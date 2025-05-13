import React, { useState } from 'react';
import './UserPage.css';

const CREAM = '#fdf6ee';

const styleOptions = [
  { value: 'casual', label: 'Casual' },
  { value: 'office', label: 'Office' },
];

export default function UserPage() {
  const [style, setStyle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [wardrobe, setWardrobe] = useState('');
  const [match, setMatch] = useState(null);

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files.map(file => URL.createObjectURL(file)));
  };

  // Simulate matching logic
  const handleMatch = () => {
    setMatch({
      style,
      wardrobe,
      photos,
      suggestion: 'This is your best match! (Demo)',
    });
  };

  return (
    <div className="user-page-cream">
      <div className="chic-section">
        <h1 className="chic-title">Stilini Seç</h1>
        <div className="chic-style-options">
          {styleOptions.map(opt => (
            <button
              key={opt.value}
              className={`chic-style-btn${style === opt.value ? ' selected' : ''}`}
              onClick={() => setStyle(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {style && (
        <div className="chic-section">
          <h2 className="chic-title">Kıyafet Fotoğraflarını Yükle</h2>
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
        </div>
      )}

      {style && (
        <div className="chic-section">
          <h2 className="chic-title">Gardırobunda Neler Var? Ne Giymek İstersin?</h2>
          <textarea
            className="chic-wardrobe-input"
            placeholder="Örn: beyaz gömlek, siyah etek, ceket..."
            value={wardrobe}
            onChange={e => setWardrobe(e.target.value)}
            rows={3}
          />
          <button className="chic-button" onClick={handleMatch}>
            En İyi Kombini Göster
          </button>
        </div>
      )}

      {match && (
        <div className="chic-section chic-match-section">
          <h2 className="chic-title">Sana Özel Kombin</h2>
          <div className="chic-match-details">
            <div><b>Stil:</b> {match.style === 'casual' ? 'Casual' : 'Office'}</div>
            <div><b>Gardırop:</b> {match.wardrobe}</div>
            <div className="chic-photo-preview">
              {match.photos.map((src, i) => (
                <img key={i} src={src} alt="Kıyafet" className="chic-photo" />
              ))}
            </div>
            <div className="chic-suggestion">{match.suggestion}</div>
          </div>
        </div>
      )}
    </div>
  );
} 