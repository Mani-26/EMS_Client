import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const { transactionRef } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);
  
  // Get data from location state or fetch it if not available
  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        if (location.state && location.state.ticketId) {
          // Data is available from navigation state
          setTicketData({
            ticketId: location.state.ticketId,
            eventId: location.state.eventId,
            status: location.state.status,
            transactionRef: transactionRef
          });
        } else {
          // Fetch data from server using transaction reference
          const response = await fetch(`/api/upi/payment-status/${transactionRef}`);
          if (!response.ok) {
            throw new Error('Failed to fetch ticket data');
          }
          const data = await response.json();
          setTicketData({
            ticketId: data.ticketId,
            status: data.status,
            paymentMethod: data.paymentMethod,
            transactionRef: transactionRef
          });
        }
      } catch (error) {
        console.error('Error fetching ticket data:', error);
        setError('Unable to load ticket information. Please check your email for ticket details or contact support.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [transactionRef, location.state]);

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your ticket information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container">
        <div className="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p className="success-message">
          Thank you for your payment. Your registration is now complete!
        </p>
        <div className="payment-details">
          <p className="payment-method">Transaction Reference: {transactionRef}</p>
        </div>
        <p className="email-note error-message">
          {error}
        </p>
        <div className="action-buttons">
          <button className="home-button" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="success-icon">✓</div>
      <h1>Payment Received!</h1>
      <p className="success-message">
        {location.state && location.state.status === 'pending' 
          ? "Thank you for your payment. Your payment is being verified by our team."
          : "Thank you for your payment. Your registration is now complete!"}
      </p>
      
      {ticketData && (
        <div className={`payment-details ${ticketData.status === 'pending' ? 'pending' : ''}`}>
          <p className="payment-method">Transaction Reference: {transactionRef}</p>
          {ticketData.ticketId && (
            <p className="ticket-id">Ticket ID: {ticketData.ticketId}</p>
          )}
          
          {location.state && location.state.status === 'pending' && (
            <div className="verification-notice">
              <h3>Payment Verification in Progress</h3>
              <p>Your payment screenshot has been received and is being verified by our team.</p>
              <p>Please note your Ticket ID for future reference.</p>
              <p>You will receive an email once your payment is verified.</p>
            </div>
          )}
          <p className="payment-status">
            Status: <span className={ticketData.status === 'completed' ? 'status-completed' : 'status-pending'}>
              {ticketData.status === 'completed' ? 'Verified' : 'Pending Verification'}
            </span>
          </p>
        </div>
      )}

      {/* QR Code Section */}
      {ticketData && ticketData.ticketId && (
        <div className="qr-code-container">
          <h2>Your Ticket QR Code</h2>
          <p className="qr-code-instruction">Scan this QR code at the event entrance</p>
          <div className="qr-code-wrapper">
            <QRCodeSVG 
              value={JSON.stringify({
                ticketId: ticketData.ticketId,
                transactionRef: transactionRef,
                timestamp: new Date().toISOString()
              })}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
        </div>
      )}

      <p className="email-note">
        A confirmation email with your ticket has been sent to your email address.
      </p>

      <div className="action-buttons">
        <button className="home-button" onClick={handleBackToHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
