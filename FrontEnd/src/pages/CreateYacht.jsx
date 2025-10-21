import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createYacht } from "../services/operations/yautAPI";

function CreateYacht() {
  const navigate = useNavigate();
  const [yacht, setYacht] = useState({
    name: "",
    capacity: "",
    runningCost: "",
    price: "",
    maxSellingPrice: "",
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
    setYacht((prev) => ({ ...prev, photos: files })); // keep File objects
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");

      // Ensure numeric values are numbers
      const payload = {
        ...yacht,
        capacity: Number(yacht.capacity),
        runningCost: Number(yacht.runningCost),
        price: Number(yacht.price),
        maxSellingPrice: Number(yacht.maxSellingPrice),
        sellingPrice: Number(yacht.sellingPrice),
      };

      await createYacht(payload, token);

      alert("✅ Yacht created successfully!");
      navigate("/admin"); // redirect to admin dashboard
    } catch (err) {
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
        <div className="col-12">
          <label className="form-label fw-bold">Yacht Name</label>
          <input
            type="text"
            name="name"
            className="form-control border border-dark text-dark"
            value={yacht.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-bold">Capacity</label>
          <input
            type="number"
            name="capacity"
            className="form-control border border-dark text-dark"
            value={yacht.capacity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-bold">Running Cost</label>
          <input
            type="number"
            name="runningCost"
            className="form-control border border-dark text-dark"
            value={yacht.runningCost}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-bold">Price</label>
          <input
            type="number"
            name="price"
            className="form-control border border-dark text-dark"
            value={yacht.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-bold">Max Selling Price</label>
          <input
            type="number"
            name="maxSellingPrice"
            className="form-control border border-dark text-dark"
            value={yacht.maxSellingPrice}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-bold">Selling Price</label>
          <input
            type="number"
            name="sellingPrice"
            className="form-control border border-dark text-dark"
            value={yacht.sellingPrice}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
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

        <div className="col-12">
          <label className="form-label fw-bold">Upload Photos</label>
          <input type="file" multiple className="form-control" onChange={handlePhotoUpload} />
        </div>

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
