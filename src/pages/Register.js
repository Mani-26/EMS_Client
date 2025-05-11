import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import Swal from "sweetalert2";
import "./Register.css"; // Custom styles for Register page
import "../styles/sweetalert-dark.css"; // Import SweetAlert dark mode styles

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [availableSeats, setAvailableSeats] = useState(null);
  const [eventName, setEventName] = useState(""); // Added to display event name
  const [eventDetails, setEventDetails] = useState(null); // Store all event details
  const [isLoading, setIsLoading] = useState(false); // Added for button feedback
  const { eventId } = useParams();
  const navigate = useNavigate(); // For redirect after success

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/events/${eventId}`
        );
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      console.log("Registering user:", { name, email, phone, eventId });
      console.log("API URL:", process.env.REACT_APP_API_URL);
      
      try {
        // Register user
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/register`, {
          name,
          email,
          phone,
          eventId,
        });

        // Check if this is a paid event that requires payment
        if (res.data.isPaid) {
          console.log("Paid event detected in success response");
          // Redirect to payment page with user details in the URL (including phone)
          navigate(`/payment/${eventId}/${encodeURIComponent(name)}/${encodeURIComponent(email)}/${encodeURIComponent(phone)}`);
          return;
        }
      } catch (error) {
        // Check if this is a paid event error
        if (error.response?.data?.isPaid) {
          console.log("Paid event detected in error response");
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
      <h1>
        {eventName ? `Register for "${eventName}"` : "Register for Event"}
      </h1>
      
      {eventDetails && !eventDetails.isFree && (
        <div className="payment-notice">
          <p>💰 This is a paid event. You will be redirected to payment after registration.</p>
          <p>Fee: ₹{eventDetails.fee}</p>
        </div>
      )}

      {eventDetails ? (
        <div className="event-details-container">
          <h3 className="event-heading">Event Details</h3>
          <p className="event-venue">📍 <strong>Venue:</strong> {eventDetails.venue}</p>
          <p className="event-date">📅 <strong>Date:</strong> {new Date(eventDetails.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
          
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
          <p className="seat-info loading">Loading event details...</p>
          <div className="spinner centered-spinner"></div>
        </div>
      )}

      <form className="register-form" onSubmit={handleRegister}>
        <h3 className="form-heading">Your Information</h3>
        
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
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
          <label htmlFor="email">Email Address</label>
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
          <label htmlFor="phone">Phone Number</label>
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

        <button
          type="submit"
          className="register-button"
          disabled={availableSeats === 0 || isLoading || !formData.name || !formData.email || !formData.phone}
        >
          {isLoading ? (
            <span className="spinner">.</span>
          ) : availableSeats === 0 ? (
            "Sold Out"
          ) : (
            "Register Now"
          )}
        </button>
        
        {(availableSeats === 0 || isLoading || !formData.name || !formData.email || !formData.phone) && (
          <small className="form-hint" style={{ marginTop: '0.5rem' }}>
            {availableSeats === 0 ? 
              "This event is sold out" : 
              !formData.name || !formData.email || !formData.phone ? 
              "Please fill in all fields to continue" : 
              "Processing your registration..."}
          </small>
        )}
      </form>

      <p className="back-link">
        <a href="/" className="navbar-item">← Back to Home</a>
      </p>
    </div>
  );
}