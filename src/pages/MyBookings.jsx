import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaTrain,
  FaClipboardList,
  FaSearch,
  FaTimesCircle,
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

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInPassenger = getLoggedInPassenger();

    if (!isPassengerLoggedIn() || !loggedInPassenger) {
      navigate("/passenger-login");
      return;
    }

    const passengerBookings = getBookings()
      .filter(
        (booking) =>
          booking.passengerEmail ===
          loggedInPassenger.email
      )
      .sort((a, b) => b.id - a.id);

    setBookings(passengerBookings);
  }, [navigate]);

  /* Add the cancelled seats back to the same class */
  const restoreClassSeats = (
    trainId,
    classCode,
    numberOfSeats
  ) => {
    const savedTrains =
      JSON.parse(localStorage.getItem("trains")) || [];

    const updatedTrains = savedTrains.map((train) => {
      if (
        train.id === trainId &&
        train.classes?.[classCode]
      ) {
        return {
          ...train,
          classes: {
            ...train.classes,
            [classCode]: {
              ...train.classes[classCode],
              seats:
                train.classes[classCode].seats +
                numberOfSeats,
            },
          },
        };
      }

      return train;
    });

    localStorage.setItem(
      "trains",
      JSON.stringify(updatedTrains)
    );
  };

  const cancelPassenger = (
    bookingId,
    passengerIndex
  ) => {
    const bookingToUpdate = bookings.find(
      (booking) => booking.id === bookingId
    );

    if (!bookingToUpdate) {
      return;
    }

    const passenger =
      bookingToUpdate.passengers?.[passengerIndex];

    if (!passenger) {
      return;
    }

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel the ticket for ${passenger.name}?`
    );

    if (!confirmCancel) {
      return;
    }

    const farePerSeat =
      bookingToUpdate.seats > 0
        ? bookingToUpdate.totalFare /
          bookingToUpdate.seats
        : 0;

    const updatedPassengers =
      bookingToUpdate.passengers.filter(
        (_, index) => index !== passengerIndex
      );

    const allBookings = getBookings();

    if (updatedPassengers.length === 0) {
      const updatedAllBookings = allBookings.filter(
        (booking) => booking.id !== bookingId
      );

      localStorage.setItem(
        "bookings",
        JSON.stringify(updatedAllBookings)
      );

      setBookings(
        bookings.filter(
          (booking) => booking.id !== bookingId
        )
      );
    } else {
      const updatedBooking = {
        ...bookingToUpdate,
        passengers: updatedPassengers,
        seats: updatedPassengers.length,
        totalFare:
          farePerSeat * updatedPassengers.length,
      };

      const updatedAllBookings = allBookings.map(
        (booking) =>
          booking.id === bookingId
            ? updatedBooking
            : booking
      );

      localStorage.setItem(
        "bookings",
        JSON.stringify(updatedAllBookings)
      );

      setBookings(
        bookings.map((booking) =>
          booking.id === bookingId
            ? updatedBooking
            : booking
        )
      );
    }

    restoreClassSeats(
      bookingToUpdate.trainId,
      bookingToUpdate.class,
      1
    );

    alert(
      `${passenger.name}'s ticket cancelled successfully.`
    );
  };

  const cancelBooking = (bookingId) => {
    const bookingToCancel = bookings.find(
      (booking) => booking.id === bookingId
    );

    if (!bookingToCancel) {
      return;
    }

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel the entire booking?"
    );

    if (!confirmCancel) {
      return;
    }

    const updatedAllBookings = getBookings().filter(
      (booking) => booking.id !== bookingId
    );

    localStorage.setItem(
      "bookings",
      JSON.stringify(updatedAllBookings)
    );

    setBookings(
      bookings.filter(
        (booking) => booking.id !== bookingId
      )
    );

    restoreClassSeats(
      bookingToCancel.trainId,
      bookingToCancel.class,
      bookingToCancel.seats
    );

    alert("Entire booking cancelled successfully.");
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="container">

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaClipboardList /> My Bookings
              </h2>

              <p>
                View and manage your booked train tickets
              </p>
            </div>

            <Link
              to="/"
              className="btn btn-light d-flex align-items-center gap-2"
            >
              <FaSearch /> Book New Ticket
            </Link>

          </div>

        </div>
      </div>

      <div className="container page-body pb-5">

        {bookings.length === 0 ? (
          <div className="card text-center p-4 p-md-5">

            <div className="fs-1 mb-3">🎫</div>

            <h4>No Bookings Found</h4>

            <p className="text-muted">
              You have not booked any train tickets yet.
            </p>

            <div>
              <Link to="/" className="btn btn-primary">
                Search Trains
              </Link>
            </div>

          </div>
        ) : (
          <>
            <p className="text-muted mb-3">
              Total <strong>{bookings.length}</strong>{" "}
              booking
              {bookings.length > 1 ? "s" : ""}
            </p>

            <div className="row g-4">

              {bookings.map((booking) => (
                <div className="col-12" key={booking.id}>

                  <div className="card ticket-card">

                    <div className="ticket-head">

                      <span className="d-flex align-items-center gap-2 fw-semibold">
                        <FaTrain /> {booking.trainName}
                      </span>

                      <span className="pnr-chip">
                        PNR: {booking.pnr}
                      </span>

                    </div>

                    <div className="card-body p-4">

                      <div className="row g-3">

                        <div className="col-6 col-md-3">
                          <span className="info-label">
                            Train No.
                          </span>

                          <p className="info-value">
                            {booking.trainNumber}
                          </p>
                        </div>

                        <div className="col-6 col-md-3">
                          <span className="info-label">
                            Route
                          </span>

                          <p className="info-value">
                            {booking.source} →{" "}
                            {booking.destination}
                          </p>
                        </div>

                        <div className="col-6 col-md-2">
                          <span className="info-label">
                            Date
                          </span>

                          <p className="info-value">
                            {formatDate(booking.date)}
                          </p>
                        </div>

                        <div className="col-6 col-md-2">
                          <span className="info-label">
                            Class
                          </span>

                          <p className="info-value">
                            {getClassName(booking.class)}
                          </p>
                        </div>

                        <div className="col-6 col-md-2">
                          <span className="info-label">
                            Seats
                          </span>

                          <p className="info-value">
                            {booking.seats}
                          </p>
                        </div>

                      </div>

                      <hr />

                      <h6 className="fw-bold mb-3">
                        Passenger Details
                      </h6>

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
                                    Passenger{" "}
                                    {index + 1}
                                  </strong>

                                  {booking.seats > 1 && (
                                    <button
                                      className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                      onClick={() =>
                                        cancelPassenger(
                                          booking.id,
                                          index
                                        )
                                      }
                                    >
                                      <FaTimesCircle />{" "}
                                      Cancel
                                    </button>
                                  )}

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

                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">

                        <div className="alert alert-info mb-0 py-2 px-3">
                          Total Fare:{" "}
                          <strong>
                            ₹{booking.totalFare}
                          </strong>{" "}
                          <span className="text-muted">
                            (₹
                            {booking.seats > 0
                              ? booking.totalFare /
                                booking.seats
                              : 0}{" "}
                            × {booking.seats})
                          </span>
                        </div>

                        <button
                          className="btn btn-danger d-flex align-items-center gap-2"
                          onClick={() =>
                            cancelBooking(booking.id)
                          }
                        >
                          <FaTimesCircle /> Cancel
                          Booking
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          </>
        )}

      </div>
    </>
  );
}

export default MyBookings;
