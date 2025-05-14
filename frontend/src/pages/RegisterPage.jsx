import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './UserPage.css'; // Assuming common styles are here

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username || !password || !confirmPassword) {
      setError('Tüm alanlar gereklidir.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    // Basic password length validation (mirroring backend)
    if (password.length < 6) {
      setError('Şifre en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(data.message || 'Kayıt başarılı! Lütfen giriş yapın.');
        // Optionally redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000); // 2 seconds delay
      } else {
        setError(data.error || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="user-page-cream" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="chic-section" style={{ maxWidth: '450px', width: '100%', padding: '2rem' }}>
        <h1 className="chic-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Üye Ol</h1>
        {successMessage && (
          <div style={{ color: 'green', marginBottom: '1rem', textAlign: 'center', padding: '0.5rem', border: '1px solid green', borderRadius: '4px' }}>
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username" className="chic-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Kullanıcı Adı</label>
            <input
              type="text"
              id="username"
              className="chic-input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Bir kullanıcı adı seçin"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" className="chic-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Şifre</label>
            <input
              type="password"
              id="password"
              className="chic-input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Bir şifre seçin (en az 6 karakter)"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword" className="chic-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Şifreyi Onayla</label>
            <input
              type="password"
              id="confirmPassword"
              className="chic-input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifrenizi tekrar girin"
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
            Üye Ol
          </button>
          <div style={{ textAlign: 'center' }}>
            <p>Zaten hesabın var mı? <Link to="/login" className="chic-link">Giriş Yap</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
} 