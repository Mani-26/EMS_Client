import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";

export default function Register() {
  const [name, setName] = useState(""); // New State for Name
  const [email, setEmail] = useState("");
  const [availableSeats, setAvailableSeats] = useState(null);
  const { eventId } = useParams();

  // Fetch event details (including available seats)
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await axios.get(
          `https://yellowmatics-events.onrender.com/api/events/${eventId}`
        );
        setAvailableSeats(res.data.seatLimit - res.data.registeredUsers);
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  // Handle registration
  const handleRegister = async () => {
    if (!name || !email) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information!",
        text: "Please enter your name and email before registering.",
        confirmButtonColor: "#007bff",
      });
      return;
    }
  
    try {
      // Fetch latest remaining seats
      const eventRes = await axios.get(
        `https://yellowmatics-events.onrender.com/api/events/${eventId}`
      );
      if (eventRes.data.remainingSeats <= 0) {
        Swal.fire({
          icon: "warning",
          title: "⚠️ Sorry, all seats are filled!",
          text: "Stay tuned for our next event!",
          confirmButtonColor: "#007bff",
        });
        return;
      }
  
      // Proceed with registration
      const res = await axios.post("https://yellowmatics-events.onrender.com/api/register", {
        name,
        email,
        eventId,
      });
  
      // Await confirmation before updating state
      await Swal.fire({
        icon: "success",
        title: "🎉 Registration Successful!",
        text: res.data.message,
        confirmButtonColor: "#28a745",
      });
  
      // Update seat count only after successful registration
      setAvailableSeats((prevSeats) => Math.max(prevSeats - 1, 0));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "❌ Registration Failed",
        text: error.response?.data?.message || "Try again later.",
        confirmButtonColor: "#d33",
      });
    }
  };
  
  return (
    <div className="register-container">
      <h1>Register for Event</h1>
      {availableSeats !== null ? (
        <p className="seat-info">🎟 Available Tickets: {availableSeats}</p>
      ) : (
        <p>Loading available seats...</p>
      )}

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-field"
      />

      <input
        type="email"
        placeholder="Your Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />

      <button
        onClick={handleRegister}
        disabled={availableSeats === 0}
        className="register-button"
      >
        {availableSeats === 0 ? "Sold Out" : "Register"}
      </button>
    </div>
  );
}
