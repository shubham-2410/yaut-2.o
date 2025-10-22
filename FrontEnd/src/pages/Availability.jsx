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
  const navigate = useNavigate();

  const token = localStorage.getItem("authToken");

  // 🧭 Fetch weekly availability summary
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const fiveDaysLater = new Date();
        fiveDaysLater.setDate(today.getDate() + 5);

        const startDate = today.toISOString().split("T")[0];
        const endDate = fiveDaysLater.toISOString().split("T")[0];

        const weekLabel = `${today.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${fiveDaysLater.toLocaleString("en-US", {
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
            yachtPhotos:
              y.yachtPhotos && y.yachtPhotos.length > 0
                ? y.yachtPhotos
                : y.photos && y.photos.length > 0
                ? y.photos
                : ["/default-yacht.jpg"],
            email: `${(y.name || y.yachtName)?.toLowerCase()?.replace(/\s/g, "")}@gmail.com`,
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

    if (token) fetchAvailability();
  }, [token]);

  // 📅 Navigate to specific date's availability
  const handleDayClick = (yacht, day) => {
    if (!yacht || !day) return;
    navigate(
      `/availability/${encodeURIComponent(yacht.name)}/${day.date}`,
      {
        state: { yachtId: yacht.yachtId, yachtName: yacht.name, day },
      }
    );
  };

  // 🔍 Fetch detailed yacht info for modal
  const handleYachtClick = async (yacht) => {
    setSelectedYacht(yacht);
    setLoadingDetails(true);

    try {
      const res = await getAllYachtsDetailsAPI(token);
      const allYachts = res?.data?.yachts || [];
      const details = allYachts.find((y) => y._id === yacht.yachtId);

      if (details) {
        setDetailedYacht({
          ...details,
          yachtPhotos:
            details.yachtPhotos && details.yachtPhotos.length > 0
              ? details.yachtPhotos
              : details.photos && details.photos.length > 0
              ? details.photos
              : ["/default-yacht.jpg"],
          currentImageIndex: 0,
        });
      } else {
        setDetailedYacht({
          ...yacht,
          yachtPhotos:
            yacht.yachtPhotos && yacht.yachtPhotos.length > 0
              ? yacht.yachtPhotos
              : yacht.photos && yacht.photos.length > 0
              ? yacht.photos
              : ["/default-yacht.jpg"],
          currentImageIndex: 0,
        });
      }
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

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-3">Yacht Availability</h3>

      {/* Week Range */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-outline-primary btn-sm" disabled>
          &lt;
        </button>
        <h6 className="mb-0">{selectedWeek}</h6>
        <button className="btn btn-outline-primary btn-sm" disabled>
          &gt;
        </button>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : availability.length === 0 ? (
        <div className="text-center text-muted mt-5">No yachts available</div>
      ) : (
        availability.map((yacht, index) => (
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
                  <small className="text-muted">{yacht.email}</small>
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
              {/* Image Slider */}
              <div className="position-relative mb-3">
                <img
                  src={
                    detailedYacht.yachtPhotos[detailedYacht.currentImageIndex] ||
                    "/default-yacht.jpg"
                  }
                  alt="Yacht"
                  className="d-block mx-auto rounded"
                  style={{ height: "200px", width: "100%", maxWidth: "300px", objectFit: "cover" }}
                />

                {/* Arrows for multiple images */}
                {detailedYacht.yachtPhotos.length > 1 && (
                  <>
                    <button
                      className="btn btn-dark btn-sm position-absolute top-50 start-0 translate-middle-y"
                      style={{ opacity: 0.7, padding: "6px 12px", fontSize: "18px" }}
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
                      style={{ opacity: 0.7, padding: "6px 12px", fontSize: "18px" }}
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

              {/* Info Table */}
              <table className="table table-bordered mx-auto" style={{ maxWidth: "300px" }}>
                <tbody>
                  <tr>
                    <th>Capacity</th>
                    <td>{detailedYacht.capacity || "—"}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span
                        className={`badge ${
                          detailedYacht.status === "active" ? "bg-success" : "bg-danger"
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
