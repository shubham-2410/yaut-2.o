import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../services/operations/authAPI";
import "../styles/Login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginAPI(username, password);

      if (
        response.status === 200 &&
        response.data &&
        response.data.employee &&
        response.data.token
      ) {
        const { employee, token } = response.data;

        localStorage.setItem("authToken", token);
        onLogin({ ...employee, token });

        if (employee.type === "admin") navigate("/admin");
        else navigate("/bookings");
      } else {
        setError("Invalid login credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card shadow p-4 w-100 login-card">

        {/* ------------ ADDED INSIDE CARD (TOP) ------------ */}
        <div className="login-branding">
          {/* <img
            src="/yacht-logo.png"  // replace with your logo
            alt="Logo"
            className="login-logo"
          /> */}
          <h3 className="login-title-text">Yacht Manager</h3>
        </div>
        {/* -------------------------------------------------- */}

        <h3 className="text-center mb-2">Login</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-danger text-center">{error}</p>}

          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
