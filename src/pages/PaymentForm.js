import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
import './PaymentForm.css';
import '../styles/sweetalert-dark.css';

const CheckoutForm = ({ eventId, name, email, phone, eventDetails }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Cleanup function for registration data
  const cleanupRegistrationData = () => {
    sessionStorage.removeItem('registrationData');
  };
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      cleanupRegistrationData();
      window.removeEventListener('beforeunload', cleanupRegistrationData);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsProcessing(true);
    setPaymentError('');

    try {
      // Use our direct UPI payment flow
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/upi/create-payment`, {
        eventId,
        name,
        email,
        phone
      });
      
      // Store registration data in session storage for later use
      sessionStorage.setItem('registrationData', JSON.stringify(data.registrationData));
      
      // Add event listener for page unload/navigation
      window.addEventListener('beforeunload', cleanupRegistrationData);
      
      // Define the functions that will be used by SweetAlert
      const showTabFunction = (tabId) => {
        // Hide all tab contents
        document.querySelectorAll('.upi-tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.upi-tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Show the selected tab content
        document.getElementById(tabId).classList.add('active');
        
        // Add active class to the clicked button
        document.querySelector(`.upi-tab-btn[data-tab="${tabId}"]`).classList.add('active');
      };
      
      const copyUpiIdFunction = (upiId) => {
        navigator.clipboard.writeText(upiId);
        const copyBtn = document.querySelector('.copy-btn');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      };

      // Show UPI payment modal with multiple payment options
      Swal.fire({
        title: 'Pay with UPI',
        html: `
          <div class="upi-payment-modal">
            <p>Pay ₹${data.eventDetails.fee} using any of these methods:</p>
            
            <div class="upi-tabs">
              <button class="upi-tab-btn active" data-tab="qr-code" id="qr-code-tab">QR Code</button>
              <button class="upi-tab-btn" data-tab="upi-id" id="upi-id-tab">UPI ID</button>
            </div>
            
            <div id="qr-code" class="upi-tab-content active">
              <p>Scan this QR code with any UPI app:</p>
              <div class="qr-container">
                <img src="${data.qrCode}" alt="UPI QR Code" class="upi-qr" onerror="this.onerror=null; this.src='${data.backupQrCode}';" />
              </div>
            </div>
            
            <div id="upi-id" class="upi-tab-content">
              <p>Pay directly to this UPI ID:</p>
              <div class="upi-id-container">
                <div class="upi-id-value">${data.upiId}</div>
                <button class="copy-btn" id="copy-upi-btn">
                  Copy
                </button>
              </div>
              <p class="upi-amount">Amount: ₹${data.amount}</p>
            </div>
            
            <p class="upi-ref">Payment Reference: ${data.transactionRef}</p>
            <div class="upi-buttons">
              <a href="${data.gpayLink}" class="upi-app-button" target="_blank" style="background-color: #1a73e8; margin-right: 10px;">
                Google Pay
              </a>
              <a href="${data.phonePeLink}" class="upi-app-button" target="_blank" style="background-color: #5f259f; margin-right: 10px;">
                PhonePe
              </a>
              <a href="${data.upiLink}" class="upi-app-button" target="_blank" style="background-color: #28a745;">
                Other UPI App
              </a>
            </div>
            <p class="upi-instructions">After payment, click "I've Paid" below</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "I've Paid",
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        allowOutsideClick: false,
        didOpen: () => {
          // Add event listeners after the modal is opened
          document.getElementById('qr-code-tab').addEventListener('click', () => showTabFunction('qr-code'));
          document.getElementById('upi-id-tab').addEventListener('click', () => showTabFunction('upi-id'));
          document.getElementById('copy-upi-btn').addEventListener('click', () => copyUpiIdFunction(data.upiId));
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // User claims they've paid, verify payment
          verifyUpiPayment(data.transactionRef);
        } else {
          // User canceled, clean up registration data
          cleanupRegistrationData();
          setIsProcessing(false);
        }
      });
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'An error occurred during payment processing');
      setIsProcessing(false);
    }
  };

  // Function to verify UPI payment
  const verifyUpiPayment = async (transactionRef) => {
    try {
      // Create a file input for screenshot upload
      const fileInputId = 'payment-screenshot-input';
      
      // Ask for payment screenshot only
      const { value: formValues, dismiss } = await Swal.fire({
        title: 'Payment Verification',
        html: `
          <div class="payment-verification-form">
            <div class="form-group" style="margin-bottom: 20px;">
              <label for="${fileInputId}" style="display: block; text-align: left; margin-bottom: 5px; font-weight: bold;">Payment Screenshot *</label>
              <input type="file" id="${fileInputId}" accept="image/*" style="width: 100%;" required>
              <div id="screenshot-error" style="color: red; font-size: 12px; text-align: left; display: none;">Payment screenshot is required</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px; text-align: left;">
                Please upload a screenshot of your payment confirmation
              </div>
            </div>
            
            <div id="preview-container" style="margin-top: 10px; display: none;">
              <img id="screenshot-preview" style="max-width: 100%; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;" />
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Verify Payment',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        allowOutsideClick: false,
        focusConfirm: false,
        didOpen: () => {
          // Add event listener for file input
          const fileInput = document.getElementById(fileInputId);
          const previewContainer = document.getElementById('preview-container');
          const previewImage = document.getElementById('screenshot-preview');
          
          fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewContainer.style.display = 'block';
              };
              reader.readAsDataURL(file);
            } else {
              previewContainer.style.display = 'none';
            }
          });
        },
        preConfirm: () => {
          const fileInput = document.getElementById(fileInputId);
          const screenshotError = document.getElementById('screenshot-error');
          
          let isValid = true;
          
          // Validate screenshot
          if (!fileInput.files || fileInput.files.length === 0) {
            screenshotError.style.display = 'block';
            isValid = false;
          } else {
            screenshotError.style.display = 'none';
          }
          
          if (!isValid) {
            return false;
          }
          
          // Return form values
          return {
            file: fileInput.files[0]
          };
        }
      });
      
      // If user cancels or validation fails
      if (dismiss === Swal.DismissReason.cancel || !formValues) {
        setIsProcessing(false);
        return;
      }
      
      // Show loading state
      Swal.fire({
        title: 'Processing Image',
        text: 'Please wait while we process your payment screenshot...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Compress the image before uploading
      const compressImage = async (file) => {
        try {
          const options = {
            maxSizeMB: 1, // Max size in MB
            maxWidthOrHeight: 1200, // Max width/height
            useWebWorker: true,
            fileType: 'image/jpeg'
          };
          
          const compressedFile = await imageCompression(file, options);
          console.log('Original file size:', file.size / 1024 / 1024, 'MB');
          console.log('Compressed file size:', compressedFile.size / 1024 / 1024, 'MB');
          
          return compressedFile;
        } catch (error) {
          console.error('Error compressing image:', error);
          return file; // Return original file if compression fails
        }
      };
      
      // Convert image to base64
      const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      };
      
      // Compress and convert to base64
      const compressedFile = await compressImage(formValues.file);
      const paymentScreenshot = await readFileAsDataURL(compressedFile);
      
      // Update loading message
      Swal.update({
        title: 'Verifying Payment',
        text: 'Please wait while we verify your payment...'
      });
      
      // Get registration data from session storage
      const storedRegistrationData = JSON.parse(sessionStorage.getItem('registrationData'));
      
      // Verify payment with the server
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/upi/verify-payment`, {
        transactionRef,
        email,
        upiTransactionId: `AUTO-${Date.now()}`, // Generate an automatic transaction ID
        paymentScreenshot,
        registrationData: storedRegistrationData // Include registration data
      });

      if (data.success) {
        // Clear registration data from session storage
        sessionStorage.removeItem('registrationData');
        
        // Payment screenshot received, pending verification
        Swal.fire({
          icon: 'info',
          title: 'Payment Being Verified',
          html: `
            <div>
              <p>Your payment screenshot has been received and is pending verification by our team.</p>
              <p><strong>Ticket ID: #${data.ticketId}</strong></p>
              <p>Please note your Ticket ID for future reference.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #17a2b8; text-align: left;">
                <h4 style="margin-top: 0; color: #17a2b8;">What happens next?</h4>
                <ul style="padding-left: 20px; margin-bottom: 0;">
                  <li>Our team will verify your payment</li>
                  <li>Once verified, you'll receive your ticket via email</li>
                  <li>You can check your registration status anytime using your Ticket ID</li>
                </ul>
              </div>
            </div>
          `,
          confirmButtonText: 'Check Status',
          confirmButtonColor: '#17a2b8',
          showCancelButton: true,
          cancelButtonText: 'View Receipt',
          cancelButtonColor: '#6c757d',
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate to check status page
            navigate('/check-status');
          } else {
            // Navigate to payment success page with pending status
            navigate(`/payment-success/${transactionRef}`, {
              state: {
                status: 'pending',
                eventId: eventId,
                ticketId: data.ticketId
              }
            });
          }
        });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      
      let errorMessage = "We could not verify your payment. Please try again.";
      
      if (error.response) {
        // Server responded with an error
        if (error.response.status === 413) {
          errorMessage = "The payment screenshot is too large. Please try again with a smaller image.";
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check your internet connection and try again.";
      } else {
        // Error in setting up the request
        errorMessage = error.message || errorMessage;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: errorMessage,
        footer: '<p class="transaction-ref">Reference ID: ' + transactionRef + '</p>',
        confirmButtonColor: '#dc3545',
      });
      
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-form">
      <h1>Complete Your Registration</h1>
      
      <p className="payment-intro">
        Please review your details and complete the payment to confirm your registration.
      </p>
      
      {eventDetails && (
        <div className="event-summary">
          <h3>Event Details</h3>
          <p><strong>{eventDetails.name}</strong></p>
          <p className="event-date">📅 Date: {new Date(eventDetails.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
          <p className="event-venue">📍 Venue: {eventDetails.venue}</p>
          <p className="event-fee">💰 Fee: ₹{eventDetails.fee}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="card-details">
          <h3>Your Information</h3>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} disabled className="upi-input" />
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Email</label>
            <input type="email" value={email} disabled className="upi-input" />
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Phone</label>
            <input 
              type="tel" 
              value={phone} 
              className="upi-input"
              disabled
            />
          </div>
        </div>
        
        <div className="payment-method-selector">
          <h3>Payment Method</h3>
          <div className="payment-option selected">
            <div className="payment-icon">
              <img 
                src="/upi-icon.png" 
                alt="UPI" 
                style={{ width: '50px', height: '50px' }}
                onError={(e) => e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png'} 
              />
            </div>
            <div>
              <div className="payment-method-name" style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>UPI Payment</div>
              <div className="payment-method-description" style={{ fontSize: '0.9rem' }}>
                Pay using Google Pay, PhonePe, Paytm, or any UPI app
              </div>
            </div>
          </div>
        </div>
        
        {paymentError && <div className="payment-error">{paymentError}</div>}
        
        <button 
          type="submit" 
          className="payment-button" 
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay ₹${eventDetails?.fee || '0'}`}
        </button>
      </form>
      
      <div className="back-link">
        <a href="/">← Back to Home</a>
      </div>
    </div>
  );
};

const PaymentForm = () => {
  const { eventId, name, email, phone } = useParams();
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`);
        setEventDetails(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load event details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);
  
  if (loading) {
    return (
      <div className="payment-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="payment-container">
        <div className="payment-error">
          <h3>Error</h3>
          <p>{error}</p>
          <div className="back-link">
            <a href="/">← Back to Home</a>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="payment-container">
      <CheckoutForm 
        eventId={eventId} 
        name={name} 
        email={email} 
        phone={phone}
        eventDetails={eventDetails} 
      />
    </div>
  );
};

export default PaymentForm;