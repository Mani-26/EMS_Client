import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Optional: Add custom styles

const Home = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added for loading effect
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/events`);
        const fetchedEvents = response.data;

        // Sort events: Upcoming first, then expired
        const sortedEvents = fetchedEvents.sort((a, b) => {
          const today = new Date().setHours(0, 0, 0, 0);
          const dateA = new Date(a.date).setHours(0, 0, 0, 0);
          const dateB = new Date(b.date).setHours(0, 0, 0, 0);

          if (dateA < today && dateB < today) return dateA - dateB; // Sort expired by date
          if (dateA < today) return 1; // Expired to the end
          if (dateB < today) return -1; // Upcoming first
          return dateA - dateB; // Sort upcoming by date
        });

        setEvents(sortedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        {/* <br/> */}
        <h1>🎉 Welcome to Yellowmatics Events</h1>
        <p>Discover and join our exciting upcoming events!</p>
      </header>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner-circular"></div>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <p className="no-events">No events available right now. Check back soon!</p>
      ) : (
        <section className="events-section">
          <h2>📅 Event Lineup</h2>
          <div className="events-list">
            {events.map((event, index) => {
              const eventDate = new Date(event.date);
              const today = new Date().setHours(0, 0, 0, 0);
              const isExpired = eventDate < today;
              const availableSeats = event.seatLimit - event.registeredUsers;

              return (
                <div
                  key={event._id}
                  className={`event-card ${isExpired ? "expired" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }} // Staggered animation
                >
                  <h3>{event.name}</h3>
                  <p className="event-date">
                    📅 {eventDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="event-desc">{event.description}</p>
                  <p className="event-venue">📍 Venue: {event.venue}</p>
                  <p className="seat-info">
                    💺 Seats: <span>{availableSeats}</span> / {event.seatLimit}
                    {availableSeats <= 5 && availableSeats > 0 && !isExpired && (
                      <span className="low-seats"> (Few left!)</span>
                    )}
                  </p>
                  {event.isFree === false && (
                    <p className="event-fee">💰 Fee: ₹{event.fee}</p>
                  )}
                  <div className="event-actions">
                    {isExpired ? (
                      <button className="register-button" disabled>
                        ❌ Registration Closed
                      </button>
                    ) : availableSeats > 0 ? (
                      <button
                        className="register-button"
                        onClick={() => navigate(`/register/${event._id}`)}
                      >
                        {event.isFree === false ? 
                          `Register (₹${event.fee}) 💰` : 
                          "Register Now (Free) 🚀"
                        }
                      </button>
                    ) : (
                      <button className="register-button" disabled>
                        ⚠️ Registration Full
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;