import React, { useState, useEffect, useRef } from 'react';
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
  const submissionRef = useRef(false); // Prevent multiple submissions

  // Cleanup function for registration data
  //eslint-disable-next-line
  const cleanupRegistrationData = () => {
    console.log('Cleaning up registration data');
    // Only remove the data after successful payment verification
    // Don't remove customFieldValues until payment is verified
    sessionStorage.removeItem('registrationData');
  };
  
  // Final cleanup function - only called after successful payment verification
  const finalCleanup = () => {
    console.log('Final cleanup - removing all registration data');
    sessionStorage.removeItem('registrationData');
    sessionStorage.removeItem('customFieldValues');
  };

  // Clean up when component unmounts
  useEffect(() => {
    console.log('CheckoutForm: Mounting component');
    return () => {
      console.log('CheckoutForm: Unmounting component');
      // IMPORTANT: DO NOT remove custom field values on unmount
      // Only remove registration data
      console.log('Component unmounting - preserving custom field values');
      sessionStorage.removeItem('registrationData');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submissionRef.current) {
      console.log('handleSubmit: Submission already in progress, ignoring');
      return;
    }

    submissionRef.current = true;
    setIsProcessing(true);
    setPaymentError('');

    try {
      console.log('handleSubmit: Initiating payment creation');
      
      // Get custom field values from session storage
      let customFieldValues = {};
      try {
        console.log('handleSubmit: Checking session storage for custom field values');
        console.log('handleSubmit: All session storage keys:', Object.keys(sessionStorage));
        
        const storedCustomFields = sessionStorage.getItem('customFieldValues');
        console.log('handleSubmit: Raw stored custom fields:', storedCustomFields);
        
        if (storedCustomFields) {
          customFieldValues = JSON.parse(storedCustomFields);
          console.log('handleSubmit: Retrieved custom field values from session storage:', customFieldValues);
        } else {
          console.warn('handleSubmit: No custom field values found in session storage!');
        }
      } catch (error) {
        console.error('handleSubmit: Error parsing custom field values:', error);
      }
      
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/upi/create-payment`, {
        eventId,
        name,
        email,
        phone,
        customFieldValues
      });

      // console.log('handleSubmit: Payment creation successful, transactionRef:', data.transactionRef);
      sessionStorage.setItem('registrationData', JSON.stringify(data.registrationData));
      // IMPORTANT: We need to preserve custom field values throughout the payment process
      // DO NOT add any event listeners that might remove them
      console.log('Payment initiated - custom field values must be preserved');

      await verifyUpiPayment(data.transactionRef, data.upiId, data.amount, data.phoneNumber);
    } catch (err) {
      console.error('handleSubmit: Error creating payment:', err);
      setPaymentError(err.response?.data?.message || 'An error occurred during payment processing');
      setIsProcessing(false);
      submissionRef.current = false;
    }
  };

  const verifyUpiPayment = async (transactionRef, upiId, amount, phoneNumber) => {
    try {
      // console.log('verifyUpiPayment: Starting with transactionRef:', transactionRef);

      if (window.isProcessingUpload) {
        console.log('verifyUpiPayment: Already processing upload, skipping');
        return;
      }

      const isVerified = localStorage.getItem(`payment_verified_${transactionRef}`);
      if (isVerified === 'true') {
        console.log('verifyUpiPayment: Payment already verified');
        const ticketId = localStorage.getItem(`payment_ticket_${transactionRef}`);
        Swal.fire({
          icon: 'info',
          title: 'Payment Already Submitted',
          html: `
            <div>
              <p>Your payment screenshot has already been submitted and is pending verification by our team.</p>
              <p><strong>Ticket ID: #${ticketId || 'N/A'}</strong></p>
              <p>Please note your Ticket ID for future reference.</p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#17a2b8'
        });
        setIsProcessing(false);
        submissionRef.current = false;
        return;
      }

      try {
        console.log('verifyUpiPayment: Checking payment status');
        const checkResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/upi/check-payment-status`, {
          transactionRef,
          email
        });

        if (checkResponse.data.success && checkResponse.data.paymentScreenshotUrl) {
          // console.log('verifyUpiPayment: Payment screenshot exists:', checkResponse.data);
          // Use finalCleanup to remove all registration data after successful verification
          finalCleanup();

          Swal.fire({
            icon: 'info',
            title: 'Payment Already Submitted',
            html: `
              <div>
                <p>Your payment screenshot has already been submitted and is pending verification by our team.</p>
                <p><strong>Ticket ID: #${checkResponse.data.ticketId}</strong></p>
                <p>Please note your Ticket ID for future reference.</p>
              </div>
            `,
            confirmButtonText: 'Check Status',
            confirmButtonColor: '#17a2b8',
            showCancelButton: true,
            cancelButtonText: 'View Receipt',
            cancelButtonColor: '#6c757d',
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/check-status');
            } else {
              navigate(`/payment-success/${transactionRef}`, {
                state: {
                  status: 'pending',
                  eventId: eventId,
                  ticketId: checkResponse.data.ticketId
                }
              });
            }
          });

          setIsProcessing(false);
          submissionRef.current = false;
          return;
        }
      } catch (checkError) {
        console.log('verifyUpiPayment: Error checking payment status:', checkError);
      }

      window.isProcessingUpload = true;
      console.log('verifyUpiPayment: Setting isProcessingUpload to true');

      const fileInputId = 'payment-screenshot-input';
      const uploadModal = document.createElement('div');
      uploadModal.className = 'custom-upload-modal';
      uploadModal.innerHTML = `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8;">
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

      console.log('verifyUpiPayment: Showing upload modal');
      const { value: formValues, dismiss } = await Swal.fire({
        title: 'Make Payment & Upload Screenshot',
        text: 'Please make the payment and upload a screenshot',
        html: uploadModal,
        showCancelButton: true,
        confirmButtonText: 'Upload Screenshot',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        allowOutsideClick: false,
        focusConfirm: false,
        didOpen: () => {
          console.log('verifyUpiPayment: Modal opened, setting up event listeners');
          const fileInput = document.querySelector('.swal2-container #' + fileInputId);
          const fileLabel = document.querySelector('.swal2-container .file-upload-label');
          const previewContainer = document.querySelector('.swal2-container #preview-container');
          const previewImage = document.querySelector('.swal2-container #screenshot-preview');
          const screenshotError = document.querySelector('.swal2-container #screenshot-error');
          const uploadSuccess = document.querySelector('.swal2-container #upload-success');
          const copyUpiBtn = document.querySelector('.swal2-container #copy-upi-btn');
          const copyPhoneBtn = document.querySelector('.swal2-container #copy-phone-btn');

          if (copyUpiBtn) {
            copyUpiBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(upiId);
              copyUpiBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyUpiBtn.textContent = 'Copy';
              }, 2000);
            });
          }

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
            // Remove the click event on the label to prevent double file explorer opening
            // The label's 'for' attribute will handle opening the file explorer once
            
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

          if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            if (screenshotError) {
              screenshotError.style.display = 'block';
            }
            Swal.showValidationMessage('Please upload a payment screenshot');
            return false;
          }

          return { file: fileInput.files[0] };
        }
      });

      if (uploadModal && uploadModal.parentNode) {
        uploadModal.parentNode.removeChild(uploadModal);
      }

      if (dismiss === Swal.DismissReason.cancel || !formValues) {
        console.log('verifyUpiPayment: Modal cancelled or no file selected');
        window.isProcessingUpload = false;
        setIsProcessing(false);
        submissionRef.current = false;
        return;
      }

      Swal.fire({
        title: 'Processing Image',
        text: 'Please wait while we process your payment screenshot...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const compressImage = async (file) => {
        try {
          if (file.size < 500 * 1024) {
            return file;
          }
          const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1000,
            useWebWorker: true,
            fileType: 'image/jpeg',
            quality: 0.7
          };
          let compressedFile = await imageCompression(file, options);
          if (compressedFile.size > 1.5 * 1024 * 1024) {
            const moreOptions = {
              ...options,
              maxSizeMB: 0.3,
              maxWidthOrHeight: 800,
              quality: 0.5
            };
            compressedFile = await imageCompression(compressedFile, moreOptions);
          }
          return compressedFile;
        } catch (error) {
          if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image is too large and could not be compressed. Please use a smaller image.');
          }
          return file;
        }
      };

      const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      };

      try {
        console.log('verifyUpiPayment: Compressing image');
        const compressedFile = await compressImage(formValues.file);
        if (compressedFile.size > 5 * 1024 * 1024) {
          throw new Error('Image is too large (over 5MB). Please use a smaller image.');
        }
        console.log('verifyUpiPayment: Converting to base64');
        const paymentScreenshot = await readFileAsDataURL(compressedFile);
        window.lastPaymentScreenshot = paymentScreenshot;

        Swal.update({
          title: 'Uploading Payment Screenshot',
          text: 'Please wait while we process your payment screenshot...'
        });

        console.log('verifyUpiPayment: Checking session storage');
        console.log('verifyUpiPayment: All session storage keys:', Object.keys(sessionStorage));
        
        const storedRegistrationData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
        console.log('verifyUpiPayment: Retrieved registration data:', storedRegistrationData);
        
        let customFieldValues = {};
        try {
          console.log('verifyUpiPayment: Checking for custom field values');
          const storedCustomFields = sessionStorage.getItem('customFieldValues');
          console.log('verifyUpiPayment: Raw stored custom fields:', storedCustomFields);
          
          if (storedCustomFields) {
            customFieldValues = JSON.parse(storedCustomFields);
            console.log('verifyUpiPayment: Parsed custom field values:', customFieldValues);
          } else {
            console.warn('verifyUpiPayment: No custom field values found in session storage!');
          }
        } catch (error) {
          console.error('verifyUpiPayment: Error parsing custom field values:', error);
        }

        const plainCustomFields = {};
        if (typeof customFieldValues === 'object' && !Array.isArray(customFieldValues)) {
          Object.entries(customFieldValues).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              // Don't sanitize the key - keep it exactly as in the event definition
              plainCustomFields[key] = value;
            }
          });
        }

        const updatedRegistrationData = {
          ...storedRegistrationData,
          customFieldValues: plainCustomFields
        };

        console.log('verifyUpiPayment: Sending verification request');
        console.log('Custom field values being sent:', plainCustomFields);
        console.log('Updated registration data:', updatedRegistrationData);
        
        const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/upi/verify-payment`, {
          transactionRef,
          email,
          upiTransactionId: `AUTO-${Date.now()}`,
          paymentScreenshot,
          registrationData: updatedRegistrationData
        }, {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // console.log('verifyUpiPayment: Verification successful:', data);
        // Payment verification successful - now it's safe to clean up
        console.log('Payment verification successful - cleaning up session storage');
        
        // Store the custom field values in localStorage as a backup
        try {
          const customFieldsBackup = sessionStorage.getItem('customFieldValues');
          if (customFieldsBackup) {
            localStorage.setItem(`payment_custom_fields_${transactionRef}`, customFieldsBackup);
            console.log('Backed up custom field values to localStorage');
          }
        } catch (e) {
          console.error('Error backing up custom field values:', e);
        }
        
        // Now it's safe to clean up
        // finalCleanup();
        window.lastPaymentScreenshot = null;
        window.isProcessingUpload = false;

        localStorage.setItem(`payment_verified_${transactionRef}`, 'true');
        localStorage.setItem(`payment_ticket_${transactionRef}`, data.ticketId);

        const isNewScreenshot = data.message && data.message.includes("received");
        const title = isNewScreenshot ? 'Payment Being Verified' : 'Payment Already Submitted';
        const message = isNewScreenshot
          ? 'Your payment screenshot has been received and is pending verification by our team.'
          : 'Your payment screenshot was already submitted and is pending verification by our team.';

        Swal.fire({
          icon: 'info',
          title: title,
          html: `
            <div>
              <p>${message}</p>
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
            navigate('/check-status');
          } else {
            navigate(`/payment-success/${transactionRef}`, {
              state: {
                status: 'pending',
                eventId: eventId,
                ticketId: data.ticketId
              }
            });
          }
        });
      } catch (error) {
        console.error('verifyUpiPayment: Error during image processing or verification:', error);
        window.lastPaymentScreenshot = null;
        window.isProcessingUpload = false;

        let errorMessage = 'We could not verify your payment. Please try again.';
        if (error.response) {
          if (error.response.status === 413) {
            errorMessage = 'The payment screenshot is too large. Please try again with a smaller image.';
          } else {
            errorMessage = error.response.data?.message || errorMessage;
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message || errorMessage;
        }

        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: errorMessage,
          footer: `<p class="transaction-ref">Reference ID: ${transactionRef}</p>`,
          confirmButtonColor: '#dc3545',
          confirmButtonText: 'Try Again',
        }).then((result) => {
          if (result.isConfirmed) {
            console.log('verifyUpiPayment: User chose to try again');
            setIsProcessing(false);
            submissionRef.current = false;
          }
        });
      }
    } catch (error) {
      console.error('verifyUpiPayment: Unexpected error:', error);
      window.isProcessingUpload = false;
      setIsProcessing(false);
      submissionRef.current = false;
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
          <p className="event-date" style={{ margin: '0.2rem 0' }}>
            📅{' '}
            {new Date(eventDetails.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="event-venue" style={{ margin: '0.2rem 0' }}>📍 {eventDetails.venue}</p>
          <p className="event-fee" style={{ margin: '0.2rem 0' }}>💰 ₹{eventDetails.fee}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="card-details" style={{ overflow: 'auto', maxHeight: '200px' }}>
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
                onError={(e) =>
                  (e.target.src =
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png')
                }
              />
            </div>
            <div>
              <div className="payment-method-name" style={{ fontWeight: 'bold', marginBottom: '0.1rem' }}>
                UPI Payment
              </div>
              <div className="payment-method-description" style={{ fontSize: '0.85rem' }}>
                Pay using Google Pay, PhonePe, Paytm, or any UPI app
              </div>
            </div>
          </div>
        </div>
        {paymentError && <div className="payment-error">{paymentError}</div>}
        <button type="submit" className="payment-button" disabled={isProcessing || submissionRef.current}>
          {isProcessing ? 'Processing...' : `Pay ₹${eventDetails?.fee || '0'}`}
        </button>
      </form>
      <div className="back-link">
        <a href="/">← Back to Home</a>
      </div>
    </div>
  );
};

// PaymentForm component (unchanged from your code)
const PaymentForm = () => {
  const { eventId, name, email, phone } = useParams();
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // console.log('PaymentForm: Fetching event details for eventId:', eventId);
    const fetchEventDetails = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`);
        // console.log('PaymentForm: Event details fetched:', data);
        setEventDetails(data);
        setLoading(false);
      } catch (err) {
        console.error('PaymentForm: Error fetching event details:', err);
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