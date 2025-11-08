import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteYacht, getAllYachtsDetailsAPI, updateYacht } from "../services/operations/yautAPI";
import "bootstrap/dist/css/bootstrap.min.css";

const AllYachts = () => {
  const [yachts, setYachts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYacht, setSelectedYacht] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();

  // 🧾 Fetch yachts
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
        const yachtList = res?.data?.yachts || [];

        const yachtsWithImages = yachtList.map((y) => ({
          ...y,
          images:
            y.yachtPhotos && y.yachtPhotos.length > 0
              ? y.yachtPhotos
              : y.photos && y.photos.length > 0
                ? y.photos
                : ["/default-yacht.jpg"],
        }));

        console.log("Here are yauts - ", yachtsWithImages)
        setYachts(yachtsWithImages);
      } catch (err) {
        console.error("❌ Error fetching yachts:", err);
        setError(err?.response?.data?.message || "Failed to fetch yachts");
      } finally {
        setLoading(false);
      }
    };

    fetchYachts();
  }, []);

  // 🚦 Toggle status directly in table
  // const toggleStatus = (id) => {
  //   setYachts((prev) =>
  //     prev.map((y) =>
  //       y._id === id
  //         ? { ...y, status: y.status === "active" ? "inactive" : "active" }
  //         : y
  //     )
  //   );
  // };

  // 🚮 Delete yacht handler
  const handleDelete = async () => {
    if (!selectedYacht) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await deleteYacht(selectedYacht._id, token);
      setYachts((prev) => prev.filter((y) => y._id !== selectedYacht._id));
      alert("Yacht deleted successfully!");
    } catch (err) {
      console.error("❌ Error deleting yacht:", err);
      setError(err?.response?.data?.message || "Failed to delete yacht");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ✏️ Handle edit form save
  const handleEditSave = async () => {
    if (!selectedYacht) return;

    if (!selectedYacht.name || !selectedYacht.runningCost) {
      alert("Please fill in required fields (Name, Running Cost)");
      return;
    }
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await updateYacht(selectedYacht._id, selectedYacht, token)
      setYachts((prev) =>
        prev.map((y) => (y._id === selectedYacht._id ? selectedYacht : y))
      );
      alert("Yacht details updated!");
    } catch (err) {
      console.error("❌ Error Updating yachts:", err);
      setError(err?.response?.data?.message || "Failed to Update yacht");
    } finally {
      setLoading(false);
      setShowEditModal(false);
    }
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
  };

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

      {/* Yacht Table */}
      {Array.isArray(yachts) && yachts.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle text-center">
            <thead className="table-dark">
              <tr>
                <th className="d-none d-sm-table-cell">#</th>
                <th>Yacht Name</th>
                <th className="d-none d-md-table-cell">Capacity</th>
                <th className="d-none d-lg-table-cell">Running Cost (₹)</th>
                <th className="d-none d-sm-table-cell">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {yachts.map((yacht, index) => (
                <tr key={yacht._id}>
                  <td className="d-none d-sm-table-cell">{index + 1}</td>
                  <td className="fw-semibold">{yacht.name}</td>
                  <td className="d-none d-md-table-cell">{yacht.capacity}</td>
                  <td className="d-none d-lg-table-cell">
                    {yacht.runningCost?.toLocaleString() || "-"}
                  </td>
                  <td className="d-none d-sm-table-cell">
                    <span
                      className={`badge ${yacht.status === "active"
                          ? "bg-success"
                          : "bg-secondary"
                        }`}
                      style={{ cursor: "pointer" }}
                    // onClick={() => toggleStatus(yacht._id)}
                    >
                      {yacht.status?.charAt(0).toUpperCase() + yacht.status?.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => {
                          setSelectedYacht(yacht);
                          setShowViewModal(true);
                        }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => {
                          setSelectedYacht({ ...yacht });
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          setSelectedYacht(yacht);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-muted mt-5">No yachts found.</div>
      )}

      {/* === BACKDROP === */}
      {(showViewModal || showEditModal || showDeleteModal) && (
        <div
          className="modal-backdrop fade show"
          onClick={closeAllModals}
        ></div>
      )}

      {/* 🧭 View Modal */}
      {showViewModal && selectedYacht && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{selectedYacht.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAllModals}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Yacht Details */}
                  <div className="col-12 col-lg-6">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item">
                        <strong>Capacity:</strong> {selectedYacht.capacity}
                      </li>
                      <li className="list-group-item">
                        <strong>Duration:</strong> {selectedYacht.duration}
                      </li>
                      <li className="list-group-item">
                        <strong>Running Cost:</strong> ₹
                        {selectedYacht.runningCost?.toLocaleString()}
                      </li>
                      <li className="list-group-item">
                        <strong>MaxSelling Price:</strong> ₹
                        {selectedYacht?.maxSellingPrice?.toLocaleString() || selectedYacht?.price?.toLocaleString()}
                      </li>
                      <li className="list-group-item">
                        <strong>Selling Price:</strong> ₹
                        {selectedYacht.sellingPrice?.toLocaleString()}
                      </li>
                      <li className="list-group-item">
                        <strong>Sail Start:</strong> {selectedYacht.sailStartTime}
                      </li>
                      <li className="list-group-item">
                        <strong>Sail End:</strong> {selectedYacht.sailEndTime}
                      </li>
                      <li className="list-group-item">
                        <strong>Status:</strong> {selectedYacht.status}
                      </li>
                    </ul>
                  </div>

                  {/* Image Carousel */}
                  <div className="col-12 col-lg-6 mt-3 mt-lg-0">
                    {selectedYacht.images && selectedYacht.images.length > 0 ? (
                      <div
                        id="yachtCarousel"
                        className="carousel slide"
                        data-bs-ride="carousel"
                      >
                        <div className="carousel-inner rounded shadow-sm">
                          {selectedYacht.images.map((img, idx) => (
                            <div
                              key={idx}
                              className={`carousel-item ${idx === 0 ? "active" : ""
                                }`}
                            >
                              <img
                                src={img}
                                className="d-block w-100 rounded"
                                alt={`Yacht ${idx}`}
                                style={{ maxHeight: "400px", objectFit: "cover" }}
                              />
                            </div>
                          ))}
                        </div>
                        {selectedYacht.images.length > 1 && (
                          <>
                            <button
                              className="carousel-control-prev"
                              type="button"
                              data-bs-target="#yachtCarousel"
                              data-bs-slide="prev"
                            >
                              <span
                                className="carousel-control-prev-icon"
                                aria-hidden="true"
                              ></span>
                            </button>
                            <button
                              className="carousel-control-next"
                              type="button"
                              data-bs-target="#yachtCarousel"
                              data-bs-slide="next"
                            >
                              <span
                                className="carousel-control-next-icon"
                                aria-hidden="true"
                              ></span>
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted">No images available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Edit Modal */}
      {showEditModal && selectedYacht && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title">Edit Yacht Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAllModals}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {[
                    "name",
                    "capacity",
                    "duration",
                    "runningCost",
                    "maxSellingPrice",
                    "sellingPrice",
                    "sailStartTime",
                    "sailEndTime",
                  ].map((field) => (
                    <div className="col-12 col-md-6" key={field}>
                      <label className="form-label text-capitalize">
                        {field.replace(/([A-Z])/g, " $1")}
                      </label>
                      <input
                        type={
                          field === "name"
                            ? "text"
                            : field.toLowerCase().includes("time")
                              ? "time"
                              : "number"
                        }
                        className="form-control"
                        value={selectedYacht[field] || ""}
                        onChange={(e) =>
                          setSelectedYacht({
                            ...selectedYacht,
                            [field]:
                              field === "capacity"
                                ? Number(e.target.value)
                                : e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}

                  {/* Yacht Status Dropdown */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={selectedYacht.status || "active"}
                      onChange={(e) =>
                        setSelectedYacht({
                          ...selectedYacht,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditSave}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ❌ Delete Modal */}
      {showDeleteModal && selectedYacht && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeAllModals}
                ></button>
              </div>
              <div className="modal-body text-center">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selectedYacht.name}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeAllModals}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllYachts;
