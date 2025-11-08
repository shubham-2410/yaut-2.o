// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer"; // <- Make sure to import Footer

function AdminDashboard({ user }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="container mt-4 flex-grow-1">
        <h2 className="mb-4 text-center">Admin Dashboard</h2>
        <p className="text-center mb-5">
          Welcome, <span className="fw-bold">{user?.role}</span>! Manage
          employees, bookings, and collections here.
        </p>

        <div className="row g-4">
          {/* Create Employee Card */}
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-primary">
              <div className="card-body text-center">
                <h5 className="card-title">Create Employee</h5>
                <p className="card-text">
                  Add backdesk or onsite employees with username and credentials.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleNavigate("/create-employee")}
                >
                  Go
                </button>
              </div>
            </div>
          </div>

          {/* View Bookings Card */}
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-success">
              <div className="card-body text-center">
                <h5 className="card-title">View Bookings</h5>
                <p className="card-text">
                  Check all current bookings and manage .
                </p>
                <button
                  className="btn btn-success"
                  onClick={() => handleNavigate("/bookings")}
                >
                  Go
                </button>
              </div>
            </div>
          </div>

          {/* Track Collections Card */}
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-warning">
              <div className="card-body text-center">
                <h5 className="card-title">Yacht Management</h5>
                <p className="card-text">
                  Monitor and manage your Yacht's
                </p>
                <button
                  className="btn btn-warning text-dark"
                  onClick={() => handleNavigate("/all-yachts")}
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-5 text-center">
          <h5>Quick Actions</h5>
          <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => handleNavigate("/create-customer")}
            >
              Create Customer
            </button>
            <button
              className="btn btn-outline-success"
              onClick={() => handleNavigate("/create-booking")}
            >
              Create Booking
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default AdminDashboard;
