// Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
// import Swal from 'sweetalert2';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Set light mode as default
  // eslint-disable-next-line no-unused-vars
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Update body class for dark mode
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);
  
  // Check if admin is logged in
  useEffect(() => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location.pathname]);
  
  // Handle admin tab click
  const handleAdminClick = (e) => {
    e.preventDefault();
    
    if (isLoggedIn) {
      // If logged in, go to admin dashboard
      navigate("/admin");
    } else {
      // If not logged in, go to admin login page
      navigate("/admin-login");
    }
    
    setIsOpen(false);
  };

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Top Navbar (hidden on mobile) */}
      <nav className="navbar top-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="animated-text">Y</span>
            <span className="animated-text">e</span>
            <span className="animated-text">l</span>
            <span className="animated-text">l</span>
            <span className="animated-text">o</span>
            <span className="animated-text">w</span>
            <span className="animated-text">m</span>
            <span className="animated-text">a</span>
            <span className="animated-text">t</span>
            <span className="animated-text">i</span>
            <span className="animated-text">c</span>
            <span className="animated-text">s</span>
          </Link>

          {/* Hamburger Icon (only visible on tablets, not on phones) */}
          <div className="hamburger tablet-only" onClick={toggleMenu}>
            <span className={`bar ${isOpen ? 'open' : ''}`}></span>
            <span className={`bar ${isOpen ? 'open' : ''}`}></span>
            <span className={`bar ${isOpen ? 'open' : ''}`}></span>
          </div>

          {/* Navigation Menu */}
          <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
            <Link to="/" className="navbar-item" onClick={() => setIsOpen(false)}>
              Home
            </Link>
            <Link to="/check-status" className="navbar-item" onClick={() => setIsOpen(false)}>
              Check Status
            </Link>
            <button className="navbar-item link-button" onClick={handleAdminClick}>
              {isLoggedIn ? 'Admin' : 'Login'}
            </button>
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-navbar">
        <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">🏠</div>
          <span>Home</span>
        </Link>
        <Link to="/check-status" className={`bottom-nav-item ${isActive('/check-status') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">🔍</div>
          <span>Status</span>
        </Link>
        <button className="bottom-nav-item theme-toggle-mobile" onClick={toggleDarkMode}>
          <div className="bottom-nav-icon">{isDarkMode ? '☀️' : '🌙'}</div>
          <span>Theme</span>
        </button>
        <button 
          className={`bottom-nav-item link-button ${isActive('/admin-login') || isActive('/admin') ? 'active' : ''}`}
          onClick={handleAdminClick}
        >
          <div className="bottom-nav-icon">{isLoggedIn ? '👤' : '⚙️'}</div>
          <span>{isLoggedIn ? 'Admin' : 'Login'}</span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;