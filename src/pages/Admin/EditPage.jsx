import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Admin.css';

const EditPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  // Home (Titles for the 6 grid items)
  const [homeTitles, setHomeTitles] = useState(["", "", "", "", "", ""]);

  // About Us (Dynamic sections)
  const [aboutSections, setAboutSections] = useState([
     { title: "Our Business", content: "" },
     { title: "Our Commitment", content: "" },
     { title: "Our Goal", content: "" }
  ]);

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

  useEffect(() => {
    fetchPageData();
  }, [slug]);

  const fetchPageData = async () => {
    setLoading(true);
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
      alert('Error fetching page data: ' + error.message);
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
      }
      else if (slug === 'home') {
        try {
          const titles = JSON.parse(rawContent);
          if (Array.isArray(titles) && titles.length === 6) {
            setHomeTitles(titles);
          } else {
             setHomeTitles(["The Farm", "Our process", "Get to know us", "Perfect coffee", "Green Energy", "Our Staff"]);
          }
        } catch (e) {
             setHomeTitles(["The Farm", "Our process", "Get to know us", "Perfect coffee", "Green Energy", "Our Staff"]);
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
                      { title: "Our Business", content: parsed.business || "is to create high quality green coffee micro-lots..." },
                      { title: "Our Commitment", content: parsed.commitment || "is to achieve the best quality..." },
                      { title: "Our Goal", content: parsed.goal || "is to have fun, meet great people..." }
                  ]);
              }
          } catch (e) {
              setAboutSections([
                  { title: "Our Business", content: "is to create high quality green coffee micro-lots..." },
                  { title: "Our Commitment", content: "is to achieve the best quality..." },
                  { title: "Our Goal", content: "is to have fun, meet great people..." }
              ]);
          }
      }
      else if (slug === 'contact') {
          try {
              const parsed = JSON.parse(rawContent);
              setContactIntro(parsed.intro || "");
              setContactVisit(parsed.visit || "");
          } catch (e) {
              setContactIntro("If you have any questions about us...");
              setContactVisit("If you want to come visit our farm...");
          }
      }
      else if (slug === 'layout') {
        try {
            if (rawContent.startsWith('{')) {
                const parsed = JSON.parse(rawContent);
                setFooterText(parsed.text || "");
                setFacebookUrl(parsed.facebook || "");
                setInstagramUrl(parsed.instagram || "");
                setHeaderTitle(parsed.headerTitle || "sonora coffee");
                
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
                setHeaderTitle("sonora coffee");
                if (rawImages.length > 0) setHeaderLogo(rawImages[0]);
                if (rawImages.length > 1) setFooterLogo(rawImages[1]);
            }
        } catch (e) {
            setFooterText(rawContent);
            setHeaderTitle("sonora coffee");
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
    setSaving(true);
    
    let contentToSave = formData.content;
    let imagesToSave = formData.images;

    // Compose content based on slug
    if (slug === 'landing') {
        contentToSave = `${landingSub}|${landingTitle}|${landingDesc}`;
    }
    else if (slug === 'home') {
        contentToSave = JSON.stringify(homeTitles);
    }
    else if (slug === 'aboutus') {
        contentToSave = JSON.stringify({
            sections: aboutSections
        });
    }
    else if (slug === 'contact') {
        contentToSave = JSON.stringify({
            intro: contactIntro,
            visit: contactVisit
        });
    }
    else if (slug === 'layout') {
        contentToSave = JSON.stringify({
            text: footerText,
            facebook: facebookUrl,
            instagram: instagramUrl,
            headerTitle: headerTitle,
            headerLogo: headerLogo,
            footerLogo: footerLogo
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
      alert('Error saving: ' + error.message);
    } else {
      alert('Page updated successfully!');
    }
  };

  const handleGenericImageUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Select at least one image.');
      
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
          alert('Upload failed: ' + error.message);
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

  if (loading) return <div className="admin-page-container">Loading...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-admin-action" style={{background:'none', textDecoration:'underline', padding:0}}> &larr; Dashboard</button>
        <h1 className="admin-title">Edit: {slug}</h1>
      </div>

      <form onSubmit={handleSave} className="edit-container">
        <div className="edit-section">
          <label className="edit-label">Page Title (Internal/Admin)</label>
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
                <h3 style={{marginTop:0}}>Landing Details</h3>
                <div className="mb-10">
                    <label className="edit-label">Subtitle (Top)</label>
                    <input type="text" value={landingSub} onChange={e => setLandingSub(e.target.value)} className="edit-input" />
                </div>
                <div className="mb-10">
                    <label className="edit-label">Main Title (Middle)</label>
                    <input type="text" value={landingTitle} onChange={e => setLandingTitle(e.target.value)} className="edit-input" />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">Description (Bottom)</label>
                    <textarea value={landingDesc} onChange={e => setLandingDesc(e.target.value)} rows={3} className="edit-textarea" />
                </div>
             </div>
        ) 
        /* LAYOUT */
        : slug === 'layout' ? (
             <div className="edit-section">
                <h3 style={{marginTop:0}}>Global Settings</h3>
                 <div className="mb-10">
                    <label className="edit-label">Header Title (Navbar)</label>
                    <input type="text" value={headerTitle} onChange={e => setHeaderTitle(e.target.value)} className="edit-input" placeholder="sonora coffee" />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">Footer Text</label>
                    <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} className="edit-input" />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">Facebook URL</label>
                    <input type="text" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} className="edit-input" placeholder="https://facebook.com/..." />
                </div>
                 <div className="mb-10">
                    <label className="edit-label">Instagram URL</label>
                    <input type="text" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} className="edit-input" placeholder="https://instagram.com/..." />
                </div>

                <hr style={{margin:'20px 0'}}/>
                
                {/* HEADER LOGO */}
                <div className="mb-20">
                    <label className="edit-label">Header Logo</label>
                    {headerLogo ? (
                        <div className="mb-10">
                             <img src={headerLogo} style={{maxHeight:'60px', display:'block', marginBottom:'5px', border:'1px solid #ccc'}} />
                             <button type="button" onClick={() => setHeaderLogo("")} style={{color:'red', cursor:'pointer', border:'none', background:'none', padding:0, textDecoration:'underline'}}>Remove Header Logo</button>
                        </div>
                    ) : (
                        <p style={{fontStyle:'italic', color:'#888'}}>No header logo selected.</p>
                    )}
                    <label className="btn-admin-action" style={{background:'#eee', border:'1px solid #ccc', display:'inline-block'}}>
                        {uploading ? 'Uploading...' : 'Upload Header Logo'}
                        <input type="file" accept="image/*" onChange={(e) => handleSpcificLogoUpload(e, 'header')} disabled={uploading} style={{display: 'none'}} />
                    </label>
                </div>

                {/* FOOTER LOGO */}
                <div>
                    <label className="edit-label">Footer Logo</label>
                    {footerLogo ? (
                        <div className="mb-10">
                             <img src={footerLogo} style={{maxHeight:'60px', display:'block', marginBottom:'5px', border:'1px solid #ccc'}} />
                             <button type="button" onClick={() => setFooterLogo("")} style={{color:'red', cursor:'pointer', border:'none', background:'none', padding:0, textDecoration:'underline'}}>Remove Footer Logo</button>
                        </div>
                    ) : (
                        <p style={{fontStyle:'italic', color:'#888'}}>No footer logo selected.</p>
                    )}
                     <label className="btn-admin-action" style={{background:'#eee', border:'1px solid #ccc', display:'inline-block'}}>
                        {uploading ? 'Uploading...' : 'Upload Footer Logo'}
                        <input type="file" accept="image/*" onChange={(e) => handleSpcificLogoUpload(e, 'footer')} disabled={uploading} style={{display: 'none'}} />
                    </label>
                </div>

             </div>
        ) 
        /* ABOUT US */
        : slug === 'aboutus' ? (
             <div className="edit-section">
                <h3 style={{marginTop:0}}>Mission Statements</h3>
                {aboutSections.map((section, idx) => (
                    <div className="mb-20" key={idx} style={{backgroundColor:'#f9f9f9', padding:'15px', borderRadius:'6px'}}>
                        <div className="mb-10">
                            <label className="edit-label">Title {idx + 1}</label>
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
                            <label className="edit-label">Content {idx + 1}</label>
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
                <h3 style={{marginTop:0}}>Contact Info Text</h3>
                <div className="mb-10">
                    <label className="edit-label">Intro Text (General Inquiries)</label>
                    <textarea value={contactIntro} onChange={e => setContactIntro(e.target.value)} rows={4} className="edit-textarea" />
                </div>
                <div className="mb-10">
                    <label className="edit-label">Visit Text (Farm Visits)</label>
                    <textarea value={contactVisit} onChange={e => setContactVisit(e.target.value)} rows={4} className="edit-textarea" />
                </div>
             </div>
        )
        /* HOME Grid */
        : slug === 'home' ? (
              <div className="edit-section">
                 <h3 style={{marginTop:0}}>Grid Menu Titles</h3>
                 <p className="mb-10">Enter the titles for the 6 menu items.</p>
                 <div className="home-titles-grid">
                    {homeTitles.map((t, idx) => (
                        <div key={idx}>
                             <label style={{fontSize:'0.8rem'}}>Item {idx+1}</label>
                             <input type="text" value={t} onChange={(e) => {
                                    const newTitles = [...homeTitles];
                                    newTitles[idx] = e.target.value;
                                    setHomeTitles(newTitles);
                                }} 
                                className="edit-input"
                             />
                        </div>
                    ))}
                 </div>
              </div>
        ) 
        /* GENERIC CONTENT */
        : (
            <div className="edit-section">
            <label className="edit-label">Content (Text)</label>
            <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={10}
                className="edit-textarea"
            />
            <small>Use &lt;p&gt; tags for paragraphs.</small>
            </div>
        )}

        {/* Generic Image Gallery (HIDDEN FOR LAYOUT) */}
        {slug !== 'layout' && (
            <div className="edit-section">
            <label className="edit-label">Images</label>
            
            <div className="gallery-grid">
                {formData.images.map((img, idx) => (
                <div key={idx} className="gallery-item">
                    <img src={img} alt={`Gallery ${idx}`} className="gallery-img" />
                    
                    <input 
                        type="text" 
                        placeholder="Image Caption"
                        value={captions[img] || ""}
                        onChange={(e) => setCaptions({...captions, [img]: e.target.value})}
                        className="gallery-caption-input"
                    />

                    <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    style={{position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 5px'}}
                    >
                    X
                    </button>
                </div>
                ))}
            </div>

            <div style={{border: '1px dashed #ccc', padding: '20px', textAlign: 'center'}}>
                <label className="btn-upload" style={{cursor: 'pointer'}}>
                {uploading ? 'Uploading...' : 'Upload New Image(s)'}
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditPage;
