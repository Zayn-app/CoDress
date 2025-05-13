import React from 'react';
import galleryHero from '../assets/gallery-hero.jpg';
import './GalleryHero.css';

function Gallery() {
  return (
    <div className="gallery-hero-outer">
      <h1 className="gallery-hero-title">CoDress</h1>
      <div className="gallery-hero-fullpage">
        <div className="gallery-hero-fullimg">
          <img src={galleryHero} alt="Sürdürülebilir Moda" />
        </div>
        <div className="gallery-hero-topic-full">
          <h2>Bilinçli Tüketimde Sürdürülebilir Modanın Önemi</h2>
        </div>
      </div>
    </div>
  );
}

export default Gallery; 