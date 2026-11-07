import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { invalidatePages } from '../../lib/content';
import './Admin.css';

/* Only these slugs have a dedicated editor here (same list as the Dashboard).
   Other content rows keep their own format and must not be rewritten by the
   generic editor: heromedia and farmmap are settings JSON edited from their
   own modules. */
const EDITABLE_SLUGS = ['landing', 'thefarm', 'ourprocess', 'gettoknowus', 'perfectcoffee', 'greenenergy', 'our-staff', 'aboutus', 'contact', 'layout', 'home'];
const MODULE_SLUGS = { heromedia: '/admin/hero-video', farmmap: '/admin/map' };

const EditPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Base state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: [] // Used for non-layout pages generic gallery
  });

  // Specific state for composite pages
  // Landing
  const [landingSub, setLandingSub] = useState("");
  const [landingTitle, setLandingTitle] = useState("");
  const [landingDesc, setLandingDesc] = useState("");
  const [landingStats, setLandingStats] = useState([
      { value: 100, suffix: '+', label: 'Hectáreas de la finca' },
      { value: 1200, suffix: 'm', label: 'Altitud (m s. n. m.)' },
      { value: 8, suffix: '', label: 'Variedades de arábica' },
      { value: 35, suffix: 'ha', label: 'Reserva forestal' }
  ]);

  // Home (Titles for the 6 grid items)
  const [homeTitles, setHomeTitles] = useState(["", "", "", "", "", ""]);

  // About Us (Dynamic sections)
  const [aboutSections, setAboutSections] = useState([
     { title: "Nuestro negocio", content: "" },
     { title: "Nuestro compromiso", content: "" },
     { title: "Nuestro objetivo", content: "" }
  ]);

  // Get To Know Us  (3 pillars displayed as cards on the homepage)
  const [gtkBusiness,   setGtkBusiness]   = useState('');
  const [gtkCommitment, setGtkCommitment] = useState('');
  const [gtkGoal,       setGtkGoal]       = useState('');

  // Contact
  const [contactIntro, setContactIntro] = useState("");
  const [contactVisit, setContactVisit] = useState("");

  // Generic Pages Captions (Map of URL -> Caption)
  const [captions, setCaptions] = useState({});

  // Layout (Footer text, Social Links, Logos)
  const [footerText, setFooterText] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerLogo, setHeaderLogo] = useState("");
  const [footerLogo, setFooterLogo] = useState("");
  const [footerCopyright, setFooterCopyright] = useState("");

  // Contact details
  const [contactEmail, setContactEmail] = useState("rosanabernal26@gmail.com");
  const [contactLocation, setContactLocation] = useState("Sierra Nevada de Santa Marta, Colombia");

  // Landing manifesto
  const [landingManifesto, setLandingManifesto] = useState("");

  // Home card descriptions
  const [homeDescriptions, setHomeDescriptions] = useState(["", "", "", "", "", ""]);
  
  // Custom Navigation Labels
  const [navLabels, setNavLabels] = useState({
      home: "Inicio",
      about: "Nosotros",
      contact: "Contacto",
      admin: "Admin",
      landingBtn: "Conoce nuestra finca",
      coffees: "Nuestros cafés"
  });

  useEffect(() => {
    fetchPageData();
  }, [slug]);

  const fetchPageData = async () => {
    setLoading(true);
    setLoadError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      /* Real load failure: block the form entirely. Saving from here would
         upsert the template defaults over the stored content. */
      setLoadError(error.message);
    } else if (data) {
      const rawContent = data.content || '';
      const rawImages = Array.isArray(data.images) ? data.images : [];

      setFormData({
        title: data.title || '',
        content: rawContent,
        images: rawImages
      });

      // Parse specific logic depending on Slug
      if (slug === 'landing') {
        const parts = rawContent.split('|');
        setLandingSub(parts[0] || "");
        setLandingTitle(parts[1] || "");
        setLandingDesc(parts[2] || "");
        setLandingManifesto(parts[3] || "");
        
        try {
            if (parts[4]) {
                const parsedStats = JSON.parse(parts[4]);
                if (Array.isArray(parsedStats) && parsedStats.length === 4) {
                    setLandingStats(parsedStats);
                }
            }
        } catch(e) {}
      }
      else if (slug === 'home') {
        try {
          const parsed = JSON.parse(rawContent);
          if (Array.isArray(parsed) && parsed.length === 6) {
            // Legacy format: plain array of titles
            setHomeTitles(parsed);
            setHomeDescriptions(["", "", "", "", "", ""]);
          } else if (parsed.titles) {
            // New format: {titles, descriptions}
            setHomeTitles(parsed.titles || ["La finca", "Nuestro proceso", "Conócenos", "Café perfecto", "Energía verde", "Nuestro equipo"]);
            setHomeDescriptions(parsed.descriptions || ["", "", "", "", "", ""]);
          } else {
            setHomeTitles(["La finca", "Nuestro proceso", "Conócenos", "Café perfecto", "Energía verde", "Nuestro equipo"]);
            setHomeDescriptions(["", "", "", "", "", ""]);
          }
        } catch (e) {
          setHomeTitles(["La finca", "Nuestro proceso", "Conócenos", "Café perfecto", "Energía verde", "Nuestro equipo"]);
          setHomeDescriptions(["", "", "", "", "", ""]);
        }
      }
      else if (slug === 'aboutus') {
          try {
              const parsed = JSON.parse(rawContent);
              if (parsed.sections && Array.isArray(parsed.sections)) {
                  setAboutSections(parsed.sections);
              } else {
                  // Migration from old format or default
                  setAboutSections([
                      { title: "Nuestro negocio", content: parsed.business || "es crear microlotes de café verde de alta calidad..." },
                      { title: "Nuestro compromiso", content: parsed.commitment || "es lograr la mejor calidad..." },
                      { title: "Nuestro objetivo", content: parsed.goal || "es disfrutar el camino, conocer gente increíble..." }
                  ]);
              }
          } catch (e) {
              setAboutSections([
                  { title: "Nuestro negocio", content: "es crear microlotes de café verde de alta calidad..." },
                  { title: "Nuestro compromiso", content: "es lograr la mejor calidad..." },
                  { title: "Nuestro objetivo", content: "es disfrutar el camino, conocer gente increíble..." }
              ]);
          }
      }
      else if (slug === 'contact') {
          try {
              const parsed = JSON.parse(rawContent);
              setContactIntro(parsed.intro || "");
              setContactVisit(parsed.visit || "");
              setContactEmail(parsed.email || "rosanabernal26@gmail.com");
              setContactLocation(parsed.location || "Santa Marta, Colombia");
          } catch (e) {
              setContactIntro("Si tienes preguntas sobre nosotros...");
              setContactVisit("Si quieres venir a visitar nuestra finca...");
          }
      }
      else if (slug === 'gettoknowus') {
          try {
              if (rawContent.trim().startsWith('{')) {
                  const parsed = JSON.parse(rawContent);
                  if (parsed.business !== undefined) {
                      // Correct new format: {business, commitment, goal}
                      setGtkBusiness(parsed.business || '');
                      setGtkCommitment(parsed.commitment || '');
                      setGtkGoal(parsed.goal || '');
                  } else if (parsed.isRichContent) {
                      // Legacy isRichContent — migrate to business field
                      setGtkBusiness(parsed.text || '');
                      setGtkCommitment('');
                      setGtkGoal('');
                  }
              } else if (rawContent.trim().startsWith('<')) {
                  // OLD plain-HTML seed format — extract paragraphs via DOMParser
                  try {
                      const doc = new DOMParser().parseFromString(rawContent, 'text/html');
                      const paras = Array.from(doc.querySelectorAll('p'))
                          .map(p => p.textContent.trim())
                          .filter(Boolean);
                      setGtkBusiness(paras[0] || '');
                      setGtkCommitment(paras[1] || '');
                      setGtkGoal(paras[2] || '');
                  } catch {
                      setGtkBusiness(rawContent);
                      setGtkCommitment('');
                      setGtkGoal('');
                  }
              } else {
                  // Plain text fallback
                  setGtkBusiness(rawContent);
                  setGtkCommitment('');
                  setGtkGoal('');
              }
          } catch (e) {
              setGtkBusiness('');
              setGtkCommitment('');
              setGtkGoal('');
          }
      }
      else if (slug === 'layout') {
        try {
            if (rawContent.startsWith('{')) {
                const parsed = JSON.parse(rawContent);
                setFooterText(parsed.text || "");
                setFacebookUrl(parsed.facebook || "");
                setInstagramUrl(parsed.instagram || "");
                setHeaderTitle(parsed.headerTitle || "FINCA VERGEL");
                setFooterCopyright(parsed.footerCopyright || "Nunca te conformes con lo suficientemente bueno.");
                
                if (parsed.navLabels) {
                    setNavLabels({
                        home: parsed.navLabels.home || "Inicio",
                        about: parsed.navLabels.about || "Nosotros",
                        contact: parsed.navLabels.contact || "Contacto",
                        admin: parsed.navLabels.admin || "Admin",
                        landingBtn: parsed.navLabels.landingBtn || "Conoce nuestra finca",
                        coffees: parsed.navLabels.coffees || "Nuestros cafés"
                    });
                }
                
                if (parsed.headerLogo) {
                    setHeaderLogo(parsed.headerLogo);
                } else if (rawImages.length > 0) {
                    setHeaderLogo(rawImages[0]);
                } else {
                    setHeaderLogo("");
                }

                if (parsed.footerLogo) {
                    setFooterLogo(parsed.footerLogo);
                } else if (rawImages.length > 1) {
                    setFooterLogo(rawImages[1]);
                } else {
                    setFooterLogo("");
                }

            } else {
                // Legacy plain text
                setFooterText(rawContent);
                setHeaderTitle("FINCA VERGEL");
                if (rawImages.length > 0) setHeaderLogo(rawImages[0]);
                if (rawImages.length > 1) setFooterLogo(rawImages[1]);
            }
        } catch (e) {
            setFooterText(rawContent);
            setHeaderTitle("FINCA VERGEL");
        }
      } 
      // Generic Pages (TheFarm, etc.)
      else {
          try {
             // Try to see if content is stored as JSON with captions
             if (rawContent.trim().startsWith('{')) {
                 const parsed = JSON.parse(rawContent);
                 if (parsed.isRichContent) {
                     setFormData({
                         title: data.title || '',
                         content: parsed.text || '',
                         images: rawImages
                     });
                     setCaptions(parsed.captions || {});
                 } else {
                     // Just regular content or unrelated JSON
                     // Fallback to treating as string if it doesn't match our schema? 
                     // Or maybe it IS the content. 
                     // Safe check: usually content is HTML. HTML doesn't start with { unless it's weird.
                     setFormData({
                        title: data.title || '',
                        content: rawContent,
                        images: rawImages
                     });
                     setCaptions({});
                 }
             } else {
                 setCaptions({});
             }
          } catch (e) {
              setCaptions({});
          }
      }
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (loadError) return;
    setSaving(true);
    
    let contentToSave = formData.content;
    let imagesToSave = formData.images;

    // Compose content based on slug
    if (slug === 'landing') {
        const statsJson = JSON.stringify(landingStats);
        contentToSave = `${landingSub}|${landingTitle}|${landingDesc}|${landingManifesto}|${statsJson}`;
    }
    else if (slug === 'home') {
        contentToSave = JSON.stringify({ titles: homeTitles, descriptions: homeDescriptions });
    }
    else if (slug === 'aboutus') {
        contentToSave = JSON.stringify({
            sections: aboutSections
        });
    }
    else if (slug === 'contact') {
        contentToSave = JSON.stringify({
            intro: contactIntro,
            visit: contactVisit,
            email: contactEmail,
            location: contactLocation
        });
    }
    else if (slug === 'gettoknowus') {
        contentToSave = JSON.stringify({
            business:   gtkBusiness,
            commitment: gtkCommitment,
            goal:       gtkGoal,
        });
    }
    else if (slug === 'layout') {
        contentToSave = JSON.stringify({
            text: footerText,
            facebook: facebookUrl,
            instagram: instagramUrl,
            headerTitle: headerTitle,
            headerLogo: headerLogo,
            footerLogo: footerLogo,
            footerCopyright: footerCopyright,
            navLabels: navLabels
        });
        // Clear generic images array for layout to enforce JSON source of truth
        imagesToSave = []; 
    }
    else {
        // Generic Pages - Save Text + Captions as JSON
        contentToSave = JSON.stringify({
            isRichContent: true,
            text: formData.content,
            captions: captions
        });
    }

    const { error } = await supabase
      .from('content_pages')
      .upsert({
        slug: slug,
        title: formData.title,
        content: contentToSave,
        images: imagesToSave,
        updated_at: new Date()
      });

    setSaving(false);
    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      invalidatePages();
      alert('¡Página actualizada correctamente!');
    }
  };

  const handleGenericImageUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Selecciona al menos una imagen.');
      
      const files = Array.from(event.target.files);
      const newImages = [];

      // Upload all files in parallel
      await Promise.all(files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const filePath = `${slug}/${Date.now()}-${Math.random()}.${fileExt}`;
          
          const { error } = await supabase.storage.from('page-images').upload(filePath, file);
          if (error) {
              console.error(`Error uploading ${file.name}:`, error);
              return; // Skip this file on error
          }
          
          const { data } = supabase.storage.from('page-images').getPublicUrl(filePath);
          if (data && data.publicUrl) {
              newImages.push(data.publicUrl);
          }
      }));
      
      if (newImages.length > 0) {
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImages]
        }));
      }

    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = null;
    }
  };

  const handleSpcificLogoUpload = async (event, type) => {
      try {
        setUploading(true);
        if (!event.target.files || event.target.files.length === 0) return;
        
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `layout/${type}-${Date.now()}.${fileExt}`;
        
        const { error } = await supabase.storage.from('page-images').upload(filePath, file);
        if (error) throw error;
        
        const { data } = supabase.storage.from('page-images').getPublicUrl(filePath);
        
        if (type === 'header') setHeaderLogo(data.publicUrl);
        if (type === 'footer') setFooterLogo(data.publicUrl);

      } catch (error) {
          alert('Error al subir: ' + error.message);
      } finally {
          setUploading(false);
      }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove)
    }));
  };

  if (loading) return <div className="admin-page-container">Cargando...</div>;

  if (!EDITABLE_SLUGS.includes(slug)) {
    const modulePath = MODULE_SLUGS[slug];
    return (
      <div className="admin-page-container">
        <div className="admin-header">
          <button onClick={() => navigate('/admin/dashboard')} className="btn-admin-action" style={{background:'none', textDecoration:'underline', padding:0}}> &larr; Panel</button>
          <h1 className="admin-title">Editar: {slug}</h1>
        </div>
        <p>Este contenido no se edita aquí{modulePath ? <>: tiene su propio módulo: <button onClick={() => navigate(modulePath)} className="btn-admin-action" style={{background:'none', textDecoration:'underline', padding:0}}>abrirlo</button></> : '.'}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-page-container">
        <div className="admin-header">
          <button onClick={() => navigate('/admin/dashboard')} className="btn-admin-action" style={{background:'none', textDecoration:'underline', padding:0}}> &larr; Panel</button>
          <h1 className="admin-title">Editar: {slug}</h1>
        </div>
        <p>No se pudo cargar el contenido guardado de esta página ({loadError}). La edición está desactivada para que nada se sobrescriba por error.</p>
        <button onClick={fetchPageData} className="btn-admin-action btn-save">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-admin-action" style={{background:'none', textDecoration:'underline', padding:0}}> &larr; Panel</button>
        <h1 className="admin-title">Editar: {slug}</h1>
      </div>

      <form onSubmit={handleSave} className="edit-container">
        <div className="edit-section">
          <label className="edit-label">Título de la página (interno/admin)</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="edit-input"
          />
        </div>

        {/* --- Custom Editors based on SLUG --- */}
        
        {/* LANDING */}
        {slug === 'landing' ? (
             <div className="edit-section">
                <h3 style={{marginTop:0}}>Detalles de la página principal</h3>
                <div className="mb-10">
                    <label className="edit-label">Subtítulo (arriba)</label>
                    <input type="text" value={landingSub} onChange={e => setLandingSub(e.target.value)} className="edit-input" />
                </div>
                <div className="mb-10">
                    <label className="edit-label">Título principal (centro)</label>
                    <input type="text" value={landingTitle} onChange={e => setLandingTitle(e.target.value)} className="edit-input" />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">Descripción (abajo)</label>
                    <textarea value={landingDesc} onChange={e => setLandingDesc(e.target.value)} rows={3} className="edit-textarea" />
                </div>
                <div className="mb-10">
                    <label className="edit-label">Manifiesto / Declaración de misión</label>
                    <textarea value={landingManifesto} onChange={e => setLandingManifesto(e.target.value)} rows={4} className="edit-textarea" placeholder="Cultivamos el mejor café de especialidad..." />
                    <small style={{color:'#888', fontSize:'0.75rem'}}>Usa saltos de línea para mostrarlo en varias líneas. Déjalo en blanco para mostrar el texto por defecto.</small>
                </div>
                <hr style={{margin:'20px 0', borderTop: '1px solid #eee'}}/>
                <h4 style={{marginTop:0, marginBottom:'10px'}}>Contadores de cifras</h4>
                <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px'}}>
                  {landingStats.map((stat, i) => (
                    <div key={i} style={{padding: '10px', background: '#f9f9f9', borderRadius: '4px'}}>
                      <label style={{fontSize:'0.75rem', fontWeight:'bold'}}>{`Etiqueta de la cifra ${i+1}:`}</label>
                      <input type="text" value={stat.label} onChange={e => {
                         const n = [...landingStats]; n[i].label = e.target.value; setLandingStats(n);
                      }} className="edit-input" style={{marginBottom:'5px'}} />
                       <label style={{fontSize:'0.75rem', fontWeight:'bold'}}>Valor:</label>
                      <input type="number" value={stat.value} onChange={e => {
                         const n = [...landingStats]; n[i].value = Number(e.target.value); setLandingStats(n);
                      }} className="edit-input" style={{marginBottom:'5px'}} />
                       <label style={{fontSize:'0.75rem', fontWeight:'bold'}}>Sufijo (ej. + o ha):</label>
                      <input type="text" value={stat.suffix} onChange={e => {
                         const n = [...landingStats]; n[i].suffix = e.target.value; setLandingStats(n);
                      }} className="edit-input" />
                    </div>
                  ))}
                </div>
             </div>
        ) 
        /* LAYOUT */
        : slug === 'layout' ? (
             <div className="edit-section">
                <h3 style={{marginTop:0}}>Configuración global</h3>
                 <div className="mb-10">
                    <label className="edit-label">Título del encabezado (barra de navegación)</label>
                    <input type="text" value={headerTitle} onChange={e => setHeaderTitle(e.target.value)} className="edit-input" placeholder="FINCA VERGEL" />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">Texto del pie de página</label>
                    <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} className="edit-input" />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">Texto de copyright del pie</label>
                    <input type="text" value={footerCopyright} onChange={e => setFooterCopyright(e.target.value)} className="edit-input" placeholder="Nunca te conformes con lo suficientemente bueno." />
                    <small style={{color:'#888', fontSize:'0.75rem'}}>Se muestra antes de © {new Date().getFullYear()} Finca Vergel. Todos los derechos reservados.</small>
                </div>
                 <div className="mb-10">
                    <label className="edit-label">URL de Facebook</label>
                    <input type="text" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} className="edit-input" placeholder="https://facebook.com/..." />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">URL de Instagram</label>
                    <input type="text" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} className="edit-input" placeholder="https://instagram.com/..." />
                </div>

                <hr style={{margin:'20px 0', borderTop: '1px solid #ddd'}}/>
                
                <h3 style={{marginTop:0}}>Etiquetas del menú y botones</h3>
                <div className="nav-labels-grid">
                    <div>
                        <label className="edit-label">Ítem del menú: Inicio</label>
                        <input type="text" value={navLabels.home} onChange={e => setNavLabels({...navLabels, home: e.target.value})} className="edit-input" />
                    </div>
                    <div>
                        <label className="edit-label">Ítem del menú: Nosotros</label>
                        <input type="text" value={navLabels.about} onChange={e => setNavLabels({...navLabels, about: e.target.value})} className="edit-input" />
                    </div>
                    <div>
                        <label className="edit-label">Ítem del menú: Cafés</label>
                        <input type="text" value={navLabels.coffees || ''} onChange={e => setNavLabels({...navLabels, coffees: e.target.value})} className="edit-input" placeholder="Nuestros cafés" />
                    </div>
                    <div>
                        <label className="edit-label">Ítem del menú: Contacto</label>
                        <input type="text" value={navLabels.contact} onChange={e => setNavLabels({...navLabels, contact: e.target.value})} className="edit-input" />
                    </div>
                    <div>
                        <label className="edit-label">Ítem del menú: Admin</label>
                        <input type="text" value={navLabels.admin} onChange={e => setNavLabels({...navLabels, admin: e.target.value})} className="edit-input" />
                    </div>
                    <div>
                        <label className="edit-label">Botón principal (Conócenos)</label>
                        <input type="text" value={navLabels.landingBtn} onChange={e => setNavLabels({...navLabels, landingBtn: e.target.value})} className="edit-input" />
                    </div>
                </div>

                <hr style={{margin:'20px 0'}}/>
                
                {/* HEADER LOGO */}
                <div className="mb-20">
                    <label className="edit-label">Logo del encabezado</label>
                    {headerLogo ? (
                        <div className="mb-10">
                             <img src={headerLogo} style={{maxHeight:'60px', display:'block', marginBottom:'5px', border:'1px solid #ccc'}} />
                             <button type="button" onClick={() => setHeaderLogo("")} style={{color:'red', cursor:'pointer', border:'none', background:'none', padding:0, textDecoration:'underline'}}>Quitar logo del encabezado</button>
                        </div>
                    ) : (
                        <p style={{fontStyle:'italic', color:'#888'}}>No se ha seleccionado un logo de encabezado.</p>
                    )}
                    <label className="btn-admin-action" style={{background:'#eee', border:'1px solid #ccc', display:'inline-block'}}>
                        {uploading ? 'Subiendo...' : 'Subir logo del encabezado'}
                        <input type="file" accept="image/*" onChange={(e) => handleSpcificLogoUpload(e, 'header')} disabled={uploading} style={{display: 'none'}} />
                    </label>
                </div>

                {/* FOOTER LOGO */}
                <div>
                    <label className="edit-label">Logo del pie</label>
                    {footerLogo ? (
                        <div className="mb-10">
                             <img src={footerLogo} style={{maxHeight:'60px', display:'block', marginBottom:'5px', border:'1px solid #ccc'}} />
                             <button type="button" onClick={() => setFooterLogo("")} style={{color:'red', cursor:'pointer', border:'none', background:'none', padding:0, textDecoration:'underline'}}>Quitar logo del pie</button>
                        </div>
                    ) : (
                        <p style={{fontStyle:'italic', color:'#888'}}>No se ha seleccionado un logo de pie.</p>
                    )}
                     <label className="btn-admin-action" style={{background:'#eee', border:'1px solid #ccc', display:'inline-block'}}>
                        {uploading ? 'Subiendo...' : 'Subir logo del pie'}
                        <input type="file" accept="image/*" onChange={(e) => handleSpcificLogoUpload(e, 'footer')} disabled={uploading} style={{display: 'none'}} />
                    </label>
                </div>

             </div>
        ) 
        /* ABOUT US */
        : slug === 'aboutus' ? (
             <div className="edit-section">
                <h3 style={{marginTop:0}}>Declaraciones de misión</h3>
                {aboutSections.map((section, idx) => (
                    <div className="mb-20" key={idx} style={{backgroundColor:'#f9f9f9', padding:'15px', borderRadius:'6px'}}>
                        <div className="mb-10">
                            <label className="edit-label">Título {idx + 1}</label>
                            <input 
                                type="text"
                                value={section.title} 
                                onChange={e => {
                                    const newSections = [...aboutSections];
                                    newSections[idx].title = e.target.value;
                                    setAboutSections(newSections);
                                }} 
                                className="edit-input" 
                                style={{marginBottom:'10px'}}
                            />
                        </div>
                        <div className="mb-10">
                            <label className="edit-label">Contenido {idx + 1}</label>
                            <textarea 
                                value={section.content} 
                                onChange={e => {
                                    const newSections = [...aboutSections];
                                    newSections[idx].content = e.target.value;
                                    setAboutSections(newSections);
                                }} 
                                rows={4} 
                                className="edit-textarea" 
                            />
                        </div>
                    </div>
                ))}
             </div>
        )
        /* CONTACT */
        : slug === 'contact' ? (
             <div className="edit-section">
                <h3 style={{marginTop:0}}>Textos de contacto</h3>
                <div className="mb-10">
                    <label className="edit-label">Texto de introducción (consultas generales)</label>
                    <textarea value={contactIntro} onChange={e => setContactIntro(e.target.value)} rows={4} className="edit-textarea" />
                </div>
                <div className="mb-10">
                    <label className="edit-label">Texto de visitas (visitas a la finca)</label>
                    <textarea value={contactVisit} onChange={e => setContactVisit(e.target.value)} rows={4} className="edit-textarea" />
                </div>
                <hr style={{margin:'16px 0', border:'none', borderTop:'1px solid #eee'}}/>
                <div className="mb-10">
                    <label className="edit-label">Correo de contacto</label>
                    <input type="text" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="edit-input" placeholder="info@example.com" />
                </div>
                <div className="mb-10">
                    <label className="edit-label">Ubicación</label>
                    <input type="text" value={contactLocation} onChange={e => setContactLocation(e.target.value)} className="edit-input" placeholder="Ciudad, País" />
                </div>
             </div>
        )
        /* GET TO KNOW US */
        : slug === 'gettoknowus' ? (
             <div className="edit-section">
                <h3>Conócenos: los 3 pilares</h3>
                <p className="edit-hint">Estos tres textos aparecen como tarjetas en la sección «Conócenos» de la página principal.</p>
                <div className="mb-20">
                    <label className="edit-label">Nuestro negocio</label>
                    <textarea value={gtkBusiness} onChange={e => setGtkBusiness(e.target.value)} rows={4} className="edit-textarea" />
                </div>
                <div className="mb-20">
                    <label className="edit-label">Nuestro compromiso</label>
                    <textarea value={gtkCommitment} onChange={e => setGtkCommitment(e.target.value)} rows={4} className="edit-textarea" />
                </div>
                <div className="mb-10">
                    <label className="edit-label">Nuestro objetivo</label>
                    <textarea value={gtkGoal} onChange={e => setGtkGoal(e.target.value)} rows={4} className="edit-textarea" />
                </div>
             </div>
        )
        /* HOME Grid */
        : slug === 'home' ? (
              <div className="edit-section">
                 <h3 style={{marginTop:0}}>Ítems de la cuadrícula</h3>
                 <p className="edit-hint">Edita el título y la descripción de cada una de las 6 tarjetas del menú.</p>
                 {homeTitles.map((t, idx) => (
                    <div key={idx} style={{backgroundColor:'#f9f9f9', padding:'12px', borderRadius:'4px', marginBottom:'12px'}}>
                        <label className="edit-label">Ítem {idx+1} — Título</label>
                        <input type="text" value={t} onChange={(e) => {
                                const newTitles = [...homeTitles];
                                newTitles[idx] = e.target.value;
                                setHomeTitles(newTitles);
                            }}
                            className="edit-input"
                            style={{marginBottom:'8px'}}
                        />
                        <label className="edit-label">Ítem {idx+1} — Descripción</label>
                        <input type="text" value={homeDescriptions[idx] || ""} onChange={(e) => {
                                const newDescs = [...homeDescriptions];
                                newDescs[idx] = e.target.value;
                                setHomeDescriptions(newDescs);
                            }}
                            className="edit-input"
                        />
                    </div>
                 ))}
              </div>
        ) 
        /* GENERIC CONTENT */
        : (
            <div className="edit-section">
            <label className="edit-label">Contenido (texto)</label>
            <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={10}
                className="edit-textarea"
            />
            <small>Usa etiquetas &lt;p&gt; para los párrafos.</small>
            </div>
        )}

        {/* Generic Image Gallery (HIDDEN FOR LAYOUT) */}
        {slug !== 'layout' && (
            <div className="edit-section">
            <label className="edit-label">Imágenes</label>
            
            <div className="gallery-grid">
                {formData.images.map((img, idx) => (
                <div key={idx} className="gallery-item">
                    <img src={img} alt={`Galería ${idx}`} className="gallery-img" />
                    
                    <input 
                        type="text" 
                        placeholder="Pie de foto"
                        value={captions[img] || ""}
                        onChange={(e) => setCaptions({...captions, [img]: e.target.value})}
                        className="gallery-caption-input"
                    />

                    <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="gallery-remove-btn"
                    >
                    ×
                    </button>
                </div>
                ))}
            </div>

            <div className="upload-zone">
                <label className="btn-upload" style={{cursor: 'pointer'}}>
                {uploading ? 'Subiendo...' : 'Subir imagen(es) nueva(s)'}
                <input 
                    type="file" 
                    multiple
                    accept="image/*" 
                    onChange={handleGenericImageUpload} 
                    disabled={uploading}
                    style={{display: 'none'}} 
                />
                </label>
            </div>
            </div>
        )}

        <button 
          type="submit" 
          disabled={saving}
          className="btn-admin-action btn-save"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
};

export default EditPage;
