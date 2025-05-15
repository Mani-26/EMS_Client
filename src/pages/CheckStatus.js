import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import Swal from 'sweetalert2';
// import { useNavigate } from 'react-router-dom';
import './CheckStatus.css';
import '../styles/sweetalert-dark.css'; // Import SweetAlert dark mode styles
import '../styles/animations.css'; // Import animations

export default function CheckStatus() {
  const [ticketId, setTicketId] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [error, setError] = useState('');
  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticketId || !email) {
      setError('Please enter both ticket ID and email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/registration/status?ticketId=${ticketId}&email=${encodeURIComponent(email)}`
      );
      
      setRegistrationData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching registration status:', error);
      setError(error.response?.data?.message || 'Failed to fetch registration status');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not verified yet';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge completed';
      case 'pending':
        return 'status-badge pending';
      case 'failed':
        return 'status-badge failed';
      default:
        return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Verified';
      case 'pending':
        return 'Pending Verification';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };
  
  // Scroll animation with Intersection Observer
  useEffect(() => {
    const formGroups = document.querySelectorAll('.form-group');
    const formSections = document.querySelectorAll('.status-form-container, .status-result, .status-card');
    
    const appearOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };
    
    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          return;
        } else {
          entry.target.classList.add('appear');
          appearOnScroll.unobserve(entry.target);
        }
      });
    }, appearOptions);
    
    // Observe form groups
    formGroups.forEach(group => {
      appearOnScroll.observe(group);
    });
    
    // Observe form sections
    formSections.forEach(section => {
      appearOnScroll.observe(section);
    });
    
    return () => {
      formGroups.forEach(group => {
        appearOnScroll.unobserve(group);
      });
      formSections.forEach(section => {
        appearOnScroll.unobserve(section);
      });
    };
  }, [registrationData]); // Re-run when registration data changes

  return (
    <div className="check-status-container">
      <h1 className="staggered-entrance">Check Registration Status</h1>
      
      <div className="status-form-container form-section">
        <form onSubmit={handleSubmit} className="status-form">
          <div className="form-group">
            <label htmlFor="ticketId">Ticket ID</label>
            <input
              type="text"
              id="ticketId"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter your ticket ID"
              className="input-field"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="input-field"
              required
            />
          </div>
          
          {error && <div className="error-message animated-error">{error}</div>}
          
          <div className="form-group">
            <button 
              type="submit" 
              className="check-status-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-loading">
                  <span className="btn-text">Checking...</span>
                </span>
              ) : (
                'Check Status'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {registrationData && (
        <div className="status-result form-section">
          <h2 className="staggered-entrance">Registration Details</h2>
          
          <div className="status-card card-entrance">
            <div className="status-header">
              <span className={`${getStatusBadgeClass(registrationData.paymentStatus)} pulse-animation`}>
                {getStatusText(registrationData.paymentStatus)}
              </span>
            </div>
            
            <div className="status-body">
              <div className="status-row form-group">
                <span className="status-label">Name:</span>
                <span className="status-value">{registrationData.name}</span>
              </div>
              
              <div className="status-row form-group">
                <span className="status-label">Email:</span>
                <span className="status-value">{registrationData.email}</span>
              </div>
              
              <div className="status-row form-group">
                <span className="status-label">Phone:</span>
                <span className="status-value">{registrationData.phone || 'Not provided'}</span>
              </div>
              
              <div className="status-row form-group">
                <span className="status-label">Ticket ID:</span>
                <span className="status-value">{registrationData.ticketId}</span>
              </div>
              
              <div className="status-row form-group">
                <span className="status-label">Event:</span>
                <span className="status-value">{registrationData.eventName}</span>
              </div>
              
              <div className="status-row form-group">
                <span className="status-label">Payment Method:</span>
                <span className="status-value">{registrationData.paymentMethod?.toUpperCase() || 'N/A'}</span>
              </div>
              
              {registrationData.paymentVerified && (
                <div className="status-row form-group">
                  <span className="status-label">Verified On:</span>
                  <span className="status-value">{formatDate(registrationData.verificationDate)}</span>
                </div>
              )}
            </div>
            
            {registrationData.ticket && (
              <div className="ticket-qr-container form-group">
                <h3>Your Ticket</h3>
                <img src={registrationData.ticket} alt="Ticket QR Code" className="ticket-qr scale-in-animation" />
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="back-link staggered-entrance">
        <a href="/" className="navbar-item">← Back to Home</a>
      </p>
    </div>
  );
}