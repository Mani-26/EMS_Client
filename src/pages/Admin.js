import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Admin.css"; // Ensure this includes the updated styles

export default function Admin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
    seatLimit: "",
  });
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Unauthorized!",
        text: "Please log in to access this page.",
        confirmButtonColor: "#007bff",
      }).then(() => {
        navigate("/admin-login");
      });
    } else {
      fetchEvents();
    }
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("https://emsserver2-production.up.railway.app/api/events");
      setEvents(res.data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch events.",
      });
    }
  };

  const handleDownloadExcel = async (eventId, eventName) => {
    try {
      const response = await axios.get(
        `https://emsserver2-production.up.railway.app/api/events/${eventId}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${eventName}_Registrations.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      Swal.fire({
        icon: "success",
        title: "Downloaded!",
        text: "Excel file downloaded successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to download Excel.",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    const { name, date, description, seatLimit } = formData;
    if (!name || !date || !description || !seatLimit) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill in all fields!",
      });
      return;
    }

    try {
      if (editingEvent) {
        await axios.put(
          `https://emsserver2-production.up.railway.app/api/events/${editingEvent._id}`,
          formData
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Event updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await axios.post("https://emsserver2-production.up.railway.app/api/events", formData);
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "Event created successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setFormData({ name: "", date: "", description: "", seatLimit: "" });
      setEditingEvent(null);
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save event.",
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`https://emsserver2-production.up.railway.app/api/events/${eventId}`);
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Event removed successfully.",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchEvents();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete event.",
          });
        }
      }
    });
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date.split("T")[0],
      description: event.description,
      seatLimit: event.seatLimit,
    });
    setShowForm(true);
  };

  const fetchRegistrations = async (eventId, eventName) => {
    try {
      const res = await axios.get(
        `https://emsserver2-production.up.railway.app/api/events/${eventId}/registrations`
      );
      setRegistrations(res.data);
      setSelectedEventName(eventName);
      setShowRegistrations(true);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Failed to fetch registrations.",
      });
    }
  };

  return (
    <div className="admin-container">
      <br />
      <h1>🎯 Admin Dashboard</h1>

      {/* Event Form */}
      {showForm && (
        <form className="event-form" onSubmit={handleSaveEvent}>
          <h2>{editingEvent ? "✏️ Edit Event" : "➕ New Event"}</h2>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Event Name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Event Description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
            />
            <input
              type="number"
              name="seatLimit"
              placeholder="Seat Limit"
              value={formData.seatLimit}
              onChange={handleInputChange}
              min="1"
            />
          </div>
          <div className="form-actions">
            <button type="submit">{editingEvent ? "Update" : "Create"}</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Registrations Modal */}
      {showRegistrations && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📋 {selectedEventName} Registrations</h2>
            {registrations.length > 0 ? (
              <ul className="registrations-list">
                {registrations.map((user, index) => (
                  <li key={index}>
                    <span className="user-name">{user.name}</span> -{" "}
                    <span className="user-email">{user.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No registrations yet.</p>
            )}
            <button onClick={() => setShowRegistrations(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Events List */}
      <section className="events-section">
        <h2>📌 Events Overview</h2>
        {events.length === 0 ? (
          <p className="no-events">No events available. Create one to get started!</p>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                <h3>{event.name}</h3>
                <p className="event-date">📅 {new Date(event.date).toLocaleDateString()}</p>
                <p>{event.description}</p>
                <p>🎟 Seats: {event.seatLimit}</p>
                <div className="event-actions">
                  <button
                    className="view-button"
                    onClick={() => fetchRegistrations(event._id, event.name)}
                  >
                    👀 View
                  </button>
                  <button className="edit-button" onClick={() => handleEditEvent(event)}>
                    ✏️ Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteEvent(event._id)}
                  >
                    ❌ Delete
                  </button>
                  <button
                    className="download-button"
                    onClick={() => handleDownloadExcel(event._id, event.name)}
                  >
                    📥 Excel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Button */}
      {!showForm && (
        <button className="floating-button" onClick={() => setShowForm(true)}>
          +
        </button>
      )}
    </div>
  );
}