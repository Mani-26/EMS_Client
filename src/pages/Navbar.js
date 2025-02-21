// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Yellowmatics
        </Link>
        <div className="navbar-menu">
          {/* <Link to="/" className="navbar-item">
            Home
          </Link> */}
          <Link to="/admin-login" className="navbar-item">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
