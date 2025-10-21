// src/pages/Availability.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAvailabilitySummary } from "../services/operations/availabilityAPI";

function Availability() {
  const [availability, setAvailability] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔐 Read token from localStorage
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);

        // 📅 Get today's date and 5 days later
        const today = new Date();
        const fiveDaysLater = new Date();
        fiveDaysLater.setDate(today.getDate() + 5);

        const startDate = today.toISOString().split("T")[0];
        const endDate = fiveDaysLater.toISOString().split("T")[0];

        // For heading (Oct 21 - Oct 26)
        const weekLabel = `${today.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${fiveDaysLater.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
        setSelectedWeek(weekLabel);

        // 🔥 Fetch from backend
        const res = await getAvailabilitySummary(startDate, endDate, token);
        console.log("Availability Response:", res);

        if (res?.success && res?.yachts) {
          const formatted = res.yachts.map((y) => ({
            yachtId: y.yachtId || y._id, // fallback for _id
            yachtName: y.yachtName,
            email: `${y.yachtName.toLowerCase().replace(/\s/g, "")}@gmail.com`,
            // days: y.availability.map((a) => ({
            //   day: new Date(a.date).toLocaleDateString("en-US", { weekday: "short" }),
            //   date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            //   status: a.status === "busy" ? "Busy" : a.status === "locked" ? "Locked" : "Free",
            //   bookedSlots: a.bookingsCount ? Array(a.bookingsCount).fill({}) : [],
            // })),
            days: y.availability.map((a) => ({
              day: new Date(a.date).toLocaleDateString("en-US", { weekday: "short" }),
              date: new Date(a.date).toISOString().split("T")[0], // ✅ YYYY-MM-DD
              status: a.status === "busy" ? "Busy" : a.status === "locked" ? "Locked" : "Free",
              bookedSlots: a.bookingsCount ? Array(a.bookingsCount).fill({}) : [],
            })),
          }));

          console.log("Formatted Availability:", formatted);
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

  // -------------------------
  // Handle day click
  // -------------------------
  // const handleDayClick = (yacht, day) => {
  //   console.log("Inside handle day")
  //   console.log(yacht, "   ", day);
  //   if (!yacht || !day) {
  //     console.error("Yacht or day data missing");
  //     return;
  //   }

  //   // Format date to YYYY-MM-DD without spaces
  //   const formattedDate = day.date.replace(/\s+/g, "");

  //   navigate(`/availability/${encodeURIComponent(yacht.yachtName)}/${formattedDate}`, {
  //     state: {
  //       yachtId: yacht.yachtId,
  //       yachtName: yacht.yachtName,
  //       day, // full day object for DayAvailability
  //     },
  //   });
  // };

  const handleDayClick = (yacht, day) => {
    if (!yacht || !day) return;

    const formattedDate = day.date; // already YYYY-MM-DD

    navigate(`/availability/${encodeURIComponent(yacht.yachtName)}/${formattedDate}`, {
      state: {
        yachtId: yacht.yachtId,
        yachtName: yacht.yachtName,
        day, // full day object for DayAvailability
      },
    });
  };


  return (
    <div className="container mt-4">
      <h3 className="text-center mb-3">Yacht Availability</h3>

      {/* Week Selector */}
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
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : availability.length === 0 ? (
        <div className="text-center text-muted mt-5">No yachts available</div>
      ) : (
        availability.map((yacht, index) => (
          <div key={index} className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">{yacht.yachtName}</h5>
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
    </div>
  );
}

export default Availability;
