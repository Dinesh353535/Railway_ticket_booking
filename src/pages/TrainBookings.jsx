import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaTrain,
  FaArrowLeft,
  FaUserFriends,
  FaEnvelope,
  FaCopy,
  FaCheck,
  FaSyncAlt,
} from "react-icons/fa";

import {
  loadAdminBookings,
  loadAdminTrains,
  cancelAdminBooking,
  getClassName,
  formatDate,
  formatCurrency,
  getBookingStatus,
} from "../utils/helpers";

function TrainBookings() {
  const { trainId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [train, setTrain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [copiedPnr, setCopiedPnr] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const id = Number(trainId);
      const [allBookings, allTrains] = await Promise.all([
        loadAdminBookings(),
        loadAdminTrains(),
      ]);

      const matchingBookings = allBookings
        .filter((booking) => Number(booking.trainId) === id)
        .sort((a, b) => Number(b.id) - Number(a.id));

      const foundTrain = allTrains.find((item) => Number(item.id) === id);
      const sample = matchingBookings[0];

      setTrain(
        foundTrain ||
          (sample
            ? {
                id: Number(sample.trainId),
                trainName: sample.trainName,
                trainNumber: sample.trainNumber,
                source: sample.source,
                destination: sample.destination,
                date: sample.date,
                departure: sample.departure,
                arrival: sample.arrival,
                isActive: false,
                removed: true,
              }
            : null)
      );
      setBookings(matchingBookings);
    } catch (err) {
      console.error("Unable to load train bookings from database:", err);
      setError(err.message || "Unable to load bookings from the database.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trainId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancelBooking = async (booking) => {
    const bookingId = booking.id ?? booking.bookingId;
    const pnr = booking.pnr || `Booking #${bookingId}`;

    if (getBookingStatus(booking) !== "CONFIRMED") {
      window.alert("Only confirmed bookings can be cancelled.");
      return;
    }

    const confirmed = window.confirm(
      `Cancel ticket ${pnr}? This will update the MySQL database and the passenger will see the cancelled status.`
    );
    if (!confirmed) return;

    try {
      await cancelAdminBooking(bookingId);
      window.alert(`Ticket ${pnr} cancelled successfully.`);
      await loadData(true);
    } catch (err) {
      console.error("Admin cancellation failed:", err);
      window.alert(err.message || "Unable to cancel this booking.");
      // Reload current state in case another user changed the status.
      await loadData(true);
    }
  };

  const handleCopyPNR = async (pnr) => {
    if (!pnr) return;
    try {
      await navigator.clipboard.writeText(String(pnr));
      setCopiedPnr(pnr);
      window.setTimeout(() => setCopiedPnr(null), 1800);
    } catch (err) {
      console.error("Unable to copy PNR:", err);
      window.prompt("Copy this PNR:", String(pnr));
    }
  };

  const summary = useMemo(() => {
    const confirmed = bookings.filter(
      (booking) => getBookingStatus(booking) === "CONFIRMED"
    );
    const cancelled = bookings.filter(
      (booking) => getBookingStatus(booking) === "CANCELLED"
    );

    return {
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      cancelledBookings: cancelled.length,
      confirmedPassengers: confirmed.reduce(
        (total, booking) =>
          total + Number(booking.passengerCount ?? booking.seats ?? 0),
        0
      ),
      confirmedRevenue: confirmed.reduce(
        (total, booking) => total + Number(booking.totalFare || 0),
        0
      ),
    };
  }, [bookings]);

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTrain />
                {train ? train.trainName : "Train Bookings"}
              </h2>
              <p className="mb-0">
                {train
                  ? `Train No. ${train.trainNumber} · ${train.source} → ${train.destination}`
                  : "Bookings stored in the database for this train"}
                {train?.removed && (
                  <span className="badge bg-secondary ms-2">
                    Historical train
                  </span>
                )}
                {train && train.isActive === false && !train.removed && (
                  <span className="badge bg-secondary ms-2">
                    Inactive train
                  </span>
                )}
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-light d-flex align-items-center gap-2"
                onClick={() => loadData(true)}
                disabled={loading || refreshing}
              >
                <FaSyncAlt className={refreshing ? "fa-spin" : ""} />
                Refresh
              </button>
              <Link
                to="/admin/bookings"
                className="btn btn-light d-flex align-items-center gap-2"
              >
                <FaArrowLeft /> Back to Trains
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container page-body pb-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading bookings...</span>
            </div>
            <p className="text-muted mt-2">Loading bookings from MySQL...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            <strong>Unable to load database bookings.</strong>
            <div>{error}</div>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm mt-3"
              onClick={() => loadData(true)}
            >
              Try Again
            </button>
          </div>
        ) : !train && bookings.length === 0 ? (
          <div className="alert alert-warning">
            Train record was not found in the database, and no bookings exist
            for train ID {trainId}.
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: "#1565d8" }}>
                    🎫
                  </div>
                  <div>
                    <div className="stat-value">{summary.totalBookings}</div>
                    <p className="stat-label mb-0">Total Bookings</p>
                    <small className="text-muted">
                      {summary.confirmedBookings} confirmed · {summary.cancelledBookings} cancelled
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: "#16a34a" }}>
                    <FaUserFriends />
                  </div>
                  <div>
                    <div className="stat-value">{summary.confirmedPassengers}</div>
                    <p className="stat-label mb-0">Confirmed Passengers</p>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: "#f59e0b" }}>
                    ₹
                  </div>
                  <div>
                    <div className="stat-value">
                      {formatCurrency(summary.confirmedRevenue)}
                    </div>
                    <p className="stat-label mb-0">Confirmed Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="card text-center p-4 p-md-5">
                <div className="fs-1 mb-3">🎫</div>
                <h4>No Bookings For This Train</h4>
                <p className="text-muted mb-0">
                  No booking records for this train were found in MySQL.
                </p>
              </div>
            ) : (
              <div className="row g-4">
                {bookings.map((booking) => {
                  const status = getBookingStatus(booking);
                  const isCancelled = status === "CANCELLED";
                  const passengers = Array.isArray(booking.passengers)
                    ? booking.passengers
                    : [];

                  return (
                    <div className="col-12" key={booking.id ?? booking.bookingId}>
                      <div className="card ticket-card">
                        <div className="ticket-head d-flex flex-wrap justify-content-between align-items-center gap-3">
                          <span className="d-flex align-items-center gap-2 fw-semibold">
                            <FaEnvelope />
                            {booking.passengerName || "Passenger"}
                            {booking.passengerEmail ? ` · ${booking.passengerEmail}` : ""}
                          </span>

                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="pnr-chip">PNR: {booking.pnr || "N/A"}</span>
                            <button
                              type="button"
                              className={`btn btn-sm d-flex align-items-center gap-1 ${
                                copiedPnr === booking.pnr ? "btn-success" : "btn-light"
                              }`}
                              onClick={() => handleCopyPNR(booking.pnr)}
                              disabled={!booking.pnr}
                            >
                              {copiedPnr === booking.pnr ? (
                                <>
                                  <FaCheck /> Copied
                                </>
                              ) : (
                                <>
                                  <FaCopy /> Copy
                                </>
                              )}
                            </button>
                            <span className={`badge ${isCancelled ? "bg-danger" : status === "CONFIRMED" ? "bg-success" : "bg-secondary"}`}>
                              {status}
                            </span>
                            {status === "CONFIRMED" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancelBooking(booking)}
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="card-body p-4">
                          <div className="row g-3">
                            <div className="col-6 col-md-3">
                              <span className="info-label">Journey Date</span>
                              <p className="info-value">{formatDate(booking.date)}</p>
                            </div>
                            <div className="col-6 col-md-3">
                              <span className="info-label">Class</span>
                              <p className="info-value">
                                {booking.className || getClassName(booking.class)}
                              </p>
                            </div>
                            <div className="col-6 col-md-3">
                              <span className="info-label">Seats Booked</span>
                              <p className="info-value">{booking.seats ?? booking.passengerCount ?? 0}</p>
                            </div>
                            <div className="col-6 col-md-3">
                              <span className="info-label">Total Fare</span>
                              <p className="info-value">{formatCurrency(booking.totalFare)}</p>
                            </div>
                          </div>

                          <hr />
                          <h6 className="fw-bold mb-3">Passenger Details</h6>
                          {passengers.length === 0 ? (
                            <p className="text-muted mb-0">
                              No passenger detail records were returned by the database.
                            </p>
                          ) : (
                            <div className="row g-3">
                              {passengers.map((passenger, index) => (
                                <div className="col-12 col-md-6" key={`${booking.id}-${index}`}>
                                  <div className="passenger-row h-100">
                                    <strong>Passenger {index + 1}</strong>
                                    <div className="row g-2 mt-1">
                                      <div className="col-5">
                                        <span className="info-label">Name</span>
                                        <p className="info-value">{passenger.name || "N/A"}</p>
                                      </div>
                                      <div className="col-3">
                                        <span className="info-label">Age</span>
                                        <p className="info-value">{passenger.age ?? "N/A"}</p>
                                      </div>
                                      <div className="col-4">
                                        <span className="info-label">Gender</span>
                                        <p className="info-value">{passenger.gender || "N/A"}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default TrainBookings;
