import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import Swal from "sweetalert2";
import "./Register.css"; // Optional: Add custom styles if needed

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [availableSeats, setAvailableSeats] = useState(null);
  const [eventName, setEventName] = useState(""); // Added to display event name
  const [isLoading, setIsLoading] = useState(false); // Added for button feedback
  const { eventId } = useParams();
  const navigate = useNavigate(); // For redirect after success

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await axios.get(
          `https://emsserver2-production.up.railway.app/api/events/${eventId}`
        );
        setEventName(res.data.name);
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
    const { name, email } = formData;

    if (!name || !email) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter your name and email.",
        confirmButtonColor: "#007bff",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch latest event data to check seats
      const eventRes = await axios.get(
        `https://emsserver2-production.up.railway.app/api/events/${eventId}`
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

      // Register user
      const res = await axios.post("https://emsserver2-production.up.railway.app/api/register", {
        name,
        email,
        eventId,
      });

      await Swal.fire({
        icon: "success",
        title: "Registered!",
        text: `${res.data.message} Enjoy the event!`,
        confirmButtonColor: "#28a745",
      });

      // Update UI and redirect
      setAvailableSeats(remainingSeats - 1);
      setFormData({ name: "", email: "" });
      navigate("/"); // Redirect to home page after success
    } catch (error) {
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

      {availableSeats !== null ? (
        <p className="seat-info">
          🎟 Available Tickets: <span>{availableSeats}</span>
          {availableSeats <= 5 && availableSeats > 0 && (
            <span className="low-seats"> (Hurry, few seats left!)</span>
          )}
        </p>
      ) : (
        <p className="seat-info loading">Loading available seats...</p>
      )}

      <form className="register-form" onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleInputChange}
            className="input-field"
            disabled={availableSeats === 0 || isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleInputChange}
            className="input-field"
            disabled={availableSeats === 0 || isLoading}
          />
        </div>

        <button
          type="submit"
          className="register-button"
          disabled={availableSeats === 0 || isLoading}
        >
          {isLoading ? (
            <span className="spinner">Registering...</span>
          ) : availableSeats === 0 ? (
            "Sold Out"
          ) : (
            "Register Now"
          )}
        </button>
      </form>

      <p className="back-link">
        <a href="/" className="navbar-item">← Back to Home</a>
      </p>
    </div>
  );
}