import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Admin from "./pages/Admin"; // Import Admin Page
import "./App.css"; // Import CSS file

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register/:eventId" element={<Register />} />
        <Route path="/admin" element={<Admin />} /> {/* Add Admin Route */}
      </Routes>
    </Router>
  );
}

export default App;
