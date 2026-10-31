import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTrain, FaTicketAlt, FaUsers, FaRupeeSign, FaSyncAlt, FaArrowRight,
} from "react-icons/fa";
import { loadAdminTrains, loadAdminBookings } from "../utils/helpers";

const statusOf = (b) =>
  String(b.status || b.bookingStatus || b.booking_status || "").trim().toUpperCase();

const rupees = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(n) || 0);

export default function AdminDashboard() {
  const [trains, setTrains] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refreshDashboard = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      // Admin endpoints read current records from MySQL, including inactive trains.
      const [trainRows, bookingRows] = await Promise.all([
        loadAdminTrains(),
        loadAdminBookings(),
      ]);
      setTrains(Array.isArray(trainRows) ? trainRows : []);
      setBookings(Array.isArray(bookingRows) ? bookingRows : []);
    } catch (err) {
      console.error("Admin dashboard refresh failed:", err);
      setError(err.message || "Unable to load dashboard data from the database.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => statusOf(b) === "CONFIRMED");
    const cancelled = bookings.filter((b) => statusOf(b) === "CANCELLED");
    const passengerCount = (b) =>
      Number(b.passengerCount ?? b.passengers?.length ?? b.seats ?? 0);
    const fare = (b) => Number(b.totalFare || 0);

    const activeTrains = trains.filter((t) =>
      t.isActive === true || t.isActive === 1 ||
      String(t.isActive).toLowerCase() === "true" ||
      String(t.isActive) === "1"
    );
    const inactiveTrains = trains.filter((t) => !(
      t.isActive === true || t.isActive === 1 ||
      String(t.isActive).toLowerCase() === "true" ||
      String(t.isActive) === "1"
    ));

    const confirmedPassengers = confirmed.reduce((sum, b) => sum + passengerCount(b), 0);
    const cancelledPassengers = cancelled.reduce((sum, b) => sum + passengerCount(b), 0);
    const confirmedRevenue = confirmed.reduce((sum, b) => sum + fare(b), 0);
    const cancelledRevenue = cancelled.reduce((sum, b) => sum + fare(b), 0);

    return {
      totalTrains: trains.length,
      activeTrains: activeTrains.length,
      inactiveTrains: inactiveTrains.length,
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      cancelledBookings: cancelled.length,
      confirmedPassengers,
      cancelledPassengers,
      totalPassengers: confirmedPassengers + cancelledPassengers,
      confirmedRevenue,
      cancelledRevenue,
      totalRevenue: confirmedRevenue + cancelledRevenue,
    };
  }, [trains, bookings]);

  const cards = [
    {
      id: "trains", title: "Total Trains", value: stats.totalTrains,
      icon: <FaTrain />, color: "#0d2b50",
      split: [
        ["Active Trains", stats.activeTrains, "confirmed"],
        ["Inactive Trains", stats.inactiveTrains, "cancelled"],
      ],
    },
    {
      id: "bookings", title: "Total Bookings", value: stats.totalBookings,
      icon: <FaTicketAlt />, color: "#198754",
      split: [
        ["Confirmed Bookings", stats.confirmedBookings, "confirmed"],
        ["Cancelled Bookings", stats.cancelledBookings, "cancelled"],
      ],
    },
    {
      id: "passengers", title: "Total Passengers", value: stats.totalPassengers,
      icon: <FaUsers />, color: "#dc3545",
      split: [
        ["Confirmed Passengers", stats.confirmedPassengers, "confirmed"],
        ["Cancelled Passengers", stats.cancelledPassengers, "cancelled"],
      ],
    },
    {
      id: "revenue", title: "Total Revenue", value: rupees(stats.totalRevenue),
      icon: <FaRupeeSign />, color: "#ffb900",
      split: [
        ["Confirmed Fare", rupees(stats.confirmedRevenue), "confirmed"],
        ["Cancelled Fare", rupees(stats.cancelledRevenue), "cancelled"],
      ],
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="mb-1">Admin Dashboard</h2>
              <p className="mb-0">Manage trains, monitor bookings and track revenue</p>
            </div>
            <button
              type="button"
              className="btn btn-light d-inline-flex align-items-center gap-2"
              onClick={() => refreshDashboard(true)}
              disabled={loading || refreshing}
            >
              <FaSyncAlt className={refreshing ? "fa-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </div>

      <div className="container page-body pb-5">
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Dashboard data could not be loaded.</strong>
            <div>{error}</div>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm mt-2"
              onClick={() => refreshDashboard(true)}
              disabled={refreshing}
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading dashboard...</span>
            </div>
            <p className="text-muted mt-2">Loading latest data from MySQL...</p>
          </div>
        ) : !error ? (
          <>
            <div className="row g-3 mb-4">
              {cards.map((card) => (
                <div className="col-12 col-sm-6 col-xl-3" key={card.id}>
                  <div
                    className="stat-card dashboard-hover-card has-split h-100"
                    tabIndex={0}
                    aria-label={`${card.title}: hover or focus for breakdown`}
                  >
                    <div className="stat-icon" style={{ backgroundColor: card.color }}>
                      {card.icon}
                    </div>
                    <div className="dashboard-stat-content">
                      <div className="stat-value">{card.value}</div>
                      <p className="stat-label mb-0">{card.title}</p>
                      <small className="text-muted dashboard-hint">{card.hint}</small>
                    </div>
                    <div className="dashboard-breakdown">
                      {card.split.map(([label, value, type]) => (
                        <div className={`dashboard-breakdown-row ${type}`} key={label}>
                          <span>{label}</span><strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4 p-md-5">
                    <div className="dashboard-action-icon train-action"><FaTrain /></div>
                    <h4 className="fw-bold">Manage Trains</h4>
                    <p className="text-muted">Add trains, update details, manage class-wise seats and fares, and deactivate trains.</p>
                    <Link to="/admin/trains" className="btn btn-primary d-inline-flex align-items-center gap-2">
                      Manage Trains <FaArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4 p-md-5">
                    <div className="dashboard-action-icon bookings-action"><FaTicketAlt /></div>
                    <h4 className="fw-bold">Manage Bookings</h4>
                    <p className="text-muted">View bookings and cancellation history using current database statuses.</p>
                    <Link to="/admin/bookings" className="btn btn-success d-inline-flex align-items-center gap-2">
                      View Train Bookings <FaArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
