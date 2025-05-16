import React, { useEffect, useState } from 'react';
import '../styles/Toast.css';

const Toast = ({ message, type, onClose }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fade out animation after 3.7 seconds (increased from 2.7)
    const fadeTimeout = setTimeout(() => {
      setIsFading(true);
    }, 3700);

    // Remove toast after 4 seconds (increased from 3)
    const closeTimeout = setTimeout(() => {
      onClose();
    }, 4000);

    // Cleanup timeouts
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(closeTimeout);
    };
  }, [onClose]);

  return (
    <div className={`toast toast-${type} ${isFading ? 'fade-out' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;