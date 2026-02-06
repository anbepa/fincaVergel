import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Contact.css';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [heroImage, setHeroImage] = useState(null);
  const [pageTitle, setPageTitle] = useState("Stop by or get in touch");
  const [introText, setIntroText] = useState("If you have any questions about us, or if you interested in obtaining our green coffee please don't hesitate to contact us. We can provide you with information of the coffee we have on stock, hurry up before is too late.");
  const [visitText, setVisitText] = useState("If you want to come visit our farm please let us know a little bit about yourself and what your interested in seeing or learning. We'll put together a package that suits you perfectly. Anything from a short afternoon visit to a prolonged stay at the farm.");

  useEffect(() => {
    const fetchContactData = async () => {
        const { data } = await supabase
            .from('content_pages')
            .select('*')
            .eq('slug', 'contact')
            .single();

        if (data) {
             if (data.title && data.title !== 'Contact') setPageTitle(data.title);

             // Fetch Images
             if (data.images && data.images.length > 0) {
                 setHeroImage(data.images[0]);
             }

             // Fetch Text Content
             if (data.content && data.content.startsWith('{')) {
                 try {
                     const parsed = JSON.parse(data.content);
                     if (parsed.intro) setIntroText(parsed.intro);
                     if (parsed.visit) setVisitText(parsed.visit);
                 } catch (e) {
                     console.error("Error parsing contact JSON", e);
                 }
             }
        }
    };
    fetchContactData();
  }, []);

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Combine names
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      
      try {
          const response = await fetch("https://formsubmit.co/ajax/rosanabernal26@gmail.com", {
              method: "POST",
              headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              body: JSON.stringify({
                  name: fullName,
                  email: data.email,
                  subject: data.subject,
                  message: data.message,
                  _template: 'table', // Nice looking email table
                  _subject: `New Contact from Website: ${data.subject}`
              })
          });

          if (response.ok) {
              setSubmitted(true);
              form.reset();
          } else {
              alert("Something went wrong. Please try again later.");
          }
      } catch (error) {
          alert("Error sending message. Please check your connection.");
          console.error(error);
      }
  };

  return (
    <div className='contact-page-container'>
      <h1 className='contact-title'>{pageTitle}</h1>
      
      <div className='contact-intro-text'>
        {introText}
      </div>
      
      {heroImage ? (
          <div className='contact-hero-img' style={{
            height: '400px', 
            width: '100%',
            overflow: 'hidden',
            marginBottom: '30px'
          }}>
             <img src={heroImage} alt="Contact Hero" style={{width:'100%', height:'100%', objectFit:'cover'}} />
          </div>
      ) : (
        <div className='contact-hero-img' style={{
            backgroundColor: '#e6e6e6', 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#999',
            fontSize: '1.2rem'
        }}>
            <span>[ Contact Hero Image ]</span>
        </div>
      )}

      <div className='contact-intro-text'>
        {visitText}
      </div>

      <div className='contact-form-wrapper'>
         {submitted ? (
             <div style={{padding: '30px', backgroundColor: '#e9f7ef', color: '#27ae60', border: '1px solid #d4efdf', textAlign:'center'}}>
                 <h3>Thank you!</h3>
                 <p>Your message has been sent successfully. We will be in touch soon.</p>
                 <button onClick={() => setSubmitted(false)} style={{marginTop:'15px', padding:'10px 20px', background:'none', border:'1px solid #27ae60', color:'#27ae60', cursor:'pointer'}}>Send another message</button>
             </div>
         ) : (
         <form className='contact-form' onSubmit={handleSubmit}>
            <div className='form-group'>
                <label>Name</label>
                <div className="name-inputs-row">
                    <div className="name-field">
                        <label className="sub-label">First Name <span style={{color:'#888'}}>(required)</span></label>
                        <input type='text' name="firstName" required />
                    </div>
                    <div className="name-field">
                        <label className="sub-label">Last Name <span style={{color:'#888'}}>(required)</span></label>
                        <input type='text' name="lastName" required />
                    </div>
                </div>
            </div>
            
            <div className='form-group'>
                <label>Email Address <span style={{color:'#888', fontWeight:'normal', fontSize:'0.75rem'}}>(required)</span></label>
                <input type='email' name="email" required />
            </div>

            <div className='form-group'>
                <label>Subject <span style={{color:'#888', fontWeight:'normal', fontSize:'0.75rem'}}>(required)</span></label>
                <input type='text' name="subject" required />
            </div>

            <div className='form-group'>
                <label>Message <span style={{color:'#888', fontWeight:'normal', fontSize:'0.75rem'}}>(required)</span></label>
                <textarea rows={5} name="message" required />
            </div>
            
            <button type='submit' className='btn-submit'>Submit</button>
         </form>
         )}
      </div>
    </div>
  );
};

export default Contact;
