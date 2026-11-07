import React, { useEffect, useState } from 'react';
import { getPage } from '../lib/content';
import './Contact.css';

const Contact = () => {
  const [submitted,  setSubmitted]  = useState(false);
  const [heroImage,  setHeroImage]  = useState(null);
  const [pageTitle,  setPageTitle]  = useState('Escríbenos');
  const [introText,  setIntroText]  = useState("Si tienes preguntas sobre nosotros o te interesa obtener nuestro café verde, no dudes en escribirnos.");
  const [visitText,  setVisitText]  = useState("Si quieres venir a visitar nuestra finca, cuéntanos un poco sobre ti y qué te gustaría ver o aprender. Armaremos un plan a tu medida.");
  const [contactEmail, setContactEmail] = useState("rosanabernal26@gmail.com");
  const [contactLocation, setContactLocation] = useState("Sierra Nevada de Santa Marta, Colombia");

  useEffect(() => {
    (async () => {
      const { data } = await getPage('contact');
      if (data) {
        if (data.title && data.title !== 'Contact') setPageTitle(data.title);
        if (data.images?.length) setHeroImage(data.images[0]);
        if (data.content?.startsWith('{')) {
          try {
            const p = JSON.parse(data.content);
            if (p.intro) setIntroText(p.intro);
            if (p.visit) setVisitText(p.visit);
            if (p.email) setContactEmail(p.email);
            if (p.location) setContactLocation(p.location);
          } catch {}
        }
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd   = Object.fromEntries(new FormData(form).entries());
    const fullName = `${fd.firstName || ''} ${fd.lastName || ''}`.trim();
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${contactEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: fullName, email: fd.email, subject: fd.subject, message: fd.message,
          _template: 'table', _subject: `Nuevo contacto desde el sitio web: ${fd.subject}`,
        }),
      });
      if (res.ok) { setSubmitted(true); form.reset(); }
      else alert('Algo salió mal. Inténtalo de nuevo.');
    } catch { alert('Error al enviar el mensaje. Revisa tu conexión.'); }
  };

  return (
    <div className="contact-page">
      {heroImage && (
        <div className="contact-hero" style={{ backgroundImage: `url(${heroImage})` }} />
      )}

      <div className="contact-body container">
        <header className="contact-header">
          <p className="eyebrow">Contacto</p>
          <h1 className="contact-title">{pageTitle}</h1>
        </header>

        <div className="contact-split">
          <div className="contact-info">
            <p className="contact-info-text">{introText}</p>
            <p className="contact-info-text">{visitText}</p>

            <div className="contact-details">
              <div className="contact-detail-item">
                <span className="contact-detail-label">Correo electrónico</span>
                <a href={`mailto:${contactEmail}`} className="contact-detail-value">{contactEmail}</a>
              </div>
              <div className="contact-detail-item">
                <span className="contact-detail-label">Ubicación</span>
                <span className="contact-detail-value">{contactLocation}</span>
              </div>
            </div>
          </div>

          <div className="contact-form-col">
            {submitted ? (
              <div className="contact-success">
                <h3>¡Gracias!</h3>
                <p>Tu mensaje ha sido enviado. Te contactaremos pronto.</p>
                <button className="btn-primary" onClick={() => setSubmitted(false)}>Enviar otro mensaje</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre <span className="req">*</span></label>
                    <input type="text" name="firstName" required />
                  </div>
                  <div className="form-group">
                    <label>Apellido <span className="req">*</span></label>
                    <input type="text" name="lastName" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Correo electrónico <span className="req">*</span></label>
                  <input type="email" name="email" required />
                </div>

                <div className="form-group">
                  <label>Asunto <span className="req">*</span></label>
                  <input type="text" name="subject" required />
                </div>

                <div className="form-group">
                  <label>Mensaje <span className="req">*</span></label>
                  <textarea name="message" rows={6} required />
                </div>

                <button type="submit" className="btn-primary">Enviar mensaje</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
