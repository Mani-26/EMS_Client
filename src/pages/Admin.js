import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Admin.css"; // Admin page styles
import "../styles/sweetalert-dark.css"; // Import SweetAlert dark mode styles



export default function Admin() {
  const navigate = useNavigate();
  
  // Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Function to generate input styles based on dark mode
  // eslint-disable-next-line
  const getInputStyles = () => {
    return {
      width: '90%',
      padding: '12px 15px',
      border: isDarkMode ? '1px solid #444' : '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
      outline: 'none',
      backgroundColor: isDarkMode ? '#333' : '#fff',
      color: isDarkMode ? '#f5f5f5' : '#333'
    };
  };
  
  // Add animation styles and detect dark mode when component mounts
  useEffect(() => {
    const slideDownAnimation = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        90% { transform: scale(1); }
      }
      
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = slideDownAnimation;
    document.head.appendChild(styleElement);
    
    // Check if dark mode is active
    const isDark = document.body.classList.contains('dark-mode');
    setIsDarkMode(isDark);
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.body.classList.contains('dark-mode');
          setIsDarkMode(isDark);
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
      observer.disconnect();
    };
  }, []);
  
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
    venue: "",
    seatLimit: "",
    isFree: true,
    fee: "",
    featured: false,
    upiId: "",
    phoneNumber: "",
    customFields: []
  });
  
  // Ensure formData is properly initialized
  useEffect(() => {
    // console.log("Current form data state:", formData);
    // console.log("Form data UPI ID:", formData.upiId);
    // console.log("Form data phone number:", formData.phoneNumber);
    // console.log("Form data featured:", formData.featured);
  }, [formData]);
  
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
  // const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check both sessionStorage and localStorage for the token
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    // console.log("Admin page - token check:", !!token);
    
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
      if (isInAppBrowser) { // If in mobile app (APK)
        // For mobile apps, show a dialog with both options
        Swal.fire({
          icon: "info",
          title: "Download Ready",
          html: `
            <p>Your Excel file is ready to download.</p>
            <div style="display: flex; flex-direction: column; gap: 12px; margin: 15px 0;">
              <button id="copyLinkBtn" class="download-link" style="width: 90%; cursor: pointer; border: none; background: #28a745; color: white; font-weight: bold;">
                Copy Download Link
              </button>
              <a href="${downloadUrl}" target="_blank" class="download-link" style="background: #6c757d; text-align: center;">
                Try Open in Browser
              </a>
            </div>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
              <strong>Recommended:</strong> Copy the link and paste it in your mobile browser.
            </p>
          `,
          confirmButtonText: "Close",
          confirmButtonColor: "#6c757d",
          didOpen: () => {
            // Add click event to the copy button
            document.getElementById('copyLinkBtn').addEventListener('click', () => {
              navigator.clipboard.writeText(downloadUrl).then(() => {
                // Show mini toast inside the modal
                const toast = document.createElement('div');
                toast.innerHTML = '✓ Link copied!';
                toast.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #28a745; color: white; padding: 8px 12px; border-radius: 4px; font-size: 14px; opacity: 0; transition: opacity 0.3s;';
                document.querySelector('.swal2-popup').appendChild(toast);
                
                // Show and hide the toast
                setTimeout(() => { toast.style.opacity = '1'; }, 10);
                setTimeout(() => { 
                  toast.style.opacity = '0'; 
                  setTimeout(() => toast.remove(), 300);
                }, 2000);
              }).catch(err => {
                console.error('Failed to copy link: ', err);
                // Fallback for clipboard API failure
                Swal.fire({
                  icon: "info",
                  title: "Manual Copy Required",
                  html: `
                    <p>Please copy this link manually:</p>
                    <textarea readonly style="width: 90%; padding: 10px; margin: 10px 0; border-radius: 4px; border: 1px solid #ddd;">${downloadUrl}</textarea>
                  `,
                  confirmButtonColor: "#28a745",
                });
              });
            });
          }
        });
      } else if (isMobileDevice || window.innerWidth < 1024) { // Mobile or tablet devices (or small screens) in browser
        // For mobile browsers, show a dialog with both options
        Swal.fire({
          icon: "info",
          title: "Download Ready",
          html: `
            <p>Your Excel file is ready to download.</p>
            <div style="display: flex; flex-direction: column; gap: 12px; margin: 15px 0;">
              <a href="${downloadUrl}" target="_blank" class="download-link" style="background: #28a745; text-align: center;">
                Open in Browser
              </a>
              <button id="copyLinkBtn" class="download-link" style="width: 90%; cursor: pointer; border: none; background: #6c757d; color: white; font-weight: bold;">
                Copy Download Link
              </button>
            </div>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
              Choose how you want to download your file.
            </p>
          `,
          confirmButtonText: "Close",
          confirmButtonColor: "#28a745",
          showCloseButton: true,
          didOpen: () => {
            // Add click event to the copy button
            document.getElementById('copyLinkBtn').addEventListener('click', () => {
              navigator.clipboard.writeText(downloadUrl).then(() => {
                // Show mini toast inside the modal
                const toast = document.createElement('div');
                toast.innerHTML = '✓ Link copied!';
                toast.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #28a745; color: white; padding: 8px 12px; border-radius: 4px; font-size: 14px; opacity: 0; transition: opacity 0.3s;';
                document.querySelector('.swal2-popup').appendChild(toast);
                
                // Show and hide the toast
                setTimeout(() => { toast.style.opacity = '1'; }, 10);
                setTimeout(() => { 
                  toast.style.opacity = '0'; 
                  setTimeout(() => toast.remove(), 300);
                }, 2000);
              }).catch(err => {
                console.error('Failed to copy link: ', err);
                // Fallback for clipboard API failure
                Swal.fire({
                  icon: "info",
                  title: "Manual Copy Required",
                  html: `
                    <p>Please copy this link manually:</p>
                    <textarea readonly style="width: 90%; padding: 10px; margin: 10px 0; border-radius: 4px; border: 1px solid #ddd;">${downloadUrl}</textarea>
                  `,
                  confirmButtonColor: "#28a745",
                });
              });
            });
          }
        });
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
    // console.log(`Input change - Field: ${name}, Value: ${value}`);
    
    // For UPI ID and phone number, log extra debugging
    if (name === 'upiId' || name === 'phoneNumber') {
      console.log(`Updating ${name} from "${formData[name]}" to "${value}"`);
    }
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // console.log(`Updated form data for ${name}:`, newData);
      return newData;
    });
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    // eslint-disable-next-line
    const { name, date, description, venue, seatLimit, isFree, fee, featured, upiId, phoneNumber } = formData;
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
    
    // Validate UPI ID and phone number for paid events
    if (!isFree && (!upiId || !phoneNumber)) {
      Swal.fire({
        icon: "warning",
        title: "Payment Details Required",
        text: "Please enter UPI ID and phone number for paid events.",
      });
      return;
    }

    // Validate custom fields
    if (formData.customFields && formData.customFields.length > 0) {
      // Check for empty field names
      const emptyFieldNames = formData.customFields.some(field => !field.fieldName || field.fieldName.trim() === '');
      if (emptyFieldNames) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Custom Fields",
          text: "All custom fields must have a name.",
        });
        return;
      }
      
      // Check for duplicate field names
      const fieldNames = formData.customFields.map(field => field.fieldName.trim());
      const hasDuplicates = fieldNames.some((name, index) => 
        name && fieldNames.indexOf(name) !== index
      );
      if (hasDuplicates) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Field Names",
          text: "Custom field names must be unique.",
        });
        return;
      }
      
      // Validate select fields have options
      const selectFieldsWithoutOptions = formData.customFields
        .filter(field => field.fieldType === 'select')
        .some(field => !field.options || !Array.isArray(field.options) || field.options.length === 0);
        
      if (selectFieldsWithoutOptions) {
        Swal.fire({
          icon: "warning",
          title: "Missing Options",
          text: "Dropdown fields must have at least one option.",
        });
        return;
      }
    }
    
    try {
      // Log the form data being sent
      // console.log("Saving event with data:", formData);
      // console.log("Custom fields:", formData.customFields);
      // console.log("UPI ID being sent:", formData.upiId);
      // console.log("Phone number being sent:", formData.phoneNumber);
      
      // Create a copy of the form data to ensure UPI ID and phone number are included
      const dataToSend = { ...formData };
      
      // Ensure UPI ID and phone number are included for paid events
      if (!formData.isFree) {
        if (!dataToSend.upiId) {
          console.log("UPI ID is missing, using value from input field");
          const upiInput = document.querySelector('input[name="upiId"]');
          if (upiInput) {
            dataToSend.upiId = upiInput.value || "";
            // console.log("Retrieved UPI ID from input:", dataToSend.upiId);
          }
        }
        
        if (!dataToSend.phoneNumber) {
          console.log("Phone number is missing, using value from input field");
          const phoneInput = document.querySelector('input[name="phoneNumber"]');
          if (phoneInput) {
            dataToSend.phoneNumber = phoneInput.value || "";
            // console.log("Retrieved phone number from input:", dataToSend.phoneNumber);
          }
        }
      }
      
      // Ensure featured field is included
      if (dataToSend.featured === undefined) {
        console.log("Featured field is missing, checking checkbox");
        const featuredCheckbox = document.querySelector('input[type="checkbox"][name="featured"]');
        if (featuredCheckbox) {
          dataToSend.featured = featuredCheckbox.checked;
          // console.log("Retrieved featured status from checkbox:", dataToSend.featured);
        } else {
          // Default to false if checkbox not found
          dataToSend.featured = false;
        }
      }
      
      if (editingEvent) {
        // console.log("Sending data to server:", dataToSend);
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/events/${editingEvent._id}`,
          dataToSend
        );
        
        // console.log("Event update response:", response.data);
        
        // Update the events list with the updated event data
        if (response.data.event) {
          setEvents(prevEvents => 
            prevEvents.map(e => 
              e._id === editingEvent._id ? {...e, ...response.data.event} : e
            )
          );
        }
        
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Event updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // console.log("Creating new event with data:", dataToSend);
        await axios.post(`${process.env.REACT_APP_API_URL}/api/events`, dataToSend);
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "Event created successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset form and fetch events after a slight delay
      setTimeout(() => {
        setFormData({ 
          name: "", 
          date: "", 
          description: "", 
          venue: "", 
          seatLimit: "", 
          isFree: true, 
          fee: "",
          customFields: []
        });
        setEditingEvent(null);
        setShowForm(false);
        fetchEvents();
      }, 300);
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
    // Add extensive debugging to see what we're getting
    // console.log("Edit event clicked with data:", JSON.stringify(event, null, 2));
    // console.log("Current form data before edit:", formData);
    
    // Fetch the full event data from the server to ensure we have all fields
    axios.get(`${process.env.REACT_APP_API_URL}/api/events/${event._id}`)
      .then(response => {
        // console.log("Fetched event data from server:", response.data);
        // Continue with the edit using the fetched data
        handleEditWithFullData({...event, ...response.data});
      })
      .catch(error => {
        console.error("Error fetching event data:", error);
        // Fall back to using the provided event data
        handleEditWithFullData(event);
      });
  };
  
  const handleEditWithFullData = (event) => {
    
    // First, make sure we have a valid event object
    if (!event || typeof event !== 'object') {
      console.error("Invalid event object:", event);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not load event data. Please try again.",
      });
      return;
    }
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Set editing event state immediately
    setEditingEvent(event);
    
    // Format the date properly
    let formattedDate = "";
    try {
      if (event.date) {
        // Try to handle ISO format first
        if (typeof event.date === 'string' && event.date.includes('T')) {
          formattedDate = event.date.split("T")[0];
        } 
        // Then try to handle date object
        else if (event.date instanceof Date) {
          formattedDate = event.date.toISOString().split("T")[0];
        }
        // Then try to parse as date
        else {
          const dateObj = new Date(event.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split("T")[0];
          } else {
            // If it's a string but not in ISO format, try to parse it
            formattedDate = event.date;
          }
        }
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      // If all else fails, try to use the raw value
      formattedDate = event.date || "";
    }
    
    // console.log("Formatted date for form:", formattedDate);
    
    // Ensure custom fields are properly formatted
    const formattedCustomFields = [];
    if (Array.isArray(event.customFields)) {
      event.customFields.forEach(field => {
        formattedCustomFields.push({
          fieldName: field.fieldName || '',
          fieldType: field.fieldType || 'text',
          placeholder: field.placeholder || '',
          isRequired: Boolean(field.isRequired),
          options: Array.isArray(field.options) ? [...field.options] : 
                  (field.options ? field.options.split(',').map(opt => opt.trim()) : [])
        });
      });
    }
    
    // console.log("Formatted custom fields:", formattedCustomFields);
    
    // Log UPI ID and phone number specifically
    // console.log("Event UPI ID:", event.upiId);
    // console.log("Event phone number:", event.phoneNumber);
    
    // Create the form data object
    const newFormData = {
      name: event.name || "",
      date: formattedDate,
      description: event.description || "",
      venue: event.venue || "",
      seatLimit: event.seatLimit?.toString() || "",
      isFree: event.isFree !== undefined ? Boolean(event.isFree) : true,
      fee: event.fee?.toString() || "",
      featured: event.featured !== undefined ? Boolean(event.featured) : false,
      upiId: event.upiId || "",
      phoneNumber: event.phoneNumber || "",
      customFields: formattedCustomFields
    };
    
    // console.log("Setting form data to:", newFormData);
    
    // First set showForm to false to reset any previous state
    setShowForm(false);
    
    // Force a state update with a clean new object
    const cleanFormData = {
      name: event.name || "",
      date: formattedDate,
      description: event.description || "",
      venue: event.venue || "",
      seatLimit: event.seatLimit?.toString() || "",
      isFree: event.isFree !== undefined ? Boolean(event.isFree) : true,
      fee: event.fee?.toString() || "",
      featured: event.featured !== undefined ? Boolean(event.featured) : false,
      upiId: event.upiId || "",
      phoneNumber: event.phoneNumber || "",
      customFields: formattedCustomFields
    };
    
    // console.log("Setting clean form data:", cleanFormData);
    
    // Use a timeout to ensure the state updates properly
    setTimeout(() => {
      // Set the form data and editing event state
      // console.log("Setting form data with UPI ID:", cleanFormData.upiId);
      // console.log("Setting form data with phone number:", cleanFormData.phoneNumber);
      
      setFormData(cleanFormData);
      setEditingEvent({...event});
      
      // Show the form after a short delay
      setTimeout(() => {
        setShowForm(true);
        // console.log("Form should now be visible");
        // console.log("Form data after update:", formData);
        // console.log("UPI ID after update:", formData.upiId);
        // console.log("Phone number after update:", formData.phoneNumber);
      }, 100);
    }, 50);
  };

  const fetchRegistrations = async (eventId, eventName) => {
    try {
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Fetch the registrations with event custom fields
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/events/${eventId}/registrations`
      );
      
      // Extract event custom fields and registrations from the response
      const eventCustomFields = res.data.eventCustomFields || [];
      const registrationsData = res.data.registrations || [];
      
      // console.log("Event custom fields:", eventCustomFields);
      // console.log("Registrations data:", registrationsData);
      
      // Process the registration data to ensure customFieldValues is properly handled
      const processedRegistrations = registrationsData.map(registration => {
        // Log the raw customFieldValues for debugging
        // console.log("Registration customFieldValues:", registration.customFieldValues);
        
        // Process customFieldValues based on its type
        let processedCustomFieldValues = {};
        let hasCustomFields = registration.hasCustomFields || false;
        
        if (registration.customFieldValues) {
          if (typeof registration.customFieldValues === 'string') {
            // Try to parse if it's a JSON string
            try {
              processedCustomFieldValues = JSON.parse(registration.customFieldValues);
              hasCustomFields = Object.keys(processedCustomFieldValues).length > 0;
            } catch (e) {
              console.error("Error parsing customFieldValues JSON string:", e);
            }
          } else if (registration.customFieldValues instanceof Map) {
            // Convert Map to object
            processedCustomFieldValues = {};
            registration.customFieldValues.forEach((value, key) => {
              processedCustomFieldValues[key] = value;
            });
            hasCustomFields = Object.keys(processedCustomFieldValues).length > 0;
          } else if (typeof registration.customFieldValues === 'object' && !Array.isArray(registration.customFieldValues)) {
            // It's already an object
            processedCustomFieldValues = registration.customFieldValues;
            hasCustomFields = Object.keys(processedCustomFieldValues).length > 0;
          }
        }
        
        // console.log("Processed customFieldValues:", processedCustomFieldValues);
        
        return {
          ...registration,
          customFieldValues: processedCustomFieldValues,
          hasCustomFields: hasCustomFields,
          eventCustomFields: eventCustomFields // Add the event custom fields to each registration
        };
      });
      
      // console.log("Processed registrations:", processedRegistrations);
      
      // Set data after a slight delay to ensure scroll completes
      setTimeout(() => {
        setRegistrations(processedRegistrations);
        setSelectedEventName(eventName);
        setShowRegistrations(true);
      }, 300);
    } catch (error) {
      console.error("Error fetching registrations:", error);
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
    <div className="admin-container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
      <div className="admin-header">
        <h1>🎯 Admin Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          <span className="logout-icon">🚪</span> Logout
        </button>
      </div>

      {/* Event Form */}
      {/* {console.log("Rendering form section, showForm:", showForm, "editingEvent:", editingEvent, "isDarkMode:", isDarkMode)} */}
      {showForm && (
        <div 
          className={`event-form-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
          style={{
            backgroundColor: isDarkMode ? '#2c3e50' : '#ffffff',
            padding: window.innerWidth <= 480 ? '20px' : window.innerWidth <= 768 ? '25px' : '30px',
            borderRadius: window.innerWidth <= 480 ? '8px' : '10px',
            boxShadow: isDarkMode ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.1)',
            marginBottom: window.innerWidth <= 768 ? '20px' : '30px',
            border: isDarkMode ? '1px solid #34495e' : '1px solid #e0e0e0',
            animation: 'slideDown 0.5s ease-out',
            transform: 'translateZ(0)', /* Force hardware acceleration */
            maxWidth: '900px',
            margin: '0 auto 30px auto',
            color: isDarkMode ? '#f5f5f5' : '#333',
            overflowX: 'hidden'
          }}>
          <h2 style={{
            marginBottom: window.innerWidth <= 480 ? '15px' : '25px', 
            color: editingEvent 
              ? (isDarkMode ? '#4dabf7' : '#007bff') 
              : (isDarkMode ? '#40c057' : '#28a745'), 
            textAlign: 'center',
            fontFamily: "'Playfair Display', serif",
            fontSize: window.innerWidth <= 480 ? '22px' : window.innerWidth <= 768 ? '24px' : '28px',
            fontWeight: 'bold',
            animation: 'fadeIn 0.7s ease-out',
            textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
            padding: '0 10px'
          }}>
            {editingEvent ? "✏️ Edit Event" : "➕ New Event"}
          </h2>
          {/* {console.log("Form data being rendered:", JSON.stringify(formData, null, 2))} */}
          
          <form 
            className={`event-edit-form ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
            onSubmit={handleSaveEvent}>
          <div style={{
            marginBottom: '20px',
            animation: 'fadeIn 0.8s ease-out'
          }}>
            <div style={{marginBottom: '15px'}}>
              <label style={{
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: isDarkMode ? '#f5f5f5' : '#333',
                fontSize: '16px'
              }}>Event Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter event name"
                value={formData.name || ""}
                onChange={handleInputChange}
                style={{
                  width: '90%',
                  padding: '12px 15px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333',
                fontSize: '16px'
              }}>Event Date</label>
              <input
                type="date"
                name="date"
                value={formData.date || ""}
                onChange={handleInputChange}
                style={{
                  width: '90%',
                  padding: '12px 15px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Event Description</label>
              <textarea
                name="description"
                placeholder="Enter event description"
                value={formData.description || ""}
                onChange={handleInputChange}
                rows="4"
                style={{
                  width: '90%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Event Venue</label>
              <input
                type="text"
                name="venue"
                placeholder="Enter event venue"
                value={formData.venue || ""}
                onChange={handleInputChange}
                style={{
                  width: '90%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Seat Limit</label>
              <input
                type="number"
                name="seatLimit"
                placeholder="Enter seat limit"
                value={formData.seatLimit || ""}
                onChange={handleInputChange}
                min="1"
                style={{
                  width: '90%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '4px'
            }}>
              <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold'}}>Event Fee Type</label>
              
              <div style={{marginBottom: '10px'}}>
                <label style={{display: 'inline-flex', alignItems: 'center', marginRight: '20px', cursor: 'pointer'}}>
                  <input
                    type="radio"
                    name="isFree"
                    checked={formData.isFree === true}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: true, fee: "" }))}
                    style={{marginRight: '8px'}}
                  />
                  Free Event
                </label>
                <label style={{display: 'inline-flex', alignItems: 'center', cursor: 'pointer'}}>
                  <input
                    type="radio"
                    name="isFree"
                    checked={formData.isFree === false}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: false, fee: prev.fee || "0" }))}
                    style={{marginRight: '8px'}}
                  />
                  Paid Event
                </label>
              </div>
              
              {formData.isFree === false && (
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Fee Amount (INR)</label>
                  <input
                    type="number"
                    name="fee"
                    placeholder="Enter fee amount"
                    value={formData.fee || ""}
                    onChange={handleInputChange}
                    min="1"
                    style={{
                      width: '90%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Payment Details Section - Only shown for paid events */}
            {formData.isFree === false && (
              <div style={{
                marginBottom: '15px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '4px'
              }}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold'}}>Payment Details</label>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>UPI ID</label>
                  <input
                    type="text"
                    name="upiId"
                    placeholder="Enter UPI ID for payments"
                    value={formData.upiId || ""}
                    onChange={handleInputChange}
                    style={{
                      width: '90%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div style={{marginBottom: '5px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="Enter phone number for payments"
                    value={formData.phoneNumber || ""}
                    onChange={handleInputChange}
                    style={{
                      width: '90%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                  <p style={{fontSize: '0.8rem', color: '#6c757d', margin: '5px 0 0 0'}}>
                    This information will be displayed to users during payment
                  </p>
                </div>
              </div>
            )}

            {/* Featured Event Toggle */}
            <div style={{marginTop: '20px', marginBottom: '20px'}}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                fontWeight: 'bold',
                color: formData.featured ? '#ff9800' : 'inherit'
              }}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured || false}
                  onChange={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                  style={{marginRight: '10px', width: '18px', height: '18px'}}
                />
                <span style={{display: 'flex', alignItems: 'center'}}>
                  {formData.featured ? '⭐ Featured Event' : 'Make this a featured event'} 
                  {formData.featured && <span style={{fontSize: '0.8rem', marginLeft: '10px', fontWeight: 'normal', fontStyle: 'italic'}}>(Will appear prominently on the home page)</span>}
                </span>
              </label>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div style={{
            marginTop: '40px', 
            borderTop: '1px solid #ddd', 
            paddingTop: '30px',
            animation: 'fadeIn 1s ease-out'
          }}>
            <h3 style={{
              marginBottom: '12px', 
              fontSize: '20px',
              color: '#333',
              fontFamily: "'Playfair Display', serif",
              textAlign: 'center'
            }}>Custom Registration Fields</h3>
            <p style={{
              marginBottom: '20px', 
              color: '#666', 
              fontSize: '15px',
              textAlign: 'center',
              maxWidth: '700px',
              margin: '0 auto 25px auto'
            }}>
              Add custom fields to collect additional information from registrants.
            </p>
            
            {Array.isArray(formData.customFields) && formData.customFields.map((field, index) => (
              <div key={index} style={{
                marginBottom: '20px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                backgroundColor: '#f9f9f9',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                animation: 'slideUp 0.5s ease-out',
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}>
                {/* Custom Field Header with Field Number */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '10px'
                }}>
                  <h4 style={{margin: 0, color: '#333'}}>Field #{index + 1}</h4>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      const updatedFields = formData.customFields.filter((_, i) => i !== index);
                      setFormData({...formData, customFields: updatedFields});
                    }}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{marginRight: '5px'}}>✕</span> Remove
                  </button>
                </div>
                
                {/* Main Field Properties */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '15px'
                }}>
                  {/* Field Name */}
                  <div style={{gridColumn: '1 / 2'}}>
                    <label style={{
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: '#444'
                    }}>
                      Field Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter field name"
                      value={field.fieldName || ''}
                      onChange={(e) => {
                        const updatedFields = [...formData.customFields];
                        updatedFields[index].fieldName = e.target.value;
                        setFormData({...formData, customFields: updatedFields});
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  {/* Field Type */}
                  <div style={{gridColumn: '2 / 3'}}>
                    <label style={{
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: '#444'
                    }}>
                      Field Type
                    </label>
                    <select
                      value={field.fieldType || 'text'}
                      onChange={(e) => {
                        const updatedFields = [...formData.customFields];
                        updatedFields[index].fieldType = e.target.value;
                        setFormData({...formData, customFields: updatedFields});
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                  
                  {/* Placeholder/Help Text - Full Width */}
                  <div style={{gridColumn: '1 / 3'}}>
                    <label style={{
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: '#444'
                    }}>
                      {field.fieldType === 'date' ? 'Help Text' : 'Placeholder'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        field.fieldType === 'date' 
                          ? "Help text (e.g., 'Select your birth date')" 
                          : "Placeholder text"
                      }
                      value={field.placeholder || ''}
                      onChange={(e) => {
                        const updatedFields = [...formData.customFields];
                        updatedFields[index].placeholder = e.target.value;
                        setFormData({...formData, customFields: updatedFields});
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  {/* Required Field Checkbox */}
                  <div style={{
                    gridColumn: '1 / 3',
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '5px'
                  }}>
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.isRequired || false}
                      onChange={(e) => {
                        const updatedFields = [...formData.customFields];
                        updatedFields[index].isRequired = e.target.checked;
                        setFormData({...formData, customFields: updatedFields});
                      }}
                      style={{
                        marginRight: '8px',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                    <label 
                      htmlFor={`required-${index}`} 
                      style={{
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: field.isRequired ? '#28a745' : '#666'
                      }}
                    >
                      {field.isRequired ? '✓ Required Field' : 'Make this field required'}
                    </label>
                  </div>
                </div>
                
                {field.fieldType === 'select' && (
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '15px',
                    borderTop: '1px dashed #ddd',
                    backgroundColor: '#f5f5f5',
                    padding: '15px',
                    borderRadius: '5px'
                  }}>
                    <label style={{
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: '#444'
                    }}>
                      Dropdown Options
                    </label>
                    <input
                      type="text"
                      placeholder="Enter options separated by commas"
                      value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                      onChange={(e) => {
                        const updatedFields = [...formData.customFields];
                        updatedFields[index].options = e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
                        setFormData({...formData, customFields: updatedFields});
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  
                    {/* Options Preview */}
                    {Array.isArray(field.options) && field.options.length > 0 && (
                      <div style={{
                        marginTop: '10px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '5px'
                      }}>
                        {field.options.map((option, optIndex) => (
                          <div key={optIndex} style={{
                            backgroundColor: '#e9ecef',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            display: 'inline-block'
                          }}>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p style={{
                      fontSize: '0.8rem', 
                      color: '#6c757d', 
                      margin: '10px 0 0 0',
                      fontStyle: 'italic'
                    }}>
                      Enter options separated by commas (e.g., Option 1, Option 2, Option 3)
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add Custom Field Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '30px',
              marginBottom: '20px'
            }}>
                <button 
                type="button"
                onClick={() => {
                  const newField = { 
                    fieldName: '', 
                    fieldType: 'text', 
                    isRequired: false,
                    placeholder: '',
                    options: []
                  };
                  setFormData({
                    ...formData, 
                    customFields: [...(formData.customFields || []), newField]
                  });
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '12px 25px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(40, 167, 69, 0.3)',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#218838';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(40, 167, 69, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#28a745';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.3)';
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '18px' }}>+</span>
                Add Custom Field
              </button>
            </div>
            
            {/* Custom Fields Count */}
            {formData.customFields && formData.customFields.length > 0 && (
              <div style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#6c757d',
                marginBottom: '20px'
              }}>
                {formData.customFields.length} custom field{formData.customFields.length !== 1 ? 's' : ''} configured
              </div>
            )}
          </div>
          
          <div style={{
            marginTop: '10px', 
            display: 'block', 
            animation: 'fadeIn 1.2s ease-out'
          }}>
            <button 
              type="submit"
              style={{
                padding: '10px',
                margin:"10px",
                backgroundColor: editingEvent ? '#007bff' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px',
                minWidth: '180px',
                boxShadow: `0 4px 10px ${editingEvent ? 'rgba(0, 123, 255, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`,
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = editingEvent ? '#0069d9' : '#218838';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 15px ${editingEvent ? 'rgba(0, 123, 255, 0.4)' : 'rgba(40, 167, 69, 0.4)'}`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = editingEvent ? '#007bff' : '#28a745';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 10px ${editingEvent ? 'rgba(0, 123, 255, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`;
              }}
            >
              {editingEvent ? "Update Event" : "Create Event"}
            </button>
            <button 
              type="button"
              style={{
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px',
                minWidth: '180px',
                boxShadow: '0 4px 10px rgba(108, 117, 125, 0.3)',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#5a6268';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(108, 117, 125, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#6c757d';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(108, 117, 125, 0.3)';
              }}
              onClick={() => {
                // Scroll to top of the page
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Close the form after a slight delay
                setTimeout(() => setShowForm(false), 300);
              }}
            >
              Cancel
            </button>
          </div>
          </form>
        </div>
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
                      <th>Custom Fields</th>
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
                          {(() => {
                            // Debug log
                            // console.log(`Custom field values for ${user.name}:`, user.customFieldValues);
                            
                            // Check if we have valid custom field values
                            let hasCustomFields = false;
                            let customFieldEntries = [];
                            
                            // First, check if the user has customFieldValues
                            if (user.customFieldValues) {
                              // console.log(`Custom field values type for ${user.name}:`, typeof user.customFieldValues);
                              
                              if (typeof user.customFieldValues === 'object') {
                                if (user.customFieldValues instanceof Map) {
                                  // It's a Map
                                  hasCustomFields = user.customFieldValues.size > 0;
                                  customFieldEntries = Array.from(user.customFieldValues.entries());
                                } else if (!Array.isArray(user.customFieldValues)) {
                                  // It's a plain object
                                  hasCustomFields = Object.keys(user.customFieldValues).length > 0;
                                  customFieldEntries = Object.entries(user.customFieldValues);
                                }
                              } else if (typeof user.customFieldValues === 'string') {
                                // Try to parse if it's a JSON string
                                try {
                                  const parsedValues = JSON.parse(user.customFieldValues);
                                  if (typeof parsedValues === 'object' && !Array.isArray(parsedValues)) {
                                    hasCustomFields = Object.keys(parsedValues).length > 0;
                                    customFieldEntries = Object.entries(parsedValues);
                                  }
                                } catch (e) {
                                  console.error("Error parsing customFieldValues string:", e);
                                }
                              }
                            }
                            
                            // If the user has the hasCustomFields property, use that
                            if (user.hasCustomFields !== undefined) {
                              hasCustomFields = user.hasCustomFields;
                            }
                            
                            // If customFieldEntries is empty but we know there should be custom fields,
                            // try to extract them from the raw data
                            if (customFieldEntries.length === 0 && user._doc && user._doc.customFieldValues) {
                              try {
                                const rawValues = user._doc.customFieldValues;
                                if (typeof rawValues === 'object' && !Array.isArray(rawValues)) {
                                  customFieldEntries = Object.entries(rawValues);
                                  hasCustomFields = customFieldEntries.length > 0;
                                }
                              } catch (e) {
                                console.error("Error extracting raw custom field values:", e);
                              }
                            }
                            
                            // console.log(`Custom field entries for ${user.name}:`, customFieldEntries);
                            
                            if (hasCustomFields && customFieldEntries.length > 0) {
                              return (
                                <div className="custom-fields-data">
                                  {customFieldEntries.map(([key, value], i) => {
                                    // Skip null or undefined values
                                    if (value === null || value === undefined) {
                                      return null;
                                    }
                                    
                                    // Check if the value is a date string (YYYY-MM-DD format)
                                    const isDateValue = value && typeof value === 'string' && 
                                      /^\d{4}-\d{2}-\d{2}$/.test(value);
                                    
                                    // Format date values nicely
                                    let displayValue;
                                    try {
                                      displayValue = isDateValue 
                                        ? new Date(value).toLocaleDateString('en-US', {
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric'
                                          })
                                        : value.toString();
                                    } catch (error) {
                                      console.error("Error formatting value:", error);
                                      displayValue = String(value);
                                    }
                                    
                                    return (
                                      <div key={i} className="custom-field-entry">
                                        <strong>{key}:</strong> {displayValue}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } else {
                              // Check if this is a registration for an event with custom fields
                              const hasEventCustomFields = registrations.length > 0 && 
                                registrations[0].eventCustomFields && 
                                registrations[0].eventCustomFields.length > 0;
                              
                              return (
                                <span className="no-data">
                                  {user.hasOwnProperty('customFieldValues') 
                                    ? (hasEventCustomFields ? 'No custom data provided' : 'No custom fields for this event') 
                                    : 'Loading custom fields...'}
                                </span>
                              );
                            }
                          })()}
                        </td>
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
            <button 
              className="close-modal-btn" 
              onClick={() => {
                // Scroll to top of the page
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Close the registrations view after a slight delay
                setTimeout(() => setShowRegistrations(false), 300);
              }}
            >
              Back to Events
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      <section className="events-section">
        <h2>📌 Events Overview</h2>
        {events.length === 0 ? (
          <p className="no-events">No events available. Create one to get started!</p>
        ) : (
          <div className="event-list events-grid">
            {events.map((event) => (
              <div key={event._id} className={`event-card ${event.featured ? 'featured-event' : ''}`}>
                {event.featured && <div className="featured-badge">⭐ Featured</div>}
                <h3>{event.name}</h3>
                <p className="event-date">📅 {event.date ? 
                  (() => {
                    try {
                      return new Date(event.date).toLocaleDateString();
                    } catch (e) {
                      console.error("Error formatting date:", e);
                      return event.date;
                    }
                  })() 
                  : 'No date'}</p>
                <p>{event.description}</p>
                <p>📍 Venue: {event.venue}</p>
                <p>🎟 Seats: {event.seatLimit}</p>
                <p>
                  {event.isFree ? 
                    "🆓 Free Event" : 
                    `💰 Paid Event: ₹${event.fee || '0'}`
                  }
                </p>
                {event.customFields && event.customFields.length > 0 && (
                  <p className="custom-fields-indicator">
                    📋 Custom Fields: {event.customFields.length}
                  </p>
                )}
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
                    📊 Export to Excel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Button */}
      {!showForm && (
        <button 
          className="floating-button" 
          onClick={() => {
            // Scroll to top of the page
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Show the form after a slight delay to ensure scroll completes
            setTimeout(() => setShowForm(true), 300);
          }}
        >
          +
        </button>
      )}
    </div>
  );
}