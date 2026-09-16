import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaTrain,
  FaArrowLeft,
  FaUserFriends,
  FaCheckCircle,
} from "react-icons/fa";

import { getLoggedInPassenger } from "../utils/auth";
import {
  CLASS_LABELS,
  getClassName,
  formatDate,
} from "../utils/helpers";

function Booking() {
  const { trainId } = useParams();
  const navigate = useNavigate();

  const [train, setTrain] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [seats, setSeats] = useState(1);

  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "" },
  ]);

  const [error, setError] = useState("");

  useEffect(() => {
    const savedTrains = localStorage.getItem("trains");

    if (!savedTrains) {
      setNotFound(true);
      return;
    }

    const trains = JSON.parse(savedTrains);

    const selectedTrain = trains.find(
      (item) => item.id === Number(trainId)
    );

    if (!selectedTrain) {
      setNotFound(true);
      return;
    }

    setTrain(selectedTrain);

    const savedClass = sessionStorage.getItem(
      "pendingBookingClass"
    );

    if (
      savedClass &&
      selectedTrain?.classes?.[savedClass]
    ) {
      setSelectedClass(savedClass);
    } else if (selectedTrain?.classes) {
      setSelectedClass(
        Object.keys(selectedTrain.classes)[0]
      );
    }
  }, [trainId]);

  const generatePNR = () => {
    const existingBookings =
      JSON.parse(localStorage.getItem("bookings")) || [];

    let pnr;

    do {
      pnr = Math.floor(
        1000000000 + Math.random() * 9000000000
      ).toString();
    } while (
      existingBookings.some(
        (booking) => booking.pnr === pnr
      )
    );

    return pnr;
  };

  const selectedClassData =
    train?.classes?.[selectedClass];

  const availableSeats = selectedClassData?.seats ?? 0;
  const selectedFare = selectedClassData?.fare ?? 0;

  const handleSeatChange = (e) => {
    const value = Number(e.target.value);

    setSeats(e.target.value);
    setError("");

    if (!value || value < 1) {
      setPassengers([]);
      return;
    }

    if (value > 6) {
      setPassengers([]);
      setError(
        "You can book a maximum of 6 seats per train."
      );
      return;
    }

    if (value > availableSeats) {
      setPassengers([]);
      setError(
        `Only ${availableSeats} seat(s) are available.`
      );
      return;
    }

    setPassengers(
      Array.from(
        { length: value },
        (_, index) =>
          passengers[index] || {
            name: "",
            age: "",
            gender: "",
          }
      )
    );
  };

  const handlePassengerChange = (
    index,
    field,
    value
  ) => {
    const updatedPassengers = [...passengers];

    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    };

    setPassengers(updatedPassengers);
    setError("");
  };

  const handleBooking = (e) => {
    e.preventDefault();
    setError("");

    const requestedSeats = Number(seats);

    if (!selectedClass) {
      setError("Please select a train class.");
      return;
    }

    if (!seats || requestedSeats < 1) {
      setError("Please select at least one seat.");
      return;
    }

    if (requestedSeats > 6) {
      setError(
        "You can book a maximum of 6 seats per train."
      );
      return;
    }

    if (requestedSeats > availableSeats) {
      setError(
        `Only ${availableSeats} seat(s) are available.`
      );
      return;
    }

    if (passengers.length !== requestedSeats) {
      setError(
        "Please enter passenger details for all seats."
      );
      return;
    }

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];

      if (!passenger.name.trim()) {
        setError(
          `Please enter name for Passenger ${i + 1}.`
        );
        return;
      }

      const passengerAge = Number(passenger.age);

      if (!passenger.age) {
        setError(
          `Please enter age for Passenger ${i + 1}.`
        );
        return;
      }

      if (passengerAge < 1 || passengerAge > 120) {
        setError(
          `Please enter a valid age between 1 and 120 for Passenger ${
            i + 1
          }.`
        );
        return;
      }

      if (!passenger.gender) {
        setError(
          `Please select gender for Passenger ${i + 1}.`
        );
        return;
      }
    }

    const loggedInPassenger = getLoggedInPassenger();

    const booking = {
      id: Date.now(),
      pnr: generatePNR(),
      passengerEmail: loggedInPassenger?.email,
      passengerName: loggedInPassenger?.name,

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
      seats: requestedSeats,
      totalFare: selectedFare * requestedSeats,
    };

    const existingBookings =
      JSON.parse(localStorage.getItem("bookings")) || [];

    existingBookings.push(booking);

    localStorage.setItem(
      "bookings",
      JSON.stringify(existingBookings)
    );

    /* Reduce seats only for the selected class */
    const savedTrains =
      JSON.parse(localStorage.getItem("trains")) || [];

    const updatedTrains = savedTrains.map((item) => {
      if (
        item.id === train.id &&
        item.classes?.[selectedClass]
      ) {
        return {
          ...item,
          classes: {
            ...item.classes,
            [selectedClass]: {
              ...item.classes[selectedClass],
              seats:
                item.classes[selectedClass].seats -
                requestedSeats,
            },
          },
        };
      }

      return item;
    });

    localStorage.setItem(
      "trains",
      JSON.stringify(updatedTrains)
    );

    sessionStorage.removeItem("pendingBookingClass");
    sessionStorage.removeItem("pendingBookingTrainId");

    navigate("/booking-confirmation");
  };

  if (notFound) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card text-center p-4 p-md-5">

              <div className="fs-1 mb-3">🚫</div>

              <h4>Train Not Found</h4>

              <p className="text-muted">
                The train you are looking for is no longer
                available.
              </p>

              <div>
                <Link to="/" className="btn btn-primary">
                  Back to Home
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!train) {
    return (
      <div className="container my-5 text-center">
        <div
          className="spinner-border text-primary"
          role="status"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  const totalFare = selectedFare * Number(seats || 0);

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="container">

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTrain /> Book Your Ticket
              </h2>

              <p>
                Fill the passenger details and confirm
                your booking
              </p>
            </div>

            <button
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

          {/* LEFT - FORM */}
          <div className="col-lg-8">

            {/* Train Info */}
            <div className="card mb-4">
              <div className="card-body p-4">

                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">

                  <div>
                    <h4 className="mb-1">
                      {train.trainName}
                    </h4>

                    <span className="train-number-chip">
                      Train No. {train.trainNumber}
                    </span>
                  </div>

                  <span className="badge bg-primary p-2">
                    {formatDate(train.date)}
                  </span>

                </div>

                <div className="row g-3 text-center text-md-start">

                  <div className="col-4">
                    <p className="route-time mb-0">
                      {train.departure}
                    </p>

                    <span className="route-place">
                      {train.source}
                    </span>
                  </div>

                  <div className="col-4 d-flex align-items-center">
                    <div className="route-line w-100">
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
            </div>

            {error && (
              <div className="alert alert-danger">
                <strong>⚠ </strong>
                {error}
              </div>
            )}

            <form onSubmit={handleBooking}>

              {/* Class + seats */}
              <div className="card mb-4">
                <div className="card-body p-4">

                  <div className="row g-3">

                    <div className="col-md-6">

                      <label className="form-label">
                        Train Class
                      </label>

                      <select
                        className="form-select"
                        value={selectedClass}
                        onChange={(e) => {
                          setSelectedClass(
                            e.target.value
                          );
                          setSeats(1);
                          setPassengers([
                            {
                              name: "",
                              age: "",
                              gender: "",
                            },
                          ]);
                          setError("");
                        }}
                      >
                        {train.classes &&
                          Object.keys(
                            train.classes
                          ).map((code) => (
                            <option
                              key={code}
                              value={code}
                            >
                              {CLASS_LABELS[code] ||
                                code}
                            </option>
                          ))}
                      </select>

                    </div>

                    <div className="col-md-6">

                      <label className="form-label">
                        Number of Seats
                      </label>

                      <input
                        type="number"
                        min="1"
                        max={Math.min(
                          6,
                          availableSeats
                        )}
                        className="form-control"
                        value={seats}
                        onChange={handleSeatChange}
                      />

                      <small className="text-muted">
                        Maximum 6 seats ·{" "}
                        {availableSeats} available in{" "}
                        {selectedClass}
                      </small>

                    </div>

                  </div>

                </div>
              </div>

              {/* Passengers */}
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <FaUserFriends /> Passenger Details
              </h5>

              {passengers.map((passenger, index) => (
                <div
                  className="card mb-3"
                  key={index}
                >
                  <div className="card-body p-4">

                    <h6 className="fw-bold mb-3">
                      Passenger {index + 1}
                    </h6>

                    <div className="row g-3">

                      <div className="col-md-5">

                        <label className="form-label">
                          Full Name
                        </label>

                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter passenger name"
                          value={passenger.name}
                          onChange={(e) =>
                            handlePassengerChange(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="col-6 col-md-3">

                        <label className="form-label">
                          Age
                        </label>

                        <input
                          type="number"
                          className="form-control"
                          placeholder="Age"
                          min="1"
                          max="120"
                          value={passenger.age}
                          onChange={(e) =>
                            handlePassengerChange(
                              index,
                              "age",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="col-6 col-md-4">

                        <label className="form-label">
                          Gender
                        </label>

                        <select
                          className="form-select"
                          value={passenger.gender}
                          onChange={(e) =>
                            handlePassengerChange(
                              index,
                              "gender",
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            Select
                          </option>
                          <option value="Male">
                            Male
                          </option>
                          <option value="Female">
                            Female
                          </option>
                          <option value="Other">
                            Other
                          </option>
                        </select>

                      </div>

                    </div>

                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="btn btn-success w-100 btn-lg d-flex align-items-center justify-content-center gap-2 d-lg-none"
                disabled={availableSeats === 0}
              >
                <FaCheckCircle />
                {availableSeats === 0
                  ? "No Seats Available"
                  : "Confirm Booking"}
              </button>

            </form>

          </div>

          {/* RIGHT - FARE SUMMARY */}
          <div className="col-lg-4">

            <div
              className="card"
              style={{ position: "sticky", top: "90px" }}
            >

              <div className="card-header bg-primary text-white">
                Fare Summary
              </div>

              <div className="card-body p-4">

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    Class
                  </span>

                  <strong>
                    {getClassName(selectedClass)}
                  </strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    Available Seats
                  </span>

                  <strong>{availableSeats}</strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    Fare per Seat
                  </span>

                  <strong>₹{selectedFare}</strong>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    Number of Seats
                  </span>

                  <strong>{seats || 0}</strong>
                </div>

                <hr />

                <div className="d-flex justify-content-between fs-5 mb-3">
                  <strong>Total Fare</strong>

                  <strong className="text-primary">
                    ₹{totalFare}
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn btn-success w-100 btn-lg d-none d-lg-flex align-items-center justify-content-center gap-2"
                  disabled={availableSeats === 0}
                  onClick={handleBooking}
                >
                  <FaCheckCircle />
                  {availableSeats === 0
                    ? "No Seats"
                    : "Confirm Booking"}
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default Booking;
