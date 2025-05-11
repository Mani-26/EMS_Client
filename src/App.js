import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Admin from "./pages/Admin"; // Import Admin Page
import "./App.css"; // Import CSS file
import "./styles/sweetalert-dark.css"; // Import SweetAlert dark mode styles
import AdminLogin from "./pages/AdminLogin";
import Navbar from "./pages/Navbar.js";
import PrivateRoute from "./PrivateRoute";
import PaymentForm from "./pages/PaymentForm";
import PaymentSuccess from "./pages/PaymentSuccess";
import CheckStatus from "./pages/CheckStatus";
import TestRegistration from "./pages/TestRegistration";
import React from "react";

function App() {
  return (
    <Router>
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
