import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaTrain,
  FaTicketAlt,
  FaUserFriends,
  FaRupeeSign,
  FaArrowRight,
} from "react-icons/fa";

import { loadTrains, getBookings } from "../utils/helpers";

function AdminDashboard() {
  const [stats, setStats] = useState({
    trains: 0,
    bookings: 0,
    passengers: 0,
    revenue: 0,
  });

  useEffect(() => {
    const load = async () => {
      const trains = await loadTrains();
      const bookings = getBookings();

      const passengers = bookings.reduce(
        (total, booking) =>
          total + (booking.passengers?.length || 0),
        0
      );

      const revenue = bookings.reduce(
        (total, booking) =>
          total + (booking.totalFare || 0),
        0
      );

      setStats({
        trains: trains.length,
        bookings: bookings.length,
        passengers,
        revenue,
      });
    };

    load();
  }, []);

  const statCards = [
    {
      id: 1,
      label: "Total Trains",
      value: stats.trains,
      icon: <FaTrain />,
      color: "#1565d8",
    },
    {
      id: 2,
      label: "Total Bookings",
      value: stats.bookings,
      icon: <FaTicketAlt />,
      color: "#16a34a",
    },
    {
      id: 3,
      label: "Total Passengers",
      value: stats.passengers,
      icon: <FaUserFriends />,
      color: "#7c3aed",
    },
    {
      id: 4,
      label: "Total Revenue",
      value: `₹${stats.revenue}`,
      icon: <FaRupeeSign />,
      color: "#f59e0b",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="container">

          <h2>Admin Dashboard</h2>

          <p>
            Manage trains, monitor bookings and track
            revenue
          </p>

        </div>
      </div>

      <div className="container page-body pb-5">

        {/* Stats */}
        <div className="row g-3 mb-4">

          {statCards.map((card) => (
            <div
              className="col-6 col-lg-3"
              key={card.id}
            >
              <div className="stat-card">

                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: card.color,
                  }}
                >
                  {card.icon}
                </div>

                <div>
                  <div className="stat-value">
                    {card.value}
                  </div>

                  <p className="stat-label">
                    {card.label}
                  </p>
                </div>

              </div>
            </div>
          ))}

        </div>

        {/* Actions */}
        <div className="row g-4">

          <div className="col-md-6">
            <div className="card admin-action-card">
              <div className="card-body text-center p-4 p-md-5">

                <div
                  className="admin-action-icon"
                  style={{
                    background:
                      "linear-gradient(135deg, #1565d8, #0b2c53)",
                  }}
                >
                  <FaTrain />
                </div>

                <h4 className="mb-2">Manage Trains</h4>

                <p className="text-muted">
                  Add new trains, update train details,
                  set class-wise seats and fares, and
                  remove trains from the system.
                </p>

                <Link
                  to="/admin/trains"
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                >
                  Manage Trains <FaArrowRight />
                </Link>

              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card admin-action-card">
              <div className="card-body text-center p-4 p-md-5">

                <div
                  className="admin-action-icon"
                  style={{
                    background:
                      "linear-gradient(135deg, #16a34a, #065f46)",
                  }}
                >
                  <FaTicketAlt />
                </div>

                <h4 className="mb-2">
                  Manage Bookings
                </h4>

                <p className="text-muted">
                  Select any train and view all the user
                  bookings made for that train, with the
                  option to cancel tickets.
                </p>

                <Link
                  to="/admin/bookings"
                  className="btn btn-success d-inline-flex align-items-center gap-2"
                >
                  View Train Bookings <FaArrowRight />
                </Link>

              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

export default AdminDashboard;
