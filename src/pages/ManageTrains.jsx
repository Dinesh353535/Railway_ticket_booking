import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaTrain,
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrashAlt,
} from "react-icons/fa";

function ManageTrains() {
  const [trains, setTrains] = useState([]);

  const [formData, setFormData] = useState({
    trainNumber: "",
    trainName: "",
    source: "",
    destination: "",
    date: "",
    departure: "",
    arrival: "",

    classes: {
      "1A": {
        seats: "",
        fare: "",
      },
      "2A": {
        seats: "",
        fare: "",
      },
      SL: {
        seats: "",
        fare: "",
      },
    },
  });

  const [editingId, setEditingId] = useState(null);

  // Load train data
  useEffect(() => {
    const savedTrains = localStorage.getItem("trains");

    if (savedTrains) {
      setTrains(JSON.parse(savedTrains));
    } else {
      fetch("/data/data.json")
        .then((response) => response.json())
        .then((data) => {
          setTrains(data.trains);

          localStorage.setItem(
            "trains",
            JSON.stringify(data.trains)
          );
        })
        .catch((error) => {
          console.error("Error loading trains:", error);
        });
    }
  }, []);

  // Handle normal input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle class seats and fare changes
  const handleClassChange = (classCode, field, value) => {
    setFormData({
      ...formData,
      classes: {
        ...formData.classes,
        [classCode]: {
          ...formData.classes[classCode],
          [field]: value,
        },
      },
    });
  };

  // Add or update train
  const handleSubmit = (e) => {
    e.preventDefault();

    const { classes } = formData;

    if (
      !formData.trainNumber ||
      !formData.trainName ||
      !formData.source ||
      !formData.destination ||
      !formData.date ||
      !formData.departure ||
      !formData.arrival ||
      !classes["1A"].seats ||
      !classes["1A"].fare ||
      !classes["2A"].seats ||
      !classes["2A"].fare ||
      !classes["SL"].seats ||
      !classes["SL"].fare
    ) {
      alert("Please fill all fields.");
      return;
    }

    const trainData = {
      trainNumber: formData.trainNumber,
      trainName: formData.trainName,
      source: formData.source,
      destination: formData.destination,
      date: formData.date,
      departure: formData.departure,
      arrival: formData.arrival,

      classes: {
        "1A": {
          seats: Number(classes["1A"].seats),
          fare: Number(classes["1A"].fare),
        },
        "2A": {
          seats: Number(classes["2A"].seats),
          fare: Number(classes["2A"].fare),
        },
        SL: {
          seats: Number(classes.SL.seats),
          fare: Number(classes.SL.fare),
        },
      },
    };

    if (editingId) {
      const updatedTrains = trains.map((train) =>
        train.id === editingId
          ? {
              ...trainData,
              id: editingId,
            }
          : train
      );

      setTrains(updatedTrains);

      localStorage.setItem(
        "trains",
        JSON.stringify(updatedTrains)
      );

      alert("Train updated successfully.");

      setEditingId(null);
    } else {
      const newTrain = {
        ...trainData,
        id: Date.now(),
      };

      const updatedTrains = [...trains, newTrain];

      setTrains(updatedTrains);

      localStorage.setItem(
        "trains",
        JSON.stringify(updatedTrains)
      );

      alert("Train added successfully.");
    }

    resetForm();
  };

  // Edit train
  const handleEdit = (train) => {
    setEditingId(train.id);

    setFormData({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      source: train.source,
      destination: train.destination,
      date: train.date,
      departure: train.departure,
      arrival: train.arrival,

      classes: {
        "1A": {
          seats: train.classes?.["1A"]?.seats ?? "",
          fare: train.classes?.["1A"]?.fare ?? "",
        },
        "2A": {
          seats: train.classes?.["2A"]?.seats ?? "",
          fare: train.classes?.["2A"]?.fare ?? "",
        },
        SL: {
          seats: train.classes?.SL?.seats ?? "",
          fare: train.classes?.SL?.fare ?? "",
        },
      },
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete train
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this train?"
    );

    if (!confirmDelete) {
      return;
    }

    const updatedTrains = trains.filter(
      (train) => train.id !== id
    );

    setTrains(updatedTrains);

    localStorage.setItem(
      "trains",
      JSON.stringify(updatedTrains)
    );

    alert("Train deleted successfully.");
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      trainNumber: "",
      trainName: "",
      source: "",
      destination: "",
      date: "",
      departure: "",
      arrival: "",

      classes: {
        "1A": {
          seats: "",
          fare: "",
        },
        "2A": {
          seats: "",
          fare: "",
        },
        SL: {
          seats: "",
          fare: "",
        },
      },
    });

    setEditingId(null);
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTrain /> Manage Trains
              </h2>

              <p>
                Add, update and delete train information
              </p>
            </div>

            <Link
              to="/admin-dashboard"
              className="btn btn-light d-flex align-items-center gap-2"
            >
              <FaArrowLeft /> Back to Dashboard
            </Link>

          </div>

        </div>
      </div>

      <div className="container page-body pb-5">

      {/* Add / Edit Form */}

      <div className="card shadow-sm mb-5">

        <div className="card-header bg-primary text-white">

          <h4 className="mb-0 text-white d-flex align-items-center gap-2">
            {editingId ? <FaEdit /> : <FaPlus />}
            {editingId ? "Edit Train" : "Add New Train"}
          </h4>

        </div>

        <div className="card-body">

          <form onSubmit={handleSubmit}>

            <div className="row g-3">

              {/* Train Number */}
              <div className="col-md-6">

                <label className="form-label">
                  Train Number
                </label>

                <input
                  type="text"
                  name="trainNumber"
                  className="form-control"
                  value={formData.trainNumber}
                  onChange={handleChange}
                  placeholder="Example: 12727"
                />

              </div>

              {/* Train Name */}
              <div className="col-md-6">

                <label className="form-label">
                  Train Name
                </label>

                <input
                  type="text"
                  name="trainName"
                  className="form-control"
                  value={formData.trainName}
                  onChange={handleChange}
                  placeholder="Example: Godavari Express"
                />

              </div>

              {/* Source */}
              <div className="col-md-6">

                <label className="form-label">
                  Source
                </label>

                <input
                  type="text"
                  name="source"
                  className="form-control"
                  value={formData.source}
                  onChange={handleChange}
                  placeholder="Example: Vijayawada"
                />

              </div>

              {/* Destination */}
              <div className="col-md-6">

                <label className="form-label">
                  Destination
                </label>

                <input
                  type="text"
                  name="destination"
                  className="form-control"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Example: Hyderabad"
                />

              </div>

              {/* Date */}
              <div className="col-md-4">

                <label className="form-label">
                  Journey Date
                </label>

                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={formData.date}
                  onChange={handleChange}
                />

              </div>

              {/* Departure */}
              <div className="col-md-4">

                <label className="form-label">
                  Departure Time
                </label>

                <input
                  type="text"
                  name="departure"
                  className="form-control"
                  value={formData.departure}
                  onChange={handleChange}
                  placeholder="Example: 06:00 AM"
                />

              </div>

              {/* Arrival */}
              <div className="col-md-4">

                <label className="form-label">
                  Arrival Time
                </label>

                <input
                  type="text"
                  name="arrival"
                  className="form-control"
                  value={formData.arrival}
                  onChange={handleChange}
                  placeholder="Example: 01:00 PM"
                />

              </div>

              {/* Classes Heading */}
              <div className="col-12 mt-4">

                <h5 className="fw-bold border-bottom pb-2">
                  Class Details
                </h5>

              </div>

              {/* 1A */}
              <div className="col-md-4">

                <div className="card border-primary h-100">

                  <div className="card-header bg-primary text-white">
                    1A - First AC
                  </div>

                  <div className="card-body">

                    <label className="form-label">
                      Available Seats
                    </label>

                    <input
                      type="number"
                      className="form-control mb-3"
                      min="1"
                      value={formData.classes["1A"].seats}
                      onChange={(e) =>
                        handleClassChange(
                          "1A",
                          "seats",
                          e.target.value
                        )
                      }
                      placeholder="Example: 10"
                    />

                    <label className="form-label">
                      Fare per Seat
                    </label>

                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={formData.classes["1A"].fare}
                      onChange={(e) =>
                        handleClassChange(
                          "1A",
                          "fare",
                          e.target.value
                        )
                      }
                      placeholder="Example: 1200"
                    />

                  </div>

                </div>

              </div>

              {/* 2A */}
              <div className="col-md-4">

                <div className="card border-success h-100">

                  <div className="card-header bg-success text-white">
                    2A - AC 2-Tier
                  </div>

                  <div className="card-body">

                    <label className="form-label">
                      Available Seats
                    </label>

                    <input
                      type="number"
                      className="form-control mb-3"
                      min="1"
                      value={formData.classes["2A"].seats}
                      onChange={(e) =>
                        handleClassChange(
                          "2A",
                          "seats",
                          e.target.value
                        )
                      }
                      placeholder="Example: 20"
                    />

                    <label className="form-label">
                      Fare per Seat
                    </label>

                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={formData.classes["2A"].fare}
                      onChange={(e) =>
                        handleClassChange(
                          "2A",
                          "fare",
                          e.target.value
                        )
                      }
                      placeholder="Example: 900"
                    />

                  </div>

                </div>

              </div>

              {/* SL */}
              <div className="col-md-4">

                <div className="card border-warning h-100">

                  <div className="card-header bg-warning">

                    <strong>
                      SL - Sleeper
                    </strong>

                  </div>

                  <div className="card-body">

                    <label className="form-label">
                      Available Seats
                    </label>

                    <input
                      type="number"
                      className="form-control mb-3"
                      min="1"
                      value={formData.classes.SL.seats}
                      onChange={(e) =>
                        handleClassChange(
                          "SL",
                          "seats",
                          e.target.value
                        )
                      }
                      placeholder="Example: 45"
                    />

                    <label className="form-label">
                      Fare per Seat
                    </label>

                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={formData.classes.SL.fare}
                      onChange={(e) =>
                        handleClassChange(
                          "SL",
                          "fare",
                          e.target.value
                        )
                      }
                      placeholder="Example: 650"
                    />

                  </div>

                </div>

              </div>

              {/* Buttons */}
              <div className="col-12 mt-4">

                <button
                  type="submit"
                  className="btn btn-success me-2 d-inline-flex align-items-center gap-2"
                >
                  {editingId ? <FaEdit /> : <FaPlus />}
                  {editingId
                    ? "Update Train"
                    : "Add Train"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </button>
                )}

              </div>

            </div>

          </form>

        </div>

      </div>

      {/* Train List */}

      <h3 className="section-title mb-3">
        Available Trains
      </h3>

      {trains.length === 0 ? (
        <div className="alert alert-warning">
          No trains available.
        </div>
      ) : (
        <div className="table-responsive">

          <table className="table table-bordered table-hover align-middle">

            <thead className="table-dark">

              <tr>
                <th>Train No</th>
                <th>Train Name</th>
                <th>Route</th>
                <th>Date</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Class Details</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {trains.map((train) => (

                <tr key={train.id}>

                  <td>{train.trainNumber}</td>

                  <td>{train.trainName}</td>

                  <td>
                    {train.source} → {train.destination}
                  </td>

                  <td>{train.date}</td>

                  <td>{train.departure}</td>

                  <td>{train.arrival}</td>

                  <td>

                    <div>
                      <strong>1A:</strong>{" "}
                      {train.classes?.["1A"]?.seats ?? 0} seats
                      {" | ₹"}
                      {train.classes?.["1A"]?.fare ?? 0}
                    </div>

                    <div>
                      <strong>2A:</strong>{" "}
                      {train.classes?.["2A"]?.seats ?? 0} seats
                      {" | ₹"}
                      {train.classes?.["2A"]?.fare ?? 0}
                    </div>

                    <div>
                      <strong>SL:</strong>{" "}
                      {train.classes?.SL?.seats ?? 0} seats
                      {" | ₹"}
                      {train.classes?.SL?.fare ?? 0}
                    </div>

                  </td>

                  <td>

                    <button
                      className="btn btn-warning btn-sm me-2 mb-1"
                      onClick={() => handleEdit(train)}
                    >
                      <FaEdit /> Edit
                    </button>

                    <button
                      className="btn btn-danger btn-sm mb-1"
                      onClick={() => handleDelete(train.id)}
                    >
                      <FaTrashAlt /> Delete
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

      </div>
    </>
  );
}

export default ManageTrains;

