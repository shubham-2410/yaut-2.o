import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllEmployeesAPI, updateEmployeeStatusAPI } from "../services/operations/employeeAPI";
import { toast } from "react-hot-toast";

const AllEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken"); // ✅ assume token stored in localStorage after login

  // ✅ Fetch all employees
  const fetchEmployees = async () => {
    try {
      const response = await getAllEmployeesAPI(token);
      if (response.data.success) {
        setEmployees(response.data.employees);
      } else {
        toast.error("Failed to load employees");
      }
    } catch (error) {
      toast.error("Error fetching employees");
    }
  };

  // ✅ Toggle employee status
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const response = await updateEmployeeStatusAPI(id, newStatus, token);
      if (response.data.success) {
        toast.success(`Employee set to ${newStatus}`);
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === id ? { ...emp, status: newStatus } : emp
          )
        );
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating employee status");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Employees</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/create-employee")}
        >
          + Create Employee
        </button>
      </div>

      <div className="row">
        {employees.length > 0 ? (
          employees.map((emp) => (
            <div key={emp._id} className="col-md-4 mb-4">
              <div className="card shadow-sm border border-dark h-100 text-center">
                <img
                  src={
                    emp.photo ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt={emp.name}
                  className="card-img-top mx-auto mt-3 rounded-circle"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                  }}
                />
                <div className="card-body">
                  <h5 className="card-title fw-bold">{emp.name}</h5>
                  <p><strong>Contact:</strong> {emp.contact}</p>
                  <p><strong>Email:</strong> {emp.email}</p>
                  <p><strong>Role:</strong> {emp.type}</p>
                  <p><strong>Username:</strong> {emp.username}</p>
                  <p>
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
                    onClick={() => toggleStatus(emp._id, emp.status)}
                  >
                    {emp.status === "active" ? "Set Inactive" : "Set Active"}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted mt-5">No employees found.</p>
        )}
      </div>
    </div>
  );
};

export default AllEmployees;
