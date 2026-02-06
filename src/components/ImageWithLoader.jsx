import React, { useState } from 'react';
import './ImageWithLoader.css';

const ImageWithLoader = ({ src, alt, className, style, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`image-loader-wrapper ${className || ''}-wrapper`} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="image-loader-skeleton" />
      )}
      
      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className || ''} ${isLoaded ? 'img-loaded' : 'img-loading'}`}
        onLoad={() => setIsLoaded(true)}
        style={{
           ...props.style,
           opacity: isLoaded ? 1 : 0,
           transition: 'opacity 0.8s ease-in-out'
        }}
        {...props}
      />
    </div>
  );
};

export default ImageWithLoader;
