import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Admin from "./pages/Admin"; // Import Admin Page
import "./App.css"; // Import CSS file
import AdminLogin from "./pages/AdminLogin";
import Navbar from "./pages/Navbar.js";
import PrivateRoute from "./PrivateRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register/:eventId" element={<Register />} />
        <Route path="/admin" element={<Admin />} /> 
        <Route path="/admin-login" element={<AdminLogin />} />{" "}
        {/* Add Admin Route */}
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
