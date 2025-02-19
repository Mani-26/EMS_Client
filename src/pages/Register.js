import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

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
          `${process.env.Host}/api/events/${eventId}`
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
      alert("Please enter your name and email.");
      return;
    }

    try {
      // Fetch latest remaining seats
      const eventRes = await axios.get(
        `${process.env.Host}/api/events/${eventId}`
      );
      if (eventRes.data.remainingSeats <= 0) {
        alert("⚠️ Sorry, all seats are filled! \n Stay tuned for next event");
        return;
      }

      const res = await axios.post(`${process.env.Host}/api/register`, {
        name,
        email,
        eventId,
      });
      alert(res.data.message);
      setAvailableSeats((prevSeats) => prevSeats - 1);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "❌ Registration failed. Try again later."
      );
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
