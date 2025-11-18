import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; //  import navigate
import { loginAPI } from "../services/operations/authAPI";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); //  setup navigate

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

        console.log(" Login successful:", employee);
        console.log("🔑 Token:", token);

        // Save token in localStorage
        localStorage.setItem("authToken", token);

        // Update App state
        onLogin({ ...employee, token });

        //  Redirect based on role
        if (employee.type === "admin") {
          navigate("/admin");
        } else if (employee.type === "backdesk") {
          navigate("/bookings");
        } else if (employee.type === "onsite") {
          navigate("/bookings");
        } else {
          navigate("/"); // fallback
        }
      } else {
        console.warn("⚠️ Unexpected response structure:", response.data);
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Login Error:", err);
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4 w-100" style={{ maxWidth: "400px" }}>
        <h3 className="text-center mb-4">Login</h3>
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-danger text-center">{error}</p>}

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
