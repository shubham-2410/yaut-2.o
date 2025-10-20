import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBookingAPI } from "../services/operations/bookingAPI";
import { getCustomerByEmailAPI } from "../services/operations/customerAPI";

function CreateBooking() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    boat: "",
    totalAmount: "",
    date: "",
    duration: "",
    startTime: "",
    numPeople: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");

      // Step 1: Get Customer ID by email
      const { data: customer } = await getCustomerByEmailAPI(formData.email, token);
      if (!customer?._id) {
        setError("Customer not found. Please check the email.");
        setLoading(false);
        return;
      }

      // Step 2: Prepare payload with correct field names
      const payload = {
        customerId: customer._id,
        employeeId: "replace_with_actual_employee_id", // TODO: get from token or UI
        yautId: parseInt(formData.boat, 10),
        date: formData.date,
        duration: formData.duration,
        startTime: formData.startTime,
        quotedAmount: parseFloat(formData.totalAmount),
        numPeople: parseInt(formData.numPeople, 10),
      };

      // Step 3: Call booking API
      const res = await createBookingAPI(payload, token);
      console.log("✅ Booking created:", res.data);

      alert("✅ Booking created successfully!");
      navigate("/bookings");
    } catch (err) {
      console.error("❌ Error creating booking:", err);
      setError(
        err.response?.data?.error || err.response?.data?.message || "Failed to create booking"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4 px-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Create Booking</h4>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="row g-3" onSubmit={handleSubmit}>
        {/* Customer Email */}
        <div className="col-12">
          <label className="form-label fw-bold">Customer Email</label>
          <input
            className="form-control border border-dark text-dark"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter registered customer email"
            required
          />
        </div>

        {/* Boat / Yaut ID */}
        <div className="col-12">
          <label className="form-label fw-bold">Boat (Yaut ID)</label>
          <input
            type="number"
            className="form-control border border-dark text-dark"
            name="boat"
            value={formData.boat}
            onChange={handleChange}
            placeholder="Enter Yaut ID"
            required
          />
        </div>

        {/* Total Amount */}
        <div className="col-12 col-md-4">
          <label className="form-label fw-bold">Total Amount</label>
          <input
            type="number"
            className="form-control border border-dark text-dark"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            placeholder="Enter amount"
            required
          />
        </div>

        {/* Date */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Date of Ride</label>
          <input
            type="date"
            className="form-control border border-dark text-dark"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {/* Duration */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Duration (hours)</label>
          <input
            type="time"
            className="form-control border border-dark text-dark"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Enter duration"
            required
          />
        </div>

        {/* Start Time */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Start Time</label>
          <input
            type="time"
            className="form-control border border-dark text-dark"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        {/* Number of People */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Number of People</label>
          <input
            type="number"
            className="form-control border border-dark text-dark"
            name="numPeople"
            value={formData.numPeople}
            onChange={handleChange}
            placeholder="Enter number of people"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateBooking;
