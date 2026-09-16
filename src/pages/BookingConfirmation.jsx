import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaCheckCircle,
  FaTrain,
  FaClipboardList,
  FaHome,
  FaPrint,
} from "react-icons/fa";

import {
  isPassengerLoggedIn,
  getLoggedInPassenger,
} from "../utils/auth";

import {
  getBookings,
  getClassName,
  formatDate,
} from "../utils/helpers";

function BookingConfirmation() {
  const [booking, setBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInPassenger = getLoggedInPassenger();

    if (!isPassengerLoggedIn() || !loggedInPassenger) {
      navigate("/passenger-login");
      return;
    }

    const passengerBookings = getBookings().filter(
      (item) =>
        item.passengerEmail === loggedInPassenger.email
    );

    if (passengerBookings.length > 0) {
      setBooking(
        passengerBookings[passengerBookings.length - 1]
      );
    }
  }, [navigate]);

  if (!booking) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card text-center p-4 p-md-5">

              <div className="fs-1 mb-3">🎫</div>

              <h4>No Booking Found</h4>

              <p className="text-muted">
                We could not find your booking details.
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

  const farePerSeat =
    booking.seats > 0
      ? booking.totalFare / booking.seats
      : 0;

  return (
    <div className="container my-5">

      <div className="row justify-content-center">
        <div className="col-lg-10">

          {/* Success Banner */}
          <div className="card text-center mb-4 border-0">
            <div className="card-body p-4 p-md-5">

              <div
                className="text-success mb-3"
                style={{ fontSize: "3rem" }}
              >
                <FaCheckCircle />
              </div>

              <h2 className="text-success mb-2">
                Booking Confirmed!
              </h2>

              <p className="text-muted mb-3">
                Your train ticket has been booked
                successfully. Save your PNR number for
                future reference.
              </p>

              <div className="d-inline-block bg-light border rounded-3 px-4 py-3">
                <span className="info-label">
                  PNR Number
                </span>

                <h3 className="mb-0 text-primary">
                  {booking.pnr}
                </h3>
              </div>

            </div>
          </div>

          {/* Ticket */}
          <div className="card ticket-card mb-4">

            <div className="ticket-head">

              <span className="d-flex align-items-center gap-2 fw-semibold">
                <FaTrain /> E-Ticket
              </span>

              <span className="pnr-chip">
                PNR: {booking.pnr}
              </span>

            </div>

            <div className="card-body p-4">

              <div className="row g-4 align-items-center">

                <div className="col-md-5">

                  <h4 className="mb-1">
                    {booking.trainName}
                  </h4>

                  <span className="train-number-chip">
                    Train No. {booking.trainNumber}
                  </span>

                </div>

                <div className="col-md-7">

                  <div className="row g-3 text-center text-md-start">

                    <div className="col-4">
                      <p className="route-time mb-0">
                        {booking.departure}
                      </p>

                      <span className="route-place">
                        {booking.source}
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
                        {booking.arrival}
                      </p>

                      <span className="route-place">
                        {booking.destination}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              <hr className="my-4" />

              <div className="row g-3">

                <div className="col-6 col-md-3">
                  <span className="info-label">
                    Journey Date
                  </span>

                  <p className="info-value">
                    {formatDate(booking.date)}
                  </p>
                </div>

                <div className="col-6 col-md-3">
                  <span className="info-label">
                    Class
                  </span>

                  <p className="info-value">
                    {getClassName(booking.class)}
                  </p>
                </div>

                <div className="col-6 col-md-3">
                  <span className="info-label">
                    Seats Booked
                  </span>

                  <p className="info-value">
                    {booking.seats}
                  </p>
                </div>

                <div className="col-6 col-md-3">
                  <span className="info-label">
                    Status
                  </span>

                  <p className="info-value">
                    <span className="badge bg-success">
                      CONFIRMED
                    </span>
                  </p>
                </div>

              </div>

              <hr className="my-4" />

              <h5 className="mb-3">
                Passenger Details
              </h5>

              <div className="row g-3">

                {booking.passengers?.map(
                  (passenger, index) => (
                    <div
                      className="col-md-6"
                      key={index}
                    >
                      <div className="passenger-row h-100">

                        <strong className="d-block mb-2">
                          Passenger {index + 1}
                        </strong>

                        <div className="row g-2">

                          <div className="col-5">
                            <span className="info-label">
                              Name
                            </span>

                            <p className="info-value">
                              {passenger.name}
                            </p>
                          </div>

                          <div className="col-3">
                            <span className="info-label">
                              Age
                            </span>

                            <p className="info-value">
                              {passenger.age}
                            </p>
                          </div>

                          <div className="col-4">
                            <span className="info-label">
                              Gender
                            </span>

                            <p className="info-value">
                              {passenger.gender}
                            </p>
                          </div>

                        </div>

                      </div>
                    </div>
                  )
                )}

              </div>

              <div className="alert alert-success mt-4 mb-0">

                <div className="d-flex justify-content-between">
                  <span>Fare per Seat</span>
                  <strong>₹{farePerSeat}</strong>
                </div>

                <div className="d-flex justify-content-between mt-2">
                  <span>Number of Seats</span>
                  <strong>{booking.seats}</strong>
                </div>

                <hr />

                <div className="d-flex justify-content-between fs-5">
                  <strong>Total Fare</strong>
                  <strong>₹{booking.totalFare}</strong>
                </div>

              </div>

            </div>

          </div>

          {/* Buttons */}
          <div className="d-flex flex-wrap justify-content-center gap-2">

            <Link
              to="/my-bookings"
              className="btn btn-primary d-flex align-items-center gap-2"
            >
              <FaClipboardList /> View My Bookings
            </Link>

            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={() => window.print()}
            >
              <FaPrint /> Print Ticket
            </button>

            <Link
              to="/"
              className="btn btn-secondary d-flex align-items-center gap-2"
            >
              <FaHome /> Back to Home
            </Link>

          </div>

        </div>
      </div>

    </div>
  );
}

export default BookingConfirmation;
