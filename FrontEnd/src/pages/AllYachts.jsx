import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AllYachts = () => {
  const [yachts, setYachts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const sampleYachts = [
      {
        _id: 1,
        name: "Ocean Bliss",
        capacity: 12,
        runningCost: 15000,
        price: 250000,
        maxSellingPrice: 350000,
        sellingPrice: 320000,
        status: "active",
        images: [
          "https://images.pexels.com/photos/2951863/pexels-photo-2951863.jpeg",
        ],
      },
      {
        _id: 2,
        name: "Sea Breeze",
        capacity: 10,
        runningCost: 12000,
        price: 180000,
        maxSellingPrice: 260000,
        sellingPrice: 240000,
        status: "inactive",
        images: [
          "https://images.pexels.com/photos/3780701/pexels-photo-3780701.jpeg",
          "https://images.pexels.com/photos/2174656/pexels-photo-2174656.jpeg",
        ],
      },
      {
        _id: 3,
        name: "Golden Wave",
        capacity: 8,
        runningCost: 10000,
        price: 150000,
        maxSellingPrice: 210000,
        sellingPrice: 200000,
        status: "active",
        images: [
          "https://images.pexels.com/photos/210014/pexels-photo-210014.jpeg",
          "https://images.pexels.com/photos/799091/pexels-photo-799091.jpeg",
        ],
      },
    ];

    const yachtsWithIndex = sampleYachts.map((y) => ({
      ...y,
      currentImageIndex: 0,
    }));

    setYachts(yachtsWithIndex);
  }, []);

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

  const toggleStatus = (id) => {
    setYachts((prev) =>
      prev.map((y) =>
        y._id === id
          ? { ...y, status: y.status === "active" ? "inactive" : "active" }
          : y
      )
    );
  };

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
        {yachts.map((yacht) => (
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
                      style={{ opacity: 0.7, padding: "6px 12px", fontSize: "18px" }}
                      onClick={() => handlePrevImage(yacht._id)}
                    >
                      ‹
                    </button>
                    <button
                      className="btn btn-dark btn-sm position-absolute top-50 end-0 translate-middle-y"
                      style={{ opacity: 0.7, padding: "6px 12px", fontSize: "18px" }}
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
                    <strong>Running Cost:</strong> ₹{yacht.runningCost.toLocaleString()}
                  </li>
                  <li>
                    <strong>Price:</strong> ₹{yacht.price.toLocaleString()}
                  </li>
                  <li>
                    <strong>Max Selling Price:</strong> ₹{yacht.maxSellingPrice.toLocaleString()}
                  </li>
                  <li>
                    <strong>Selling Price:</strong> ₹{yacht.sellingPrice.toLocaleString()}
                  </li>
                  <li>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`badge ${
                        yacht.status === "active" ? "bg-success" : "bg-secondary"
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
        ))}
      </div>
    </div>
  );
};

export default AllYachts;
