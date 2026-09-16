import { Link } from "react-router-dom";

import {
  FaTrain,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="rb-footer">
      <div className="container">

        <div className="row g-4">

          {/* Brand */}
          <div className="col-lg-4 col-md-6">

            <h5 className="d-flex align-items-center gap-2 mb-3">
              <FaTrain /> RailBook
            </h5>

            <p className="mb-0" style={{ fontSize: "0.92rem" }}>
              Book train tickets in a few clicks. Search
              trains, check seat availability, track PNR
              status and manage your journeys — all in one
              place.
            </p>

          </div>

          {/* Quick Links */}
          <div className="col-lg-3 col-md-6">

            <h6 className="mb-3">Quick Links</h6>

            <div className="d-flex flex-column">
              <Link to="/">Home</Link>
              <Link to="/my-bookings">My Bookings</Link>
              <Link to="/passenger-login">
                Passenger Login
              </Link>
              <Link to="/register">Register</Link>
            </div>

          </div>

          {/* Services */}
          <div className="col-lg-2 col-md-6">

            <h6 className="mb-3">Services</h6>

            <div className="d-flex flex-column">
              <Link to="/">PNR Status</Link>
              <Link to="/">Seat Availability</Link>
              <Link to="/">Train Search</Link>
              <Link to="/admin-login">Admin Login</Link>
            </div>

          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6">

            <h6 className="mb-3">Contact Us</h6>

            <p className="d-flex align-items-center gap-2 mb-2"
              style={{ fontSize: "0.9rem" }}
            >
              <FaPhoneAlt /> 139 (Rail Madad)
            </p>

            <p className="d-flex align-items-center gap-2 mb-2"
              style={{ fontSize: "0.9rem" }}
            >
              <FaEnvelope /> support@railbook.in
            </p>

            <p className="d-flex align-items-center gap-2 mb-0"
              style={{ fontSize: "0.9rem" }}
            >
              <FaMapMarkerAlt /> Secunderabad, India
            </p>

          </div>

        </div>

        <div className="footer-bottom">
          © 2026 RailBook — Train Ticket Booking System ·
          Frontend project built with React &amp; Bootstrap
        </div>

      </div>
    </footer>
  );
}

export default Footer;
