import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './UserPage.css'; // Assuming common styles are here

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/style-wardrobe';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!username || !password) {
      setError('Kullanıcı adı ve şifre gereklidir.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Login successful:', data.user);
        // Store user info or token (e.g., in localStorage)
        localStorage.setItem('user', JSON.stringify(data.user)); 
        // Redirect to the page the user was trying to access, or default
        navigate(from, { replace: true }); 
      } else {
        setError(data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="user-page-cream" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="chic-section" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <h1 className="chic-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Giriş Yap</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username" className="chic-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Kullanıcı Adı</label>
            <input
              type="text"
              id="username"
              className="chic-input" // Assuming a general input style like chic-upload-input
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" className="chic-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Şifre</label>
            <input
              type="password"
              id="password"
              className="chic-input" // Assuming a general input style
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
            />
          </div>
          {error && (
            <div className="chic-error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="chic-button"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1rem' }}
          >
            Giriş Yap
          </button>
          <div style={{ textAlign: 'center' }}>
            <p>Hesabın yok mu? <Link to="/register" className="chic-link">Üye Ol</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
} 