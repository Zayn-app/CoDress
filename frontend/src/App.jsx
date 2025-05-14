import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import About from './pages/About'
import UserPage  from './pages/UserPage'
import UploadPage from './pages/UploadPage'
import StyleAndWardrobePage from './pages/StyleAndWardrobePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// A wrapper component to conditionally render header and footer
function LayoutWrapper({ children }) {
  const location = useLocation();
  const noHeaderFooterPaths = ['/login', '/register'];
  const showHeaderFooter = !noHeaderFooterPaths.includes(location.pathname);
  const isMainPage = location.pathname === '/';

  const isLoggedIn = !!localStorage.getItem('user');

  const handleLogout = () => {
    localStorage.removeItem('user');
    // Potentially navigate to home or login page, and force re-render if needed
    window.location.href = '/login'; // Simple redirect, consider useNavigate for SPA behavior
  };

  return (
    <div className="app-container">
      {showHeaderFooter && (
        <header className="app-header">
          <h1>CoDress</h1>
          <nav>
            <ul>
              <li><Link to="/">AnaSayfa</Link></li>
              <li><Link to="/gallery">Galeri</Link></li>
              <li><Link to="/about">Hakkımızda</Link></li>
              {/* Auth links are hidden on the main page, and also if on login/register (due to showHeaderFooter) */}
              {!isMainPage && (
                <>
                  {isLoggedIn ? (
                    <li><button onClick={handleLogout} className="chic-nav-button">Çıkış Yap</button></li>
                  ) : (
                    <>
                      {/* These checks are somewhat redundant if !isMainPage is active and showHeaderFooter correctly hides for /login /register */}
                      {location.pathname !== '/login' && <li><Link to="/login">Giriş Yap</Link></li>}
                      {location.pathname !== '/register' && <li><Link to="/register">Üye Ol</Link></li>}
                    </>
                  )}
                </>
              )}
            </ul>
          </nav>
        </header>
      )}

      <main className={`main-content ${!showHeaderFooter ? 'main-content-full-page' : ''}`}>
        {children} {/* This is where Routes will be rendered */}
      </main>

      {showHeaderFooter && (
        <footer className="app-footer">
          <p>&copy; 2024 CoDress. All rights reserved.</p>
        </footer>
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/user" 
            element={<ProtectedRoute><UserPage /></ProtectedRoute>} 
          />
          <Route 
            path="/upload" 
            element={<ProtectedRoute><UploadPage /></ProtectedRoute>} 
          />
          <Route 
            path="/style-wardrobe" 
            element={<ProtectedRoute><StyleAndWardrobePage /></ProtectedRoute>} 
          />
        </Routes>
      </LayoutWrapper>
    </Router>
  )
}

export default App
