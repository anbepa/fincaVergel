import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './InteractivePlant.css';
import { COFFEE_PLANT_SVG } from './CoffeePlantSvgData';

const InteractivePlant = ({ items }) => {
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const [hoveredItem, setHoveredItem] = useState(null);

    // Map ids to positions (stable regardless of language)
    const getCoordinates = (id, title = "") => {
        // First try by ID (Robust method)
        if (id) {
            const cleanId = id.toString();
            if (cleanId === '01') return { x: 50, y: 15 }; // The Farm (Top Center)
            if (cleanId === '02') return { x: 20, y: 50 }; // Our Process (Left Middle)
            if (cleanId === '03') return { x: 80, y: 70 }; // Get to Know Us (Right Bottom)
            if (cleanId === '04') return { x: 80, y: 35 }; // Perfect Coffee (Right Top)
            if (cleanId === '05') return { x: 20, y: 15 }; // Green Energy (Left Top)
            if (cleanId === '06') return { x: 50, y: 80 }; // Our Staff (Bottom Center)
        }

        // Fallback to title matching if ID fails (Legacy support)
        if (title) {
            const t = title.toLowerCase(); 
            if (t.includes('energy')) return { x: 20, y: 15 };
            if (t.includes('farm')) return { x: 50, y: 15 };
            if (t.includes('coffee')) return { x: 80, y: 35 };
            if (t.includes('process')) return { x: 20, y: 50 };
            if (t.includes('staff')) return { x: 50, y: 80 };
            if (t.includes('know')) return { x: 80, y: 70 };
        }
        
        return { x: 50, y: 50 }; // Absolute Fallback
    };
    
    // Sort items by visual flow (Top-Left -> Bottom-Right) if needed, 
    // or just rely on the incoming order if it's already "step 1, step 2..."
    // We'll use the incoming order for the "Journey" numbers
    const activeClass = hoveredItem ? 'has-active-node' : '';

    useEffect(() => {
          const svg = document.getElementById("coffeeSvg");
          if (!svg) {
            console.error("No se encontro el elemento SVG.");
            return;
          }

          // 1. Desactivar interacción en el follaje (path9)
          const foliage = svg.querySelector("#path9");
          if (foliage) {
              foliage.style.pointerEvents = "none";
          }

          // 2. Manejar Interacción en Hotspots
          // Bind directly to IDs to ensure links work regardless of SVG attributes
          if (items) {
            items.forEach((item, index) => {
                const beanId = `bean-${index + 1}`; // bean-1, bean-2, etc.
                const beanElement = svg.getElementById(beanId);

                if (beanElement) {
                    const group = beanElement.closest('.hotspot-group') || beanElement.parentNode;
                    
                    if (group) {
                        // Clean up legacy inline events
                        group.removeAttribute("onclick");
                        
                        // Enforce pointer cursor
                        group.style.cursor = "pointer";
                        group.style.pointerEvents = "all";

                        const targetId = item.href ? item.href.replace(/^\//, '') : '';

                        // Define Handlers
                        const handleHover = () => {
                            // Visual: Bring to front
                            group.parentNode.appendChild(group);
                            setHoveredItem(targetId);
                        };

                        const handleLeave = () => {
                            setHoveredItem(null);
                        };

                        const handleClick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (item.href) {
                                console.log("Navigating to:", item.href);
                                navigate(item.href);
                            }
                        };

                        // Attach robust event listeners
                        // Using property assignment (onclick) to ensure we overwrite any persistent state
                        group.onclick = handleClick;
                        group.onmouseenter = handleHover;
                        group.onmouseleave = handleLeave;
                        
                        // Touch support
                        group.ontouchstart = (e) => {
                            // Allow scroll, but capture tap
                            // We'll trust click for standard tap, or use custom logic if needed
                            // For now, let's keep it simple to avoid ghost clicks
                        };
                    }
                }
            });
          }

    }, [navigate, items]);

    return (
        <div className={`plant-container ${activeClass}`} ref={containerRef}>
            <div className="plant-content-wrapper">
                <svg className="connections-layer">
                {items && items.map((item, index) => {
                    if (index === items.length - 1) return null;
                    const curr = getCoordinates(item.id, item.title);
                    const next = getCoordinates(items[index + 1].id, items[index + 1].title);
                    return (
                        <line 
                            key={`line-${index}`}
                            x1={`${curr.x}%`} y1={`${curr.y}%`}
                            x2={`${next.x}%`} y2={`${next.y}%`}
                            className="connection-line"
                        />
                    );
                })}
            </svg>
            <div className="interaction-hint">Start here</div>
            <div className={`plant-svg ${hoveredItem ? 'dimmed' : ''}`} dangerouslySetInnerHTML={{ __html: COFFEE_PLANT_SVG }} />

            <div className="plant-labels-overlay">
                {items && items.map((item, index) => {
                    const coord = getCoordinates(item.id, item.title);
                    const style = { top: `${coord.y}%`, left: `${coord.x}%` };
                    const isHovered = hoveredItem === item.id;
                    const isInactive = hoveredItem && !isHovered;
                    
                    return (
                        <div 
                            key={item.id} 
                            className={`plant-label ${isHovered ? 'active' : ''} ${isInactive ? 'inactive' : ''}`}
                            style={style}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={(e) => { 
                                // Direct navigation for both mobile and desktop
                                // Double-tap removed for better UX since labels are visible
                                navigate(item.href); 
                            }}
                        >
                            <div className="label-number">{index + 1}</div>
                            <div className="label-text">{item.title}</div>
                        </div>
                    );
                })}
            </div>
            </div>

            {/* Mobile Bottom Tooltip */}
            <div className={`mobile-tooltip ${hoveredItem ? 'visible' : ''}`}>
                 <span className="tooltip-number">
                    {items.findIndex(i => i.id === hoveredItem) + 1}
                 </span>
                 {items.find(i => i.id === hoveredItem)?.title}
            </div>

            <div className="plant-footer">
                <button 
                  onClick={() => {
                    const contactSection = document.getElementById('contact');
                    if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
                    else navigate('/contact');
                  }} 
                  className="plant-cta-btn"
                >
                   Schedule a Visit
                </button>  
            </div>
        </div>
    );
};

export default InteractivePlant;
