// src/pages/Availability.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function Availability() {
  const [availability, setAvailability] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("Oct 20 - Oct 26, 2025");
  const navigate = useNavigate();

  useEffect(() => {
    // Mock data (replace with API later)
    const data = [
      {
        yacht: "GoaYachtWorld",
        email: "goayachtworldbooking@gmail.com",
        days: [
          { day: "Mon", date: "Oct 20", status: "Free", bookedSlots: [] },
          {
            day: "Tue",
            date: "Oct 21",
            status: "Busy",
            bookedSlots: [
              { start: "09:30", end: "11:00" },
              { start: "14:15", end: "16:45" },
            ],
          },
          {
            day: "Wed",
            date: "Oct 22",
            status: "Busy",
            bookedSlots: [
              { start: "08:00", end: "09:00" },
              { start: "12:00", end: "13:30" },
              { start: "17:00", end: "19:00" },
            ],
          },
          { day: "Thu", date: "Oct 23", status: "Free", bookedSlots: [] },
        ],
      },
    ];
    setAvailability(data);
  }, []);

  const handleDayClick = (yachtName, day) => {
    const formattedDate = day.date.replace(/\s+/g, "");
    navigate(`/availability/${encodeURIComponent(yachtName)}/${formattedDate}`, {
      state: { yachtName, day },
    });
  };

  return (
    <div className="container mt-4">
      <h3 className="text-center mb-3">Yacht Availability</h3>

      {/* Week Selector */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-outline-primary btn-sm">&lt;</button>
        <h6 className="mb-0">{selectedWeek}</h6>
        <button className="btn btn-outline-primary btn-sm">&gt;</button>
      </div>

      {/* Yacht Availability Cards */}
      {availability.map((yacht, index) => (
        <div key={index} className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">{yacht.yacht}</h5>
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
                        onClick={() => handleDayClick(yacht.yacht, d)}
                        style={{ cursor: "pointer" }}
                        className={
                          d.status === "Busy"
                            ? "bg-warning text-dark"
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
      ))}
    </div>
  );
}

export default Availability;
