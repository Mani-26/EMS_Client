import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Admin from "./pages/Admin"; // Import Admin Page
import "./App.css"; // Import CSS file
import "./styles/sweetalert-dark.css"; // Import SweetAlert dark mode styles
import "./styles/animations.css"; // Import animations
import "./styles/loading-animations.css"; // Import advanced loading animations
import AdminLogin from "./pages/AdminLogin";
import Navbar from "./pages/Navbar.js";
import PrivateRoute from "./PrivateRoute";
import PaymentForm from "./pages/PaymentForm";
import PaymentSuccess from "./pages/PaymentSuccess";
import CheckStatus from "./pages/CheckStatus";
import TestRegistration from "./pages/TestRegistration";
import React, { useEffect, useState } from "react";

function App() {
  const [pageLoading, setPageLoading] = useState(false);
  
  // Set light mode as default when app loads
  useEffect(() => {
    document.body.className = 'light-mode';
  }, []);

  // Simulate page transition loading
  useEffect(() => {
    const handleStart = () => {
      setPageLoading(true);
    };
    
    const handleComplete = () => {
      setTimeout(() => {
        setPageLoading(false);
      }, 800);
    };

    // In a real app with react-router, you would listen to router events
    // For this demo, we'll simulate a page load
    handleStart();
    handleComplete();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <Router>
      {pageLoading && <div className="page-transition-loader"></div>}
      <div className="page-background animate-gpu"></div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register/:eventId" element={<Register />} />
        <Route path="/payment/:eventId/:name/:email/:phone" element={<PaymentForm />} />
        <Route path="/payment-success/:transactionRef" element={<PaymentSuccess />} />
        <Route path="/check-status" element={<CheckStatus />} />
        <Route path="/test-registration" element={<TestRegistration />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
