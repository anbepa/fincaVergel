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
  // Each line starts at the Node and ends near the Tag
  const connections = {
      'pos-farm':    { x1: 45, y1: 83, x2: 25, y2: 83, cx: 35 }, 
      'pos-process': { x1: 82, y1: 72, x2: 95, y2: 72, cx: 90 },
      'pos-know':    { x1: 18, y1: 58, x2: 5,  y2: 58, cx: 10 },
      'pos-coffee':  { x1: 78, y1: 45, x2: 95, y2: 45, cx: 85 },
      'pos-energy':  { x1: 24, y1: 30, x2: 5,  y2: 30, cx: 15 },
      'pos-staff':   { x1: 55, y1: 9,  x2: 75, y2: 9,  cx: 65 },
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
                    <Link key={item.href} to={item.href}>
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
                                    hover: { scale: 1.5, backgroundColor: "rgba(139, 195, 74, 0.8)" }
                                }}
                            >
                                <motion.div 
                                    className="dot-ring"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                                    transition={{ duration: 3, repeat: Infinity }}
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
                                    hover: { x: 5, scale: 1.05, backgroundColor: "rgba(255,255,255, 0.95)", boxShadow: "0 8px 16px rgba(0,0,0,0.15)" }
                                }}
                            >
                                <span className="card-number">0{index + 1}</span>
                                <span className="card-title">{item.title}</span>
                                <motion.span 
                                    className="card-arrow"
                                    variants={{ hover: { x: 3, opacity: 1 }}}
                                >→</motion.span>
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
