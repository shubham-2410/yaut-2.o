import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Bookings from "./pages/Bookings";
import Collections from "./pages/Collections";
import Availability from "./pages/Availability";
import NotFound from "./pages/NotFound";
import CreateCustomer from "./pages/CreateCustomer";
import CustomerDetails from "./pages/CustomerDetails";
import CreateEmployee from "./pages/CreateEmployee";
import CreateBooking from "./pages/CreateBooking";
import UpdateBooking from "./pages/UpdateBooking";
import DayAvailability from "./pages/DayAvailability";
import CreateYacht from "./pages/CreateYacht";
import AllYachts from "./pages/AllYachts";
import AllEmployees from "./pages/AllEmployees";
import { Home } from "./pages/Home";

function App() {
  // Initialize user immediately from localStorage
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  const role = user?.type?.toLowerCase();

  const handleLogin = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  };

  return (
    <>
      {user && <Navbar user={user} onLogout={handleLogout} />}

      <Routes>
        {/* Public route */}
        <Route
          path="/"
          element={user ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />}
        />

        <Route
          path="/home"
          element={
            <Home></Home>
          }
        />
        
        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user}>
              {role === "admin" ? <AdminDashboard /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-details"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk", "onsite"].includes(role) ? (
                <CustomerDetails />
              ) : (
                <NotFound />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-yacht"
          element={
            <ProtectedRoute user={user}>
              {role === "admin" ? <CreateYacht /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/all-yachts"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk"].includes(role) ? <AllYachts /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/all-employees"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk"].includes(role) ? <AllEmployees /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-employee"
          element={
            <ProtectedRoute user={user}>
              {role === "admin" ? <CreateEmployee /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute user={user}>
              <Bookings user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/collections"
          element={
            <ProtectedRoute user={user}>
              {role === "admin" ? <Collections /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/availability"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk"].includes(role) ? <Availability /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/availability/:yachtName/:date"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk"].includes(role) ? <DayAvailability /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-customer"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk"].includes(role) ? <CreateCustomer /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-booking"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk"].includes(role) ? <CreateBooking /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/update-booking"
          element={
            <ProtectedRoute user={user}>
              {["admin", "backdesk", "onsite"].includes(role) ? <UpdateBooking /> : <NotFound />}
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<NotFound user={user} />} />
      </Routes>
    </>
  );
}

export default App;
