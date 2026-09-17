import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaTrain,
  FaTicketAlt,
  FaUsers,
  FaRupeeSign,
  FaArrowRight,
} from "react-icons/fa";
import {
  loadTrains,
  getBookings,
} from "../utils/helpers";

function AdminDashboard() {
  const [stats, setStats] = useState({
    trains: 0,
    bookings: 0,
    passengers: 0,
    revenue: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      const trains = await loadTrains();
      const bookings = getBookings();

      const passengers = bookings.reduce(
        (total, booking) =>
          total + (booking.passengers?.length || 0),
        0
      );

      const revenue = bookings.reduce(
        (total, booking) =>
          total + (Number(booking.totalFare) || 0),
        0
      );

      setStats({
        trains: trains.length,
        bookings: bookings.length,
        passengers,
        revenue,
      });
    };

    loadDashboard();
  }, []);

  const statsData = [
    {
      title: "Total Trains",
      value: stats.trains,
      icon: <FaTrain />,
      iconClass: "bg-primary",
    },
    {
      title: "Total Bookings",
      value: stats.bookings,
      icon: <FaTicketAlt />,
      iconClass: "bg-success",
    },
    {
      title: "Total Passengers",
      value: stats.passengers,
      icon: <FaUsers />,
      iconClass: "bg-",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.revenue}`,
      icon: <FaRupeeSign />,
      iconClass: "bg-warning text-dark",
    },
  ];

  return (
    <>
      {/* =====================================================
          DASHBOARD HEADER
      ===================================================== */}

      <div className="page-header">
        <div className="container">

          <h2 className="fw-bold mb-2">
            Admin Dashboard
          </h2>

          <p className="mb-0">
            Manage trains, monitor bookings and track revenue
          </p>

        </div>
      </div>

      {/* =====================================================
          DASHBOARD CONTENT
      ===================================================== */}

      <div className="container page-body pb-5">

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="row row-cols-2 row-cols-lg-4 g-3 mb-4">

          {statsData.map((item, index) => (

            <div
              className="col"
              key={index}
            >

              <div className="card h-100 border-0 shadow-sm rounded-4">

                <div className="card-body p-3 p-sm-4">

                  <div
                    className="
                      d-flex
                      flex-column
                      flex-sm-row
                      align-items-center
                      justify-content-center
                      justify-content-sm-start
                      text-center
                      text-sm-start
                      gap-2
                      gap-sm-3
                    "
                  >

                    {/* =================================================
                        ICON
                    ================================================= */}

                    <div
                      className={`
                        ${item.iconClass}
                        text-white
                        rounded-3
                        d-flex
                        align-items-center
                        justify-content-center
                        flex-shrink-0
                      `}
                      style={{
                        width: "52px",
                        height: "52px",
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* =================================================
                        NUMBER + LABEL
                    ================================================= */}

                    <div className="overflow-hidden">

                      <div
                        className="
                          fw-bold
                          fs-4
                          lh-1
                          text-nowrap
                        "
                      >
                        {item.value}
                      </div>

                      <div
                        className="
                          small
                          text-secondary
                          mt-2
                        "
                      >
                        {item.title}
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* =====================================================
            ACTION CARDS
        ===================================================== */}

        <div className="row g-4">

          {/* =================================================
              MANAGE TRAINS
          ================================================= */}

          <div className="col-12 col-md-6">

            <div className="card h-100 border-0 shadow-sm rounded-4">

              <div className="card-body text-center p-4 p-lg-5">

                <div
                  className="
                    bg-primary
                    text-white
                    rounded-4
                    d-flex
                    align-items-center
                    justify-content-center
                    mx-auto
                    mb-4
                  "
                  style={{
                    width: "68px",
                    height: "68px",
                  }}
                >

                  <FaTrain size={28} />

                </div>

                <h4 className="fw-bold mb-3">
                  Manage Trains
                </h4>

                <p className="text-secondary mb-4">
                  Add new trains, update train details,
                  manage class-wise seats and fares, and
                  remove trains from the system.
                </p>

                <Link
                  to="/admin/trains"
                  className="
                    btn
                    btn-primary
                    d-inline-flex
                    align-items-center
                    justify-content-center
                    gap-2
                  "
                >
                  Manage Trains
                  <FaArrowRight />
                </Link>

              </div>

            </div>

          </div>

          {/* =================================================
              MANAGE BOOKINGS
          ================================================= */}

          <div className="col-12 col-md-6">

            <div className="card h-100 border-0 shadow-sm rounded-4">

              <div className="card-body text-center p-4 p-lg-5">

                <div
                  className="
                    bg-success
                    text-white
                    rounded-4
                    d-flex
                    align-items-center
                    justify-content-center
                    mx-auto
                    mb-4
                  "
                  style={{
                    width: "68px",
                    height: "68px",
                  }}
                >

                  <FaTicketAlt size={28} />

                </div>

                <h4 className="fw-bold mb-3">
                  Manage Bookings
                </h4>

                <p className="text-secondary mb-4">
                  Select any train and view all bookings
                  made for that train and manage tickets.
                </p>

                <Link
                  to="/admin/bookings"
                  className="
                    btn
                    btn-success
                    d-inline-flex
                    align-items-center
                    justify-content-center
                    gap-2
                  "
                >
                  View Train Bookings
                  <FaArrowRight />
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