import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  FaTrain,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

import {
  getBookings,
  getClassName,
  formatDate,
} from "../utils/helpers";

/*
  Separate page that opens when a correct PNR number
  is entered on the Home page.
*/
function PNRDetails() {
  const { pnr } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookings = getBookings();

    const foundBooking = bookings.find(
      (item) => item.pnr === pnr
    );

    setBooking(foundBooking || null);
    setLoading(false);
  }, [pnr]);

  if (loading) {
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

  /* PNR removed / cancelled after opening the page */
  if (!booking) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">

            <div className="card text-center p-4 p-md-5">

              <div className="mb-3 text-warning fs-1">
                <FaExclamationTriangle />
              </div>

              <h4 className="mb-2">
                No Booking Found
              </h4>

              <p className="text-muted">
                We could not find any booking for PNR
                number <strong>{pnr}</strong>.
              </p>

              <Link to="/" className="btn btn-primary">
                Back to Home
              </Link>

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
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTrain /> PNR Status
              </h2>

              <p>
                Live booking details for your PNR number
              </p>
            </div>

            <Link
              to="/"
              className="btn btn-light d-flex align-items-center gap-2"
            >
              <FaArrowLeft /> Back to Home
            </Link>

          </div>

        </div>
      </div>

      {/* Body */}
      <div className="container page-body pb-5">

        <div className="card ticket-card">

          <div className="ticket-head">

            <span className="d-flex align-items-center gap-2 fw-semibold">
              <FaCheckCircle /> Booking Confirmed
            </span>

            <span className="pnr-chip">
              PNR: {booking.pnr}
            </span>

          </div>

          <div className="card-body p-4">

            {/* Journey Summary */}
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
                    <span className="info-label">
                      From
                    </span>

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
                    <span className="info-label">
                      To
                    </span>

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

            {/* Booking Info */}
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
                  Booking Status
                </span>

                <p className="info-value">
                  <span className="badge bg-success">
                    CONFIRMED
                  </span>
                </p>
              </div>

            </div>

            <hr className="my-4" />

            {/* Passengers */}
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

                      <div className="d-flex justify-content-between align-items-center mb-2">

                        <strong>
                          Passenger {index + 1}
                        </strong>

                        <span className="badge bg-success-subtle text-success">
                          Confirmed
                        </span>

                      </div>

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

            {/* Fare */}
            <div className="alert alert-primary mt-4 mb-0">

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

      </div>
    </>
  );
}

export default PNRDetails;
