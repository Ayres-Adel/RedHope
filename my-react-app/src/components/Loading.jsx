// src/components/Loading.jsx
import React from 'react';
import '../styles/loading.css';

const Loading = () => {
  return (
    <div className='loading' >
        <div className="logo_loading">
            <img src="/src/assets/images/RedHope_Logo.png" alt="RedHope Logo" />
            <a href="/"><h1><span>Red</span>Hope</h1></a>
         </div>
    </div>
  );
};

export default Loading;
