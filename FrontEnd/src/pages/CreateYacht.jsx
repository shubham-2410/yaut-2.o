import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createYacht } from "../services/operations/yautAPI";
import { toast } from "react-hot-toast";

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
    duration: "120",
    customDuration: "",
    specialSlotTime: null,
    photos: [],
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [photoError, setPhotoError] = useState("");

  //  Price Validation
  useEffect(() => {
    const errors = {};
    const running = Number(yacht.runningCost);
    const maxSell = Number(yacht.maxSellingPrice);
    const sell = Number(yacht.sellingPrice);

    if (running && maxSell && maxSell <= running) {
      errors.maxSellingPrice =
        "Max selling price must be greater than running cost";
    }

    if (running && sell && sell < running) {
      errors.sellingPrice = "Selling price must be ≥ running cost";
    }

    if (maxSell && sell && sell > maxSell) {
      errors.sellingPrice = "Selling price must be ≤ max selling price";
    }

    setFieldErrors(errors);
  }, [yacht.runningCost, yacht.maxSellingPrice, yacht.sellingPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setYacht((prev) => ({ ...prev, [name]: value }));
  };

  //  Photo Upload Validation
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) {
      setYacht((prev) => ({ ...prev, photos: [] }));
      setPhotoError("");
      return;
    }

    for (const file of files) {
      if (file.size > 1 * 1024 * 1024) {   // 1 MB
        setPhotoError("Each photo must be less than 1 MB.");
        return;
      }
    }


    setPhotoError("");
    setYacht((prev) => ({ ...prev, photos: files }));
  };

  const convertMinutesToHHMM = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
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

  const validateDuration = () => {
    if (yacht.duration !== "custom") {
      return { value: convertMinutesToHHMM(Number(yacht.duration)) };
    }
    if (!yacht.customDuration) {
      return { error: "Please enter custom duration." };
    }
    if (isNaN(Number(yacht.customDuration))) {
      return { error: "Custom duration must be numeric." };
    }
    return { value: convertMinutesToHHMM(Number(yacht.customDuration)) };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(fieldErrors).length > 0) {
      setError("Fix all validation errors first.");
      return;
    }

    if (photoError) {
      setError("Please fix photo upload error first.");
      return;
    }

    const { value: durationHHMM, error: durationError } = validateDuration();
    if (durationError) {
      setError(durationError);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const payload = {
        ...yacht,
        capacity: Number(yacht.capacity),
        runningCost: Number(yacht.runningCost),
        maxSellingPrice: Number(yacht.maxSellingPrice),
        sellingPrice: Number(yacht.sellingPrice),
        duration: durationHHMM,
        specialSlotTime: convertTo24Hour(yacht.specialSlotTime),
      };

      await createYacht(payload, token);
      toast.success(" Yacht created successfully!", {
        duration: 3000, // disappears after 3 seconds
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      navigate("/all-yachts");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create yacht");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/*  Full-screen loader overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(3px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="spinner-border text-light"
            role="status"
            style={{ width: "4rem", height: "4rem" }}
          ></div>
        </div>
      )}

      <div className="container my-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Create Yacht</h4>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {error && <div className="text-danger mb-2">{error}</div>}

        <form className="row g-3" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Yacht Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control border border-dark"
              name="name"
              value={yacht.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Capacity */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Capacity <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="form-control border border-dark"
              name="capacity"
              value={yacht.capacity}
              onChange={handleChange}
              required
            />
          </div>

          {/* Running Cost */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Running Cost <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="runningCost"
              className={`form-control border border-dark ${fieldErrors.runningCost ? "is-invalid" : ""
                }`}
              value={yacht.runningCost}
              onChange={handleChange}
              required
            />
          </div>

          {/* Max Selling Price */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Max Selling Price <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="maxSellingPrice"
              className={`form-control border border-dark ${fieldErrors.maxSellingPrice ? "is-invalid" : ""
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
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Selling Price <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              name="sellingPrice"
              className={`form-control border border-dark ${fieldErrors.sellingPrice ? "is-invalid" : ""
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

          {/* Sail Start */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Sail Start Time <span className="text-danger">*</span>
            </label>
            <input
              type="time"
              name="sailStartTime"
              className="form-control border border-dark"
              value={yacht.sailStartTime}
              onChange={handleChange}
              required
            />
          </div>

          {/* Sail End */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Sail End Time <span className="text-danger">*</span>
            </label>
            <input
              type="time"
              name="sailEndTime"
              className="form-control border border-dark"
              value={yacht.sailEndTime}
              onChange={handleChange}
              required
            />
          </div>

          {/* Duration */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Slot Duration <span className="text-danger">*</span>
            </label>
            <select
              name="duration"
              className="form-select border border-dark"
              value={yacht.duration}
              onChange={(e) => {
                const val = e.target.value;
                setYacht((prev) => ({
                  ...prev,
                  duration: val,
                  customDuration: val === "custom" ? prev.customDuration : "",
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
                className="form-control mt-2 border border-dark"
                placeholder="Enter minutes"
                value={yacht.customDuration}
                onChange={handleChange}
              />
            )}
          </div>

          {/* Special Slot */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Special Slot Time</label>
            <select
              name="specialSlotTime"
              className="form-select border border-dark"
              value={yacht.specialSlotTime || "none"}
              onChange={handleChange}
            >
              <option value="none">None</option>
              <option value="4:00 PM">4:00 - 6:00 PM</option>
              <option value="5:30 PM">5:30 - 7:30 PM</option>
              <option value="6:00 PM">6:00 - 8:00 PM</option>
            </select>
          </div>

          {/* Status */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Status <span className="text-danger">*</span>
            </label>
            <select
              className="form-select border border-dark"
              name="status"
              value={yacht.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Photos */}
          <div className="col-md-6">
            <label className="form-label fw-bold">
              Upload Photos (optional)
            </label>

            <input
              type="file"
              className={`form-control border border-dark ${photoError ? "is-invalid" : ""
                }`}
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
            />

            {photoError && (
              <div className="text-danger small mt-1">{photoError}</div>
            )}

            <div className="form-text">Max size: 1 MB per image</div>
          </div>

          {/* Submit */}
          <div className="col-12">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Yacht"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateYacht;
