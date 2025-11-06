import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAvailabilitySummary } from "../services/operations/availabilityAPI";
import { getAllYachtsDetailsAPI } from "../services/operations/yautAPI";

function Availability() {
  const [availability, setAvailability] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedYacht, setSelectedYacht] = useState(null);
  const [detailedYacht, setDetailedYacht] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ✅ Default date = today
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [filterCapacity, setFilterCapacity] = useState("");
  const [filterBudget, setFilterBudget] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  // ✅ Single reusable fetch function
  const fetchAvailability = async (customDate) => {
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
          yachtPhotos: y.yachtPhotos?.length
            ? y.yachtPhotos
            : y.photos?.length
            ? y.photos
            : ["/default-yacht.jpg"],
          email: `${(y.name || y.yachtName)
            ?.toLowerCase()
            ?.replace(/\s/g, "")}@gmail.com`,
          days: y.availability.map((a) => ({
            day: new Date(a.date).toLocaleDateString("en-US", {
              weekday: "short",
            }),
            date: new Date(a.date).toISOString().split("T")[0],
            status:
              a.status === "busy"
                ? "Busy"
                : a.status === "locked"
                ? "Locked"
                : "Free",
            bookedSlots: a.bookingsCount
              ? Array(a.bookingsCount).fill({})
              : [],
          })),
        }));

        setAvailability(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ First load — today's date
  useEffect(() => {
    if (token) fetchAvailability(filterDate);
  }, [token]);

  // ✅ Auto-fetch when date changes
  useEffect(() => {
    if (token && filterDate) {
      fetchAvailability(filterDate);
    }
  }, [filterDate]);

  // ✅ Clear filters → set today → auto fetch triggers
  const handleClear = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilterDate(today);
    setFilterCapacity("");
    setFilterBudget("");
  };

  // ✅ Navigate for booking
  const handleDayClick = (yacht, day) => {
    if (!yacht || !day) return;

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

  // ✅ Yacht Details Modal
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
          details?.yachtPhotos?.length
            ? details.yachtPhotos
            : yacht.yachtPhotos?.length
            ? yacht.yachtPhotos
            : ["/default-yacht.jpg"],
        currentImageIndex: 0,
      });
    } catch (error) {
      console.error("Error fetching detailed yacht info:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedYacht(null);
    setDetailedYacht(null);
  };

  // ✅ Apply budget & capacity filters
  const filteredAvailability = availability.filter((yacht) => {
    if (filterCapacity === "small" && yacht.capacity > 5) return false;
    if (
      filterCapacity === "medium" &&
      (yacht.capacity < 6 || yacht.capacity > 10)
    )
      return false;
    if (
      filterCapacity === "large" &&
      (yacht.capacity < 11 || yacht.capacity > 20)
    )
      return false;
    if (filterCapacity === "xlarge" && yacht.capacity <= 20) return false;

    if (filterBudget === "low" && yacht.sellingPrice >= 5000) return false;
    if (
      filterBudget === "mid" &&
      (yacht.sellingPrice < 5000 || yacht.sellingPrice > 10000)
    )
      return false;
    if (
      filterBudget === "high" &&
      (yacht.sellingPrice < 10000 || yacht.sellingPrice > 20000)
    )
      return false;
    if (filterBudget === "premium" && yacht.sellingPrice <= 20000) return false;

    if (filterDate) {
      return yacht.days.some((d) => d.date === filterDate);
    }

    return true;
  });

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-3">Yacht Availability</h3>

      {/* Week Range */}
      <div className="text-center mb-3">
        <h6 className="mb-0 fw-semibold">{selectedWeek}</h6>
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
        <div className="d-flex flex-wrap gap-3">
          {/* Capacity */}
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

          {/* Budget */}
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
        </div>

        {/* Date + Clear */}
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

          <div className="d-flex gap-2">
            <button className="btn btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Availability Table */}
      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : filteredAvailability.length === 0 ? (
        <div className="text-center text-muted mt-5">
          No yachts match your filters
        </div>
      ) : (
        filteredAvailability.map((yacht, index) => (
          <div key={index} className="card shadow-sm mb-4">
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
                  <small className="text-muted">
                    {yacht.email} | Capacity: {yacht.capacity} | ₹
                    {yacht.sellingPrice}
                  </small>
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
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    ></div>
                    <p className="mt-2">Loading details...</p>
                  </div>
                ) : (
                  <>
                    <div className="position-relative mb-3">
                      <img
                        src={
                          detailedYacht.yachtPhotos[
                            detailedYacht.currentImageIndex
                          ] || "/default-yacht.jpg"
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
                                  (prev.currentImageIndex -
                                    1 +
                                    prev.yachtPhotos.length) %
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
                                  (prev.currentImageIndex +
                                    1) %
                                  prev.yachtPhotos.length,
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
                          <td>{detailedYacht.capacity || "—"}</td>
                        </tr>
                        <tr>
                          <th>Price</th>
                          <td>₹{detailedYacht.sellingPrice || "—"}</td>
                        </tr>
                        <tr>
                          <th>Status</th>
                          <td>
                            <span
                              className={`badge ${
                                detailedYacht.status === "active"
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
