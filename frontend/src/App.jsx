import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import About from './pages/About'
import UserPage  from './pages/UserPage'
import UploadPage from './pages/UploadPage'
import StyleAndWardrobePage from './pages/StyleAndWardrobePage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>CoDress</h1>
          <nav>
            <ul>
              <li><Link to="/">AnaSayfa</Link></li>
              <li><Link to="/gallery">Galeri</Link></li>
              <li><Link to="/about">Hakkımızda</Link></li>
              
            </ul>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<About />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/style-wardrobe" element={<StyleAndWardrobePage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; 2024 CoDress. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
