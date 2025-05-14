import React from 'react';
import { useNavigate } from 'react-router-dom';
import hero1 from '../assets/hero1.jpg';
import hero2 from '../assets/hero2.jpg';
import hero3 from '../assets/hero3.jpg';
import './HomeHero.css';

function Home() {
  const navigate = useNavigate();

  const handleStartNow = () => {
    navigate('/login');
  };

  return (
    <div className="hero-wrapper">
      <div className="hero-images">
        <img src={hero1} alt="Hero 1" className="hero-img" />
        <img src={hero2} alt="Hero 2" className="hero-img" />
        <img src={hero3} alt="Hero 3" className="hero-img" />
      </div>
      <div className="hero-overlay">
        <h1 className="hero-title">CoDress</h1>
        <p className="hero-subtitle">High style with low price</p>
        <button
          className="hero-cta"
          onClick={handleStartNow}
        >
          Hemen Başla
        </button>
      </div>
    </div>
  );
}

export default Home; 