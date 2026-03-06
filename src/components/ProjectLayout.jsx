import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { projects } from '../data/projects';
import ImageCarousel from './ImageCarousel';
import './ProjectLayout.css';

const ProjectLayout = ({ title, children, images = [], captions = {} }) => {
  const location = useLocation();
  const currentPath = location.pathname.endsWith('/') && location.pathname !== '/'
    ? location.pathname.slice(0, -1)
    : location.pathname;

  const currentProject = projects.find(p => p.path === currentPath);

  return (
    <div className="project-page">
      <nav className="project-topnav">
        <Link to="/home" className="project-topnav-home">
          <span className="project-topnav-arrow">←</span> All Topics
        </Link>
        {currentProject && (
          <div className="project-topnav-pager">
            <Link to={currentProject.prev} className="pager-btn" title="Previous">← Prev</Link>
            <span className="pager-divider" />
            <Link to={currentProject.next} className="pager-btn" title="Next">Next →</Link>
          </div>
        )}
      </nav>

      <header className="project-header">
        {title && <h1 className="project-title">{title}</h1>}
      </header>

      <div className="project-body container">
        <div className="project-split">
          <div className="project-text">
            <div className="dynamic-content">
              {children}
            </div>
          </div>

          {images.length > 0 && (
            <div className="project-gallery">
              <ImageCarousel images={images} altTitle={title} captions={captions} />
            </div>
          )}
        </div>
      </div>

      {currentProject && (
        <footer className="project-footer-nav">
          <Link to={currentProject.prev} className="project-nav-link project-nav-prev">
            <span className="pnav-dir">← Previous</span>
            <span className="pnav-title">{projects.find(p => p.path === currentProject.prev)?.title}</span>
          </Link>
          <Link to="/home" className="project-nav-link project-nav-all">
            <span className="pnav-dir">All Topics</span>
          </Link>
          <Link to={currentProject.next} className="project-nav-link project-nav-next">
            <span className="pnav-dir">Next →</span>
            <span className="pnav-title">{projects.find(p => p.path === currentProject.next)?.title}</span>
          </Link>
        </footer>
      )}
    </div>
  );
};

export default ProjectLayout;
