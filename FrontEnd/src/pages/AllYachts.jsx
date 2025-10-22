import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllYachtsAPI, getAllYachtsDetailsAPI } from "../services/operations/yautAPI";

const AllYachts = () => {
  const [yachts, setYachts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🧾 Fetch yachts from backend
  useEffect(() => {
    const fetchYachts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("Unauthorized. Please log in again.");
          setLoading(false);
          return;
        }

        const res = await getAllYachtsDetailsAPI(token);
        console.log("🛥️ API Response:", res);

        const yachtList = res?.data?.yachts || [];

        // Normalize data for frontend
        const yachtsWithIndex = yachtList.map((y) => ({
          ...y,
          images:
            y.yachtPhotos && y.yachtPhotos.length > 0
              ? y.yachtPhotos
              : y.photos && y.photos.length > 0
              ? y.photos
              : ["/default-yacht.jpg"], // fallback
          currentImageIndex: 0,
        }));

        setYachts(yachtsWithIndex);
      } catch (err) {
        console.error("❌ Error fetching yachts:", err);
        setError(err?.response?.data?.message || "Failed to fetch yachts");
      } finally {
        setLoading(false);
      }
    };

    fetchYachts();
  }, []);

  // 🔁 Image navigation
  const handleNextImage = (id) => {
    setYachts((prev) =>
      prev.map((y) =>
        y._id === id
          ? {
              ...y,
              currentImageIndex: (y.currentImageIndex + 1) % y.images.length,
            }
          : y
      )
    );
  };

  const handlePrevImage = (id) => {
    setYachts((prev) =>
      prev.map((y) =>
        y._id === id
          ? {
              ...y,
              currentImageIndex:
                (y.currentImageIndex - 1 + y.images.length) % y.images.length,
            }
          : y
      )
    );
  };

  // 🚦 Toggle status (temporary local toggle)
  const toggleStatus = (id) => {
    setYachts((prev) =>
      prev.map((y) =>
        y._id === id
          ? { ...y, status: y.status === "active" ? "inactive" : "active" }
          : y
      )
    );
  };

  // 🧭 Render
  if (loading)
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading yachts...</p>
      </div>
    );

  if (error)
    return (
      <div className="container text-center mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );

  return (
    <div className="container my-4 px-2">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h2 className="fw-bold mb-2 mb-md-0">Available Yachts</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/create-yacht")}
        >
          + Create Yacht
        </button>
      </div>

      {/* Yacht Cards */}
      <div className="row g-3">
        {Array.isArray(yachts) && yachts.length > 0 ? (
          yachts.map((yacht) => (
            <div key={yacht._id} className="col-12 col-sm-6 col-lg-4">
              <div className="card border border-dark shadow-sm h-100">
                <div className="position-relative">
                  <img
                    src={yacht.images[yacht.currentImageIndex]}
                    alt={yacht.name}
                    className="card-img-top"
                    style={{
                      height: "230px",
                      objectFit: "cover",
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius: "10px",
                    }}
                  />

                  {/* Show arrows only if multiple images */}
                  {yacht.images.length > 1 && (
                    <>
                      <button
                        className="btn btn-dark btn-sm position-absolute top-50 start-0 translate-middle-y"
                        style={{
                          opacity: 0.7,
                          padding: "6px 12px",
                          fontSize: "18px",
                        }}
                        onClick={() => handlePrevImage(yacht._id)}
                      >
                        ‹
                      </button>
                      <button
                        className="btn btn-dark btn-sm position-absolute top-50 end-0 translate-middle-y"
                        style={{
                          opacity: 0.7,
                          padding: "6px 12px",
                          fontSize: "18px",
                        }}
                        onClick={() => handleNextImage(yacht._id)}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold">{yacht.name}</h5>
                  <ul className="list-unstyled mb-3">
                    <li>
                      <strong>Capacity:</strong> {yacht.capacity}
                    </li>
                    <li>
                      <strong>Running Cost:</strong> ₹
                      {yacht.runningCost?.toLocaleString()}
                    </li>
                    <li>
                      <strong>Price:</strong> ₹
                      {yacht.price?.toLocaleString()}
                    </li>
                    <li>
                      <strong>Selling Price:</strong> ₹
                      {yacht.sellingPrice?.toLocaleString()}
                    </li>
                    <li>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`badge ${
                          yacht.status === "active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {yacht.status}
                      </span>
                    </li>
                  </ul>

                  <button
                    className={`btn btn-sm mt-auto ${
                      yacht.status === "active"
                        ? "btn-outline-secondary"
                        : "btn-outline-success"
                    }`}
                    onClick={() => toggleStatus(yacht._id)}
                  >
                    {yacht.status === "active" ? "Set Inactive" : "Set Active"}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted mt-5">No yachts found.</div>
        )}
      </div>
    </div>
  );
};

export default AllYachts;
