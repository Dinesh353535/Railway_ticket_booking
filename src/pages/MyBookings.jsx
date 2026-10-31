import { useCallback, useEffect, useState } from "react";
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
  getClassName,
  formatDate,
} from "../utils/helpers";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [copiedPnr, setCopiedPnr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const navigate = useNavigate();

  // =====================================================
  // LOAD BOOKINGS FROM FLASK / MYSQL
  // =====================================================

  const loadBookings = useCallback(async () => {
    const passenger = getLoggedInPassenger();

    if (!isPassengerLoggedIn() || !passenger) {
      navigate("/passenger-login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/my`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/passenger-login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load your bookings."
        );
      }

      const receivedBookings = Array.isArray(result.bookings)
        ? result.bookings
        : [];

      setBookings(
        receivedBookings.sort(
          (a, b) => Number(b.id) - Number(a.id)
        )
      );
    } catch (err) {
      console.error("Failed to load bookings:", err);

      setError(
        err.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // =====================================================
  // COPY PNR
  // =====================================================

  const handleCopyPNR = async (pnr) => {
    if (!pnr) return;

    try {
      await navigator.clipboard.writeText(String(pnr));

      setCopiedPnr(pnr);

      window.setTimeout(() => {
        setCopiedPnr((current) =>
          current === pnr ? null : current
        );
      }, 2000);
    } catch (err) {
      console.error("Failed to copy PNR:", err);

      alert(
        "Unable to copy the PNR. Please copy it manually."
      );
    }
  };

  // =====================================================
  // CANCEL ENTIRE BOOKING THROUGH FLASK / MYSQL
  // =====================================================

  const cancelBooking = async (booking) => {
    if (!booking || booking.status !== "CONFIRMED") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel booking PNR ${booking.pnr}?`
    );

    if (!confirmed) return;

    setCancellingId(booking.id);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/${booking.id}/cancel`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        navigate("/passenger-login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to cancel this booking."
        );
      }

      await loadBookings();

      alert(
        result.message || "Booking cancelled successfully."
      );
    } catch (err) {
      console.error("Booking cancellation failed:", err);

      setError(
        err.message || "Unable to cancel the booking."
      );
    } finally {
      setCancellingId(null);
    }
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="container">
            <h2 className="d-flex align-items-center gap-2">
              <FaClipboardList />
              My Bookings
            </h2>

            <p>Loading your bookings...</p>
          </div>
        </div>

        <div className="container page-body pb-5">
          <div className="card text-center p-5">
            <div
              className="spinner-border text-primary mx-auto mb-3"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            Retrieving bookings from the server...
          </div>
        </div>
      </>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <>
      {/* PAGE HEADER */}

      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaClipboardList />
                My Bookings
              </h2>

              <p>
                View and manage your booked train tickets
              </p>
            </div>

            <Link
              to="/"
              className="btn btn-light d-flex align-items-center gap-2"
            >
              <FaSearch />
              Book New Ticket
            </Link>
          </div>
        </div>
      </div>

      {/* PAGE BODY */}

      <div className="container page-body pb-5">
        {error && (
          <div
            className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-3"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={loadBookings}
            >
              Retry
            </button>
          </div>
        )}

        {!error && bookings.length === 0 ? (
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
          bookings.length > 0 && (
            <>
              <p className="text-white mb-3">
                Total{" "}
                <strong>{bookings.length}</strong>{" "}
                booking{bookings.length !== 1 ? "s" : ""}
              </p>

              <div className="row g-4">
                {bookings.map((booking) => (
                  <div
                    className="col-12"
                    key={booking.id}
                  >
                    <div className="card ticket-card">
                      {/* TICKET HEADER */}

                      <div className="ticket-head">
                        <span className="d-flex align-items-center gap-2 fw-semibold">
                          <FaTrain />
                          {booking.trainName}
                        </span>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="pnr-chip">
                            PNR: {booking.pnr}
                          </span>

                          <button
                            type="button"
                            className={`btn btn-sm d-flex align-items-center gap-1 ${
                              copiedPnr === booking.pnr
                                ? "btn-success"
                                : "btn-light"
                            }`}
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

                      {/* TICKET BODY */}

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
                              Passengers
                            </span>

                            <p className="info-value">
                              {booking.seats}
                            </p>
                          </div>
                        </div>

                        <hr />

                        {/* PASSENGER DETAILS */}

                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                          <h6 className="fw-bold mb-0">
                            Passenger Details
                          </h6>

                          <span
                            className={`badge ${
                              booking.status === "CONFIRMED"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="row g-3">
                          {(booking.passengers || []).map(
                            (passenger, index) => (
                              <div
                                className="col-md-6"
                                key={`${booking.id}-${index}`}
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

                        {/* FARE AND CANCELLATION */}

                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
                          <div className="alert alert-info mb-0 py-2 px-3">
                            Total Fare:{" "}
                            <strong>
                              ₹
                              {Number(
                                booking.totalFare
                              ).toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </strong>
                          </div>

                          {booking.status === "CONFIRMED" && (
                            <button
                              type="button"
                              className="btn btn-danger d-flex align-items-center gap-2"
                              disabled={
                                cancellingId === booking.id
                              }
                              onClick={() =>
                                cancelBooking(booking)
                              }
                            >
                              <FaTimesCircle />

                              {cancellingId === booking.id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}

export default MyBookings;