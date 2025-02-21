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
      const res = await axios.post("https://yellowmatics-events.onrender.com/api/admin/login", { email, password });
      localStorage.setItem("token", res.data.token);
      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Redirecting...",
        showConfirmButton: false,
        timer: 1500,
      });
      
      navigate("/admin");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Invalid credentials. Try again.",
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
