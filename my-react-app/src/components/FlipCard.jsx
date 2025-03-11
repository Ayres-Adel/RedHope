import React, { useState } from 'react';
import '../styles/FlipCard.css';
import { FaHeartbeat, FaStethoscope, FaSyringe } from 'react-icons/fa'; // React Icons for better visuals

const FlipCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleLearnMoreClick = () => {
    setIsFlipped(true);
  };

  const handleDonateNowClick = () => {
    setIsFlipped(false);
  };

  return (
    <div className="flip-card">
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front">
          <h2>RedHope</h2>
          <h3>Every donation can save up to 3 lives.</h3>
          <img src="./src/assets/images/RedHope_Logo.png" alt="Blood Donation" className="card-image" />
          <button className="learn-more-btn" onClick={handleLearnMoreClick}>Learn More</button>
        </div>
        <div className="flip-card-back">
          <div className="grid-container">
            <h2>Why Donate Blood?</h2>
            <hr />
            <p> Helps patients with surgeries, cancer, and trauma.</p>
            <hr />
            <p> Reduces the risk of heart disease.</p>
            <hr />
            <p> You get a free health check-up.</p>
          </div>
          <button className="donate-now-btn" onClick={handleDonateNowClick}>Donate Now</button>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;