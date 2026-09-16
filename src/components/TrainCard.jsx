import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FaTrain, FaChair } from "react-icons/fa";

import { isPassengerLoggedIn } from "../utils/auth";
import { CLASS_LABELS } from "../utils/helpers";

function TrainCard({ train }) {
  const navigate = useNavigate();

  const classOptions = Object.keys(CLASS_LABELS).map(
    (code) => ({
      code,
      name: CLASS_LABELS[code],
    })
  );

  const availableClasses = classOptions.filter(
    (item) => train.classes?.[item.code]
  );

  const [selectedClass, setSelectedClass] = useState(
    availableClasses.length > 0
      ? availableClasses[0].code
      : ""
  );

  const selectedClassData =
    train.classes?.[selectedClass];

  const availableSeats = selectedClassData?.seats ?? 0;
  const selectedFare = selectedClassData?.fare ?? 0;

  const handleBook = () => {
    if (!selectedClass) {
      alert("Please select a train class.");
      return;
    }

    /* Remember the selected class for the booking page */
    sessionStorage.setItem(
      "pendingBookingClass",
      selectedClass
    );

    if (!isPassengerLoggedIn()) {
      sessionStorage.setItem(
        "pendingBookingTrainId",
        train.id
      );

      navigate("/passenger-login");
      return;
    }

    navigate(`/booking/${train.id}`);
  };

  const seatBadgeClass =
    availableSeats === 0
      ? "bg-danger"
      : availableSeats <= 5
      ? "bg-warning text-dark"
      : "bg-success";

  return (
    <div className="card train-card mb-4">
      <div className="card-body p-4">

        <div className="row g-4 align-items-center">

          {/* Train Name */}
          <div className="col-lg-3 col-md-6">

            <p className="train-name mb-1">
              {train.trainName}
            </p>

            <span className="train-number-chip">
              Train No. {train.trainNumber}
            </span>

            <p className="text-muted mb-0 mt-2 small">
              📅 {train.date}
            </p>

          </div>

          {/* Route */}
          <div className="col-lg-4 col-md-6">

            <div className="row g-2 align-items-center text-center text-lg-start">

              <div className="col-4">
                <p className="route-time mb-0">
                  {train.departure}
                </p>

                <span className="route-place">
                  {train.source}
                </span>
              </div>

              <div className="col-4">
                <div className="route-line">
                  <span className="line"></span>
                  <FaTrain />
                  <span className="line"></span>
                </div>
              </div>

              <div className="col-4">
                <p className="route-time mb-0">
                  {train.arrival}
                </p>

                <span className="route-place">
                  {train.destination}
                </span>
              </div>

            </div>

          </div>

          {/* Class */}
          <div className="col-lg-3 col-md-6">

            <label className="form-label">
              Select Class
            </label>

            <select
              className="form-select form-select-sm"
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(e.target.value)
              }
            >
              {availableClasses.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>

            <div className="d-flex align-items-center gap-2 mt-2">

              <span
                className={`badge ${seatBadgeClass} d-flex align-items-center gap-1`}
              >
                <FaChair />
                {availableSeats > 0
                  ? `${availableSeats} Seats`
                  : "Sold Out"}
              </span>

            </div>

          </div>

          {/* Fare + Book */}
          <div className="col-lg-2 col-md-6 text-md-end">

            <p className="fare-amount mb-1">
              ₹{selectedFare}
            </p>

            <p className="text-muted small mb-2">
              per seat
            </p>

            {availableSeats > 0 ? (
              <button
                className="btn btn-primary w-100"
                onClick={handleBook}
              >
                Book Now
              </button>
            ) : (
              <button
                className="btn btn-secondary w-100"
                disabled
              >
                Sold Out
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default TrainCard;
