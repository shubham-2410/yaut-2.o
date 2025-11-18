import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteYacht,
  getAllYachtsDetailsAPI,
  updateYacht,
} from "../services/operations/yautAPI";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-hot-toast";

const AllYachts = () => {
  const [yachts, setYachts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYacht, setSelectedYacht] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();

  //  Convert ANY FORMAT to minutes for UI display
  const toMinutes = (value) => {
    if (!value) return 0;

    if (!isNaN(value)) return Number(value); // already minutes

    const str = value.toString().trim();

    if (str.includes(":")) {
      const [h, m] = str.split(":").map(Number);
      return h * 60 + (m || 0);
    }

    return Number(str);
  };

  //  Convert minutes to backend HH:MM format
  const minutesToHHMM = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // ------------------------------------------------------------------
  // 🧾 Fetch yachts
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // 🚮 Delete yacht handler
  // ------------------------------------------------------------------
  const handleDelete = async () => {
    if (!selectedYacht) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      await deleteYacht(selectedYacht._id, token);

      setYachts((prev) => prev.filter((y) => y._id !== selectedYacht._id));
      // alert("Yacht deleted successfully!");
      toast.success("Yacht deleted successfully!", {
        icon: "🛥️",
        duration: 3000, // 3 seconds
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    } catch (err) {
      console.error("❌ Error deleting yacht:", err);
      setError(err?.response?.data?.message || "Failed to delete yacht");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ------------------------------------------------------------------
  // ✏️ Handle edit save (duration goes to backend as HH:MM)
  // ------------------------------------------------------------------
  const handleEditSave = async () => {
    if (!selectedYacht) return;

    const { runningCost, sellingPrice, maxSellingPrice, name } = selectedYacht;

    //  Required field checks
    // if (!name || !runningCost || !sellingPrice || !maxSellingPrice) {
    //   alert("Please fill all required fields.");
    //   return;
    // }

    // //  Validation 1 — Selling Price > Running Cost
    // if (Number(sellingPrice) <= Number(runningCost)) {
    //   alert("Selling Price must be greater than Running Cost.");
    //   return;
    // }

    // //  Validation 2 — Max Selling Price > Selling Price
    // if (Number(maxSellingPrice) <= Number(sellingPrice)) {
    //   alert("Max Selling Price must be greater than Selling Price.");
    //   return;
    // }
    // Validation — required fields
    if (!name || !runningCost || !sellingPrice || !maxSellingPrice) {
      toast.error("Please fill all required fields.", {
        duration: 3000,
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    // Validation 1 — Selling Price > Running Cost
    if (Number(sellingPrice) <= Number(runningCost)) {
      toast.error("Selling Price must be greater than Running Cost.", {
        duration: 3000,
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    // Validation 2 — Max Selling Price > Selling Price
    if (Number(maxSellingPrice) <= Number(sellingPrice)) {
      toast.error("Max Selling Price must be greater than Selling Price.", {
        duration: 3000,
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }


    try {
      const token = localStorage.getItem("authToken");

      const durationMinutes = Number(selectedYacht.duration);
      const durationHHMM = minutesToHHMM(durationMinutes);

      const yachtToSave = {
        ...selectedYacht,
        duration: durationHHMM,
      };

      await updateYacht(selectedYacht._id, yachtToSave, token);

      setYachts((prev) =>
        prev.map((y) =>
          y._id === selectedYacht._id ? { ...y, ...yachtToSave } : y
        )
      );

      toast.success("Yacht details updated!", {
        duration: 3000, // duration in ms
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    } catch (err) {
      console.error("❌ Error updating yacht:", err);
      setError(err?.response?.data?.message || "Failed to update yacht");
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

  // ------------------------------------------------------------------
  //  MAIN RETURN UI
  // ------------------------------------------------------------------
  return (
    <div className="container my-4 px-2">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h2 className="fw-bold mb-2 mb-md-0">Available Yachts</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/create-yacht")}
        >
          + Create Yacht
        </button>
      </div>

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
                    >
                      {yacht.status?.charAt(0).toUpperCase() +
                        yacht.status?.slice(1).toLowerCase()}
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
                          setSelectedYacht({
                            ...yacht,
                            duration: toMinutes(yacht.duration), //  always minutes
                          });
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

      {(showViewModal || showEditModal || showDeleteModal) && (
        <div
          className="modal-backdrop fade show"
          onClick={closeAllModals}
        ></div>
      )}

      {/* ------------------------ VIEW MODAL ------------------------ */}
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
                  {/* DETAILS */}
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
                        {selectedYacht?.maxSellingPrice?.toLocaleString() ||
                          selectedYacht?.price?.toLocaleString()}
                      </li>
                      <li className="list-group-item">
                        <strong>Selling Price:</strong> ₹
                        {selectedYacht.sellingPrice?.toLocaleString()}
                      </li>
                      <li className="list-group-item">
                        <strong>Sail Start:</strong>{" "}
                        {selectedYacht.sailStartTime}
                      </li>
                      <li className="list-group-item">
                        <strong>Sail End:</strong> {selectedYacht.sailEndTime}
                      </li>
                      <li className="list-group-item">
                        <strong>Status:</strong> {selectedYacht.status}
                      </li>
                    </ul>
                  </div>

                  {/* IMAGES */}
                  <div className="col-12 col-lg-6 mt-3 mt-lg-0">
                    {selectedYacht.images?.length > 0 ? (
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
                                style={{
                                  maxHeight: "400px",
                                  objectFit: "cover",
                                }}
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

      {/* ------------------------ EDIT MODAL ------------------------ */}
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

                      {/*  Duration always in MINUTES */}
                      {field === "duration" ? (
                        <input
                          type="number"
                          className="form-control"
                          value={toMinutes(selectedYacht.duration)}
                          onChange={(e) =>
                            setSelectedYacht({
                              ...selectedYacht,
                              duration: Number(e.target.value),
                            })
                          }
                        />
                      ) : (
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
                      )}
                    </div>
                  ))}

                  {/* Status */}
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

      {/* ------------------------ DELETE MODAL ------------------------ */}
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
