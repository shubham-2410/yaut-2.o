import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBookingsAPI } from "../services/operations/bookingAPI"; // using apiConnector

function Bookings({ user }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
 
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await getBookingsAPI(token);
      setBookings(res.data);
      console.log("Bookings - ",res.data)
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleViewDetails = (booking) => {
    navigate("/customer-details", { state: { booking } });
  };


  const handleCreateBooking = () => navigate("/create-booking");
  const handleUpdateBooking = (booking) =>
    navigate("/update-booking", { state: { booking } });

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Bookings</h2>
        {(user?.type === "admin" || user?.type === "backdesk") && (
          <button className="btn btn-success" onClick={handleCreateBooking}>
            + Create Booking
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading bookings...</p>
      ) : (
        <div className="row mt-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="col-md-6 mb-3">
              <div className="card p-3">
                <h5>{booking.customerId.name}</h5>
                <p>Boat: {booking.yautId}</p>
                <p>
                  Status:{" "}
                  <span
                    className={`badge ${booking.status === "Initiated" ? "bg-warning" : "bg-success"
                      }`}
                  >
                    {booking.status}
                  </span>
                </p>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary flex-fill"
                    onClick={() => handleViewDetails(booking)}
                  >
                    View Details
                  </button>
                  {(user?.type === "admin" ||
                    user?.type === "backdesk" ||
                    user?.type === "onsite") && (
                      <button
                        className="btn btn-info flex-fill"
                        onClick={() => handleUpdateBooking(booking)}
                      >
                        Update Booking
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookings;
