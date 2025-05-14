import React, { useState, useEffect } from 'react';
import './UserPage.css';
import { useLocation } from 'react-router-dom';
import UploadModal from '../components/UploadModal';

const styleOptions = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
];

const BACKEND_URL = 'http://localhost:5000';

export default function StyleAndWardrobePage() {
  const location = useLocation();
  console.log('[StyleAndWardrobePage] Location state on load:', location.state);

  const [style, setStyle] = useState('casual');
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [matchedOutfits, setMatchedOutfits] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingPhotos, setIsFetchingPhotos] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    console.log('[StyleAndWardrobePage] useEffect triggered. Location state:', location.state);
    if (location.state?.images) {
      console.log('[StyleAndWardrobePage] Using images from navigation state:', location.state.images);
      setPhotos(location.state.images);
      setIsFetchingPhotos(false);
    } else {
      console.log('[StyleAndWardrobePage] No images in location.state, calling fetchAllImages.');
      setIsFetchingPhotos(true);
      fetchAllImages();
    }
  }, [location.pathname, location.state?.timestamp, location.state?.images]);

  useEffect(() => {
    console.log('[StyleAndWardrobePage] Photos state updated:', photos);
  }, [photos]);

  useEffect(() => {
    console.log('[StyleAndWardrobePage] matchedOutfits state updated:', matchedOutfits);
  }, [matchedOutfits]);

  const fetchAllImages = async () => {
    console.log('[StyleAndWardrobePage] fetchAllImages called.');
    setIsFetchingPhotos(true);
    setFetchError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/images`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      console.log('[StyleAndWardrobePage] fetchAllImages response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[StyleAndWardrobePage] Images fetched successfully from API:', data);
        setPhotos(data);
      } else {
        const errorText = await response.text();
        console.error('[StyleAndWardrobePage] Failed to fetch images from server:', response.status, errorText);
        setFetchError(`Server error: ${response.status}`);
        setPhotos([]); // Clear photos on error
      }
    } catch (error) {
      console.error('[StyleAndWardrobePage] Error fetching images:', error);
      setFetchError(`Connection error: ${error.message}`);
      setPhotos([]); // Clear photos on error
    } finally {
      console.log('[StyleAndWardrobePage] fetchAllImages finally block, setting isFetchingPhotos to false.');
      setIsFetchingPhotos(false);
    }
  };

  const handleSearch = async () => {
    console.log('[StyleAndWardrobePage] handleSearch triggered.');
    if (!query.trim()) {
      setSearchError('Lütfen bir arama terimi girin (Please enter a search term)');
      return;
    }
    setIsSearching(true);
    setSearchError('');
    setMatchedOutfits([]); // Clear previous results immediately

    const payload = { query: query.trim(), style: style };
    console.log('[StyleAndWardrobePage] Sending to /api/search:', payload);

    try {
      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), 
      });
      
      console.log('[StyleAndWardrobePage] /api/search response status:', response.status);
      const responseText = await response.text(); // Get raw response text for logging
      console.log('[StyleAndWardrobePage] /api/search raw response text:', responseText);

      if (response.ok) {
        const results = JSON.parse(responseText); // Parse the text
        console.log('[StyleAndWardrobePage] Search results received from API:', results);
        setMatchedOutfits(results);
      } else {
        console.error('[StyleAndWardrobePage] Search request failed. Status:', response.status, 'Response:', responseText);
        setSearchError(`Arama başarısız oldu (sunucu hatası): ${response.status}`);
        setMatchedOutfits([]);
      }
    } catch (error) {
      console.error('[StyleAndWardrobePage] Catch block error during search:', error);
      setSearchError(`Arama sırasında bir hata oluştu: ${error.message}`);
      setMatchedOutfits([]);
    } finally {
      console.log('[StyleAndWardrobePage] handleSearch finally block, setting isSearching to false.');
      setIsSearching(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const timestamp = new Date().getTime();
    return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}?t=${timestamp}`;
  };

  const formatScore = (score) => {
    return Math.round(score * 100);
  };

  const handleUploadComplete = (allImages) => {
    console.log('[StyleAndWardrobePage] Upload complete, new image list:', allImages);
    setPhotos(allImages);
    setIsFetchingPhotos(false);
  };

  console.log('[StyleAndWardrobePage] Rendering. isFetchingPhotos:', isFetchingPhotos, 'Photos length:', photos.length, 'FetchError:', fetchError);

  return (
    <div className="style-wardrobe-root">
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
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
          <div className="search-error" style={{ color: 'red', margin: '10px 0' }}>
            {searchError}
          </div>
        )}
        <button
          className="chic-button search-btn"
          style={{ marginTop: '1rem' }}
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Aranıyor...' : 'Kıyafet Ara'}
        </button>
        <button 
          className="chic-button" 
          style={{ marginTop: '1rem', backgroundColor: '#5cb85c' }}
          onClick={() => setShowUploadModal(true)}
        >
          Yeni Resim Yükle
        </button>
      </div>

      <div className="style-wardrobe-right">
        <div className="uploaded-images-section">
          <h2 className="chic-subtitle" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Yüklenen Resimler {photos.length > 0 && !isFetchingPhotos ? `(${photos.length})` : ''}
          </h2>
          {fetchError && (
            <div className="fetch-error" style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>
              {fetchError}
            </div>
          )}
          {isFetchingPhotos ? (
            <div className="style-wardrobe-placeholder">Yükleniyor...</div>
          ) : photos.length > 0 ? (
            <div className="style-wardrobe-imgs">
              {photos.map((img, i) => {
                if (!img || !img.url) {
                  console.error('[StyleAndWardrobePage] Rendering photos: Invalid image object or URL at index', i, img);
                  return <div key={`error-${i}`} className="image-card-error">Invalid image data</div>;
                }
                const imageUrl = getImageUrl(img.url);
                console.log(`[StyleAndWardrobePage] Rendering image ${i} with URL:`, imageUrl);
                return (
                  <div key={img.id || img.filename || i} className="image-card">
                    <img
                      src={imageUrl}
                      alt={`Clothing item ${img.filename || i + 1}`}
                      className="style-wardrobe-img"
                      onError={(e) => {
                        console.error(`[StyleAndWardrobePage] Error loading image ${i} from URL:`, imageUrl);
                        e.target.src = 'https://via.placeholder.com/150?text=Image+Load+Error';
                      }}
                    />
                    <div className="image-filename">{img.filename || 'Unnamed file'}</div>
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
