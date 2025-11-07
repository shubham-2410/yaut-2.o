import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createYacht } from "../services/operations/yautAPI";

function CreateYacht() {
  const navigate = useNavigate();
  const [yacht, setYacht] = useState({
    name: "",
    capacity: "",
    runningCost: "",
    maxSellingPrice: "",
    sellingPrice: "",
    sailStartTime: "",
    sailEndTime: "",
    duration: "",
    specialSlotTime: null,
    photos: [],
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // 🔍 Real-time validation
  useEffect(() => {
    const errors = {};
    const running = Number(yacht.runningCost);
    const maxSell = Number(yacht.maxSellingPrice);
    const sell = Number(yacht.sellingPrice);

    if (yacht.runningCost && yacht.maxSellingPrice && maxSell <= running) {
      errors.maxSellingPrice =
        "Max selling price must be greater than running cost";
    }

    if (yacht.runningCost && yacht.sellingPrice && sell < running) {
      errors.sellingPrice = "Selling price must be ≥ running cost";
    }

    if (yacht.maxSellingPrice && yacht.sellingPrice && sell > maxSell) {
      errors.sellingPrice = "Selling price must be ≤ max selling price";
    }

    setFieldErrors(errors);
  }, [yacht.runningCost, yacht.maxSellingPrice, yacht.sellingPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setYacht((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setYacht((prev) => ({ ...prev, photos: files }));
  };

  const convertTo24Hour = (timeStr) => {
    if (!timeStr || timeStr === "none") return null;
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Im in");
    if (Object.keys(fieldErrors).length > 0) {
      setError("Please fix validation errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        ...yacht,
        capacity: Number(yacht.capacity),
        runningCost: Number(yacht.runningCost),
        maxSellingPrice: Number(yacht.maxSellingPrice),
        sellingPrice: Number(yacht.sellingPrice),
        sailStartTime: yacht.sailStartTime,
        sailEndTime: yacht.sailEndTime,
        duration:
          yacht.duration === "custom"
            ? Number(yacht.customDuration) / 60
            : Number(yacht.duration) / 60,
        specialSlotTime: convertTo24Hour(yacht.specialSlotTime),
      };
      console.log("payload", payload);

      await createYacht(payload, token);
      alert("✅ Yacht created successfully!");
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create yacht");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      <div
        className="shadow-lg rounded-4 p-3"
        style={{
          width: "90%",
          maxWidth: "820px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="fw-bold text-primary m-0">Create Yacht</h4>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>

        {error && <div className="alert alert-danger py-1">{error}</div>}

        <form className="row gx-2 gy-2" onSubmit={handleSubmit}>
          {/* Yacht Name */}
          <div className="col-12">
            <label className="form-label fw-semibold mb-0">Yacht Name</label>
            <input
              type="text"
              name="name"
              className="form-control form-control-sm"
              value={yacht.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Capacity */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Capacity</label>
            <input
              type="number"
              name="capacity"
              className="form-control form-control-sm"
              value={yacht.capacity}
              onChange={handleChange}
              required
            />
          </div>

          {/* Running Cost */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Running Cost</label>
            <input
              type="number"
              name="runningCost"
              className={`form-control form-control-sm ${
                fieldErrors.runningCost ? "is-invalid" : ""
              }`}
              value={yacht.runningCost}
              onChange={handleChange}
              required
            />
          </div>

          {/* Max Selling Price */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">
              Max Selling Price
            </label>
            <input
              type="number"
              name="maxSellingPrice"
              className={`form-control form-control-sm ${
                fieldErrors.maxSellingPrice ? "is-invalid" : ""
              }`}
              value={yacht.maxSellingPrice}
              onChange={handleChange}
              required
            />
            {fieldErrors.maxSellingPrice && (
              <div className="text-danger small">
                {fieldErrors.maxSellingPrice}
              </div>
            )}
          </div>

          {/* Selling Price */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Selling Price</label>
            <input
              type="number"
              name="sellingPrice"
              className={`form-control form-control-sm ${
                fieldErrors.sellingPrice ? "is-invalid" : ""
              }`}
              value={yacht.sellingPrice}
              onChange={handleChange}
              required
            />
            {fieldErrors.sellingPrice && (
              <div className="text-danger small">
                {fieldErrors.sellingPrice}
              </div>
            )}
          </div>

          {/* Sail Start and End */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">
              Sail Start Time
            </label>
            <input
              type="time"
              name="sailStartTime"
              className="form-control form-control-sm"
              value={yacht.sailStartTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Sail End Time</label>
            <input
              type="time"
              name="sailEndTime"
              className="form-control form-control-sm"
              value={yacht.sailEndTime}
              onChange={handleChange}
              required
            />
          </div>

          {/* Duration */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Slot Duration</label>
            <select
              name="duration"
              className="form-select form-select-sm"
              value={yacht.duration || "120"}
              onChange={(e) => {
                const value = e.target.value;
                setYacht((prev) => ({
                  ...prev,
                  duration: value,
                  customDuration:
                    value === "custom" ? prev.customDuration || "" : null,
                }));
              }}
            >
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="120">120 min</option>
              <option value="custom">Custom</option>
            </select>

            {yacht.duration === "custom" && (
              <input
                type="number"
                name="customDuration"
                placeholder="Enter minutes"
                className="form-control form-control-sm mt-1"
                value={yacht.customDuration || ""}
                onChange={(e) =>
                  setYacht((prev) => ({
                    ...prev,
                    customDuration: e.target.value,
                  }))
                }
              />
            )}
          </div>

          {/* Special Slot */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Special Slot</label>
            <select
              name="specialSlotTime"
              className="form-select form-select-sm"
              value={yacht.specialSlotTime || "none"}
              onChange={(e) =>
                setYacht((prev) => ({
                  ...prev,
                  specialSlotTime: e.target.value,
                }))
              }
            >
              <option value="none">None</option>
              <option value="4:00 PM">4:00 - 6:00 PM</option>
              <option value="5:30 PM">5:30 - 7:30 PM</option>
              <option value="6:00 PM">6:00 - 8:00 PM</option>
            </select>
          </div>

          {/* Status */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Status</label>
            <select
              name="status"
              className="form-select form-select-sm"
              value={yacht.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Photos */}
          <div className="col-6">
            <label className="form-label fw-semibold mb-0">Upload Photos</label>
            <input
              type="file"
              multiple
              className="form-control form-control-sm"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Submit */}
          <div className="col-12 mt-2">
            <button
              type="submit"
              className="btn btn-primary w-100 fw-bold"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Yacht"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateYacht;
