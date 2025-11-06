import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header sticky-top bg-white shadow-sm">
      <nav className="container">
        <div className="d-flex justify-content-between align-items-center py-3">
          <a href="/" className="logo text-decoration-none">
            <h3 className="mb-0 fw-bold text-primary">Career AI</h3>
          </a>
          
          <ul className="nav gap-4 d-none d-md-flex">
            <li><a href="/" className="nav-link text-dark fw-medium">Home</a></li>
            <li><a href="#jobs" className="nav-link text-dark fw-medium">Jobs</a></li>
            <li><a href="#resume" className="nav-link text-dark fw-medium">Resume Builder</a></li>
            <li><a href="#about" className="nav-link text-dark fw-medium">About</a></li>
          </ul>
          
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary">Login</button>
            <button className="btn btn-primary">Sign Up</button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

