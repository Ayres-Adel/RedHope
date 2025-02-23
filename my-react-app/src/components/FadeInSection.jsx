// src/components/FadeInSection.jsx
import React, { useRef, useEffect, useState } from 'react';
import '../styles/FadeInSection.css'; // We'll create this CSS file next

const FadeInSection = ({ children, className = '' }) => {
  const domRef = useRef();
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null, // Defaults to the viewport
      rootMargin: '0px',
      threshold: 0.1, // 10% of the element is visible
    };

    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target); // Stop observing after it's visible
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    if (domRef.current) {
      observer.observe(domRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (domRef.current) {
        observer.unobserve(domRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`fade-in-section ${isVisible ? 'is-visible' : ''} ${className}`}
      ref={domRef}
    >
      {children}
    </div>
  );
};

export default FadeInSection;
