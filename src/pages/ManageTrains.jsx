
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTrain,
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSyncAlt,
} from "react-icons/fa";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CLASS_CONFIG = [
  { code: "1A", name: "First AC", color: "primary" },
  { code: "2A", name: "AC 2-Tier", color: "success" },
  { code: "SL", name: "Sleeper", color: "warning" },
];

const EMPTY_FORM = {
  trainNumber: "",
  trainName: "",
  source: "",
  destination: "",
  date: "",
  departure: "",
  arrival: "",
  classes: {
    "1A": { seats: "", fare: "" },
    "2A": { seats: "", fare: "" },
    SL: { seats: "", fare: "" },
  },
};

function normalizeTrain(train) {
  const classes = { ...EMPTY_FORM.classes };

  // Flask returns classes as an array.
  if (Array.isArray(train.classes)) {
    train.classes.forEach((item) => {
      const code = item.classCode || item.class_code;

      if (classes[code]) {
        classes[code] = {
          seats: item.totalSeats ?? item.total_seats ?? "",
          fare: item.fare ?? "",
        };
      }
    });
  } else if (train.classes) {
    // Also support the previous frontend class-object structure.
    CLASS_CONFIG.forEach(({ code }) => {
      if (train.classes[code]) {
        classes[code] = {
          seats: train.classes[code].seats ?? "",
          fare: train.classes[code].fare ?? "",
        };
      }
    });
  }

  return {
    id: train.id ?? train.trainId ?? train.train_id,
    trainNumber: train.trainNumber ?? train.train_number ?? "",
    trainName: train.trainName ?? train.train_name ?? "",
    source: train.source ?? "",
    destination: train.destination ?? "",
    date: train.date ?? train.journey_date ?? "",
    departure: String(train.departure ?? train.departure_time ?? "").slice(
      0,
      5
    ),
    arrival: String(train.arrival ?? train.arrival_time ?? "").slice(0, 5),
    isActive: train.isActive ?? train.is_active ?? true,
    classes,
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    if (response.status === 401) {
      throw new Error("Please log in to your admin account again.");
    }

    if (response.status === 403) {
      throw new Error(
        "Admin access denied. Please log in using an account with the admin role."
      );
    }

    throw new Error(
      result.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
}

function ManageTrains() {
  const [trains, setTrains] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTrains = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/api/admin/trains");
      setTrains((result.trains || []).map(normalizeTrain));
    } catch (err) {
      setError(err.message || "Unable to load trains.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrains();
  }, [loadTrains]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClassChange = (classCode, field, value) => {
    setFormData((previous) => ({
      ...previous,
      classes: {
        ...previous.classes,
        [classCode]: {
          ...previous.classes[classCode],
          [field]: value,
        },
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM,
      classes: {
        "1A": { ...EMPTY_FORM.classes["1A"] },
        "2A": { ...EMPTY_FORM.classes["2A"] },
        SL: { ...EMPTY_FORM.classes.SL },
      },
    });
    setEditingId(null);
  };

  const validateForm = () => {
    if (
      !formData.trainNumber.trim() ||
      !formData.trainName.trim() ||
      !formData.source.trim() ||
      !formData.destination.trim() ||
      !formData.date ||
      !formData.departure ||
      !formData.arrival
    ) {
      return "Please fill in all train details.";
    }

    if (
      formData.source.trim().toLowerCase() ===
      formData.destination.trim().toLowerCase()
    ) {
      return "Source and destination must be different.";
    }

    for (const { code, name } of CLASS_CONFIG) {
      const seats = Number(formData.classes[code].seats);
      const fare = Number(formData.classes[code].fare);

      if (
        formData.classes[code].seats === "" ||
        !Number.isInteger(seats) ||
        seats < 1
      ) {
        return `Enter a valid seat capacity for ${code}.`;
      }

      if (
        formData.classes[code].fare === "" ||
        !Number.isFinite(fare) ||
        fare < 0
      ) {
        return `Enter a valid fare for ${code}.`;
      }
    }

    return "";
  };

  const buildPayload = () => {
    const classEntries = CLASS_CONFIG.map(({ code, name }) => ({
      classCode: code,
      className: name,
      totalSeats: Number(formData.classes[code].seats),
      fare: Number(formData.classes[code].fare),
    }));

    // These values satisfy the existing Flask API's required train fields.
    const totalSeats = classEntries.reduce(
      (sum, item) => sum + item.totalSeats,
      0
    );

    const baseFare = Math.min(...classEntries.map((item) => item.fare));

    return {
      trainNumber: formData.trainNumber.trim(),
      trainName: formData.trainName.trim(),
      source: formData.source.trim(),
      destination: formData.destination.trim(),
      date: formData.date,
      departure: formData.departure,
      arrival: formData.arrival,
      totalSeats,
      baseFare,
      duration: null,
      runningDays: null,
      classes: classEntries,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();
      const isEditing = editingId !== null;

      const result = await apiRequest(
        isEditing
          ? `/api/admin/trains/${editingId}`
          : "/api/admin/trains",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setSuccess(
        result.message ||
          (isEditing
            ? "Train updated successfully."
            : "Train added successfully.")
      );

      resetForm();
      await loadTrains();
    } catch (err) {
      setError(err.message || "Unable to save train.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (train) => {
    if (!train.isActive) {
      setError(
        "This train is inactive. The current backend does not support reactivating trains."
      );
      return;
    }

    setError("");
    setSuccess("");
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
        "1A": { ...train.classes["1A"] },
        "2A": { ...train.classes["2A"] },
        SL: { ...train.classes.SL },
      },
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (train) => {
    if (!train.isActive) {
      setError("This train is already inactive.");
      return;
    }

    const confirmed = window.confirm(
      `Deactivate ${train.trainName} (${train.trainNumber})?\n\n` +
        "The train will no longer appear in passenger searches. " +
        "Existing bookings will be preserved."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const result = await apiRequest(
        `/api/admin/trains/${train.id}`,
        { method: "DELETE" }
      );

      if (editingId === train.id) {
        resetForm();
      }

      setSuccess(result.message || "Train deactivated successfully.");
      await loadTrains();
    } catch (err) {
      setError(err.message || "Unable to deactivate train.");
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTrain /> Manage Trains
              </h2>
              <p className="mb-0">
                Add, update and manage train information
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
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setError("")}
            />
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible" role="alert">
            {success}
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setSuccess("")}
            />
          </div>
        )}

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
                <div className="col-md-6">
                  <label className="form-label">Train Number</label>
                  <input
                    type="text"
                    name="trainNumber"
                    className="form-control"
                    value={formData.trainNumber}
                    onChange={handleChange}
                    placeholder="Example: 12727"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Train Name</label>
                  <input
                    type="text"
                    name="trainName"
                    className="form-control"
                    value={formData.trainName}
                    onChange={handleChange}
                    placeholder="Example: Godavari Express"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Source</label>
                  <input
                    type="text"
                    name="source"
                    className="form-control"
                    value={formData.source}
                    onChange={handleChange}
                    placeholder="Example: Vijayawada"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Destination</label>
                  <input
                    type="text"
                    name="destination"
                    className="form-control"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="Example: Hyderabad"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Journey Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Departure Time</label>
                  <input
                    type="time"
                    name="departure"
                    className="form-control"
                    value={formData.departure}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Arrival Time</label>
                  <input
                    type="time"
                    name="arrival"
                    className="form-control"
                    value={formData.arrival}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12 mt-4">
                  <h5 className="fw-bold border-bottom pb-2">
                    Class Details
                  </h5>
                  <small className="text-muted">
                    Seat capacities and fares are saved in MySQL for each
                    class.
                  </small>
                </div>

                {CLASS_CONFIG.map(({ code, name, color }) => (
                  <div className="col-md-4" key={code}>
                    <div className={`card border-${color} h-100`}>
                      <div
                        className={`card-header bg-${color} ${
                          color === "warning" ? "text-dark" : "text-white"
                        }`}
                      >
                        {code} - {name}
                      </div>

                      <div className="card-body">
                        <label className="form-label">Total Seats</label>
                        <input
                          type="number"
                          className="form-control mb-3"
                          min="1"
                          step="1"
                          value={formData.classes[code].seats}
                          onChange={(event) =>
                            handleClassChange(
                              code,
                              "seats",
                              event.target.value
                            )
                          }
                          placeholder="Example: 30"
                          required
                        />

                        <label className="form-label">Fare per Seat (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          value={formData.classes[code].fare}
                          onChange={(event) =>
                            handleClassChange(
                              code,
                              "fare",
                              event.target.value
                            )
                          }
                          placeholder="Example: 1200"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-success me-2 d-inline-flex align-items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? <FaEdit /> : <FaPlus />}
                        {editingId ? "Update Train" : "Add Train"}
                      </>
                    )}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h3 className="section-title mb-0">Train Management</h3>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={loadTrains}
            disabled={loading}
          >
            <FaSyncAlt className={loading ? "me-2 fa-spin" : "me-2"} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading trains...</span>
            </div>
            <p className="mt-2">Loading trains from the database...</p>
          </div>
        ) : trains.length === 0 ? (
          <div className="alert alert-info">
            No trains found in the database. Add a train using the form above.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Train No.</th>
                  <th>Train Name</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Class Details</th>
                  <th>Status</th>
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
                    <td>{train.date || "—"}</td>
                    <td>{train.departure || "—"}</td>
                    <td>{train.arrival || "—"}</td>

                    <td>
                      {CLASS_CONFIG.map(({ code }) => (
                        <div key={code}>
                          <strong>{code}:</strong>{" "}
                          {train.classes[code]?.seats ?? 0} seats | ₹
                          {train.classes[code]?.fare ?? 0}
                        </div>
                      ))}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          train.isActive ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {train.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {train.isActive ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-warning btn-sm me-2 mb-1"
                            onClick={() => handleEdit(train)}
                          >
                            <FaEdit /> Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm mb-1"
                            onClick={() => handleDelete(train)}
                          >
                            <FaTrashAlt /> Deactivate
                          </button>
                        </>
                      ) : (
                        <span className="text-muted small">
                          No actions available
                        </span>
                      )}
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
