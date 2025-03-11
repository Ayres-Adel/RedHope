import React, { useEffect, useState } from 'react';
import '../styles/InfiniteScroll.css';

const InfiniteScroll = () => {

    useEffect(() => {
      const toggle = document.getElementById('toggle');
      toggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      });
  
      // Cleanup event listener
      return () => {
        toggle.removeEventListener('change', () => {
          document.body.classList.toggle('dark-theme', toggle.checked);
        });
      };
    }, []);

      const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
      useEffect(() => {
        const interval = setInterval(() => {
          const currentLang = localStorage.getItem('language') || 'en';
          if (currentLang !== language) {
            setLanguage(currentLang);
          }
        }, 100);
        return () => clearInterval(interval);
      }, [language]);


  return (
    <div className="infinite-scroll-container">
      <div className='tag-list'>
        <div className='inner'>
          <div className='tag'>
            <i className="fas fa-tint"></i> {/* Blood drop icon */}
           RedHope
          </div>
          <div className='tag'>
            <i className="fas fa-heart"></i> {/* Heart icon */}
            {language === 'fr' ? 'SauvezDesVies' : 'SaveLives'}
          </div>
          <div className='tag'>
            <i className="fas fa-hand-holding-heart"></i> {/* Hand holding heart icon */}
             {language === 'fr' ? 'SoyezUnHéros' : 'BeAHero'}
          </div>
          <div className='tag'>
            <i className="fas fa-syringe"></i> {/* Syringe icon */}
            {language === 'fr' ? 'FaitesUnDonAujourd’hui' : 'DonateToday'}
          </div>
          <div className='tag'>
            <i className="fas fa-hands-helping"></i> {/* Helping hands icon */}
            {language === 'fr' ? 'PartagezL’Amour' : 'SpreadLove'}
          </div>
          <div className='tag'>
            <i className="fas fa-tint"></i> {/* Blood drop icon */}
           RedHope
          </div>
          <div className='tag'>
            <i className="fas fa-heart"></i> {/* Heart icon */}
            {language === 'fr' ? 'SauvezDesVies' : 'SaveLives'}
          </div>
          <div className='tag'>
            <i className="fas fa-hand-holding-heart"></i> {/* Hand holding heart icon */}
            {language === 'fr' ? 'SoyezUnHéros' : 'BeAHero'}
          </div>
          <div className='tag'>
            <i className="fas fa-syringe"></i> {/* Syringe icon */}
            {language === 'fr' ? 'FaitesUnDonAujourd’hui' : 'DonateToday'}
          </div>
          <div className='tag'>
            <i className="fas fa-hands-helping"></i> {/* Helping hands icon */}
            {language === 'fr' ? 'PartagezL’Amour' : 'SpreadLove'}
          </div>
        </div>
        <div className='fade'></div>
      </div>
    </div>
  );
};

export default InfiniteScroll;