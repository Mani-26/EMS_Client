import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    axios.get("https://yellowmatics-events.onrender.com/api/events")
      .then(res => setEvents(res.data))
      .catch(err => console.error("Error:", err));
  }, []);

  return (
    <div className="home-container">
      <h1>🎉 Yellowmatics Events</h1>
      <div className="events-list">
        {events.map(event => {
          const today = new Date();
          const eventDate = new Date(event.date);
          const isPastEvent = eventDate < today;

          return (
            <div key={event._id} className="event-card">
              <h2>{event.name}</h2>
              <p className="event-date">📅 {event.date}</p>
              <p>Available Seats: {event.seatLimit-event.registeredUsers}</p>

              <button 
                className="register-button"
                onClick={() => navigate(`/register/${event._id}`)}
                disabled={isPastEvent || event.registeredUsers >= event.seatLimit}
              >
                {isPastEvent ? "Registration Closed" : event.registeredUsers >= event.seatLimit ? "Event Full" : "Register Now 🚀"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
