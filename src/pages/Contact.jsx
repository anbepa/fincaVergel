import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Contact.css';

const Contact = () => {
  const [submitted,  setSubmitted]  = useState(false);
  const [heroImage,  setHeroImage]  = useState(null);
  const [pageTitle,  setPageTitle]  = useState('Get in Touch');
  const [introText,  setIntroText]  = useState("If you have any questions about us, or if you are interested in obtaining our green coffee, please don't hesitate to reach out.");
  const [visitText,  setVisitText]  = useState("If you want to come visit our farm please let us know a little about yourself and what you are interested in seeing or learning. We'll put together a package that suits you perfectly.");
  const [contactEmail, setContactEmail] = useState("rosanabernal26@gmail.com");
  const [contactLocation, setContactLocation] = useState("Alajuela, Costa Rica");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('content_pages').select('*').eq('slug', 'contact').single();
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
          _template: 'table', _subject: `New Contact from Website: ${fd.subject}`,
        }),
      });
      if (res.ok) { setSubmitted(true); form.reset(); }
      else alert('Something went wrong. Please try again.');
    } catch { alert('Error sending message. Please check your connection.'); }
  };

  return (
    <div className="contact-page">
      {heroImage && (
        <div className="contact-hero" style={{ backgroundImage: `url(${heroImage})` }} />
      )}

      <div className="contact-body container">
        <header className="contact-header">
          <p className="eyebrow">Contact</p>
          <h1 className="contact-title">{pageTitle}</h1>
        </header>

        <div className="contact-split">
          <div className="contact-info">
            <p className="contact-info-text">{introText}</p>
            <p className="contact-info-text">{visitText}</p>

            <div className="contact-details">
              <div className="contact-detail-item">
                <span className="contact-detail-label">Email</span>
                <a href={`mailto:${contactEmail}`} className="contact-detail-value">{contactEmail}</a>
              </div>
              <div className="contact-detail-item">
                <span className="contact-detail-label">Location</span>
                <span className="contact-detail-value">{contactLocation}</span>
              </div>
            </div>
          </div>

          <div className="contact-form-col">
            {submitted ? (
              <div className="contact-success">
                <h3>Thank you!</h3>
                <p>Your message has been sent. We'll be in touch soon.</p>
                <button className="btn-primary" onClick={() => setSubmitted(false)}>Send another message</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name <span className="req">*</span></label>
                    <input type="text" name="firstName" required />
                  </div>
                  <div className="form-group">
                    <label>Last Name <span className="req">*</span></label>
                    <input type="text" name="lastName" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address <span className="req">*</span></label>
                  <input type="email" name="email" required />
                </div>

                <div className="form-group">
                  <label>Subject <span className="req">*</span></label>
                  <input type="text" name="subject" required />
                </div>

                <div className="form-group">
                  <label>Message <span className="req">*</span></label>
                  <textarea name="message" rows={6} required />
                </div>

                <button type="submit" className="btn-primary">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
