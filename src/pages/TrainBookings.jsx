import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  FaTrain,
  FaArrowLeft,
  FaTimesCircle,
  FaUserFriends,
  FaEnvelope,
  FaCopy,
  FaCheck,
} from "react-icons/fa";

import {
  getBookings,
  getClassName,
  formatDate,
} from "../utils/helpers";

/*
  Admin -> Manage Bookings -> View Bookings

  Shows every user booking made for one particular
  train, along with cancel options and PNR copy.
*/

function TrainBookings() {
  const { trainId } = useParams();

  const [bookings, setBookings] = useState([]);
  const [train, setTrain] = useState(null);

  /* PNR currently copied */
  const [copiedPnr, setCopiedPnr] = useState(null);

  /* =====================================================
     LOAD BOOKINGS
  ===================================================== */

  useEffect(() => {
    const id = Number(trainId);

    const trainBookings = getBookings()
      .filter((booking) => booking.trainId === id)
      .sort((a, b) => b.id - a.id);

    setBookings(trainBookings);

    const savedTrains =
      JSON.parse(localStorage.getItem("trains")) || [];

    const foundTrain = savedTrains.find(
      (item) => item.id === id
    );

    if (foundTrain) {
      setTrain(foundTrain);
    } else if (trainBookings.length > 0) {
      /* Train was deleted, use booking data instead */

      const sample = trainBookings[0];

      setTrain({
        id: sample.trainId,
        trainName: sample.trainName,
        trainNumber: sample.trainNumber,
        source: sample.source,
        destination: sample.destination,
        date: sample.date,
        removed: true,
      });
    }
  }, [trainId]);

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

      /* Fallback */

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
          "Fallback copy failed:",
          fallbackError
        );
      }
    }
  };

  /* =====================================================
     RESTORE SEATS
  ===================================================== */

  const restoreClassSeats = (
    id,
    classCode,
    numberOfSeats
  ) => {
    const savedTrains =
      JSON.parse(localStorage.getItem("trains")) || [];

    const updatedTrains = savedTrains.map((item) => {
      if (
        item.id === id &&
        item.classes?.[classCode]
      ) {
        return {
          ...item,

          classes: {
            ...item.classes,

            [classCode]: {
              ...item.classes[classCode],

              seats:
                item.classes[classCode].seats +
                numberOfSeats,
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
       LAST PASSENGER CANCELLED
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
    } else {
      /* =================================================
         UPDATE BOOKING
      ================================================= */

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

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalPassengers = bookings.reduce(
    (total, booking) =>
      total + (booking.passengers?.length || 0),
    0
  );

  const totalRevenue = bookings.reduce(
    (total, booking) =>
      total + (Number(booking.totalFare) || 0),
    0
  );

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

            <div>

              <h2 className="
                d-flex
                align-items-center
                gap-2
              ">

                <FaTrain />

                {train
                  ? train.trainName
                  : "Train Bookings"}

              </h2>

              <p>

                {train
                  ? `Train No. ${train.trainNumber} · ${train.source} → ${train.destination}`
                  : "All bookings for this train"}

              </p>

            </div>

            <Link
              to="/admin/bookings"
              className="
                btn
                btn-light
                d-flex
                align-items-center
                gap-2
              "
            >

              <FaArrowLeft />

              Back to Trains

            </Link>

          </div>

        </div>

      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="container page-body pb-5">

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="row g-3 mb-4">

          {/* Total Bookings */}

          <div className="col-12 col-md-4">

            <div className="stat-card">

              <div
                className="stat-icon"
                style={{
                  backgroundColor: "#1565d8",
                }}
              >
                🎫
              </div>

              <div>

                <div className="stat-value">
                  {bookings.length}
                </div>

                <p className="stat-label">
                  Total Bookings
                </p>

              </div>

            </div>

          </div>

          {/* Total Passengers */}

          <div className="col-12 col-md-4">

            <div className="stat-card">

              <div
                className="stat-icon"
                style={{
                  backgroundColor: "#16a34a",
                }}
              >
                <FaUserFriends />
              </div>

              <div>

                <div className="stat-value">
                  {totalPassengers}
                </div>

                <p className="stat-label">
                  Total Passengers
                </p>

              </div>

            </div>

          </div>

          {/* Total Revenue */}

          <div className="col-12 col-md-4">

            <div className="stat-card">

              <div
                className="stat-icon"
                style={{
                  backgroundColor: "#f59e0b",
                }}
              >
                ₹
              </div>

              <div>

                <div className="stat-value">
                  ₹{totalRevenue}
                </div>

                <p className="stat-label">
                  Total Revenue
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            NO BOOKINGS
        ================================================= */}

        {bookings.length === 0 ? (

          <div className="
            card
            text-center
            p-4
            p-md-5
          ">

            <div className="fs-1 mb-3">
              🎫
            </div>

            <h4>
              No Bookings For This Train
            </h4>

            <p className="text-muted mb-0">
              No passenger has booked a ticket on this
              train yet.
            </p>

          </div>

        ) : (

          /* =================================================
             BOOKINGS
          ================================================= */

          <div className="row g-4">

            {bookings.map((booking) => (

              <div
                className="col-12"
                key={booking.id}
              >

                <div className="card ticket-card">

                  {/* =========================================
                      BOOKING HEADER
                  ========================================= */}

                  <div className="ticket-head">

                    <span className="
                      d-flex
                      align-items-center
                      gap-2
                      fw-semibold
                    ">

                      <FaEnvelope />

                      {booking.passengerName
                        ? `${booking.passengerName} · `
                        : ""}

                      {booking.passengerEmail}

                    </span>

                    {/* =====================================
                        PNR + COPY BUTTON
                    ===================================== */}

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
                          handleCopyPNR(
                            booking.pnr
                          )
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

                  {/* =========================================
                      BOOKING BODY
                  ========================================= */}

                  <div className="card-body p-4">

                    <div className="row g-3">

                      {/* Journey Date */}

                      <div className="col-6 col-md-3">

                        <span className="info-label">
                          Journey Date
                        </span>

                        <p className="info-value">
                          {formatDate(booking.date)}
                        </p>

                      </div>

                      {/* Class */}

                      <div className="col-6 col-md-3">

                        <span className="info-label">
                          Class
                        </span>

                        <p className="info-value">
                          {getClassName(booking.class)}
                        </p>

                      </div>

                      {/* Seats */}

                      <div className="col-6 col-md-3">

                        <span className="info-label">
                          Seats Booked
                        </span>

                        <p className="info-value">
                          {booking.seats}
                        </p>

                      </div>

                      {/* Fare */}

                      <div className="col-6 col-md-3">

                        <span className="info-label">
                          Total Fare
                        </span>

                        <p className="info-value">
                          ₹{booking.totalFare}
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
                            className="col-12 col-md-6"
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

                                {booking.passengers
                                  ?.length > 1 && (

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
                        CANCEL BOOKING
                    ================================================= */}

                    <div className="
                      d-flex
                      justify-content-end
                      mt-4
                    ">

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

        )}

      </div>
    </>
  );
}

export default TrainBookings;