import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaTrain,
  FaClipboardList,
  FaSearch,
  FaTimesCircle,
  FaCopy,
  FaCheck,
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
  const [copiedPnr, setCopiedPnr] = useState(null);

  const navigate = useNavigate();

  /* =====================================================
     LOAD BOOKINGS
     ===================================================== */

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

  /* =====================================================
     COPY PNR
     ===================================================== */

  const handleCopyPNR = async (pnr) => {
    if (!pnr) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(pnr));

      setCopiedPnr(pnr);

      setTimeout(() => {
        setCopiedPnr(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy PNR:", error);

      /* Fallback for browsers where clipboard API fails */
      try {
        const textArea =
          document.createElement("textarea");

        textArea.value = String(pnr);

        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand("copy");

        document.body.removeChild(textArea);

        setCopiedPnr(pnr);

        setTimeout(() => {
          setCopiedPnr(null);
        }, 2000);
      } catch (fallbackError) {
        console.error(
          "Fallback copy also failed:",
          fallbackError
        );
      }
    }
  };

  /* =====================================================
     RESTORE CANCELLED SEATS
     ===================================================== */

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

  /* =====================================================
     CANCEL INDIVIDUAL PASSENGER
     ===================================================== */

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

    /* Keep the original fare calculation internally */

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

    /* =================================================
       IF LAST PASSENGER IS CANCELLED
       ================================================= */

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
    }

    /* =================================================
       UPDATE BOOKING AFTER PASSENGER CANCELLATION
       ================================================= */

    else {
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

    /* Restore one seat */

    restoreClassSeats(
      bookingToUpdate.trainId,
      bookingToUpdate.class,
      1
    );

    alert(
      `${passenger.name}'s ticket cancelled successfully.`
    );
  };

  /* =====================================================
     CANCEL ENTIRE BOOKING
     ===================================================== */

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

    /* Restore all seats */

    restoreClassSeats(
      bookingToCancel.trainId,
      bookingToCancel.class,
      bookingToCancel.seats
    );

    alert("Entire booking cancelled successfully.");
  };

  return (
    <>
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-header">

        <div className="container">

          <div className="
            d-flex
            flex-wrap
            justify-content-between
            align-items-center
            gap-3
          ">

            {/* Heading */}

            <div>

              <h2 className="d-flex align-items-center gap-2">
                <FaClipboardList />
                My Bookings
              </h2>

              <p>
                View and manage your booked train tickets
              </p>

            </div>

            {/* Book New Ticket */}

            <Link
              to="/"
              className="
                btn
                btn-light
                d-flex
                align-items-center
                gap-2
              "
            >
              <FaSearch />
              Book New Ticket
            </Link>

          </div>

        </div>

      </div>

      {/* =====================================================
          PAGE BODY
          ===================================================== */}

      <div className="container page-body pb-5">

        {/* =================================================
            NO BOOKINGS
            ================================================= */}

        {bookings.length === 0 ? (

          <div className="card text-center p-4 p-md-5">

            <div className="fs-1 mb-3">
              🎫
            </div>

            <h4>
              No Bookings Found
            </h4>

            <p className="text-muted">
              You have not booked any train tickets yet.
            </p>

            <div>

              <Link
                to="/"
                className="btn btn-primary"
              >
                Search Trains
              </Link>

            </div>

          </div>

        ) : (

          <>
            {/* =================================================
                BOOKING COUNT
                ================================================= */}

            <p className="text-white mb-3">

              Total{" "}

              <strong>
                {bookings.length}
              </strong>{" "}

              booking
              {bookings.length > 1 ? "s" : ""}

            </p>

            {/* =================================================
                BOOKINGS LIST
                ================================================= */}

            <div className="row g-4">

              {bookings.map((booking) => (

                <div
                  className="col-12"
                  key={booking.id}
                >

                  <div className="card ticket-card">

                    {/* =================================================
                        TICKET HEADER
                        ================================================= */}

                    <div className="ticket-head">

                      <span className="
                        d-flex
                        align-items-center
                        gap-2
                        fw-semibold
                      ">

                        <FaTrain />

                        {booking.trainName}

                      </span>

                      {/* =================================================
                          PNR + COPY BUTTON
                          ================================================= */}

                      <div className="
                        d-flex
                        align-items-center
                        gap-2
                        flex-wrap
                      ">

                        <span className="pnr-chip">
                          PNR: {booking.pnr}
                        </span>

                        <button
                          type="button"
                          className={`
                            btn
                            btn-sm
                            d-flex
                            align-items-center
                            gap-1
                            ${
                              copiedPnr === booking.pnr
                                ? "btn-success"
                                : "btn-light"
                            }
                          `}
                          onClick={() =>
                            handleCopyPNR(booking.pnr)
                          }
                        >

                          {copiedPnr === booking.pnr ? (
                            <>
                              <FaCheck />
                              Copied
                            </>
                          ) : (
                            <>
                              <FaCopy />
                              Copy
                            </>
                          )}

                        </button>

                      </div>

                    </div>

                    {/* =================================================
                        TICKET BODY
                        ================================================= */}

                    <div className="card-body p-4">

                      {/* =================================================
                          TRAIN INFORMATION
                          ================================================= */}

                      <div className="row g-3">

                        {/* Train Number */}

                        <div className="col-6 col-md-3">

                          <span className="info-label">
                            Train No.
                          </span>

                          <p className="info-value">
                            {booking.trainNumber}
                          </p>

                        </div>

                        {/* Route */}

                        <div className="col-6 col-md-3">

                          <span className="info-label">
                            Route
                          </span>

                          <p className="info-value">
                            {booking.source} →{" "}
                            {booking.destination}
                          </p>

                        </div>

                        {/* Date */}

                        <div className="col-6 col-md-2">

                          <span className="info-label">
                            Date
                          </span>

                          <p className="info-value">
                            {formatDate(booking.date)}
                          </p>

                        </div>

                        {/* Class */}

                        <div className="col-6 col-md-2">

                          <span className="info-label">
                            Class
                          </span>

                          <p className="info-value">
                            {getClassName(booking.class)}
                          </p>

                        </div>

                        {/* Seats */}

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

                      {/* =================================================
                          PASSENGER DETAILS
                          ================================================= */}

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

                                <div className="
                                  d-flex
                                  justify-content-between
                                  align-items-center
                                  mb-2
                                ">

                                  <strong>
                                    Passenger{" "}
                                    {index + 1}
                                  </strong>

                                  {/* Individual Cancel */}

                                  {booking.seats > 1 && (

                                    <button
                                      type="button"
                                      className="
                                        btn
                                        btn-outline-danger
                                        btn-sm
                                        d-flex
                                        align-items-center
                                        gap-1
                                      "
                                      onClick={() =>
                                        cancelPassenger(
                                          booking.id,
                                          index
                                        )
                                      }
                                    >

                                      <FaTimesCircle />

                                      Cancel

                                    </button>

                                  )}

                                </div>

                                <div className="row g-2">

                                  {/* Name */}

                                  <div className="col-5">

                                    <span className="info-label">
                                      Name
                                    </span>

                                    <p className="info-value">
                                      {passenger.name}
                                    </p>

                                  </div>

                                  {/* Age */}

                                  <div className="col-3">

                                    <span className="info-label">
                                      Age
                                    </span>

                                    <p className="info-value">
                                      {passenger.age}
                                    </p>

                                  </div>

                                  {/* Gender */}

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

                      {/* =================================================
                          TOTAL FARE + CANCEL BOOKING
                          ================================================= */}

                      <div className="
                        d-flex
                        flex-wrap
                        justify-content-between
                        align-items-center
                        gap-3
                        mt-4
                      ">

                        {/* Total Fare */}

                        <div className="
                          alert
                          alert-info
                          mb-0
                          py-2
                          px-3
                        ">

                          Total Fare:{" "}

                          <strong>
                            ₹{booking.totalFare}
                          </strong>

                        </div>

                        {/* Cancel Booking */}

                        <button
                          type="button"
                          className="
                            btn
                            btn-danger
                            d-flex
                            align-items-center
                            gap-2
                          "
                          onClick={() =>
                            cancelBooking(booking.id)
                          }
                        >

                          <FaTimesCircle />

                          Cancel Booking

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