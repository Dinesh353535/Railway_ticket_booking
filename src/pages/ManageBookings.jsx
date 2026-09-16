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
  loadTrains,
  getBookings,
  formatDate,
} from "../utils/helpers";

/*
  Admin -> Manage Bookings

  Shows the list of trains. Each train has a
  "View Bookings" option. Clicking it opens all the
  user bookings made for that particular train.
*/
function ManageBookings() {
  const [trains, setTrains] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const trainList = await loadTrains();
      const bookingList = getBookings();

      /*
        Some bookings may belong to a train that the
        admin deleted later. Those trains are added to
        the list from the booking data itself so their
        bookings are still visible.
      */
      const extraTrains = [];

      bookingList.forEach((booking) => {
        const existsInTrains = trainList.some(
          (train) => train.id === booking.trainId
        );

        const alreadyAdded = extraTrains.some(
          (train) => train.id === booking.trainId
        );

        if (!existsInTrains && !alreadyAdded) {
          extraTrains.push({
            id: booking.trainId,
            trainName: booking.trainName,
            trainNumber: booking.trainNumber,
            source: booking.source,
            destination: booking.destination,
            date: booking.date,
            departure: booking.departure,
            arrival: booking.arrival,
            removed: true,
          });
        }
      });

      setTrains([...trainList, ...extraTrains]);
      setBookings(bookingList);
      setLoading(false);
    };

    load();
  }, []);

  /* Booking summary for one train */
  const getTrainSummary = (trainId) => {
    const trainBookings = bookings.filter(
      (booking) => booking.trainId === trainId
    );

    const totalPassengers = trainBookings.reduce(
      (total, booking) =>
        total + (booking.passengers?.length || 0),
      0
    );

    const totalRevenue = trainBookings.reduce(
      (total, booking) =>
        total + (booking.totalFare || 0),
      0
    );

    return {
      count: trainBookings.length,
      totalPassengers,
      totalRevenue,
    };
  };

  const filteredTrains = trains.filter((train) => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return true;
    }

    return (
      train.trainName?.toLowerCase().includes(text) ||
      train.trainNumber?.toLowerCase().includes(text) ||
      train.source?.toLowerCase().includes(text) ||
      train.destination?.toLowerCase().includes(text)
    );
  });

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="container">

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTicketAlt /> Manage Bookings
              </h2>

              <p>
                Select a train to view all the user
                bookings for that train
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

        {/* Search */}
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
            <div
              className="spinner-border text-primary"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
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
                <div
                  className="col-lg-6"
                  key={train.id}
                >
                  <div className="train-row-card">

                    <div className="d-flex align-items-start gap-3">

                      <div className="train-avatar">
                        <FaTrain />
                      </div>

                      <div className="flex-grow-1">

                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">

                          <h5 className="mb-0">
                            {train.trainName}
                          </h5>

                          {train.removed && (
                            <span className="badge bg-secondary">
                              Removed Train
                            </span>
                          )}

                        </div>

                        <span className="train-number-chip">
                          Train No. {train.trainNumber}
                        </span>

                        <p className="text-muted small mb-2 mt-2">
                          {train.source} →{" "}
                          {train.destination} ·{" "}
                          {formatDate(train.date)}
                        </p>

                        <div className="d-flex flex-wrap gap-2 mb-3">

                          <span className="badge bg-primary-subtle text-primary d-flex align-items-center gap-1">
                            <FaTicketAlt />
                            {summary.count} Booking
                            {summary.count === 1
                              ? ""
                              : "s"}
                          </span>

                          <span className="badge bg-success-subtle text-success d-flex align-items-center gap-1">
                            <FaUserFriends />
                            {summary.totalPassengers}{" "}
                            Passenger
                            {summary.totalPassengers === 1
                              ? ""
                              : "s"}
                          </span>

                          <span className="badge bg-warning-subtle text-warning-emphasis">
                            ₹{summary.totalRevenue}
                          </span>

                        </div>

                        {/* View Bookings option beside the train */}
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
