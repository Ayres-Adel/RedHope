import React, { useEffect, useState } from 'react';
import '../styles/Toast.css';

const Toast = ({ message, type, onClose }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimeout = setTimeout(() => {
      setIsFading(true);
    }, 3700);

    const closeTimeout = setTimeout(() => {
      onClose();
    }, 4000);

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