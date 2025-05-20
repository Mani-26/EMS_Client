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
      
      // Skip the payment interface and directly go to screenshot upload
      verifyUpiPayment(data.transactionRef, data.upiId, data.amount, data.phoneNumber);
      
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'An error occurred during payment processing');
      setIsProcessing(false);
    }
  };

  // Function to verify UPI payment
  const verifyUpiPayment = async (transactionRef, upiId, amount, phoneNumber) => {
    try {
      console.log("Payment details:", { transactionRef, upiId, amount, phoneNumber });
      
      // Create a file input for screenshot upload
      const fileInputId = 'payment-screenshot-input';
      
      // Create a custom modal for file upload
      const uploadModal = document.createElement('div');
      uploadModal.className = 'custom-upload-modal';
      uploadModal.innerHTML = `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;  border-left: 4px solid #17a2b8;">
          <h3 style="margin-top: 0; color: #17a2b8; font-size: 16px;">Payment Instructions</h3>
          <p style="margin-bottom: 10px;">Please pay the event fee using the following details:</p>
          
          <div style="margin-bottom: 10px;">
            <strong style="min-width: 100px;">Amount:</strong> <span style="color: green; font-weight: bolder;">₹${amount}</span>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 10px;">
            <strong style="min-width: 100px; margin-bottom: 5px;">UPI ID:</strong> 
            <div style="display: flex; align-items: center; background: #fff; padding: 5px 10px; border-radius: 4px; border: 1px solid #ddd; flex-grow: 1; width: 100%;">
              <span style="flex-grow: 1; overflow-wrap: break-word; word-break: break-all;">${upiId || 'Not provided'}</span>
              <button id="copy-upi-btn" style="background: #17a2b8; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; white-space: nowrap; min-width: 50px; margin-left: 8px;">Copy</button>
            </div>
          </div>
         
          
          ${phoneNumber ? `
          <div style="display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 10px;">
            <strong style="min-width: 100px; margin-bottom: 5px;">Phone:</strong> 
            <div style="display: flex; align-items: center; background: #fff; padding: 5px 10px; border-radius: 4px; border: 1px solid #ddd; flex-grow: 1; width: 100%;">
              <span style="flex-grow: 1; overflow-wrap: break-word; word-break: break-all;">${phoneNumber}</span>
              <button id="copy-phone-btn" style="background: #17a2b8; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; white-space: nowrap; min-width: 50px; margin-left: 8px;">Copy</button>
            </div>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 10px;">
            <strong style="min-width: 100px;">Reference:</strong> ${transactionRef}
          </div>
          
          <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">After making the payment, please upload the screenshot below.</p>
        </div>
        
        <p style="position: relative;">Please upload a screenshot of your payment confirmation </p>
        <span class="upload-arrow" style="position: relative; display: inline-block; margin-left: 5px; font-size:30px">👇</span>
        <div class="file-upload-container">
        <label for="${fileInputId}" class="file-upload-label">
        <span class="upload-icon">📁</span>
        <span class="upload-text">Click to select file</span>
          </label>
          <input type="file" id="${fileInputId}" accept="image/*" style="position: absolute; opacity: 0; width: 0.1px; height: 0.1px; overflow: hidden;">
          <div id="screenshot-error" style="color: red; font-size: 12px; text-align: left; display: none;">Payment screenshot is required</div>
          <div id="upload-success" class="upload-success-message" style="display: none;">✅ Screenshot Selected</div>
        </div>
        <div id="preview-container" style="margin-top: 10px; display: none;">
          <img id="screenshot-preview" />
        </div>
      `;
      
      document.body.appendChild(uploadModal);
      
      // Add event listener for file input
      const fileInput = document.getElementById(fileInputId);
      const previewContainer = document.getElementById('preview-container');
      const previewImage = document.getElementById('screenshot-preview');
      const screenshotError = document.getElementById('screenshot-error');
      
      const uploadSuccess = document.getElementById('upload-success');
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
            screenshotError.style.display = 'none';
            uploadSuccess.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          previewContainer.style.display = 'none';
          uploadSuccess.style.display = 'none';
        }
      });
      
      // Show SweetAlert with custom buttons
      const { value: formValues, dismiss } = await Swal.fire({
        title: 'Make Payment & Upload Screenshot',
        text: 'Please make the payment and upload a screenshot',
        html: uploadModal,
        showCancelButton: true,
        confirmButtonText: 'Verify Payment',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        allowOutsideClick: false,
        focusConfirm: false,
        didOpen: () => {
          // Re-initialize file input elements inside the SweetAlert modal
          const fileInput = document.querySelector('.swal2-container #' + fileInputId);
          const fileLabel = document.querySelector('.swal2-container .file-upload-label');
          const previewContainer = document.querySelector('.swal2-container #preview-container');
          const previewImage = document.querySelector('.swal2-container #screenshot-preview');
          const screenshotError = document.querySelector('.swal2-container #screenshot-error');
          const uploadSuccess = document.querySelector('.swal2-container #upload-success');
          const copyUpiBtn = document.querySelector('.swal2-container #copy-upi-btn');
          const copyPhoneBtn = document.querySelector('.swal2-container #copy-phone-btn');
          
          // Add copy UPI ID functionality
          if (copyUpiBtn) {
            copyUpiBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(upiId);
              copyUpiBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyUpiBtn.textContent = 'Copy';
              }, 2000);
            });
          }
          
          // Add copy Phone Number functionality
          if (copyPhoneBtn && phoneNumber) {
            copyPhoneBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(phoneNumber);
              copyPhoneBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyPhoneBtn.textContent = 'Copy';
              }, 2000);
            });
          }
          
          if (fileInput && fileLabel) {
            fileLabel.addEventListener('click', () => {
              fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  if (previewImage) {
                    previewImage.src = e.target.result;
                    if (previewContainer) {
                      previewContainer.style.display = 'block';
                    }
                  }
                  if (screenshotError) {
                    screenshotError.style.display = 'none';
                  }
                  if (uploadSuccess) {
                    uploadSuccess.style.display = 'block';
                  }
                  
                  // Update the label text to show the file name
                  const uploadText = document.querySelector('.swal2-container .upload-text');
                  if (uploadText) {
                    uploadText.textContent = file.name;
                  }
                };
                reader.readAsDataURL(file);
              } else if (previewContainer) {
                previewContainer.style.display = 'none';
                if (uploadSuccess) {
                  uploadSuccess.style.display = 'none';
                }
              }
            });
          }
        },
        preConfirm: () => {
          const fileInput = document.getElementById(fileInputId);
          const screenshotError = document.getElementById('screenshot-error');
          
          let isValid = true;
          
          // Validate screenshot
          if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            if (screenshotError) {
              screenshotError.style.display = 'block';
            }
            Swal.showValidationMessage('Please upload a payment screenshot');
            isValid = false;
          } else if (screenshotError) {
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
      
      // Remove the custom modal element from the DOM
      if (uploadModal && uploadModal.parentNode) {
        uploadModal.parentNode.removeChild(uploadModal);
      }
      
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
      
      // Get custom field values from session storage
      let customFieldValues = {};
      try {
        const storedCustomFields = sessionStorage.getItem('customFieldValues');
        if (storedCustomFields) {
          customFieldValues = JSON.parse(storedCustomFields);
        }
      } catch (error) {
        console.error("Error parsing custom field values:", error);
        customFieldValues = {};
      }
      
      console.log("Retrieved custom field values:", customFieldValues);
      
      // Add custom field values to registration data
      // Make sure customFieldValues is a plain object, not a Map
      const plainCustomFields = {};
      
      // Convert any Map to a plain object
      if (customFieldValues instanceof Map) {
        // Convert Map to plain object
        customFieldValues.forEach((value, key) => {
          // Sanitize key by replacing dots with underscores
          const sanitizedKey = key.replace(/\./g, '_');
          plainCustomFields[sanitizedKey] = value;
        });
        console.log("Converted Map to plain object:", plainCustomFields);
      } else if (typeof customFieldValues === 'object' && !Array.isArray(customFieldValues)) {
        // It's already an object, copy the values
        Object.entries(customFieldValues).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            // Sanitize key by replacing dots with underscores
            const sanitizedKey = key.replace(/\./g, '_');
            plainCustomFields[sanitizedKey] = value;
          }
        });
        console.log("Using existing object:", plainCustomFields);
      } else {
        console.log("Custom field values is not a Map or object:", customFieldValues);
      }
      
      console.log("Plain custom fields:", plainCustomFields);
      
      const updatedRegistrationData = {
        ...storedRegistrationData,
        customFieldValues: plainCustomFields
      };
      
      console.log("Updated registration data with custom fields:", updatedRegistrationData);
      
      // Verify payment with the server
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/upi/verify-payment`, {
        transactionRef,
        email,
        upiTransactionId: `AUTO-${Date.now()}`, // Generate an automatic transaction ID
        paymentScreenshot,
        registrationData: updatedRegistrationData // Include registration data with custom fields
      });

      if (data.success) {
        // Clear registration data and custom field values from session storage
        sessionStorage.removeItem('registrationData');
        sessionStorage.removeItem('customFieldValues');
        
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
        <div className="event-summary" style={{ padding: '0.75rem' }}>
          <h3 style={{ marginBottom: '0.3rem' }}>Event Details</h3>
          <p style={{ margin: '0.2rem 0' }}><strong>{eventDetails.name}</strong></p>
          <p className="event-date" style={{ margin: '0.2rem 0' }}>📅 {new Date(eventDetails.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
          <p className="event-venue" style={{ margin: '0.2rem 0' }}>📍 {eventDetails.venue}</p>
          <p className="event-fee" style={{ margin: '0.2rem 0' }}>💰 ₹{eventDetails.fee}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="card-details" style={{overflow:'auto', maxHeight: '200px'}}>
          <h3 style={{ color: 'var(--text-color, #333)', marginBottom: '0.3rem' }}>Your Information</h3>
          <div className="user-info-table" style={{ marginTop: '0.3rem' }}>
            <div className="user-info-row" style={{ padding: '0.3rem 0' }}>
              <div className="user-info-label">Name:</div>
              <div className="user-info-value">{name}</div>
            </div>
            <div className="user-info-row" style={{ padding: '0.3rem 0' }}>
              <div className="user-info-label">Email:</div>
              <div className="user-info-value">{email}</div>
            </div>
            <div className="user-info-row" style={{ padding: '0.3rem 0', borderBottom: 'none' }}>
              <div className="user-info-label">Phone:</div>
              <div className="user-info-value">{phone}</div>
            </div>
          </div>
        </div>
        
        <div className="payment-method-selector" style={{ padding: '0.75rem' }}>
          <h3 style={{ marginBottom: '0.3rem' }}>Payment Method</h3>
          <div className="payment-option selected" style={{ padding: '0.75rem' }}>
            <div className="payment-icon">
              <img 
                src="/upi-icon.png" 
                alt="UPI" 
                style={{ width: '40px', height: '40px' }}
                onError={(e) => e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png'} 
              />
            </div>
            <div>
              <div className="payment-method-name" style={{ fontWeight: 'bold', marginBottom: '0.1rem' }}>UPI Payment</div>
              <div className="payment-method-description" style={{ fontSize: '0.85rem' }}>
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
          <div className="spinner-ripple">
            <div></div>
            <div></div>
          </div>
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