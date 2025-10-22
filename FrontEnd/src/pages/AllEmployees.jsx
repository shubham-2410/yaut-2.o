import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AllEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Sample employees
    const sampleEmployees = [
      {
        _id: 1,
        name: "John Doe",
        contact: "9876543210",
        email: "john@example.com",
        designation: "Backdesk",
        status: "active",
        photo: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        _id: 2,
        name: "Jane Smith",
        contact: "9876512345",
        email: "jane@example.com",
        designation: "Onsite",
        status: "inactive",
        photo: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      {
        _id: 3,
        name: "Mark Wilson",
        contact: "9876501234",
        email: "mark@example.com",
        designation: "Backdesk",
        status: "active",
        photo: "https://randomuser.me/api/portraits/men/54.jpg",
      },
    ];

    setEmployees(sampleEmployees);
  }, []);

  const toggleStatus = (id) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp._id === id
          ? { ...emp, status: emp.status === "active" ? "inactive" : "active" }
          : emp
      )
    );
  };

  return (
    <div className="container my-5">
      {/* Header Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Employees</h2>
        {/* Create Employee button only for admin */}
        <button
          className="btn btn-primary"
          onClick={() => navigate("/create-employee")}
        >
          + Create Employee
        </button>
      </div>

      {/* Employee Cards */}
      <div className="row">
        {employees.map((emp) => (
          <div key={emp._id} className="col-md-4 mb-4">
            <div className="card shadow-sm border border-dark h-100 text-center">
              <img
                src={emp.photo}
                alt={emp.name}
                className="card-img-top mx-auto mt-3 rounded-circle"
                style={{ width: "120px", height: "120px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="card-title fw-bold">{emp.name}</h5>
                <p className="mb-1">
                  <strong>Contact:</strong> {emp.contact}
                </p>
                <p className="mb-1">
                  <strong>Email:</strong> {emp.email}
                </p>
                <p className="mb-1">
                  <strong>Designation:</strong> {emp.designation}
                </p>
                <p className="mb-2">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`badge ${
                      emp.status === "active" ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {emp.status}
                  </span>
                </p>

                <button
                  className={`btn btn-sm ${
                    emp.status === "active"
                      ? "btn-outline-secondary"
                      : "btn-outline-success"
                  }`}
                  onClick={() => toggleStatus(emp._id)}
                >
                  {emp.status === "active" ? "Set Inactive" : "Set Active"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllEmployees;
