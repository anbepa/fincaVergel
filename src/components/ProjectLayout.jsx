import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { projects } from '../data/projects';
import ImageCarousel from './ImageCarousel'; // Updated to Carousel
import './ProjectLayout.css';

const ProjectLayout = ({ title, children, images = [], captions = {} }) => {
  const location = useLocation();
  // Normalize path by removing trailing slash if present (unless root)
  const currentPath = location.pathname.endsWith('/') && location.pathname !== '/' 
    ? location.pathname.slice(0, -1) 
    : location.pathname;
    
  const currentProject = projects.find(p => p.path === currentPath);
  
  return (
    <div className="project-split-layout">
        {/* Navigation for Mobile (Top) or Desktop (Top Right Absolute) */}
        {currentProject && (
            <div className="project-nav-fixed">
                <Link to={currentProject.prev} className="nav-square-btn prev" title="Previous Project">
                    <span className="nav-icon">&#10094;</span>
                </Link>
                <Link to="/home" className="nav-square-btn grid" title="View All">
                    <span className="nav-icon" style={{fontSize: '1.4rem'}}>&#9776;</span>
                </Link>
                <Link to={currentProject.next} className="nav-square-btn next" title="Next Project">
                    <span className="nav-icon">&#10095;</span>
                </Link>
            </div>
        )}

        <div className="split-left-panel">
            {/* Title */}
            {title && <h1 className="project-split-title">{title}</h1>}
            
            {/* Description */}
            <div className="project-split-desc">
                 {children}
            </div>

            {/* Share Link */}
            <div className="share-link">
                &#x276E; Share
            </div>
        </div>

        <div className={`split-right-panel ${!children ? 'full-width' : ''}`}>
             <div className="layout-gallery-wrapper">
                 <ImageCarousel images={images} altTitle={title} captions={captions} />
             </div>
        </div>
    </div>
  );
};

export default ProjectLayout;
