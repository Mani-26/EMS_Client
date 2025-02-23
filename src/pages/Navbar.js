// Navbar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Yellowmatics
        </Link>

        {/* Hamburger Icon */}
        <div className="hamburger" onClick={toggleMenu}>
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
        </div>

        {/* Navigation Menu */}
        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-item" onClick={() => setIsOpen(false)}>
            Home
          </Link>
          <Link to="/about" className="navbar-item" onClick={() => setIsOpen(false)}>
            About
          </Link>
          <Link to="/services" className="navbar-item" onClick={() => setIsOpen(false)}>
            Services
          </Link>
          <Link to="/contact" className="navbar-item" onClick={() => setIsOpen(false)}>
            Contact
          </Link>
          <Link to="/admin-login" className="navbar-item" onClick={() => setIsOpen(false)}>
            Admin Login
          </Link>
          <button className="theme-toggle" onClick={toggleDarkMode}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;