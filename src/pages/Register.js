import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import Swal from "sweetalert2";
import "./Register.css"; // Custom styles for Register page
import "../styles/sweetalert-dark.css"; // Import SweetAlert dark mode styles

export default function Register() {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    customFieldValues: {} 
  });
  const [availableSeats, setAvailableSeats] = useState(null);
  const [eventName, setEventName] = useState(""); // Added to display event name
  const [eventDetails, setEventDetails] = useState(null); // Store all event details
  const [isLoading, setIsLoading] = useState(false); // Added for button feedback
  const { eventId } = useParams();
  const navigate = useNavigate(); // For redirect after success

  // Fetch event details
  useEffect(() => {
    // console.log("Event ID from URL:", eventId);
    
    const fetchEventDetails = async () => {
      try {
        // console.log("Fetching event details for ID:", eventId);
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/events/${eventId}`
        );
        // console.log("Event details from API:", res.data);
        // console.log("Custom fields:", res.data.customFields);
        setEventName(res.data.name);
        setEventDetails(res.data);
        setAvailableSeats(res.data.seatLimit - res.data.registeredUsers);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load event details.",
          confirmButtonColor: "#d33",
        });
      }
    };
    fetchEventDetails();
  }, [eventId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original on error
    }
  };
  
  // Scroll animation with Intersection Observer
  useEffect(() => {
    const formGroups = document.querySelectorAll('.form-group');
    const formSections = document.querySelectorAll('.form-section, .custom-fields-section, .event-details-container');
    
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
  }, [eventDetails]); // Re-run when event details are loaded
  
  // Validate date input (for date of birth)
  const validateDateInput = (fieldName, value) => {
    // If it's a date of birth field
    if (fieldName.toLowerCase().includes('birth')) {
      const birthDate = new Date(value);
      const today = new Date();
      
      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        return false;
      }
      
      // Check if date is in the future
      if (birthDate > today) {
        return false;
      }
      
      // Check if person is too old (e.g., over 120 years)
      const maxAge = 120;
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - maxAge);
      if (birthDate < minDate) {
        return false;
      }
      
      return true;
    }
    
    // For other date fields, just check if it's a valid date
    return !isNaN(new Date(value).getTime());
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Check if this is a custom field
    if (name.startsWith('custom_')) {
      const fieldName = name.replace('custom_', '');
      
      // Handle different input types
      let fieldValue = type === 'checkbox' ? checked : value;
      
      // For date fields, validate the input
      if (type === 'date' && value) {
        // If date is invalid, show an error
        if (!validateDateInput(fieldName, value)) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Date",
            text: fieldName.toLowerCase().includes('birth') 
              ? "Please enter a valid date of birth" 
              : "Please enter a valid date",
            confirmButtonColor: "#007bff",
          });
          return;
        }
        
        // Store date in ISO format (YYYY-MM-DD)
        fieldValue = value; // Already in YYYY-MM-DD format from input
        
        // console.log(`Date field ${fieldName} value:`, fieldValue);
      }
      
      setFormData((prev) => ({
        ...prev,
        customFieldValues: {
          ...prev.customFieldValues,
          [fieldName]: fieldValue
        }
      }));
    } else {
      // Regular field
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default behavior if used in a form
    const { name, email, phone } = formData;

    if (!name || !email || !phone) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter your name, email, and phone number.",
        confirmButtonColor: "#007bff",
      });
      return;
    }
    
    // Validate required custom fields
    if (eventDetails && eventDetails.customFields) {
      const missingRequiredFields = eventDetails.customFields
        .filter(field => field.isRequired)
        .filter(field => {
          const value = formData.customFieldValues[field.fieldName];
          // For non-string values like checkboxes (boolean)
          if (typeof value !== 'string') {
            return value === undefined || value === null || value === false;
          }
          // For string values
          return !value || value.trim() === '';
        });
        
      if (missingRequiredFields.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "Missing Information",
          text: `Please fill in all required fields: ${missingRequiredFields.map(f => f.fieldName).join(', ')}`,
          confirmButtonColor: "#007bff",
        });
        return;
      }
    }
    
    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Phone Number",
        text: "Please enter a valid 10-digit phone number.",
        confirmButtonColor: "#007bff",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch latest event data to check seats
      const eventRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/events/${eventId}`
      );
      const remainingSeats = eventRes.data.seatLimit - eventRes.data.registeredUsers;

      if (remainingSeats <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Sold Out!",
          text: "All seats are taken. Check back for future events!",
          confirmButtonColor: "#007bff",
        });
        setAvailableSeats(0);
        setIsLoading(false);
        return;
      }

      // Debug log
      // console.log("Registering user:", { 
      //   name, 
      //   email, 
      //   phone, 
      //   eventId,
      //   customFieldValues: formData.customFieldValues 
      // });
      // console.log("API URL:", process.env.REACT_APP_API_URL);
      
      try {
        // Register user
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/register`, {
          name,
          email,
          phone,
          eventId,
          customFieldValues: formData.customFieldValues
        });

        // Check if this is a paid event that requires payment
        if (res.data.isPaid) {
          // console.log("Paid event detected in success response");
          
          // Store custom field values in sessionStorage
          sessionStorage.setItem('customFieldValues', JSON.stringify(formData.customFieldValues));
          // console.log("Stored custom field values:", formData.customFieldValues);
          
          // Redirect to payment page with user details in the URL (including phone)
          navigate(`/payment/${eventId}/${encodeURIComponent(name)}/${encodeURIComponent(email)}/${encodeURIComponent(phone)}`);
          return;
        }
      } catch (error) {
        // Check if this is a paid event error
        if (error.response?.data?.isPaid) {
          console.log("Paid event detected in error response");
          
          // Store custom field values in sessionStorage
          sessionStorage.setItem('customFieldValues', JSON.stringify(formData.customFieldValues));
          // console.log("Stored custom field values:", formData.customFieldValues);
          
          // Redirect to payment page with user details in the URL (including phone)
          navigate(`/payment/${eventId}/${encodeURIComponent(name)}/${encodeURIComponent(email)}/${encodeURIComponent(phone)}`);
          return;
        }
        throw error; // Re-throw the error to be caught by the outer catch block
      }

      // For free events, show success message
      await Swal.fire({
        icon: "success",
        title: "Registered!",
        // text: `${res.data.message} Enjoy the event!`,
        text: 'Enjoy the event!',
        confirmButtonColor: "#28a745",
      });

      // Update UI and redirect
      setAvailableSeats(remainingSeats - 1);
      setFormData({ name: "", email: "", phone: "" });
      navigate("/"); // Redirect to home page after success
    } catch (error) {
      // Debug log
      console.error("Registration error:", error);
      console.log("Error response:", error.response?.data);
      
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.message || "Please try again later.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1 className="staggered-entrance">
        {eventName ? `Register for "${eventName}"` : "Register for Event"}
      </h1>
      
      {eventDetails && !eventDetails.isFree && (
        <div className="payment-notice">
          <p>💰 This is a paid event. You will be redirected to payment after registration.</p>
          <p>Fee: ₹{eventDetails.fee}</p>
        </div>
      )}

      {eventDetails ? (
        <div className="event-details-container staggered-entrance">
          <h3 className="event-heading">Event Details</h3>
          <p className="event-venue">📍 <strong>Venue:</strong> {eventDetails.venue}</p>
          <p className="event-date">📅 <strong>Date:</strong> {formatDate(eventDetails.date)}</p>
          
          {eventDetails.time && (
            <p className="event-time">⏰ <strong>Time:</strong> {eventDetails.time}</p>
          )}
          
          <p className="seat-info">
            🎟 <strong>Available Tickets:</strong> <span>{availableSeats}</span>
            {availableSeats <= 5 && availableSeats > 0 && (
              <span className="low-seats"> (Hurry, few seats left!)</span>
            )}
          </p>
          
          {eventDetails.isFree === false && (
            <p className="event-fee">💰 <strong>Registration Fee:</strong> ₹{eventDetails.fee}</p>
          )}
        </div>
      ) : (
        <div className="loading-container">
          <div className="spinner-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="seat-info loading">Loading event details...</p>
        </div>
      )}

      <form className="register-form" onSubmit={handleRegister}>
        <div className="form-section">
          <h3 className="form-heading">Your Information</h3>
        
        <div className="form-group">
          <p></p>
          <label htmlFor="name">Full Name <span className="required-mark">*</span></label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleInputChange}
            className="input-field"
            disabled={availableSeats === 0 || isLoading}
            required
          />
        </div>

        <div className="form-group">
          <p></p>
          <label htmlFor="email">Email Address <span className="required-mark">*</span></label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleInputChange}
            className="input-field"
            disabled={availableSeats === 0 || isLoading}
            required
          />
          <small className="form-hint">
            We'll send your ticket to this email address
          </small>
        </div>

        <div className="form-group">
          <p></p>
          <label htmlFor="phone">Phone Number <span className="required-mark">*</span></label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Enter your 10-digit phone number"
            value={formData.phone}
            onChange={handleInputChange}
            className="input-field"
            disabled={availableSeats === 0 || isLoading}
            pattern="[0-9]{10}"
            maxLength="10"
            required
          />
          <small className="form-hint">
            We'll use this for important updates about the event
          </small>
        </div>
        </div> {/* End of personal information section */}

        {/* Custom Fields Section */}
        {console.log("Rendering custom fields:", eventDetails?.customFields)}
        {eventDetails && eventDetails.customFields && eventDetails.customFields.length > 0 ? (
          <div className="custom-fields-section form-section">
            <h3 className="form-heading">Additional Information</h3>
            
            {eventDetails.customFields.map((field, index) => (
              <div className="form-group" key={index}>
                <p></p>
                <label htmlFor={`custom_${field.fieldName}`}>
                  {field.placeholder}
                  {field.isRequired && <span className="required-mark">*</span>}
                </label>
                
                {field.fieldType === 'text' && (
                  <input
                    type="text"
                    id={`custom_${field.fieldName}`}
                    name={`custom_${field.fieldName}`}
                    placeholder={field.placeholder || `Enter ${field.fieldName}`}
                    value={formData.customFieldValues[field.fieldName] || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={availableSeats === 0 || isLoading}
                    required={field.isRequired}
                  />
                )}
                
                {field.fieldType === 'email' && (
                  <input
                    type="email"
                    id={`custom_${field.fieldName}`}
                    name={`custom_${field.fieldName}`}
                    placeholder={field.placeholder || `Enter ${field.fieldName}`}
                    value={formData.customFieldValues[field.fieldName] || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={availableSeats === 0 || isLoading}
                    required={field.isRequired}
                  />
                )}
                
                {field.fieldType === 'number' && (
                  <input
                    type="number"
                    id={`custom_${field.fieldName}`}
                    name={`custom_${field.fieldName}`}
                    placeholder={field.placeholder || `Enter ${field.fieldName}`}
                    value={formData.customFieldValues[field.fieldName] || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={availableSeats === 0 || isLoading}
                    required={field.isRequired}
                  />
                )}
                
                {field.fieldType === 'date' && (
                  <div className="date-input-container">
                    <input
                      type="date"
                      id={`custom_${field.fieldName}`}
                      name={`custom_${field.fieldName}`}
                      value={formData.customFieldValues[field.fieldName] || ''}
                      onChange={handleInputChange}
                      className="input-field date-input"
                      disabled={availableSeats === 0 || isLoading}
                      required={field.isRequired}
                      max={field.fieldName.toLowerCase().includes('birth') ? new Date().toISOString().split('T')[0] : undefined}
                      min={field.fieldName.toLowerCase().includes('birth') ? "1900-01-01" : undefined}
                    />
                    <small className="form-hint">
                      {field.fieldName.toLowerCase().includes('birth') 
                        ? "Please enter your date of birth" 
                        : field.placeholder || `Select a date for ${field.fieldName}`}
                      {formData.customFieldValues[field.fieldName] && (
                        <span className="formatted-date"> ({formatDate(formData.customFieldValues[field.fieldName])})</span>
                      )}
                    </small>
                  </div>
                )}
                
                {field.fieldType === 'select' && (
                  <select
                    id={`custom_${field.fieldName}`}
                    name={`custom_${field.fieldName}`}
                    value={formData.customFieldValues[field.fieldName] || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={availableSeats === 0 || isLoading}
                    required={field.isRequired}
                  >
                    <option value="">Select {field.fieldName}</option>
                    {field.options && field.options.map((option, i) => (
                      <option key={i} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                
                {field.fieldType === 'checkbox' && (
                  <div className="checkbox-field">
                    <input
                      type="checkbox"
                      id={`custom_${field.fieldName}`}
                      name={`custom_${field.fieldName}`}
                      checked={formData.customFieldValues[field.fieldName] || false}
                      onChange={handleInputChange}
                      disabled={availableSeats === 0 || isLoading}
                      required={field.isRequired}
                    />
                    <label htmlFor={`custom_${field.fieldName}`} className="checkbox-label">
                      {field.placeholder || field.fieldName}
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-custom-fields">
            <p>No additional information required for this event.</p>
          </div>
        )}
        
        {/* Submit button section */}
        <div className="form-section submit-section">

        <button
          type="submit"
          className="register-button"
          disabled={
            availableSeats === 0 || 
            isLoading || 
            !formData.name || 
            !formData.email || 
            !formData.phone ||
            (eventDetails && eventDetails.customFields && eventDetails.customFields
              .some(field => field.isRequired && 
                (!formData.customFieldValues[field.fieldName] || 
                 formData.customFieldValues[field.fieldName] === '')
              )
            )
          }
        >
          {isLoading ? (
            <span className="btn-loading">
              <span className="btn-text">Processing</span>
            </span>
          ) : availableSeats === 0 ? (
            "Sold Out"
          ) : (
            "Register Now"
          )}
        </button>
        
        {(
          availableSeats === 0 || 
          isLoading || 
          !formData.name || 
          !formData.email || 
          !formData.phone ||
          (eventDetails && eventDetails.customFields && eventDetails.customFields
            .some(field => field.isRequired && 
              (!formData.customFieldValues[field.fieldName] || 
               formData.customFieldValues[field.fieldName] === '')
            )
          )
        ) && (
          <small className="form-hint" style={{ marginTop: '0.5rem' }}>
            {availableSeats === 0 ? 
              "This event is sold out" : 
              isLoading ?
              "Processing your registration..." :
              "Please fill in all required fields to continue"}
          </small>
        )}
        </div> {/* End of submit section */}
      </form>

      <p className="back-link">
        <a href="/" className="navbar-item">← Back to Home</a>
      </p>
    </div>
  );
}