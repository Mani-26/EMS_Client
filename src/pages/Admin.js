import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Admin.css"; // Admin page styles
import "../styles/sweetalert-dark.css"; // Import SweetAlert dark mode styles

export default function Admin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
    venue: "",
    seatLimit: "",
    isFree: true,
    fee: "",
  });
  
  // Function to handle logout
  const handleLogout = () => {
    // Clear tokens from both storage locations
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    
    Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have been successfully logged out.",
      confirmButtonColor: "#007bff",
    }).then(() => {
      navigate("/admin-login");
    });
  };
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState("");

  useEffect(() => {
    // Check both sessionStorage and localStorage for the token
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    console.log("Admin page - token check:", !!token);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      Swal.fire({
        icon: "error",
        title: "Unauthorized!",
        text: "Please log in to access this page.",
        confirmButtonColor: "#007bff",
      }).then(() => {
        navigate("/admin-login");
      });
    } else {
      console.log("Token found, fetching events");
      fetchEvents();
    }
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/events`);
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
    // Show loading message
    Swal.fire({
      title: 'Preparing Download',
      text: 'Please wait while we prepare your file...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      // Create a clean filename
      const cleanFileName = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Registrations.xlsx`;
      
      // Detect device type
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isInAppBrowser = isMobileDevice && !window.matchMedia('(display-mode: browser)').matches;
      
      // Generate the download URL
      const downloadUrl = `${process.env.REACT_APP_API_URL}/api/events/${eventId}/download?filename=${encodeURIComponent(cleanFileName)}`;
      
      // Different handling based on device type
      if (isMobileDevice || window.innerWidth < 1024) { // Mobile or tablet devices (or small screens)
        // For mobile devices, show a dialog with a link to open in browser
        Swal.fire({
          icon: "info",
          title: "Download Ready",
          html: `
            <p>Your Excel file is ready to download.</p>
            <p style="margin: 15px 0;">
              <a href="${downloadUrl}" target="_blank" class="download-link">
                Click here to open in browser
              </a>
            </p>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
              Opening in your browser gives you more options to download or share the file.
            </p>
          `,
          confirmButtonText: "Done",
          confirmButtonColor: "#28a745",
          showCancelButton: true,
          cancelButtonText: "Copy Link",
          cancelButtonColor: "#6c757d",
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.cancel) {
            // Copy the link to clipboard
            navigator.clipboard.writeText(downloadUrl).then(() => {
              Swal.fire({
                icon: "success",
                title: "Link Copied!",
                text: "Download link copied to clipboard",
                timer: 1500,
                showConfirmButton: false
              });
            }).catch(err => {
              console.error('Failed to copy link: ', err);
            });
          }
        });
      } else if (isInAppBrowser) {
        // For mobile apps, use a direct window.open approach
        window.location.href = downloadUrl;
        
        // Show a different success message for mobile apps
        setTimeout(() => {
          Swal.fire({
            icon: "success",
            title: "Download Started",
            html: `
              <p>Your file should be downloading now.</p>
              <p style="font-size: 0.9rem; margin-top: 10px;">
                <strong>Note:</strong> Check your device's download folder or notifications for the file.
              </p>
            `,
            confirmButtonColor: "#28a745",
          });
        }, 2000);
      } else {
        // For desktop browsers, use the original approach
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/events/${eventId}/download`,
          { responseType: "blob" }
        );
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", cleanFileName);
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        link.parentNode.removeChild(link);
        
        // Show success message for desktop
        Swal.fire({
          icon: "success",
          title: "Downloaded!",
          html: `
            <p>Excel file downloaded successfully.</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">
              <strong>File:</strong> ${cleanFileName}<br>
              <span style="font-size: 0.8rem; color: #666;">
                The file includes complete registration details.
              </span>
            </p>
          `,
          confirmButtonColor: "#28a745",
        });
      }
    } catch (error) {
      console.error("Excel download error:", error);
      
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "There was a problem generating the Excel file. Please try again.",
        footer: '<span style="font-size: 0.8rem;">If the problem persists, please contact technical support.</span>',
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    const { name, date, description, venue, seatLimit, isFree, fee } = formData;
    if (!name || !date || !description || !venue || !seatLimit) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill in all required fields!",
      });
      return;
    }
    
    // Validate fee if event is not free
    if (!isFree && (!fee || fee <= 0)) {
      Swal.fire({
        icon: "warning",
        title: "Fee Required",
        text: "Please enter a valid fee amount for paid events.",
      });
      return;
    }

    try {
      if (editingEvent) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/events/${editingEvent._id}`,
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
        await axios.post(`${process.env.REACT_APP_API_URL}/api/events`, formData);
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "Event created successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setFormData({ name: "", date: "", description: "", venue: "", seatLimit: "", isFree: true, fee: "" });
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
          await axios.delete(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`);
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
      venue: event.venue,
      seatLimit: event.seatLimit,
      isFree: event.isFree !== undefined ? event.isFree : true,
      fee: event.fee || "",
    });
    setShowForm(true);
  };

  const fetchRegistrations = async (eventId, eventName) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/events/${eventId}/registrations`
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
  
  const handleVerifyPayment = async (registrationId, userName) => {
    try {
      // Ask for confirmation
      const result = await Swal.fire({
        title: 'Verify Payment',
        text: `Are you sure you want to verify the payment for ${userName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, verify it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
      });
      
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Verifying Payment',
          text: 'Please wait...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Call API to verify payment
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/verify-payment`, {
          registrationId,
          verified: true
        });
        
        if (response.data.success) {
          // Update the registrations list
          setRegistrations(prevRegistrations => 
            prevRegistrations.map(reg => 
              reg._id === registrationId 
                ? { ...reg, paymentStatus: 'completed', paymentVerified: true, verificationDate: new Date() }
                : reg
            )
          );
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Verified',
            text: 'The payment has been successfully verified.',
            confirmButtonColor: '#28a745',
          });
        } else {
          throw new Error('Failed to verify payment');
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: error.response?.data?.message || 'Failed to verify payment. Please try again.',
        confirmButtonColor: '#dc3545',
      });
    }
  };

  return (
    <div className="admin-container">
      <br />
      <div className="admin-header">
        <h1>🎯 Admin Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

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
              type="text"
              name="venue"
              placeholder="Event Venue"
              value={formData.venue}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="seatLimit"
              placeholder="Seat Limit"
              value={formData.seatLimit}
              onChange={handleInputChange}
              min="1"
            />
            
            <div className="fee-section">
              <div className="fee-type">
                <label>
                  <input
                    type="radio"
                    name="isFree"
                    checked={formData.isFree === true}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: true, fee: "" }))}
                  />
                  Free Event
                </label>
                <label>
                  <input
                    type="radio"
                    name="isFree"
                    checked={formData.isFree === false}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
                  />
                  Paid Event
                </label>
              </div>
              
              {formData.isFree === false && (
                <input
                  type="number"
                  name="fee"
                  placeholder="Fee Amount (INR)"
                  value={formData.fee}
                  onChange={handleInputChange}
                  min="1"
                />
              )}
            </div>
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
          <div className="modal-content registration-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📋 {selectedEventName} Registrations</h2>
            {registrations.length > 0 ? (
              <div className="registrations-table-container">
                <table className="registrations-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Ticket ID</th>
                      <th>Payment Status</th>
                      <th>Payment Screenshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((user, index) => (
                      <tr key={index} className={user.paymentStatus === 'completed' ? 'payment-completed' : 'payment-pending'}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>{user.ticketId || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${user.paymentStatus}`}>
                            {user.paymentStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}
                          </span>
                          {user.paymentStatus === 'pending' && (
                            <button 
                              className="verify-payment-btn"
                              onClick={() => handleVerifyPayment(user._id, user.name)}
                            >
                              Verify
                            </button>
                          )}
                          {user.paymentStatus === 'completed' && !user.paymentVerified && (
                            <div className="verification-note">Auto-verified</div>
                          )}
                          {user.paymentVerified && (
                            <div className="verification-note">
                              Manually verified
                              {user.verificationDate && (
                                <span className="verification-date">
                                  {new Date(user.verificationDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {user.paymentScreenshot ? (
                            <button 
                              className="view-screenshot-btn"
                              onClick={() => {
                                Swal.fire({
                                  title: `Payment Screenshot - ${user.name}`,
                                  imageUrl: user.paymentScreenshot,
                                  imageWidth: 400,
                                  imageHeight: 'auto',
                                  imageAlt: 'Payment Screenshot',
                                  confirmButtonText: 'Close'
                                });
                              }}
                            >
                              🖼️ View
                            </button>
                          ) : (
                            'No screenshot'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No registrations yet.</p>
            )}
            <button className="close-modal-btn" onClick={() => setShowRegistrations(false)}>Close</button>
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
                <p>📍 Venue: {event.venue}</p>
                <p>🎟 Seats: {event.seatLimit}</p>
                <p>
                  {event.isFree ? 
                    "🆓 Free Event" : 
                    `💰 Paid Event: ₹${event.fee}`
                  }
                </p>
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
                    title="Download complete registration data in Excel format"
                  >
                    � Export to Excel
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