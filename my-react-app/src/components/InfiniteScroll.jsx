import React, { useEffect, useState } from 'react';
import '../styles/InfiniteScroll.css';

const InfiniteScroll = () => {

    useEffect(() => {
      const toggle = document.getElementById('toggle');
      toggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      });
  
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
            <i className="fas fa-tint"></i>
           RedHope
          </div>
          <div className='tag'>
            <i className="fas fa-heart"></i>
            {language === 'fr' ? 'SauvezDesVies' : 'SaveLives'}
          </div>
          <div className='tag'>
            <i className="fas fa-hand-holding-heart"></i>
             {language === 'fr' ? 'SoyezUnHéros' : 'BeAHero'}
          </div>
          <div className='tag'>
            <i className="fas fa-syringe"></i>
            {language === 'fr' ? 'FaitesUnDonAujourd’hui' : 'DonateToday'}
          </div>
          <div className='tag'>
            <i className="fas fa-hands-helping"></i>
            {language === 'fr' ? 'PartagezL’Amour' : 'SpreadLove'}
          </div>
          <div className='tag'>
            <i className="fas fa-tint"></i>
           RedHope
          </div>
          <div className='tag'>
            <i className="fas fa-heart"></i>
            {language === 'fr' ? 'SauvezDesVies' : 'SaveLives'}
          </div>
          <div className='tag'>
            <i className="fas fa-hand-holding-heart"></i>
            {language === 'fr' ? 'SoyezUnHéros' : 'BeAHero'}
          </div>
          <div className='tag'>
            <i className="fas fa-syringe"></i>
            {language === 'fr' ? 'FaitesUnDonAujourd’hui' : 'DonateToday'}
          </div>
          <div className='tag'>
            <i className="fas fa-hands-helping"></i>
            {language === 'fr' ? 'PartagezL’Amour' : 'SpreadLove'}
          </div>
        </div>
        <div className='fade'></div>
      </div>
    </div>
  );
};

export default InfiniteScroll;