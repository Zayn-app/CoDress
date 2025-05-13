import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hero1 from '../assets/hero1.jpg';
import hero2 from '../assets/hero2.jpg';
import hero3 from '../assets/hero3.jpg';
import './HomeHero.css';

function Home() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [photos, setPhotos] = useState([]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files.map(file => URL.createObjectURL(file)));
  };

  const handleModalContinue = () => {
    localStorage.setItem('codress_photos', JSON.stringify(photos));
    navigate('/style-wardrobe');
    setShowModal(false);
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
          onClick={() => setShowModal(true)}
        >
          Hemen Başla
        </button>
      </div>

      {showModal && (
        <div className="upload-modal-bg">
          <div className="upload-modal">
            <h2>Kıyafet Fotoğraflarını Yükle</h2>
            <input
              type="file"
              multiple
              accept="image/*"
              className="chic-upload-input"
              onChange={handlePhotoChange}
            />
            <div className="chic-photo-preview">
              {photos.map((src, i) => (
                <img key={i} src={src} alt="Kıyafet" className="chic-photo" />
              ))}
            </div>
            <button
              className="chic-button"
              style={{ marginTop: '2rem' }}
              disabled={photos.length === 0}
              onClick={handleModalContinue}
            >
              Devam Et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home; 