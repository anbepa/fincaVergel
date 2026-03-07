import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  AnimatedCounter,
  TextRevealByLine,
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
    const images = document.querySelectorAll('.lp-split-image');
    const onScroll = () => {
      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - window.innerHeight / 2) * 0.06;
        img.style.transform = `scale(1) translateY(${offset}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

/* ── Smooth anchor scroll ── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

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
    subtitle: 'Specialty Coffee · Costa Rica',
    title:    'FINCA EL VERGEL',
    desc:     'Grown at the foot of the Poás Volcano. Shade-grown, sun-dried, and crafted with purpose.',
    manifesto: 'We journey to grow the finest specialty coffee\nin the highlands of Costa Rica — with purpose,\npassion, and deep respect for the land.',
  },
  thefarm: {
    title:   'The Farm',
    content: `<p>Hacienda Sonora is located in the Central Valley of Costa Rica, at the foot of the world renowned Poás Volcano. The farm's area is approximately 100 hectares: 55 hectares of shaded coffee, 35 hectares of wild forest reserve, and 10 hectares of sugar cane. The average altitude is 1,200 m (3,900 ft) above sea level.</p><p>Our coffee grows surrounded by exotic trees and native vegetation, providing ideal conditions for quality and improving the already naturally rich volcanic soil. Thanks to the farm's diverse ecosystem, many species of birds and animals seek refuge in our land.</p>`,
    images:  defaultImages,
  },
  process: {
    title:   'Our Process',
    content: `<p>Right next to our 150-year-old sugar cane mill sits our micro coffee mill, the heart of our operation. Here, we oversee every step from harvested cherry to exportable parchment. We specialize in honey and natural processing methods — a conscious choice that saves over 3 gallons of water per pound of coffee compared to washed processing.</p><p>The cherry pulp is composted and returned to the soil; drying energy comes directly from the farm. Every decision honors the land and elevates the cup.</p>`,
    images:  defaultImages,
  },
  gettoknowus: {
    title:   'Get to Know Us',
    business:   'We grow 8 varietals of specialty-grade Arabica and export micro-lots of green coffee to roasters worldwide who share our commitment to quality and traceability.',
    commitment: 'Our commitment is to quality at every level — from soil health to staff well-being — always in harmony with the natural environment that makes our coffee unique.',
    goal:       'Our goal is simple: to have fun, meet amazing people, and create a positive impact on the environment and our community — one exceptional cup at a time.',
    images:  defaultImages,
  },
  perfectcoffee: {
    title:   'Perfect Coffee',
    content: `<p>Great coffee begins long before the roast. It starts with altitude, varietals, harvest timing, and the care taken at every processing stage. At Finca El Vergel we control all these variables — from planting under the shade of native trees to hand-selecting only ripe cherries at harvest.</p><p>The result: complex, clean, specialty-grade lots that express the unique terroir of Alajuela, Costa Rica.</p>`,
    images:  defaultImages,
  },
  greenenergy: {
    title:   'Green Energy',
    content: `<p>Sustainability is not a marketing word for us — it is how we operate. The farm harnesses natural resources at every opportunity: compost from coffee pulp feeds the soil, gravity-fed water systems reduce pump energy, and we continually invest in reducing our carbon footprint.</p><p>We believe the most delicious coffee is also the most responsible one.</p>`,
    images:  defaultImages,
  },
  staff: {
    title:   'Our Staff',
    content: `<p>Our employees are one of the crucial aspects of our success. Through their energy, consistency and local insights we have been able to build and maintain Hacienda Sonora. Their well-being is essential for us and for the tranquility of the farm.</p><p>One of the many things that make Hacienda Sonora so different from other farms is the fact that we provide free accommodation for each worker and their families at the farm's houses. We encourage our staff to become the best they can, and we are proud to often see them grow to greater opportunities in life.</p><p>Pura vida!</p>`,
    images:  defaultImages,
  },
  aboutus: {
    title:   'Our Story',
    content: 'Finca El Vergel is a family-owned coffee estate nestled in the highlands of Alajuela, Costa Rica. For generations we have cultivated specialty-grade Arabica under the shade of native trees, guided by a single belief: that great coffee is the fruit of great land, cared for with patience and respect.',
    image:   defaultImages[2],
  },
};

/* ── Fetch helper ── */
async function fetchPage(slug) {
  try {
    const { data } = await supabase.from('content_pages').select('*').eq('slug', slug).single();
    return data || null;
  } catch { return null; }
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
function Marquee({ text = 'SPECIALTY COFFEE · COSTA RICA · FINCA EL VERGEL · SHADE GROWN · SUN DRIED ·' }) {
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
    <h1 className={className}>
      {letters.map((char, i) => (
        <span
          key={i}
          className="split-char"
          style={{ animationDelay: `${0.6 + i * 0.04}s` }}
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

function SectionFarm({ data }) {
  const raw    = data?.content;
  const parsed = raw ? parseContent(raw) : null;
  const html   = (typeof parsed === 'object' && parsed?.isRichContent) ? parsed.text
               : (typeof parsed === 'string') ? parsed
               : defaults.thefarm.content;
  return (
    <section id="farm" className="lp-split lp-split--light">
      <div
        className="lp-split-image reveal"
        style={{ backgroundImage: `url(${data?.images?.[0] || defaultImages[0]})` }}
      />
      <div className="lp-split-text reveal reveal-delay-1">
        <p className="lp-section-eyebrow">01 — The Farm</p>
        <h2 className="lp-split-title">{data?.title || defaults.thefarm.title}</h2>
        <div className="lp-split-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

function SectionProcess({ data }) {
  const raw    = data?.content;
  const parsed = raw ? parseContent(raw) : null;
  const html   = (typeof parsed === 'object' && parsed?.isRichContent) ? parsed.text
               : (typeof parsed === 'string') ? parsed
               : defaults.process.content;
  return (
    <section id="process" className="lp-split lp-split--dark lp-split--reverse">
      <div
        className="lp-split-image reveal"
        style={{ backgroundImage: `url(${data?.images?.[0] || defaultImages[1]})` }}
      />
      <div className="lp-split-text reveal reveal-delay-1">
        <p className="lp-section-eyebrow">02 — Our Process</p>
        <h2 className="lp-split-title">{data?.title || defaults.process.title}</h2>
        <div className="lp-split-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

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
        <p className="lp-section-eyebrow">03 — Get to Know Us</p>
        <h2 className="lp-section-title">{title}</h2>
      </div>
      <div className="lp-tricard-grid">
        {[
          { label: 'Our Business',    text: biz },
          { label: 'Our Commitment',  text: com },
          { label: 'Our Goal',        text: goal },
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

function SectionPerfectCoffee({ data }) {
  const t = data || defaults.perfectcoffee;
  const raw = data?.content;
  const parsed = raw ? parseContent(raw) : null;
  const html = (typeof parsed === 'object' && parsed?.isRichContent) ? parsed.text
             : (typeof parsed === 'string') ? parsed
             : defaults.perfectcoffee.content;
  return (
    <section id="perfect-coffee" className="lp-split lp-split--light">
      <div
        className="lp-split-image reveal"
        style={{ backgroundImage: `url(${data?.images?.[0] || defaultImages[2]})` }}
      />
      <div className="lp-split-text reveal reveal-delay-1">
        <p className="lp-section-eyebrow">04 — Perfect Coffee</p>
        <h2 className="lp-split-title">{data?.title || defaults.perfectcoffee.title}</h2>
        <div className="lp-split-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

function SectionGreenEnergy({ data }) {
  const raw = data?.content;
  const parsed = raw ? parseContent(raw) : null;
  const html = (typeof parsed === 'object' && parsed?.isRichContent) ? parsed.text
             : (typeof parsed === 'string') ? parsed
             : defaults.greenenergy.content;
  return (
    <section id="green-energy" className="lp-split lp-split--dark lp-split--reverse">
      <div
        className="lp-split-image reveal"
        style={{ backgroundImage: `url(${data?.images?.[0] || defaultImages[3]})` }}
      />
      <div className="lp-split-text reveal reveal-delay-1">
        <p className="lp-section-eyebrow">05 — Green Energy</p>
        <h2 className="lp-split-title">{data?.title || defaults.greenenergy.title}</h2>
        <div className="lp-split-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

function SectionStaff({ data }) {
  const raw = data?.content;
  const parsed = raw ? parseContent(raw) : null;
  const html = (typeof parsed === 'object' && parsed?.isRichContent) ? parsed.text
             : (typeof parsed === 'string') ? parsed
             : defaults.staff.content;
  const imgSrc = data?.images?.[0] || defaultImages[0];
  return (
    <section id="our-staff" className="lp-staff">
      <div className="lp-staff-bg" style={{ backgroundImage: `url(${imgSrc})` }}>
        <div className="lp-staff-overlay" />
        <div className="lp-staff-content reveal">
          <p className="lp-section-eyebrow lp-eyebrow--light">06 — Our Staff</p>
          <h2 className="lp-staff-title">{data?.title || defaults.staff.title}</h2>
          <div className="lp-staff-body" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
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
      <div className="lp-split-image reveal" style={{ backgroundImage: `url(${img})` }} />
      <div className="lp-split-text reveal reveal-delay-1">
        <p className="lp-section-eyebrow">Our Story</p>
        <h2 className="lp-split-title">{data?.title || defaults.aboutus.title}</h2>
        <p className="lp-split-body-text">{text}</p>
      </div>
    </section>
  );
}

function SectionContact({ data }) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  let introText = "If you have questions about us, or are interested in our green coffee, please don't hesitate to reach out.";
  let visitText = "If you want to visit the farm, let us know a little about yourself and what you'd like to see. We'll put together a package that suits you perfectly.";
  let contactEmail = "rosanabernal26@gmail.com";
  let contactLocation = "Alajuela, Costa Rica";
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
          _subject: `New Contact from Website: ${fd.subject}`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        form.reset();
        if (toast) toast('Message sent successfully!', 'success');
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      } else {
        if (toast) toast('Something went wrong. Please try again.', 'error');
      }
    } catch {
      if (toast) toast('Connection error. Please check your internet.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="lp-contact">
      <div className="lp-contact-inner">
        <div className="lp-contact-info reveal">
          <p className="lp-section-eyebrow lp-eyebrow--light">Contact</p>
          <h2 className="lp-contact-title">Get in Touch</h2>
          <p className="lp-contact-desc">{introText}</p>
          <p className="lp-contact-desc">{visitText}</p>
          <div className="lp-contact-details">
            <div className="lp-contact-detail">
              <span className="lp-contact-label">Email</span>
              <a href={`mailto:${contactEmail}`} className="lp-contact-value">
                {contactEmail}
              </a>
            </div>
            <div className="lp-contact-detail">
              <span className="lp-contact-label">Location</span>
              <span className="lp-contact-value">{contactLocation}</span>
            </div>
          </div>
        </div>

        <div className="lp-contact-form-col reveal reveal-delay-1">
          {submitted ? (
            <div className="lp-contact-success">
              <h3>Thank you!</h3>
              <p>Your message has been sent. We'll be in touch soon.</p>
              <button className="btn-light" onClick={() => setSubmitted(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="lp-form" onSubmit={handleSubmit}>
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label>First Name <span className="req">*</span></label>
                  <input type="text" name="firstName" required />
                </div>
                <div className="lp-form-group">
                  <label>Last Name <span className="req">*</span></label>
                  <input type="text" name="lastName" required />
                </div>
              </div>
              <div className="lp-form-group">
                <label>Email Address <span className="req">*</span></label>
                <input type="email" name="email" required />
              </div>
              <div className="lp-form-group">
                <label>Subject <span className="req">*</span></label>
                <input type="text" name="subject" required />
              </div>
              <div className="lp-form-group">
                <label>Message <span className="req">*</span></label>
                <textarea name="message" rows={5} required />
              </div>
              <button type="submit" className="btn-light lp-form-submit" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
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
const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [socialLinks,  setSocialLinks]  = useState({ facebook: '', instagram: '' });
  const [btnLabel,     setBtnLabel]     = useState('Discover Our Farm');

  const [heroData,        setHeroData]        = useState(defaults.hero);
  const heroBtnRef = useRef(null);
  const heroSliderRef = useRef(null);
  useGyroParallax(heroSliderRef);
  const [farmData,        setFarmData]        = useState(null);
  const [processData,     setProcessData]     = useState(null);
  const [getToKnowData,   setGetToKnowData]   = useState(null);
  const [perfectData,     setPerfectData]     = useState(null);
  const [greenData,       setGreenData]       = useState(null);
  const [staffData,       setStaffData]       = useState(null);
  const [aboutData,       setAboutData]       = useState(null);
  const [contactData,     setContactData]     = useState(null);

  useReveal();
  useParallax();
  useMagnetic(heroBtnRef);

  /* Fetch all data once */
  useEffect(() => {
    (async () => {
      const [ld, fd, pd, gd, pcd, ged, sd, ad, lay, cd] = await Promise.all([
        fetchPage('landing'),
        fetchPage('thefarm'),
        fetchPage('ourprocess'),
        fetchPage('gettoknowus'),
        fetchPage('perfectcoffee'),
        fetchPage('greenenergy'),
        fetchPage('our-staff'),
        fetchPage('aboutus'),
        fetchPage('layout'),
        fetchPage('contact'),
      ]);

      /* Hero & Stats */
      if (ld) {
        let { subtitle, title, desc, manifesto } = defaults.hero;
        let pStats = null;
        if (ld.content) {
          const parts = ld.content.split('|');
          if (parts[0]) subtitle = parts[0];
          if (parts[1]) title    = parts[1];
          if (parts[2]) desc     = parts[2];
          if (parts[3]) manifesto = parts[3];
          if (parts[4]) {
              try { pStats = JSON.parse(parts[4]); } catch(e) {}
          }
        }
        setHeroData({ images: ld.images?.length ? ld.images : defaults.hero.images, subtitle, title, desc, manifesto, stats: pStats });
      }

      if (fd)  setFarmData(fd);
      if (pd)  setProcessData(pd);
      if (gd)  setGetToKnowData(gd);
      if (pcd) setPerfectData(pcd);
      if (ged) setGreenData(ged);
      if (sd)  setStaffData(sd);
      if (ad)  setAboutData(ad);
      if (cd)  setContactData(cd);

      /* Layout / social */
      if (lay?.content?.startsWith('{')) {
        try {
          const p = JSON.parse(lay.content);
          setSocialLinks({ facebook: p.facebook || '', instagram: p.instagram || '' });
          if (p.navLabels?.landingBtn) setBtnLabel(p.navLabels.landingBtn);
        } catch {}
      }
    })();
  }, []);

  /* Slideshow */
  useEffect(() => {
    const id = setInterval(() => setCurrentImage(i => (i + 1) % heroData.images.length), 5500);
    return () => clearInterval(id);
  }, [heroData.images.length]);

  return (
    <div className="lp-root">

      {/* ═══ HERO ═══ */}
      <section id="hero" className="lp-hero">
        <div className="lp-bg-slider" ref={heroSliderRef}>
          {heroData.images.map((img, i) => (
            <div key={i}
              className={`lp-bg-slide${i === currentImage ? ' active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
        </div>
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <p className="lp-eyebrow reveal">{heroData.subtitle}</p>
          <SplitTitle text={heroData.title} className="lp-hero-title" />
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
        <div className="lp-scroll-hint">
          <span>Scroll</span>
          <div className="lp-scroll-line" />
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <Marquee />

      {/* ═══ STATS COUNTERS ═══ */}
      <section className="lp-stats">
        <div className="lp-stats-grid">
          {(heroData.stats || [
            { value: 100, suffix: '+', label: 'Hectares of Estate' },
            { value: 1200, suffix: 'm', label: 'Altitude (m.a.s.l.)' },
            { value: 8, suffix: '', label: 'Arabica Varietals' },
            { value: 35, suffix: 'ha', label: 'Forest Reserve' }
          ]).map((s, i) => (
              <div key={i} className="lp-stat reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <AnimatedCounter end={s.value} suffix={s.suffix} prefix="" />
                <span className="lp-stat-label">{s.label}</span>
              </div>
          ))}
        </div>
      </section>

      {/* ═══ MANIFESTO ═══ */}
      <section className="lp-manifesto">
        <div className="lp-manifesto-inner reveal">
          <p className="lp-manifesto-eyebrow">Our Mission</p>
          <TextRevealByLine
            text={heroData.manifesto || defaults.hero.manifesto}
            className="lp-manifesto-text"
          />
        </div>
      </section>

      {/* ═══ THE FARM ═══ */}
      <SectionFarm data={farmData} />

      {/* ═══ OUR PROCESS ═══ */}
      <SectionProcess data={processData} />

      {/* ═══ GET TO KNOW US ═══ */}
      <SectionGetToKnow data={getToKnowData} />

      {/* ═══ PERFECT COFFEE ═══ */}
      <SectionPerfectCoffee data={perfectData} />

      {/* ═══ GREEN ENERGY ═══ */}
      <SectionGreenEnergy data={greenData} />

      {/* ═══ OUR STAFF ═══ */}
      <SectionStaff data={staffData} />

      {/* ═══ OUR STORY ═══ */}
      <SectionOurStory data={aboutData} />

      {/* ═══ CONTACT ═══ */}
      <SectionContact data={contactData} />

    </div>
  );
};

export default Landing;
