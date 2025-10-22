import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const collapseRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);

  // Collapse navbar on link click (for mobile)
  const handleNavLinkClick = () => {
    const collapseEl = collapseRef.current;
    if (collapseEl && collapseEl.classList.contains("show")) {
      const bsCollapse = new window.bootstrap.Collapse(collapseEl, {
        toggle: true,
      });
      bsCollapse.hide();
    }
  };

  // Helper: Get user initials (e.g., "Shubham Anpat" => "SA")
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    const initials =
      parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0][0];
    return initials.toUpperCase();
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            Boating Assistance
          </Link>

          {/* Toggler for small screens */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navbar links */}
          <div
            className="collapse navbar-collapse"
            id="navbarNav"
            ref={collapseRef}
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/* Admin Dashboard */}
              {user?.type === "admin" && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/admin"
                    onClick={handleNavLinkClick}
                  >
                    Admin
                  </Link>
                </li>
              )}

              {/* Create Customer */}
              {(user?.type === "admin" || user?.type === "backdesk") && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/create-customer"
                    onClick={handleNavLinkClick}
                  >
                    Create Customer
                  </Link>
                </li>
              )}

              {/* Employee Management */}
              {user?.type === "admin" && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/all-employees"
                    onClick={handleNavLinkClick}
                  >
                    Employee Management
                  </Link>
                </li>
              )}

              {/* Bookings */}
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/bookings"
                  onClick={handleNavLinkClick}
                >
                  Bookings
                </Link>
              </li>

              {/* Availability */}
              {(user?.type === "admin" || user?.type === "backdesk") && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/availability"
                    onClick={handleNavLinkClick}
                  >
                    Availability
                  </Link>
                </li>
              )}

              {/* Yacht Management */}
              {user?.type === "admin" && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/all-yachts"
                    onClick={handleNavLinkClick}
                  >
                    Yacht Management
                  </Link>
                </li>
              )}

              {/* Collections */}
              {/* {user?.type === "admin" && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/collections"
                    onClick={handleNavLinkClick}
                  >
                    Collections
                  </Link>
                </li>
              )} */}
            </ul>

            {/* My Profile (Initials) & Logout */}
            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 mt-2 mt-lg-0">
              {/* Profile initials button */}
              <button
                className="btn btn-light rounded-circle text-primary fw-bold d-flex align-items-center justify-content-center"
                style={{
                  width: "40px",
                  height: "40px",
                  fontSize: "14px",
                }}
                onClick={() => setShowProfile(true)}
                title="My Profile"
              >
                {getInitials(user?.name)}
              </button>

              {/* Logout */}
              <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfile && user && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          onClick={() => setShowProfile(false)} // click outside to close
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">My Profile</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowProfile(false)}
                ></button>
              </div>

              <div className="modal-body text-center">
                <img
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                  alt="profile"
                  className="rounded-circle mb-3"
                  width="100"
                  height="100"
                />
                <h5>{user.name}</h5>
                <p className="text-muted mb-2">{user.type.toUpperCase()}</p>
                <hr />
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Contact:</strong> {user.contact}</p>
                <p><strong>Status:</strong> {user.status}</p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowProfile(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
