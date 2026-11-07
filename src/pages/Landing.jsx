import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getCachedPage, subscribePage } from '../lib/content';
import { preloadImage, sizedImage, viewportWidth } from '../lib/images';
import LazyBackground from '../components/LazyBackground';
import Journey, { htmlExcerpt } from '../components/Journey';
import FarmLive from '../components/FarmLive';
import CoffeeLots from '../components/CoffeeLots';
import FarmMap, { parseMap, directionsUrl } from '../components/FarmMap';
import {
  AnimatedCounter,
  useGyroParallax,
  useToast,
} from '../components/MobileEnhancements';
import './Landing.css';

/* ── Scroll-reveal hook ── */
function useReveal() {
  useEffect(() => {
    const run = () => {
      const els = document.querySelectorAll('.reveal');
      const io = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        }),
        { threshold: 0.10 }
      );
      els.forEach(el => io.observe(el));
      return io;
    };
    const io = run();
    return () => io.disconnect();
  }, []);
}

/* ── Parallax hook for split images ── */
function useParallax() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return; // skip on mobile
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const images = Array.from(document.querySelectorAll('.lp-split-image'));
    const onScreen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
    });
    images.forEach(img => io.observe(img));
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      onScreen.forEach(img => {
        if (!img.classList.contains('visible')) return; // let the reveal transition finish
        const rect = img.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - vh / 2) * 0.06;
        img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);
}

/* ── Smooth anchor scroll ── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Scroll to #hash when arriving from another route ── */
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    // Wait a frame so sections have laid out
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [hash]);
}

/* ── Dark navbar while it sits over a dark section ([data-nav="dark"]) ── */
function useNavTheme() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-nav="dark"]');
    if (!els.length) return;
    const under = new Set();
    // Observe only a thin strip at the top of the viewport (where the navbar is)
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
      document.documentElement.classList.toggle('nav-dark', under.size > 0);
    }, { rootMargin: '0px 0px -93% 0px' });
    els.forEach(el => io.observe(el));
    return () => { io.disconnect(); document.documentElement.classList.remove('nav-dark'); };
  }, []);
}

/* Share of viewport width a split-section image covers */
const splitImageFraction = () => (viewportWidth() > 1024 ? 0.5 : 1);

/* ── Magnetic button hook (desktop only) ── */
function useMagnetic(ref) {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [ref]);
}

/* ── Default images ── */
const defaultImages = [
  'https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w',
  'https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111883773-8ETHQP1ZM0NGRSCIOEFT/DSC_2477a.jpg?format=2500w',
  'https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779286905-2891KWL99R9NS8ME0HAE/facy0274.jpg?format=2500w',
  'https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111900910-F6QKQPU0HONZDOBSHXX7/DSC_3499a.jpg?format=2500w',
];

/* ── Default section content ── */
const defaults = {
  hero: {
    images:   defaultImages,
    subtitle: 'Café de especialidad · Colombia',
    title:    'FINCA EL VERGEL',
    desc:     'Café de especialidad de la Sierra Nevada de Santa Marta, elaborado con propósito.',
    manifesto: 'Cultivamos el mejor café de especialidad\nen las montañas de Colombia, con propósito,\npasión y un profundo respeto por la tierra.',
  },
  thefarm: {
    title:   'La finca',
    content: `<p>Finca El Vergel está ubicada en la Sierra Nevada de Santa Marta, Colombia, una de las cordilleras costeras más altas del mundo. La finca tiene una extensión aproximada de 100 hectáreas, incluidas 35 hectáreas de reserva de bosque silvestre. La altitud promedio es de 1.200 m (3.900 pies) sobre el nivel del mar.</p><p>Nuestro café crece rodeado de árboles exóticos y vegetación nativa, lo que brinda condiciones ideales de calidad y mejora el suelo de montaña, ya de por sí rico. Gracias al ecosistema diverso de la finca, muchas especies de aves y animales encuentran refugio en nuestras tierras.</p>`,
    images:  defaultImages,
  },
  process: {
    title:   'Nuestro proceso',
    content: `<p>Junto a nuestro trapiche de caña de 150 años se encuentra nuestro microbeneficio de café, el corazón de la operación. Allí supervisamos cada paso, desde la cereza cosechada hasta el pergamino listo para exportar. Nos especializamos en procesos honey y natural, una elección consciente que ahorra más de 3 galones de agua por libra de café en comparación con el proceso lavado.</p><p>La pulpa de la cereza se compostea y regresa al suelo; la energía para el secado proviene directamente de la finca. Cada decisión honra la tierra y eleva la taza.</p>`,
    images:  defaultImages,
  },
  gettoknowus: {
    title:   'Conócenos',
    business:   'Cultivamos 8 variedades de arábica de especialidad y exportamos microlotes de café verde a tostadores de todo el mundo que comparten nuestro compromiso con la calidad y la trazabilidad.',
    commitment: 'Nuestro compromiso es la calidad en todos los niveles, desde la salud del suelo hasta el bienestar de nuestro equipo, siempre en armonía con el entorno natural que hace único a nuestro café.',
    goal:       'Nuestro objetivo es sencillo: disfrutar el camino, conocer gente increíble y generar un impacto positivo en el medio ambiente y en nuestra comunidad, una taza excepcional a la vez.',
    images:  defaultImages,
  },
  perfectcoffee: {
    title:   'Café perfecto',
    content: `<p>Un gran café nace mucho antes del tueste. Empieza con la altitud, las variedades, el momento de la cosecha y el cuidado en cada etapa del proceso. En Finca El Vergel controlamos todas estas variables: desde la siembra bajo la sombra de árboles nativos hasta la selección a mano de solo las cerezas maduras en la cosecha.</p><p>El resultado: lotes complejos y limpios, de grado de especialidad, que expresan el terroir único de la Sierra Nevada de Santa Marta, Colombia.</p>`,
    images:  defaultImages,
  },
  greenenergy: {
    title:   'Energía verde',
    content: `<p>Para nosotros, la sostenibilidad no es una palabra de moda: es nuestra forma de operar. La finca aprovecha los recursos naturales en cada oportunidad: el compost de la pulpa del café alimenta el suelo, los sistemas de agua por gravedad reducen la energía de bombeo e invertimos continuamente en reducir nuestra huella de carbono.</p><p>Creemos que el café más delicioso es también el más responsable.</p>`,
    images:  defaultImages,
  },
  staff: {
    title:   'Nuestro equipo',
    content: `<p>Nuestro equipo es uno de los pilares de nuestro éxito. Gracias a su energía, constancia y conocimiento del territorio hemos podido construir y mantener Finca El Vergel. Su bienestar es esencial para nosotros y para la tranquilidad de la finca.</p><p>Una de las cosas que hacen tan diferente a Finca El Vergel es que ofrecemos alojamiento gratuito a cada trabajador y a su familia en las casas de la finca. Animamos a nuestro equipo a dar lo mejor de sí, y nos llena de orgullo ver cómo crece hacia nuevas oportunidades en la vida.</p><p>De nuestra familia a la tuya.</p>`,
    images:  defaultImages,
  },
  aboutus: {
    title:   'Nuestra historia',
    content: 'Finca El Vergel es una finca cafetera familiar enclavada en la Sierra Nevada de Santa Marta, Colombia. Durante generaciones hemos cultivado arábica de especialidad bajo la sombra de árboles nativos, guiados por una sola convicción: el gran café es fruto de una gran tierra, cuidada con paciencia y respeto.',
    image:   defaultImages[2],
  },
};

/* ── Parse the landing row ("subtitle|title|desc|manifesto|statsJSON") ── */
function parseLanding(ld) {
  let { subtitle, title, desc, manifesto } = defaults.hero;
  let stats = null;
  if (ld?.content) {
    const parts = ld.content.split('|');
    if (parts[0]) subtitle = parts[0];
    if (parts[1]) title = parts[1];
    if (parts[2]) desc = parts[2];
    if (parts[3]) manifesto = parts[3];
    if (parts[4]) { try { stats = JSON.parse(parts[4]); } catch { /* ignore */ } }
  }
  return { images: ld?.images?.length ? ld.images : defaults.hero.images, subtitle, title, desc, manifesto, stats };
}

function parseContent(raw) {
  if (!raw) return null;
  if (raw.trim().startsWith('{')) {
    try { return JSON.parse(raw); } catch {}
  }
  return raw;
}

/* ════════════════════════════════════════════
   SPECIAL EFFECT COMPONENTS
   ════════════════════════════════════════════ */

/* Infinite scrolling marquee */
function Marquee({ text = 'CAFÉ DE ESPECIALIDAD · COLOMBIA · FINCA EL VERGEL · CULTIVADO BAJO SOMBRA · SECADO AL SOL ·' }) {
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee-track">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="marquee-item">{text}&nbsp;</span>
        ))}
      </div>
    </div>
  );
}

/* Staggered hero title — each letter animates in */
function SplitTitle({ text, className }) {
  const letters = text.split('');
  return (
    <h1 className={className} aria-label={text}>
      {letters.map((char, i) => (
        <span
          key={i}
          className="split-char"
          aria-hidden="true"
          style={{ animationDelay: `${0.1 + i * 0.03}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  );
}

/* ════════════════════════════════════════════
   INLINE SECTION COMPONENTS
   ════════════════════════════════════════════ */

function SectionGetToKnow({ data }) {
  const parsed = data ? parseContent(data.content) : null;
  const isObj  = typeof parsed === 'object' && parsed !== null;
  // Use DB value if the key EXISTS (even if empty string); only fall to default when key is absent
  const biz  = (isObj && 'business'   in parsed && parsed.business   !== '') ? parsed.business   : defaults.gettoknowus.business;
  const com  = (isObj && 'commitment' in parsed && parsed.commitment !== '') ? parsed.commitment : defaults.gettoknowus.commitment;
  const goal = (isObj && 'goal'       in parsed && parsed.goal       !== '') ? parsed.goal       : defaults.gettoknowus.goal;
  const title = data?.title || defaults.gettoknowus.title;
  return (
    <section id="get-to-know-us" className="lp-tricard">
      <div className="lp-tricard-header reveal">
        <p className="lp-section-eyebrow">03 — Conócenos</p>
        <h2 className="lp-section-title">{title}</h2>
      </div>
      <div className="lp-tricard-grid">
        {[
          { label: 'Nuestro negocio',    text: biz },
          { label: 'Nuestro compromiso', text: com },
          { label: 'Nuestro objetivo',   text: goal },
        ].map((c, i) => (
          <div key={i} className="lp-tricard-item reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
            <span className="lp-tricard-num">0{i+1}</span>
            <h3 className="lp-tricard-label">{c.label}</h3>
            <p className="lp-tricard-text">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* HTML body of a CMS section (rich JSON or plain HTML), or a fallback */
function sectionHtml(data, fallback) {
  const parsed = data?.content ? parseContent(data.content) : null;
  if (typeof parsed === 'object' && parsed?.isRichContent) return parsed.text;
  if (typeof parsed === 'string') return parsed;
  return fallback;
}

/* Scroll-linked manifesto: words light up as you read */
function ScrollWords({ text, className }) {
  const ref = useRef(null);
  const lines = text.split('\n').filter(Boolean);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll('.sw-word'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      words.forEach(w => w.classList.add('is-on'));
      return;
    }
    let ticking = false;
    let inView = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block enters the lower part of the screen, 1 when it reaches ~35% from top
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.6)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-on', i < lit));
    };
    const onScroll = () => { if (inView && !ticking) { ticking = true; requestAnimationFrame(update); } };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) update(); });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [text]);

  return (
    <p ref={ref} className={`sw ${className}`} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span key={li} className="sw-line" aria-hidden="true">
          {line.split(/\s+/).filter(Boolean).map((w, wi) => (
            <span key={wi} className="sw-word">{w} </span>
          ))}
        </span>
      ))}
    </p>
  );
}

/* Expands from an inset rounded card to full-bleed as it scrolls in (desktop) */
function useExpandOnScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)').matches) return;
    let ticking = false;
    let inView = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));
      const inset = (1 - p) * 7;          // % inset
      const radius = (1 - p) * 28;        // px corner radius
      el.style.clipPath = `inset(${inset.toFixed(2)}% ${inset.toFixed(2)}% 0 ${inset.toFixed(2)}% round ${radius.toFixed(1)}px)`;
    };
    const onScroll = () => { if (inView && !ticking) { ticking = true; requestAnimationFrame(update); } };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) update(); }, { rootMargin: '200px 0px' });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [ref]);
}

function SectionStaff({ data }) {
  const revealRef = useRef(null);
  useExpandOnScroll(revealRef);
  const raw = data?.content;
  const parsed = raw ? parseContent(raw) : null;
  const html = (typeof parsed === 'object' && parsed?.isRichContent) ? parsed.text
             : (typeof parsed === 'string') ? parsed
             : defaults.staff.content;
  const imgSrc = data?.images?.[0] || defaultImages[0];
  return (
    <section id="our-staff" className="lp-staff" data-nav="dark">
      <div ref={revealRef} className="lp-staff-reveal">
      <LazyBackground className="lp-staff-bg" src={imgSrc}>
        <div className="lp-staff-overlay" />
        <div className="lp-staff-content reveal">
          <p className="lp-section-eyebrow lp-eyebrow--light">06 — Nuestro equipo</p>
          <h2 className="lp-staff-title">{data?.title || defaults.staff.title}</h2>
          <div className="lp-staff-body" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </LazyBackground>
      </div>
    </section>
  );
}

function SectionOurStory({ data }) {
  const raw = data?.content;
  let text = defaults.aboutus.content;
  if (raw) {
    const parsed = parseContent(raw);
    if (typeof parsed === 'object') {
      text = parsed.sections?.[0]?.content || parsed.business || text;
    } else if (typeof parsed === 'string') {
      text = parsed;
    }
  }
  const img = data?.images?.[0] || defaults.aboutus.image;
  return (
    <section id="our-story" className="lp-split lp-split--light">
      <LazyBackground className="lp-split-image reveal" src={img} widthFraction={splitImageFraction()} aria-hidden="true" />
      <div className="lp-split-text reveal reveal-delay-1">
        <p className="lp-section-eyebrow">Nuestra historia</p>
        <h2 className="lp-split-title">{data?.title || defaults.aboutus.title}</h2>
        <p className="lp-split-body-text">{text}</p>
      </div>
    </section>
  );
}

function SectionContact({ data, directions }) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  let introText = "Si tienes preguntas sobre nosotros o te interesa obtener nuestro café verde, no dudes en escribirnos.";
  let visitText = "Si quieres venir a visitar nuestra finca, cuéntanos un poco sobre ti y qué te gustaría ver o aprender. Armaremos un plan a tu medida.";
  let contactEmail = "rosanabernal26@gmail.com";
  let contactLocation = "Sierra Nevada de Santa Marta, Colombia";
  if (data?.content) {
    try {
      const p = JSON.parse(data.content);
      if (p.intro) introText = p.intro;
      if (p.visit) visitText = p.visit;
      if (p.email) contactEmail = p.email;
      if (p.location) contactLocation = p.location;
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const form = e.target;
    const fd = Object.fromEntries(new FormData(form).entries());
    const fullName = `${fd.firstName || ''} ${fd.lastName || ''}`.trim();
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${contactEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: fullName, email: fd.email,
          subject: fd.subject, message: fd.message,
          _template: 'table',
          _subject: `Nuevo contacto desde el sitio web: ${fd.subject}`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        form.reset();
        if (toast) toast('¡Mensaje enviado correctamente!', 'success');
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      } else {
        if (toast) toast('Algo salió mal. Inténtalo de nuevo.', 'error');
      }
    } catch {
      if (toast) toast('Error de conexión. Revisa tu internet.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="lp-contact" data-nav="dark">
      <div className="lp-contact-inner">
        <div className="lp-contact-info reveal">
          <p className="lp-section-eyebrow lp-eyebrow--light">Contacto</p>
          <h2 className="lp-contact-title">Escríbenos</h2>
          <p className="lp-contact-desc">{introText}</p>
          <p className="lp-contact-desc">{visitText}</p>
          <div className="lp-contact-details">
            <div className="lp-contact-detail">
              <span className="lp-contact-label">Correo electrónico</span>
              <a href={`mailto:${contactEmail}`} className="lp-contact-value">
                {contactEmail}
              </a>
            </div>
            <div className="lp-contact-detail">
              <span className="lp-contact-label">Ubicación</span>
              <span className="lp-contact-value">{contactLocation}</span>
              {directions && (
                <a className="lp-contact-directions" href={directions} target="_blank" rel="noopener noreferrer">
                  Cómo llegar <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="lp-contact-form-col reveal reveal-delay-1">
          {submitted ? (
            <div className="lp-contact-success" role="status">
              <h3>¡Gracias!</h3>
              <p>Tu mensaje ha sido enviado. Te contactaremos pronto.</p>
              <button className="btn-light" onClick={() => setSubmitted(false)}>
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form className="lp-form" onSubmit={handleSubmit}>
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label htmlFor="cf-first">Nombre <span className="req" aria-hidden="true">*</span></label>
                  <input id="cf-first" type="text" name="firstName" autoComplete="given-name" required />
                </div>
                <div className="lp-form-group">
                  <label htmlFor="cf-last">Apellido <span className="req" aria-hidden="true">*</span></label>
                  <input id="cf-last" type="text" name="lastName" autoComplete="family-name" required />
                </div>
              </div>
              <div className="lp-form-group">
                <label htmlFor="cf-email">Correo electrónico <span className="req" aria-hidden="true">*</span></label>
                <input id="cf-email" type="email" name="email" autoComplete="email" inputMode="email" required />
              </div>
              <div className="lp-form-group">
                <label htmlFor="cf-subject">Asunto <span className="req" aria-hidden="true">*</span></label>
                <input id="cf-subject" type="text" name="subject" required />
              </div>
              <div className="lp-form-group">
                <label htmlFor="cf-message">Mensaje <span className="req" aria-hidden="true">*</span></label>
                <textarea id="cf-message" name="message" rows={5} required />
              </div>
              <button type="submit" className="btn-light lp-form-submit" disabled={sending} aria-busy={sending}>
                {sending ? <><span className="btn-spinner" aria-hidden="true" />Enviando…</> : 'Enviar mensaje'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════ */
/* Parse the "layout" row for social links + hero button label */
function parseLayout(lay) {
  const out = { social: { facebook: '', instagram: '' }, btnLabel: null };
  if (lay?.content?.startsWith('{')) {
    try {
      const p = JSON.parse(lay.content);
      out.social = { facebook: p.facebook || '', instagram: p.instagram || '' };
      if (p.navLabels?.landingBtn) out.btnLabel = p.navLabels.landingBtn;
    } catch { /* ignore */ }
  }
  return out;
}

/* Section slugs → state keys */
const SECTION_SLUGS = {
  farm: 'thefarm', process: 'ourprocess', getToKnow: 'gettoknowus',
  perfect: 'perfectcoffee', green: 'greenenergy', staff: 'our-staff',
  about: 'aboutus', contact: 'contact',
};

/* Parse hero video settings ("heromedia" row) */
function parseHeroMedia(row) {
  if (!row?.content) return null;
  try {
    const p = JSON.parse(row.content);
    if (!p.enabled || !(p.videoUrl || p.mobileVideoUrl)) return null;
    return p;
  } catch { return null; }
}

/* Looping background video; fades in only once it is really playing */
function HeroVideo({ media, onPlaying }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const src = React.useMemo(() => {
    const small = viewportWidth() < 768;
    return (small && media.mobileVideoUrl) || media.videoUrl || media.mobileVideoUrl;
  }, [media]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const play = () => v.play().catch(() => {});
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : v.pause()));
    io.observe(v);
    const onVis = () => (document.hidden ? v.pause() : play());
    document.addEventListener('visibilitychange', onVis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, [src]);

  return (
    <video
      ref={ref}
      className={`lp-hero-video${on ? ' is-on' : ''}`}
      src={src}
      poster={media.posterUrl || undefined}
      muted
      loop
      autoPlay
      playsInline
      preload="metadata"
      aria-hidden="true"
      onPlaying={() => { setOn(true); onPlaying?.(); }}
    />
  );
}

const canAutoplayVideo = () =>
  typeof window !== 'undefined'
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  && !navigator.connection?.saveData;

/* Full-bleed hero background that never shows a half-loaded or swapped image */
function HeroSlider({ images, sliderRef, video }) {
  const [videoOn, setVideoOn] = useState(false);
  const useVideo = !!video && canAutoplayVideo();
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState({}); // index -> decoded
  const urls = React.useMemo(
    () => (images || []).map(src => sizedImage(src, viewportWidth())),
    [images],
  );

  /* Load first image ASAP, then the next one in the background */
  useEffect(() => {
    if (!urls.length) return;
    let cancelled = false;
    setCurrent(0);
    preloadImage(urls[0]).then(() => { if (!cancelled) setReady(r => ({ ...r, 0: true })); });
    return () => { cancelled = true; };
  }, [urls]);

  /* Advance only when the next slide is already decoded */
  useEffect(() => {
    if (videoOn) return; // the video takes over the hero
    if (urls.length < 2 || !ready[current]) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const next = (current + 1) % urls.length;
    let cancelled = false;
    preloadImage(urls[next]).then(() => { if (!cancelled) setReady(r => ({ ...r, [next]: true })); });
    const id = setTimeout(() => {
      if (document.hidden) return; // don't churn in background tabs
      setCurrent(c => (c === current ? next : c));
    }, 6000);
    return () => { cancelled = true; clearTimeout(id); };
  }, [current, urls, ready, videoOn]);

  const jump = (i) => {
    if (i === current) return;
    preloadImage(urls[i]).then(() => {
      setReady(r => ({ ...r, [i]: true }));
      setCurrent(i);
    });
  };

  return (
    <>
      <div className="lp-bg-slider" ref={sliderRef}>
        {urls.map((url, i) => (ready[i] || i === current) && (
          <div
            key={url}
            className={`lp-bg-slide${i === current && ready[i] ? ' active' : ''}`}
            style={ready[i] ? { backgroundImage: `url("${url}")` } : undefined}
          />
        ))}
        {useVideo && <HeroVideo media={video} onPlaying={() => setVideoOn(true)} />}
      </div>
      {urls.length > 1 && !videoOn && (
        <div className="lp-hero-slides" role="group" aria-label="Imágenes principales">
          <span className="lp-hero-count" aria-hidden="true">
            <b>{String(current + 1).padStart(2, '0')}</b> / {String(urls.length).padStart(2, '0')}
          </span>
          <div className="lp-hero-bars">
            {urls.map((url, i) => (
              <button
                key={url}
                type="button"
                className={`lp-hero-bar${i === current ? ' is-active' : ''}${i < current ? ' is-done' : ''}`}
                onClick={() => jump(i)}
                aria-label={`Mostrar imagen ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
              >
                <span key={i === current && ready[i] ? `run-${current}` : 'idle'} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const Landing = () => {
  /* Initialise from cache so repeat visits paint final content immediately */
  const cachedLanding = getCachedPage('landing');
  const [heroData, setHeroData] = useState(() =>
    cachedLanding !== undefined ? parseLanding(cachedLanding) : { ...defaults.hero, images: null });
  const [layoutInfo, setLayoutInfo] = useState(() => parseLayout(getCachedPage('layout')));
  const [heroMedia, setHeroMedia] = useState(() => parseHeroMedia(getCachedPage('heromedia')));
  const [mapCfg, setMapCfg] = useState(() => parseMap(getCachedPage('farmmap')));
  const [sections, setSections] = useState(() => {
    const init = {};
    Object.entries(SECTION_SLUGS).forEach(([k, slug]) => { init[k] = getCachedPage(slug) || null; });
    return init;
  });

  const heroBtnRef = useRef(null);
  const heroSliderRef = useRef(null);
  useGyroParallax(heroSliderRef);
  useReveal();
  useParallax();
  useMagnetic(heroBtnRef);
  useHashScroll();
  useNavTheme();

  /* Subscribe to content (cache first, then network) */
  useEffect(() => {
    const unsubs = [
      subscribePage('landing', ld => setHeroData(parseLanding(ld))),
      subscribePage('layout', lay => setLayoutInfo(parseLayout(lay))),
      subscribePage('heromedia', row => setHeroMedia(parseHeroMedia(row))),
      subscribePage('farmmap', row => setMapCfg(parseMap(row))),
      ...Object.entries(SECTION_SLUGS).map(([k, slug]) =>
        subscribePage(slug, row => setSections(prev => ({ ...prev, [k]: row || null })))),
    ];
    /* If the CMS is slow/unreachable, fall back to default hero images */
    const t = setTimeout(() => {
      setHeroData(h => (h.images ? h : { ...h, images: defaults.hero.images }));
    }, 2500);
    return () => { clearTimeout(t); unsubs.forEach(u => u()); };
  }, []);

  const socialLinks = layoutInfo.social;
  const btnLabel = layoutInfo.btnLabel || 'Conoce nuestra finca';
  const {
    farm: farmData, process: processData, getToKnow: getToKnowData, perfect: perfectData,
    green: greenData, staff: staffData, about: aboutData, contact: contactData,
  } = sections;

  return (
    <div className="lp-root">

      {/* ═══ HERO ═══ */}
      <section id="hero" className="lp-hero">
        <HeroSlider images={heroData.images} sliderRef={heroSliderRef} video={heroMedia} />
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <FarmLive />
          <p className="lp-eyebrow reveal">{heroData.subtitle}</p>
          <SplitTitle key={heroData.title} text={heroData.title} className="lp-hero-title" />
          <p className="lp-hero-desc reveal reveal-delay-2">{heroData.desc}</p>
          <div className="lp-hero-actions reveal reveal-delay-3">
            <button ref={heroBtnRef} className="btn-light magnetic-btn" onClick={() => scrollTo('farm')}>{btnLabel}</button>
            <div className="lp-socials">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="lp-social-icon" aria-label="Facebook">
                  <svg viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5 3.66 9.15 8.44 9.9v-7h-2.54v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.71-3.89 1.06 0 1.97.08 1.97.08V8.5h-1c-1.24 0-1.63.77-1.63 1.56v1.99h2.79l-.45 2.9h-2.34v7C18.34 21.21 22 17.06 22 12.06c0-5.53-4.5-10.02-10-10.02z"/></svg>
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="lp-social-icon" aria-label="Instagram">
                  <svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2m-.2 2C5.6 4 4 5.6 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8c2 0 3.6-1.6 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <Marquee />

      {/* ═══ STATS COUNTERS ═══ */}
      <section className="lp-stats">
        <div className="lp-stats-grid">
          {(heroData.stats || [
            { value: 100, suffix: '+', label: 'Hectáreas de la finca' },
            { value: 1200, suffix: 'm', label: 'Altitud (m s. n. m.)' },
            { value: 8, suffix: '', label: 'Variedades de arábica' },
            { value: 35, suffix: 'ha', label: 'Reserva forestal' }
          ]).map((s, i) => (
              <div key={i} className="lp-stat reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <AnimatedCounter end={s.value} suffix={s.suffix} prefix="" />
                <span className="lp-stat-label">{s.label}</span>
              </div>
          ))}
        </div>
      </section>

      {/* ═══ MANIFESTO ═══ */}
      <section className="lp-manifesto" data-nav="dark">
        <div className="lp-manifesto-inner">
          <p className="lp-manifesto-eyebrow">Nuestra misión</p>
          <ScrollWords
            text={heroData.manifesto || defaults.hero.manifesto}
            className="lp-manifesto-text"
          />
        </div>
      </section>

      {/* ═══ FROM CHERRY TO CUP — Farm · Process · Perfect Coffee · Green Energy ═══ */}
      <Journey
        id="farm"
        eyebrow="De la cereza a la taza"
        title="De la cereza a la taza"
        chapters={[
          { key: 'farm',    anchor: undefined,        eyebrow: 'La finca',       href: '/thefarm',
            title: farmData?.title || defaults.thefarm.title,
            text: htmlExcerpt(sectionHtml(farmData, defaults.thefarm.content)),
            image: farmData?.images?.[0] || defaultImages[0] },
          { key: 'process', anchor: 'process',        eyebrow: 'Nuestro proceso', href: '/ourprocess',
            title: processData?.title || defaults.process.title,
            text: htmlExcerpt(sectionHtml(processData, defaults.process.content)),
            image: processData?.images?.[0] || defaultImages[1] },
          { key: 'perfect', anchor: 'perfect-coffee', eyebrow: 'Café perfecto',  href: '/perfectcoffee',
            title: perfectData?.title || defaults.perfectcoffee.title,
            text: htmlExcerpt(sectionHtml(perfectData, defaults.perfectcoffee.content)),
            image: perfectData?.images?.[0] || defaultImages[2] },
          { key: 'green',   anchor: 'green-energy',   eyebrow: 'Energía verde',  href: '/greenenergy',
            title: greenData?.title || defaults.greenenergy.title,
            text: htmlExcerpt(sectionHtml(greenData, defaults.greenenergy.content)),
            image: greenData?.images?.[0] || defaultImages[3] },
        ]}
      />

      {/* ═══ COFFEE LOTS (admin: Coffee Lots) ═══ */}
      <CoffeeLots />

      {/* ═══ INTERACTIVE FARM MAP (admin: Farm Map) ═══ */}
      <FarmMap />

      {/* ═══ GET TO KNOW US ═══ */}
      <SectionGetToKnow data={getToKnowData} />

      {/* ═══ OUR STAFF ═══ */}
      <SectionStaff data={staffData} />

      {/* ═══ OUR STORY ═══ */}
      <SectionOurStory data={aboutData} />

      {/* ═══ CONTACT ═══ */}
      <SectionContact data={contactData} directions={directionsUrl(mapCfg?.location)} />

    </div>
  );
};

export default Landing;
