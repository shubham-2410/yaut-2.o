import React, { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAvailabilitySummary } from "../services/operations/availabilityAPI";
import { getAllYachtsDetailsAPI } from "../services/operations/yautAPI";
import { useNavigate, useLocation } from "react-router-dom";

function Availability() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [availability, setAvailability] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedYacht, setSelectedYacht] = useState(null);
  const [detailedYacht, setDetailedYacht] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [filterDate, setFilterDate] = useState(
    params.get("date") || new Date().toISOString().split("T")[0]
  );
  const [filterCapacity, setFilterCapacity] = useState(params.get("capacity") || "");
  const [filterBudget, setFilterBudget] = useState(params.get("budget") || "");
  const [filterStatus, setFilterStatus] = useState(params.get("status") || "Active");

  // Sync filters into URL
  useEffect(() => {
    const p = new URLSearchParams();
    p.set("date", filterDate);
    p.set("capacity", filterCapacity);
    p.set("budget", filterBudget);
    p.set("status", filterStatus);

    navigate({ search: p.toString() }, { replace: true });
  }, [filterDate, filterCapacity, filterBudget, filterStatus, navigate]);

  // Fetch availability summary
  const fetchAvailability = useCallback(
    async (customDate) => {
      if (!token) return;
      try {
        setLoading(true);

        const start = customDate ? new Date(customDate) : new Date();
        const end = new Date(start);
        end.setDate(start.getDate() + 5);

        const startDate = start.toISOString().split("T")[0];
        const endDate = end.toISOString().split("T")[0];

        const weekLabel = `${start.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${end.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;

        setSelectedWeek(weekLabel);

        const res = await getAvailabilitySummary(startDate, endDate, token);

        if (res?.success && res?.yachts) {
          const formatted = res.yachts.map((y) => ({
            yachtId: y.yachtId || y._id,
            name: y.name || y.yachtName,
            company: y.company,
            capacity: y.capacity,
            status: y.status,
            sellingPrice: y.sellingPrice || y.maxSellingPrice || 0,
            yachtPhotos:
              y.yachtPhotos?.length > 0
                ? y.yachtPhotos
                : y.photos?.length > 0
                ? y.photos
                : ["/default-yacht.jpg"],
            days: (y.availability || []).map((a) => ({
              day: new Date(a.date).toLocaleDateString("en-US", { weekday: "short" }),
              date: new Date(a.date).toISOString().split("T")[0],
              status:
                a.status === "busy"
                  ? "Busy"
                  : a.status === "locked"
                  ? "Locked"
                  : "Free",
              bookedSlots: a.bookingsCount ? Array(a.bookingsCount).fill({}) : [],
            })),
          }));

          setAvailability(formatted);
        } else {
          setAvailability([]);
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err);
        setAvailability([]);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token && filterDate) fetchAvailability(filterDate);
  }, [token, filterDate, fetchAvailability]);

  const handleClear = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilterDate(today);
    setFilterCapacity("");
    setFilterBudget("");
    setFilterStatus("Active");
  };

  const handleDayClick = (yacht, day) => {
    const today = new Date();
    const clickedDate = new Date(day.date);

    today.setHours(0, 0, 0, 0);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      alert("You cannot book for past dates.");
      return;
    }

    navigate(`/availability/${encodeURIComponent(yacht.name)}/${day.date}`, {
      state: { yachtId: yacht.yachtId, yachtName: yacht.name, day },
    });
  };

  const handleYachtClick = async (yacht) => {
    setSelectedYacht(yacht);
    setLoadingDetails(true);

    try {
      const res = await getAllYachtsDetailsAPI(token);
      const allYachts = res?.data?.yachts || [];
      const details = allYachts.find((y) => y._id === yacht.yachtId);

      setDetailedYacht({
        ...(details || yacht),
        yachtPhotos:
          details?.yachtPhotos?.length > 0
            ? details.yachtPhotos
            : yacht.yachtPhotos || ["/default-yacht.jpg"],
        currentImageIndex: 0,
      });
    } catch {
      setDetailedYacht({
        ...yacht,
        yachtPhotos: yacht.yachtPhotos || ["/default-yacht.jpg"],
        currentImageIndex: 0,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedYacht(null);
    setDetailedYacht(null);
  };

  // Relevance sorting with dropdown ranges
  const rankedAvailability = availability
    .map((yacht) => {
      let score = 0;

      // Status match
      if (filterStatus && filterStatus !== "all") {
        if (yacht.status?.toLowerCase() === filterStatus.toLowerCase()) {
          score += 3;
        }
      }

      // Capacity relevance
      if (filterCapacity) {
        const [min, max] =
          filterCapacity === "small"
            ? [1, 5]
            : filterCapacity === "medium"
            ? [6, 10]
            : filterCapacity === "large"
            ? [11, 20]
            : filterCapacity === "xlarge"
            ? [21, Infinity]
            : [0, Infinity];

        if (yacht.capacity >= min && yacht.capacity <= max) score += 4;
        else score += 2 - Math.min(Math.abs(yacht.capacity - min), Math.abs(yacht.capacity - max)) / 5;
      }

      // Budget relevance
      if (filterBudget) {
        const [min, max] =
          filterBudget === "low"
            ? [0, 4999]
            : filterBudget === "mid"
            ? [5000, 10000]
            : filterBudget === "high"
            ? [10001, 20000]
            : filterBudget === "premium"
            ? [20001, Infinity]
            : [0, Infinity];

        if (yacht.sellingPrice >= min && yacht.sellingPrice <= max) score += 4;
        else score +=
          2 - Math.min(Math.abs(yacht.sellingPrice - min), Math.abs(yacht.sellingPrice - max)) / 5000;
      }

      // Date match
      if (filterDate) {
        if (yacht.days?.some((d) => d.date === filterDate)) {
          score += 5;
        }
      }

      return { ...yacht, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-3">Yacht Availability</h3>

      <div className="text-center mb-3">
        <h6 className="mb-0 fw-semibold">{selectedWeek}</h6>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
        <div className="d-flex flex-wrap gap-3">
          {/* Capacity dropdown */}
          <div>
            <label className="form-label mb-1">Capacity</label>
            <select
              className="form-select"
              value={filterCapacity}
              onChange={(e) => setFilterCapacity(e.target.value)}
              style={{ maxWidth: "150px" }}
            >
              <option value="">All</option>
              <option value="small">1–5</option>
              <option value="medium">6–10</option>
              <option value="large">11–20</option>
              <option value="xlarge">21+</option>
            </select>
          </div>

          {/* Budget dropdown */}
          <div>
            <label className="form-label mb-1">Budget</label>
            <select
              className="form-select"
              value={filterBudget}
              onChange={(e) => setFilterBudget(e.target.value)}
              style={{ maxWidth: "150px" }}
            >
              <option value="">All</option>
              <option value="low">Under ₹5,000</option>
              <option value="mid">₹5,000 – ₹10,000</option>
              <option value="high">₹10,000 – ₹20,000</option>
              <option value="premium">Above ₹20,000</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="form-label mb-1">Status</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ maxWidth: "150px" }}
            >
              <option value="all">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Date & Clear */}
        <div className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <label className="form-label mb-1">Date</label>
            <input
              type="date"
              className="form-control"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ maxWidth: "200px" }}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <button className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      {/* Availability Table */}
      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : availability.length === 0 ? (
        <div className="text-center text-muted mt-5">No yachts found</div>
      ) : (
        rankedAvailability.map((yacht, index) => (
          <div key={yacht.yachtId || index} className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5
                    className="mb-1 text-primary"
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => handleYachtClick(yacht)}
                  >
                    {yacht.name}
                  </h5>
                  <strong className="text-muted">
                    Capacity: {yacht.capacity} | Selling Price : ₹{yacht.sellingPrice} | Status:{" "}
                    {yacht.status}
                  </strong>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      {yacht.days.map((d, i) => (
                        <th key={i}>
                          {d.day}
                          <br />
                          <small>{d.date}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {yacht.days.map((d, i) => (
                        <td
                          key={i}
                          onClick={() => handleDayClick(yacht, d)}
                          style={{ cursor: "pointer" }}
                          className={
                            d.status === "Busy"
                              ? "bg-warning text-dark"
                              : d.status === "Locked"
                              ? "bg-secondary text-white"
                              : "bg-success text-white"
                          }
                        >
                          <strong>{d.status}</strong>
                          <br />
                          <small>
                            {d.bookedSlots.length
                              ? `${d.bookedSlots.length} bookings`
                              : "No bookings"}
                          </small>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Yacht Details Modal */}
      {selectedYacht && detailedYacht && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title text-center w-100">
                  {selectedYacht.name} — Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>

              <div className="modal-body text-center">
                {loadingDetails ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2">Loading details...</p>
                  </div>
                ) : (
                  <>
                    <div className="position-relative mb-3">
                      <img
                        src={
                          detailedYacht.yachtPhotos[detailedYacht.currentImageIndex] ||
                          "/default-yacht.jpg"
                        }
                        alt="Yacht"
                        className="d-block mx-auto rounded"
                        style={{
                          height: "200px",
                          width: "100%",
                          maxWidth: "300px",
                          objectFit: "cover",
                        }}
                      />

                      {detailedYacht.yachtPhotos.length > 1 && (
                        <>
                          <button
                            className="btn btn-dark btn-sm position-absolute top-50 start-0 translate-middle-y"
                            style={{ opacity: 0.7 }}
                            onClick={() =>
                              setDetailedYacht((prev) => ({
                                ...prev,
                                currentImageIndex:
                                  (prev.currentImageIndex - 1 + prev.yachtPhotos.length) %
                                  prev.yachtPhotos.length,
                              }))
                            }
                          >
                            ‹
                          </button>

                          <button
                            className="btn btn-dark btn-sm position-absolute top-50 end-0 translate-middle-y"
                            style={{ opacity: 0.7 }}
                            onClick={() =>
                              setDetailedYacht((prev) => ({
                                ...prev,
                                currentImageIndex:
                                  (prev.currentImageIndex + 1) % prev.yachtPhotos.length,
                              }))
                            }
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    <table
                      className="table table-bordered mx-auto"
                      style={{ maxWidth: "300px" }}
                    >
                      <tbody>
                        <tr>
                          <th>Capacity</th>
                          <td>{detailedYacht.capacity}</td>
                        </tr>
                        <tr>
                          <th>Price</th>
                          <td>₹{detailedYacht.sellingPrice}</td>
                        </tr>
                        <tr>
                          <th>Status</th>
                          <td>
                            <span
                              className={`badge ${
                                detailedYacht.status?.toLowerCase() === "active"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {detailedYacht.status}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              <div className="modal-footer justify-content-center">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Availability;
