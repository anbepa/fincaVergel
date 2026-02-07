import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import './InteractivePlant.css';

const InteractivePlant = ({ items }) => {
  const containerRef = useRef(null);
  const [isHovering, setIsHovering] = React.useState(false);
  
  // Parallax Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth mouse Spring
  const mouseX = useSpring(x, { stiffness: 60, damping: 20 }); // Softer spring for idle sway
  const mouseY = useSpring(y, { stiffness: 60, damping: 20 });

  // Idle Animation Loop (Breathing Effect)
  React.useEffect(() => {
    let animationFrame;
    
    const loop = () => {
        if (!isHovering) {
            const time = Date.now() / 2500; // Slow gentle sway
            // Sway range: X +/- 80, Y +/- 40
            // This creates a subtle figure-8 like tilt
            x.set(Math.sin(time) * 80);
            y.set(Math.cos(time * 0.8) * 40);
            animationFrame = requestAnimationFrame(loop);
        }
    };

    if (!isHovering) {
        loop();
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isHovering, x, y]);

  function handleMouseMove(event) {
    if (!isHovering) setIsHovering(true);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
      setIsHovering(false);
  }

  // Tilt Transforms for Container
  const rotateX = useTransform(mouseY, [-400, 400], [8, -8]); // Increased tilt range slightly
  const rotateY = useTransform(mouseX, [-400, 400], [-8, 8]);

  // Helper to map slugs to specific CSS positions
  const getPositionClass = (href) => {
     if(href.includes('farm')) return 'pos-farm';
     if(href.includes('process')) return 'pos-process';
     if(href.includes('know')) return 'pos-know';
     if(href.includes('coffee')) return 'pos-coffee';
     if(href.includes('energy')) return 'pos-energy';
     if(href.includes('staff')) return 'pos-staff';
     return 'pos-default'; 
  };

  // Connecting Lines SVG Coordinates (Percentages: 0-100)
  // Updated for Bean Cluster Positions (Closer to stem)
  const connections = {
      'pos-farm':    { x1: 48, y1: 80, x2: 25, y2: 80, cx: 36 }, 
      'pos-process': { x1: 62, y1: 68, x2: 85, y2: 68, cx: 73 },
      'pos-know':    { x1: 38, y1: 58, x2: 15, y2: 58, cx: 26 },
      'pos-coffee':  { x1: 65, y1: 44, x2: 85, y2: 44, cx: 75 },
      'pos-energy':  { x1: 35, y1: 32, x2: 15, y2: 32, cx: 25 },
      'pos-staff':   { x1: 52, y1: 15, x2: 75, y2: 15, cx: 63 },
  };

  return (
    <div 
        className="plant-menu-container" 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        className="plant-wrapper-3d"
        ref={containerRef}
        style={{ rotateX, rotateY, perspective: 1000 }}
      >
         {/* The Plant Image */}
         <motion.img 
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            src="/coffee-plant-transparent.png" 
            alt="Finca Vergel Navigation Tree" 
            className="plant-image" 
         />

         {/* SVG Connections Layer */}
         <svg className="connections-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
             {items.map((item, i) => {
                 const posKey = getPositionClass(item.href);
                 const coords = connections[posKey] || { x1:50, y1:50, x2:50, y2:50, cx:50 };
                 
                 return (
                     <motion.path 
                        key={i}
                        d={`M${coords.x1},${coords.y1} Q${coords.cx},${coords.y1} ${coords.cx},${(coords.y1 + coords.y2)/2} T${coords.x2},${coords.y2}`}
                        fill="none"
                        stroke="rgba(0,0,0,0.4)"
                        strokeWidth="0.2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 1 + (i * 0.15), duration: 1.5, ease: "easeInOut" }}
                     />
                 );
             })}
         </svg>
         
         <div className="plant-overlays">
            {items.map((item, index) => {
                const posClass = getPositionClass(item.href);
                return (
                    <Link 
                        key={item.href} 
                        to={item.href} 
                        aria-label={`Go to ${item.title}`}
                    >
                        <motion.div 
                            className={`plant-link-spot ${posClass}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover="hover"
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* The Interactive Node (Leaf) */}
                            <motion.div 
                                className="pulse-dot"
                                variants={{
                                    hover: { scale: 1.2, backgroundColor: "rgba(102, 187, 106, 0.9)" }
                                }}
                            >
                                <motion.div 
                                    className="dot-ring"
                                    animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                />
                                <div className="dot-core"></div>
                            </motion.div>
                            
                            {/* The Floating Tag */}
                            <motion.div 
                                className="link-card"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 2 + index * 0.1 }} /* Wait for lines */
                                variants={{
                                    hover: { 
                                        y: -5, 
                                        scale: 1.05, 
                                        backgroundColor: "#ffffff", 
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                                        borderLeft: "4px solid #66bb6a"
                                    }
                                }}
                            >
                                <div className="card-header">
                                    <span className="card-number">{item.id || `0${index + 1}`}</span>
                                    <span className="card-title">{item.title}</span>
                                </div>
                                
                                {item.description && (
                                    <motion.div 
                                        className="card-tooltip"
                                        initial={{ opacity: 0, height: 0 }}
                                        variants={{
                                            hover: { opacity: 1, height: "auto", marginTop: "4px" }
                                        }}
                                    >
                                        {item.description}
                                    </motion.div>
                                )}
                            </motion.div>
                        </motion.div>
                    </Link>
                );
            })}
         </div>
      </motion.div>
    </div>
  );
};

export default InteractivePlant;
