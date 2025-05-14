import React, { useState } from 'react';
import '../pages/UserPage.css'; // Assuming common styles for .chic-button etc.
import '../pages/HomeHero.css'; // For .upload-modal-bg, .upload-modal if we reuse them

const BACKEND_URL = 'http://localhost:5000';

export default function UploadModal({ onClose, onUploadComplete }) {
  const [photosPreview, setPhotosPreview] = useState([]); // For blob URLs for preview
  const [filesToUpload, setFilesToUpload] = useState([]);   // For actual File objects
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) {
      setPhotosPreview([]);
      setFilesToUpload([]);
      return;
    }
    setFilesToUpload(selectedFiles);
    setPhotosPreview(selectedFiles.map(file => URL.createObjectURL(file)));
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0) {
      setUploadError('Lütfen yüklenecek resimleri seçin.');
      return;
    }

    const formData = new FormData();
    filesToUpload.forEach(file => {
      formData.append('images', file);
    });

    setIsUploading(true);
    setUploadError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        // Headers for FormData are set automatically by the browser
      });

      const data = await response.json();

      if (response.ok && data.success && data.allImages) {
        console.log('Modal Upload successful:', data);
        onUploadComplete(data.allImages); // Pass all images back to parent
        // Reset internal state and close
        setPhotosPreview([]);
        setFilesToUpload([]);
        onClose(); 
      } else {
        setUploadError(data.error || 'Resimler yüklenirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Modal Upload error:', err);
      setUploadError('Yükleme sırasında bir ağ hatası oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-modal-bg"> {/* Reusing class from Home.jsx modal */}
      <div className="upload-modal">    {/* Reusing class from Home.jsx modal */}
        <h2>Kıyafet Fotoğraflarını Yükle</h2>
        <input
          type="file"
          multiple
          accept="image/*"
          className="chic-upload-input" // Assuming this class is styled globally or in UserPage.css
          onChange={handlePhotoChange}
          style={{ marginBottom: '1rem' }}
        />
        {photosPreview.length > 0 && (
          <div className="chic-photo-preview" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {photosPreview.map((src, i) => (
              <img key={`preview-${i}`} src={src} alt={`Önizleme ${i + 1}`} className="chic-photo" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
            ))}
          </div>
        )}
        {uploadError && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>{uploadError}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            className="chic-button chic-button-secondary" // You might need a secondary button style
            onClick={onClose} 
            disabled={isUploading}
          >
            İptal
          </button>
          <button 
            className="chic-button" 
            onClick={handleUpload} 
            disabled={isUploading || filesToUpload.length === 0}
          >
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
        </div>
      </div>
    </div>
  );
} 