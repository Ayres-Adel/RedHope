import React, { useEffect, useState } from 'react';
import '../styles/Toast.css';

const Toast = ({ message, type, onClose }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fade out animation after 2.7 seconds
    const fadeTimeout = setTimeout(() => {
      setIsFading(true);
    }, 2700);

    // Remove toast after 3 seconds
    const closeTimeout = setTimeout(() => {
      onClose();
    }, 3000);

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