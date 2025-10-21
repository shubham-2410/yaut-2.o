import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBookingAPI } from "../services/operations/bookingAPI";
import { getCustomerByEmailAPI } from "../services/operations/customerAPI";
import { getAllYachtsAPI } from "../services/operations/yautAPI";

function CreateBooking() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    yachtId: "",
    totalAmount: "",
    date: "",
    startTime: "",
    endTime: "",
    numPeople: "",
  });

  const [yachts, setYachts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch all yachts on mount
  useEffect(() => {
    const fetchYachts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await getAllYachtsAPI(token);
        console.log("🛥️ Yachts API response:", res);

        // Handle both formats: {data: [...]} or {data: {data: [...]}}
        const yachtList = Array.isArray(res?.data?.yachts)
          ? res.data.yachts
          : []

        console.log("✅ Parsed Yachts List:", yachtList);
        setYachts(yachtList);
      } catch (err) {
        console.error("❌ Failed to fetch yachts:", err);
        setYachts([]);
      }
    };

    fetchYachts();
  }, []);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");

      // Step 1: Get customer ID by email
      const { data: customer } = await getCustomerByEmailAPI(
        formData.email,
        token
      );

      if (!customer?._id) {
        setError("Customer not found. Please check the email.");
        setLoading(false);
        return;
      }

      // Step 2: Prepare booking payload
      const payload = {
        customerId: customer._id,
        employeeId: "replace_with_actual_employee_id", // Replace dynamically later
        yachtId: formData.yachtId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        quotedAmount: parseFloat(formData.totalAmount),
        numPeople: parseInt(formData.numPeople, 10),
      };

      console.log("📦 Booking Payload:", payload);

      // Step 3: Create booking
      const res = await createBookingAPI(payload, token);
      console.log("✅ Booking created:", res.data);

      alert("✅ Booking created successfully!");
      navigate("/bookings");
    } catch (err) {
      console.error("❌ Error creating booking:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create booking"
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

        {/* Yacht Dropdown */}
        <div className="col-12">
          <label className="form-label fw-bold">Select Yacht</label>
          <select
            className="form-select border border-dark text-dark"
            name="yachtId"
            value={formData.yachtId}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Yacht --</option>
            {Array.isArray(yachts) && yachts.length > 0 ? (
              yachts.map((yacht) => (
                <option key={yacht.id} value={yacht.id}>
                  {yacht.name}
                </option>
              ))
            ) : (
              <option disabled>No yachts available</option>
            )}
          </select>
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
        <div className="col-12 col-md-4">
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

        {/* Start Time */}
        <div className="col-12 col-md-4">
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

        {/* End Time */}
        <div className="col-12 col-md-4">
          <label className="form-label fw-bold">End Time</label>
          <input
            type="time"
            className="form-control border border-dark text-dark"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>

        {/* Number of People */}
        <div className="col-12 col-md-4">
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

        {/* Submit */}
        <div className="col-12 text-center">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateBooking;
