import React, { useState, useEffect } from 'react';
import './UserPage.css';

const styleOptions = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
];

// Backend URL - change if your backend is running on a different port
const BACKEND_URL = 'http://localhost:5000';

export default function StyleAndWardrobePage() {
  const [style, setStyle] = useState('casual');
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [matchedOutfits, setMatchedOutfits] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    // Load previously uploaded images from local storage
    const saved = localStorage.getItem('codress_uploaded_images');
    if (saved) {
      try {
        setUploadedImages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse uploaded images data", e);
      }
    }

    // Fetch all available images from the backend
    fetchAllImages();
  }, []);

  const fetchAllImages = async () => {
    setFetchError('');
    try {
      console.log('Fetching images from:', `${BACKEND_URL}/api/images`);
      const response = await fetch(`${BACKEND_URL}/api/images`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Images fetched successfully:', data);
        setPhotos(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch images from server:', response.status, errorText);
        setFetchError(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setFetchError(`Connection error: ${error.message}`);
    }
  };

  const handleSearch = async () => {
    // Combine style and query for more specific search
    const searchQuery = `${style} ${query}`.trim();
    
    if (!searchQuery) {
      setSearchError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const results = await response.json();
      console.log('Search results:', results);
      setMatchedOutfits(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(`Search failed: ${error.message}`);
      setMatchedOutfits([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to create proper image URL
  const getImageUrl = (path) => {
    if (!path) return '';
    // If the URL already starts with http, return as is
    if (path.startsWith('http')) return path;
    // If the URL already has a leading slash, don't add another
    return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Format percentage for display
  const formatScore = (score) => {
    return Math.round(score * 100);
  };

  return (
    <div className="style-wardrobe-root">
      <div className="style-wardrobe-left">
        <h1 className="chic-title">Stilini Seç & Kıyafet Ara</h1>
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
        <textarea
          className="chic-wardrobe-input"
          placeholder="Örn: mavi ceket ve siyah etek (blue jacket and black skirt)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          rows={4}
        />
        
        <div className="search-tips">
          <p>
            <strong>Search Tips:</strong>
            <ul>
              <li>You can search for multiple items using "and" or "ve"</li>
              <li>Be specific with colors and styles</li>
              <li>Example: "blue jacket and black skirt" or "red dress"</li>
            </ul>
          </p>
        </div>
        
        {searchError && (
          <div className="search-error" style={{color: 'red', margin: '10px 0'}}>
            {searchError}
          </div>
        )}
        
        <button 
          className="chic-button search-btn" 
          style={{marginTop: '1rem'}}
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Aranıyor...' : 'Kıyafet Ara'}
        </button>

        {/* Debug button to retry fetching images */}
        <button 
          className="chic-button" 
          style={{marginTop: '0.5rem', background: '#6c757d'}}
          onClick={fetchAllImages}
        >
          Resimleri Yenile
        </button>
      </div>
      
      <div className="style-wardrobe-right">
        <div className="uploaded-images-section">
          <h2 className="chic-subtitle" style={{textAlign: 'center', marginBottom: '1rem'}}>
            Yüklenen Resimler {photos.length > 0 ? `(${photos.length})` : ''}
          </h2>
          
          {fetchError && (
            <div className="fetch-error" style={{color: 'red', textAlign: 'center', margin: '10px 0'}}>
              {fetchError}
            </div>
          )}
          
          {photos.length > 0 ? (
            <div className="style-wardrobe-imgs">
              {photos.map((img, i) => {
                const imageUrl = getImageUrl(img.url);
                console.log(`Image ${i} URL:`, imageUrl);
                return (
                  <div key={i} className="image-card">
                    <img 
                      src={imageUrl} 
                      alt={`Clothing item ${i+1}`} 
                      className="style-wardrobe-img" 
                      onError={(e) => {
                        console.error(`Error loading image ${i}:`, imageUrl);
                        e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                      }}
                    />
                    <div className="image-filename">{img.filename}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="style-wardrobe-placeholder">
              {fetchError ? 'Resimler yüklenemedi.' : 'Henüz fotoğraf yok. (No photos yet.)'}
            </div>
          )}
        </div>
        
        <div className="matched-outfits-section" style={{marginTop: '2rem'}}>
          <h2 className="chic-subtitle" style={{textAlign: 'center'}}>Arama Sonuçları</h2>
          
          {matchedOutfits.length > 0 ? (
            <div className="matched-outfits">
              {matchedOutfits.map((outfit, i) => {
                const imageUrl = getImageUrl(outfit.url);
                return (
                  <div key={i} className="outfit-card">
                    <img 
                      src={imageUrl} 
                      alt={`Match ${i+1}`} 
                      className="outfit-img" 
                      onError={(e) => {
                        console.error(`Error loading match ${i}:`, imageUrl);
                        e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                      }}
                    />
                    <div className="outfit-details">
                      <div className="outfit-score">
                        Eşleşme: {formatScore(outfit.score)}%
                      </div>
                      {outfit.query && (
                        <div className="outfit-match-query">
                          Matches: "{outfit.query}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="style-wardrobe-placeholder">
              {isSearching ? 'Aranıyor...' : 'Arama sonuçları burada görünecek'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 