import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [seatLimit, setSeatLimit] = useState("");
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
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
        navigate("/admin-login"); // Redirect after clicking OK
      });
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);
  // console.log(setRegisteredUsers);
  // setRegisteredUsers();
  const fetchEvents = async () => {
    try {
      const res = await axios.get("https://yellowmatics-events.onrender.com/api/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleDownloadExcel = async (eventId, eventName) => {
    try {
      const response = await axios.get(
        `https://yellowmatics-events.onrender.com/api/events/${eventId}/download`,
        { responseType: "blob" } // Important for file download
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a download link and trigger click
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${eventName}_Registrations.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to download Excel.",
      });
    }
  };

  const handleSaveEvent = async () => {
    if (!name || !date || !description || !seatLimit) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please fill in all fields!",
      });
      
      return;
    }
    try {
      if (editingEvent) {
        await axios.put(
          `https://yellowmatics-events.onrender.com/api/events/${editingEvent._id}`,
          {
            name,
            date,
            description,
            seatLimit,
          }
        );
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Event updated successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        
      } else {
        await axios.post("https://yellowmatics-events.onrender.com/api/events", {
          name,
          date,
          description,
          seatLimit,
        });
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Event created successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
        
      }

      setName("");
      setDate("");
      setDescription("");
      setSeatLimit("");
      setEditingEvent(null);
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to save event.",
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to undo this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`https://yellowmatics-events.onrender.com/api/events/${eventId}`);
          Swal.fire("Deleted!", "The event has been removed.", "success");
          fetchEvents();
        } catch (error) {
          Swal.fire("Error", "Failed to delete event", "error");
        }
      }
    });
    
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setName(event.name);
    setDate(event.date);
    setDescription(event.description);
    setSeatLimit(event.seatLimit);
    setShowForm(true);
  };

  const handleShowCreateForm = () => {
    setEditingEvent(null);
    setName("");
    setDate("");
    setDescription("");
    setSeatLimit("");
    setShowForm(true);
  };

  const fetchRegistrations = async (eventId, eventName) => {
    try {
      const res = await axios.get(
        `https://yellowmatics-events.onrender.com/api/events/${eventId}/registrations`
      );
      setRegistrations(res.data);
      setSelectedEventName(eventName); // Store event name for UI
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
      <h1>🎯 Admin - Manage Events</h1>

      {showForm && (
        <div className="event-form">
          <h2>{editingEvent ? "✏️ Edit Event" : "➕ Create Event"}</h2>
          <input
            type="text"
            placeholder="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <textarea
            placeholder="Event Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="number"
            placeholder="Seat Limit"
            value={seatLimit}
            onChange={(e) => setSeatLimit(e.target.value)}
          />
          <button onClick={handleSaveEvent}>
            {editingEvent ? "Update Event" : "Create Event"}
          </button>
        </div>
      )}

      {showRegistrations && (
        <div className="modal">
          <div className="modal-content">
            <h2>📋 Registered Users for {selectedEventName}</h2>
            {registrations.length > 0 ? (
              <ul>
                {registrations.map((user, index) => (
                  <li key={index}>
                    <strong>{user.name}</strong> - {user.email}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No users registered yet.</p>
            )}
            <button onClick={() => setShowRegistrations(false)}>Close</button>
          </div>
        </div>
      )}

      <h2>📌 All Events</h2>
      <div className="event-list">
        {events.map((event) => (
          <div key={event._id} className="event-card">
            <h3>{event.name}</h3>
            <p>📅 {event.date}</p>
            <p>{event.description}</p>
            <p>🎟 Seats: {event.seatLimit}</p>
            <button
              className="view-button"
              onClick={() => fetchRegistrations(event._id, event.name)}
            >
              👀 View
            </button>

            <button
              className="edit-button"
              onClick={() => handleEditEvent(event)}
            >
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
              📥 Download
            </button>
          </div>
        ))}
      </div>

      {viewingEvent && (
        <div className="registered-users">
          <h2>📝 Registered Users</h2>
          {registeredUsers.length > 0 ? (
            <ul>
              {registeredUsers.map((user) => (
                <li key={user._id}>
                  <strong>{user.name}</strong> - {user.email}
                </li>
              ))}
            </ul>
          ) : (
            <p>No users registered yet.</p>
          )}
          <button onClick={() => setViewingEvent(null)}>Close</button>
        </div>
      )}

      <button className="floating-button" onClick={handleShowCreateForm}>
        +
      </button>
    </div>
  );
}
