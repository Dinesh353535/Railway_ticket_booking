
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTrain,
  FaArrowLeft,
  FaEye,
  FaTicketAlt,
  FaUserFriends,
  FaSearch,
} from "react-icons/fa";

import {
  loadAdminTrains,
  loadAdminBookings,
  formatDate,
} from "../utils/helpers";

function ManageBookings() {
  const [trains, setTrains] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [trainList, bookingList] = await Promise.all([
          loadAdminTrains(),
          loadAdminBookings(),
        ]);

        if (!active) return;

        // Admin API returns all database trains, including inactive ones.
        // Add a historical train only if its record is no longer available.
        const allTrains = [...trainList];

        bookingList.forEach((booking) => {
          const exists = allTrains.some(
            (train) => Number(train.id) === Number(booking.trainId)
          );

          if (!exists) {
            allTrains.push({
              id: Number(booking.trainId),
              trainName: booking.trainName,
              trainNumber: booking.trainNumber,
              source: booking.source,
              destination: booking.destination,
              date: booking.date,
              departure: booking.departure,
              arrival: booking.arrival,
              isActive: false,
              removed: true,
            });
          }
        });

        setTrains(allTrains);
        setBookings(bookingList);
      } catch (err) {
        console.error("Unable to load admin bookings:", err);
        if (active) {
          setError(
            err.message ||
              "Unable to load bookings from the database."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const getTrainSummary = (trainId) => {
    const trainBookings = bookings.filter(
      (booking) => Number(booking.trainId) === Number(trainId)
    );

    const confirmedBookings = trainBookings.filter(
      (booking) =>
        String(booking.status || booking.bookingStatus).toUpperCase() ===
        "CONFIRMED"
    );

    const totalPassengers = confirmedBookings.reduce(
      (total, booking) =>
        total + Number(booking.passengerCount ?? booking.seats ?? 0),
      0
    );

    const totalRevenue = confirmedBookings.reduce(
      (total, booking) => total + Number(booking.totalFare || 0),
      0
    );

    const cancelledCount = trainBookings.filter(
      (booking) =>
        String(booking.status || booking.bookingStatus).toUpperCase() ===
        "CANCELLED"
    ).length;

    return {
      count: trainBookings.length,
      totalPassengers,
      totalRevenue,
      cancelledCount,
    };
  };

  const text = search.trim().toLowerCase();

  const filteredTrains = trains.filter((train) => {
    if (!text) return true;

    return (
      train.trainName?.toLowerCase().includes(text) ||
      String(train.trainNumber || "").toLowerCase().includes(text) ||
      train.source?.toLowerCase().includes(text) ||
      train.destination?.toLowerCase().includes(text)
    );
  });

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTicketAlt /> Manage Bookings
              </h2>
              <p>
                View bookings and cancellation history for each train.
              </p>
            </div>

            <Link
              to="/admin-dashboard"
              className="btn btn-light d-flex align-items-center gap-2"
            >
              <FaArrowLeft /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container page-body pb-5">
        <div className="card mb-4">
          <div className="card-body">
            <label className="form-label d-flex align-items-center gap-2">
              <FaSearch className="text-primary" />
              Search Train
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Search by train name, number or station"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
            <div className="small mt-2">
              Check that Flask is running and the admin session is active.
            </div>
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="card text-center p-4 p-md-5">
            <div className="fs-1 mb-3">🚆</div>
            <h4>No Trains Found</h4>
            <p className="text-muted mb-0">
              There are no trains matching your search.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {filteredTrains.map((train) => {
              const summary = getTrainSummary(train.id);

              return (
                <div className="col-lg-6" key={train.id}>
                  <div className="train-row-card">
                    <div className="d-flex align-items-start gap-3">
                      <div className="train-avatar">
                        <FaTrain />
                      </div>

                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          <h5 className="mb-0">{train.trainName}</h5>

                          {train.removed && (
                            <span className="badge bg-secondary">
                              Inactive / Historical Train
                            </span>
                          )}
                        </div>

                        <span className="train-number-chip">
                          Train No. {train.trainNumber}
                        </span>

                        <p className="text-muted small mb-2 mt-2">
                          {train.source} → {train.destination} ·{" "}
                          {formatDate(train.date)}
                        </p>

                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span className="badge bg-primary-subtle text-primary d-flex align-items-center gap-1">
                            <FaTicketAlt />
                            {summary.count} Booking
                            {summary.count === 1 ? "" : "s"}
                          </span>

                          <span className="badge bg-success-subtle text-success d-flex align-items-center gap-1">
                            <FaUserFriends />
                            {summary.totalPassengers} Confirmed Passenger
                            {summary.totalPassengers === 1 ? "" : "s"}
                          </span>

                          <span className="badge bg-warning-subtle text-warning-emphasis">
                            Confirmed revenue: ₹
                            {summary.totalRevenue.toFixed(2)}
                          </span>

                          {summary.cancelledCount > 0 && (
                            <span className="badge bg-danger-subtle text-danger">
                              {summary.cancelledCount} Cancelled
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/admin/bookings/${train.id}`}
                          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                        >
                          <FaEye /> View Bookings
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default ManageBookings;
