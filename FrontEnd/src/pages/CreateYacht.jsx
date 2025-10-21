// src/pages/CreateYacht.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // make sure axios is installed

function CreateYacht() {
  const navigate = useNavigate();
  const [yacht, setYacht] = useState({
    name: "",
    capacity: "",
    runningCost: "",
    price: "",
    sellingPrice: "",
    photos: [],
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setYacht((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const photoURLs = files.map((file) => URL.createObjectURL(file));
    setYacht((prev) => ({ ...prev, photos: photoURLs }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Replace with your backend endpoint
      const formData = new FormData();
      formData.append("name", yacht.name);
      formData.append("capacity", yacht.capacity);
      formData.append("runningCost", yacht.runningCost);
      formData.append("price", yacht.price);
      formData.append("sellingPrice", yacht.sellingPrice);
      formData.append("status", yacht.status);

      // Append photos
      yacht.photos.forEach((photo, index) => {
        formData.append("photos", photo);
      });

      await axios.post("/api/yachts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Yacht created successfully!");
      navigate("/admin"); // redirect to admin dashboard or yacht list
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create yacht");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4 px-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Create Yacht</h4>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="row g-3" onSubmit={handleSubmit}>
        {/* Yacht Name */}
        <div className="col-12">
          <label className="form-label fw-bold">Yacht Name</label>
          <input
            type="text"
            name="name"
            className="form-control border border-dark text-dark"
            value={yacht.name}
            onChange={handleChange}
            placeholder="Enter yacht name"
            required
          />
        </div>

        {/* Capacity */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Capacity</label>
          <input
            type="number"
            name="capacity"
            className="form-control border border-dark text-dark"
            value={yacht.capacity}
            onChange={handleChange}
            placeholder="Enter max pax"
            required
          />
        </div>

        {/* Running Cost */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Running Cost</label>
          <input
            type="number"
            name="runningCost"
            className="form-control border border-dark text-dark"
            value={yacht.runningCost}
            onChange={handleChange}
            placeholder="Enter running cost"
            required
          />
        </div>

        {/* Price */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Price</label>
          <input
            type="number"
            name="price"
            className="form-control border border-dark text-dark"
            value={yacht.price}
            onChange={handleChange}
            placeholder="Enter price"
            required
          />
        </div>

        {/* Selling Price */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Selling Price</label>
          <input
            type="number"
            name="sellingPrice"
            className="form-control border border-dark text-dark"
            value={yacht.sellingPrice}
            onChange={handleChange}
            placeholder="Enter selling price"
            required
          />
        </div>

        {/* Status */}
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">Status</label>
          <select
            name="status"
            className="form-select border border-dark text-dark"
            value={yacht.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Photo Upload */}
        <div className="col-12">
          <label className="form-label fw-bold">Upload Photos</label>
          <input
            type="file"
            className="form-control"
            multiple
            onChange={handlePhotoUpload}
          />
          <div className="d-flex flex-wrap mt-2">
            {yacht.photos.map((url, index) => (
              <div key={index} className="me-2 mb-2 text-center">
                <img src={url} alt={`yacht-${index}`} width="100" className="mb-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Creating..." : "Create Yacht"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateYacht;
