import React, { useState, useEffect, useRef } from 'react';
import './ImageCarousel.css';

const ImageCarousel = ({ images = [], altTitle = "Image", captions = {} }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);

  // Auto-play interval
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // 3 seconds (slightly slower for readability)

    return () => clearInterval(interval);
  }, [images.length, isPaused]);

  // Inactivity Resume Timer
  useEffect(() => {
     if (isPaused) {
         if (timeoutRef.current) clearTimeout(timeoutRef.current);
         
         // Resume auto-play after 2 minutes of inactivity
         timeoutRef.current = setTimeout(() => {
             setIsPaused(false);
         }, 120000); 

         return () => clearTimeout(timeoutRef.current);
     }
  }, [isPaused]);

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
    // Pause auto-play on user interaction
    setIsPaused(true);
    
    // Reset inactivity timer if already paused (debouncing essentially handled by the useEffect dependency on isPaused/re-render, 
    // but explicit clear ensures we reset the clock on every click)
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
        setIsPaused(false);
    }, 120000);
  };

  const nextSlide = (e) => {
    e && e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsPaused(true); // Pause on manual interaction
  };

  const prevSlide = (e) => {
    e && e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsPaused(true); 
  };
  
  if (!images || images.length === 0) {
      return (
        <div className="carousel-empty">
            <span>📷</span>
            <p>No images available</p>
        </div>
      );
  }

  return (
    <div className="carousel-container">
      {/* Main Large Image */}
      <div className="carousel-main-view">
         {images.length > 1 && (
             <>
                <button className="carousel-arrow left" onClick={prevSlide}>&#10094;</button>
                <button className="carousel-arrow right" onClick={nextSlide}>&#10095;</button>
             </>
         )}

         {images.map((img, index) => (
             <div 
                key={index} 
                className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
             >
                <img src={img} alt={`${altTitle} ${index + 1}`} />
                {/* Caption Overlay */}
                {captions && captions[img] && (
                    <div className="carousel-caption-overlay">
                        <p>{captions[img]}</p>
                    </div>
                )}
             </div>
         ))}
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="carousel-thumbnails">
            {images.map((img, index) => (
                <div 
                    key={index} 
                    className={`thumbnail-item ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(index)}
                >
                    <img src={img} alt={`Thumb ${index + 1}`} />
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
