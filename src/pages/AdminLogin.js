import Swal from "sweetalert2";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      console.log("Attempting login with:", { email });
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/login`, { email, password });
      console.log("Login response:", res.data);
      
      // Store token in both sessionStorage and localStorage for consistency
      const token = res.data.token;
      sessionStorage.setItem("token", token);
      localStorage.setItem("token", token);
      
      console.log("Token stored, redirecting to admin page");
      
      await Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Redirecting...",
        showConfirmButton: false,
        timer: 1500,
      });
      
      // Force navigation with a slight delay to ensure the token is stored
      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Invalid credentials. Try again.",
      });
    }
  };

  return (
    <div className="login-container">
      <h2>Admin Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
