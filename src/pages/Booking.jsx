import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaTrain,
  FaArrowLeft,
  FaUserFriends,
  FaCheckCircle,
} from "react-icons/fa";
import { CLASS_LABELS, getClassName, formatDate } from "../utils/helpers";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/$/, "");

const emptyPassenger = () => ({ name: "", age: "", gender: "" });

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function Booking() {
  const { trainId } = useParams();
  const navigate = useNavigate();

  const [train, setTrain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [seats, setSeats] = useState("1");
  const [passengers, setPassengers] = useState([emptyPassenger()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTrain = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const result = await apiRequest("/api/trains");
      const trains = Array.isArray(result.trains) ? result.trains : [];
      const selectedTrain = trains.find(
        (item) => String(item.id) === String(trainId)
      );

      if (!selectedTrain) {
        setTrain(null);
        setNotFound(true);
        return;
      }

      setTrain(selectedTrain);
      const savedClass = sessionStorage.getItem("pendingBookingClass");
      const classCodes = Object.keys(selectedTrain.classes || {});
      const initialClass =
        savedClass && selectedTrain.classes?.[savedClass]
          ? savedClass
          : classCodes[0] || "";

      setSelectedClass(initialClass);
      setSeats("1");
      setPassengers([emptyPassenger()]);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load train details. Check that the Flask backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [trainId]);

  useEffect(() => {
    loadTrain();
  }, [loadTrain]);

  const selectedClassData = train?.classes?.[selectedClass];
  const availableSeats = Number(selectedClassData?.seats ?? 0);
  const selectedFare = Number(selectedClassData?.fare ?? 0);
  const requestedSeats = Number(seats);
  const totalFare = useMemo(
    () => selectedFare * (Number.isFinite(requestedSeats) ? requestedSeats : 0),
    [selectedFare, requestedSeats]
  );

  const handleClassChange = (event) => {
    const nextClass = event.target.value;
    setSelectedClass(nextClass);
    setSeats("1");
    setPassengers([emptyPassenger()]);
    setError("");
  };

  const handleSeatChange = (event) => {
    const rawValue = event.target.value;
    const value = Number(rawValue);
    setSeats(rawValue);
    setError("");

    if (rawValue === "" || !Number.isInteger(value) || value < 1) {
      setPassengers([]);
      return;
    }
    if (value > 6) {
      setPassengers([]);
      setError("You can book a maximum of 6 seats per booking.");
      return;
    }
    if (value > availableSeats) {
      setPassengers([]);
      setError(`Only ${availableSeats} seat(s) are available in ${selectedClass}.`);
      return;
    }

    setPassengers((current) =>
      Array.from({ length: value }, (_, index) => current[index] || emptyPassenger())
    );
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index
          ? { ...passenger, [field]: value }
          : passenger
      )
    );
    setError("");
  };

  const handleBooking = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");

    const count = Number(seats);
    if (!selectedClass || !selectedClassData?.classId) {
      setError("Please select a valid train class.");
      return;
    }
    if (!Number.isInteger(count) || count < 1) {
      setError("Please select at least one seat.");
      return;
    }
    if (count > 6) {
      setError("You can book a maximum of 6 seats per booking.");
      return;
    }
    if (count > availableSeats) {
      setError(`Only ${availableSeats} seat(s) are available.`);
      return;
    }
    if (passengers.length !== count) {
      setError("Please enter passenger details for all seats.");
      return;
    }

    for (let index = 0; index < passengers.length; index += 1) {
      const passenger = passengers[index];
      const age = Number(passenger.age);

      if (!passenger.name.trim()) {
        setError(`Please enter a name for Passenger ${index + 1}.`);
        return;
      }
      if (
        passenger.age === "" ||
        !Number.isInteger(age) ||
        age < 1 ||
        age > 120
      ) {
        setError(`Enter a valid age between 1 and 120 for Passenger ${index + 1}.`);
        return;
      }
      if (!["Male", "Female", "Other"].includes(passenger.gender)) {
        setError(`Please select a gender for Passenger ${index + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          train_id: Number(train.id),
          class_id: Number(selectedClassData.classId),
          class_code: selectedClass,
          journey_date: train.date,
          passengers: passengers.map((passenger) => ({
            name: passenger.name.trim(),
            age: Number(passenger.age),
            gender: passenger.gender,
          })),
        }),
      });

      const savedBooking = {
        id: result.booking.booking_id,
        pnr: result.booking.pnr,
        passengerEmail: result.booking.passenger_email || "",
        passengerName: result.booking.passenger_name || "",
        passengers: passengers.map((passenger) => ({
          name: passenger.name.trim(),
          age: Number(passenger.age),
          gender: passenger.gender,
        })),
        trainId: train.id,
        trainName: train.trainName,
        trainNumber: train.trainNumber,
        source: train.source,
        destination: train.destination,
        date: train.date,
        departure: train.departure,
        arrival: train.arrival,
        class: selectedClass,
        classId: selectedClassData.classId,
        seats: count,
        totalFare: Number(result.booking.total_fare),
        status: result.booking.booking_status || "CONFIRMED",
      };

      // Keep a local copy for the existing confirmation page; the database is authoritative.
      const existingBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
      localStorage.setItem(
        "bookings",
        JSON.stringify([savedBooking, ...existingBookings.filter((item) => item.pnr !== savedBooking.pnr)])
      );
      localStorage.setItem("lastBooking", JSON.stringify(savedBooking));
      sessionStorage.removeItem("pendingBookingClass");
      sessionStorage.removeItem("pendingBookingTrainId");

      navigate("/booking-confirmation", {
        state: { booking: savedBooking },
      });
    } catch (err) {
      if (err.status === 401) {
        setError("Your login session is missing or expired. Please log in again, then retry booking.");
      } else {
        setError(err.message || "Booking failed. Please try again.");
      }
      // Refresh availability in case another user booked the last seats.
      try {
        const result = await apiRequest("/api/trains");
        const refreshed = (result.trains || []).find(
          (item) => String(item.id) === String(trainId)
        );
        if (refreshed) setTrain(refreshed);
      } catch {
        // Keep the original booking error visible.
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading train...</span>
        </div>
        <p className="text-muted mt-3">Loading train details...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card text-center p-4 p-md-5">
              <div className="fs-1 mb-3">🚫</div>
              <h4>Train Not Found</h4>
              <p className="text-muted">
                This train is not available in the database for booking.
              </p>
              <div>
                <Link to="/" className="btn btn-primary">Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!train) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">
          {error || "Unable to load train details."}
          <button type="button" className="btn btn-outline-danger btn-sm ms-3" onClick={loadTrain}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTrain /> Book Your Ticket
              </h2>
              <p>Fill in passenger details and confirm your booking</p>
            </div>
            <button
              type="button"
              className="btn btn-light d-flex align-items-center gap-2"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft /> Back
            </button>
          </div>
        </div>
      </div>

      <div className="container page-body pb-5">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-body p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                  <div>
                    <h4 className="mb-1">{train.trainName}</h4>
                    <span className="train-number-chip">Train No. {train.trainNumber}</span>
                  </div>
                  <span className="badge bg-primary p-2">{formatDate(train.date)}</span>
                </div>

                <div className="row g-3 text-center text-md-start">
                  <div className="col-4">
                    <p className="route-time mb-0">{train.departure}</p>
                    <span className="route-place">{train.source}</span>
                  </div>
                  <div className="col-4 d-flex align-items-center">
                    <div className="route-line w-100">
                      <span className="line" />
                      <FaTrain />
                      <span className="line" />
                    </div>
                  </div>
                  <div className="col-4">
                    <p className="route-time mb-0">{train.arrival}</p>
                    <span className="route-place">{train.destination}</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <strong>⚠ </strong>{error}
              </div>
            )}

            <form onSubmit={handleBooking}>
              <div className="card mb-4">
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="trainClass" className="form-label">Train Class</label>
                      <select
                        id="trainClass"
                        className="form-select"
                        value={selectedClass}
                        onChange={handleClassChange}
                        required
                      >
                        {Object.keys(train.classes || {}).length === 0 && (
                          <option value="">No classes available</option>
                        )}
                        {Object.keys(train.classes || {}).map((code) => (
                          <option key={code} value={code}>
                            {CLASS_LABELS[code] || code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="seatCount" className="form-label">Number of Seats</label>
                      <input
                        id="seatCount"
                        type="number"
                        min="1"
                        max={Math.min(6, availableSeats)}
                        className="form-control"
                        value={seats}
                        onChange={handleSeatChange}
                        required
                      />
                      <small className="text-muted">
                        Maximum 6 seats · {availableSeats} available in {selectedClass || "selected class"}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <h5 className="mb-3 d-flex align-items-center gap-2">
                <FaUserFriends /> Passenger Details
              </h5>

              {passengers.map((passenger, index) => (
                <div className="card mb-3" key={index}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">Passenger {index + 1}</h6>
                    <div className="row g-3">
                      <div className="col-md-5">
                        <label htmlFor={`passenger-name-${index}`} className="form-label">Full Name</label>
                        <input
                          id={`passenger-name-${index}`}
                          type="text"
                          maxLength="100"
                          className="form-control"
                          placeholder="Enter passenger name"
                          value={passenger.name}
                          onChange={(event) => handlePassengerChange(index, "name", event.target.value)}
                          required
                        />
                      </div>
                      <div className="col-6 col-md-3">
                        <label htmlFor={`passenger-age-${index}`} className="form-label">Age</label>
                        <input
                          id={`passenger-age-${index}`}
                          type="number"
                          min="1"
                          max="120"
                          step="1"
                          className="form-control"
                          placeholder="Age"
                          value={passenger.age}
                          onChange={(event) => handlePassengerChange(index, "age", event.target.value)}
                          required
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label htmlFor={`passenger-gender-${index}`} className="form-label">Gender</label>
                        <select
                          id={`passenger-gender-${index}`}
                          className="form-select"
                          value={passenger.gender}
                          onChange={(event) => handlePassengerChange(index, "gender", event.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="btn btn-success w-100 btn-lg d-flex d-lg-none align-items-center justify-content-center gap-2"
                disabled={submitting || availableSeats < 1 || !selectedClassData?.classId}
              >
                <FaCheckCircle />
                {submitting ? "Booking..." : availableSeats < 1 ? "No Seats Available" : "Confirm Booking"}
              </button>
            </form>
          </div>

          <div className="col-lg-4">
            <div className="card" style={{ position: "sticky", top: "90px" }}>
              <div className="card-header bg-primary text-white">Fare Summary</div>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Class</span>
                  <strong>{getClassName(selectedClass)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Available Seats</span>
                  <strong>{availableSeats}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Fare per Seat</span>
                  <strong>₹{selectedFare.toLocaleString("en-IN")}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Number of Seats</span>
                  <strong>{seats || 0}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between fs-5 mb-3">
                  <strong>Total Fare</strong>
                  <strong className="text-primary">₹{totalFare.toLocaleString("en-IN")}</strong>
                </div>
                <button
                  type="button"
                  className="btn btn-success w-100 btn-lg d-none d-lg-flex align-items-center justify-content-center gap-2"
                  disabled={submitting || availableSeats < 1 || !selectedClassData?.classId}
                  onClick={handleBooking}
                >
                  <FaCheckCircle />
                  {submitting ? "Booking..." : availableSeats < 1 ? "No Seats Available" : "Confirm Booking"}
                </button>
                <small className="d-block text-muted mt-3">
                  Your booking is saved in the database after the server confirms it.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Booking;
