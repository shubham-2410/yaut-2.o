// src/components/Navbar.jsx
import React, { useRef } from "react";
import { Link } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const collapseRef = useRef(null);

  // Collapse navbar on link click (mobile)
  const handleNavLinkClick = () => {
    const collapseEl = collapseRef.current;
    if (collapseEl && collapseEl.classList.contains("show")) {
      const bsCollapse = new window.bootstrap.Collapse(collapseEl, {
        toggle: true,
      });
      bsCollapse.hide();
    }
  };

  return (
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

            {user?.type === "admin" && (
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/create-employee"
                  onClick={handleNavLinkClick}
                >
                  Create Employee
                </Link>
              </li>
            )}

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/bookings"
                onClick={handleNavLinkClick}
              >
                Bookings
              </Link>
            </li>

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
            {user?.type === "admin" && (
  <li className="nav-item">
    <Link
      className="nav-link"
      to="/create-yacht"
      onClick={handleNavLinkClick}
    >
      Create Yacht
    </Link>
  </li>
)}



            {/* Collections - Admin only */}
            {user?.type === "admin" && (
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/collections"
                  onClick={handleNavLinkClick}
                >
                  Collections
                </Link>
              </li>
            )}
          </ul>

          {/* Logout button aligned to right */}
          <div className="d-flex mt-2 mt-lg-0">
            <button
              className="btn btn-light btn-sm w-100 w-lg-auto"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
