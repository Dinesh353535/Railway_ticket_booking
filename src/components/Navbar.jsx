import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  FaTrain,
  FaHome,
  FaClipboardList,
  FaSignOutAlt,
  FaUserCircle,
  FaChevronDown,
  FaUserShield,
} from "react-icons/fa";

import {
  isAdminLoggedIn,
  isPassengerLoggedIn,
  getLoggedInPassenger,
  logoutAdmin,
  logoutPassenger,
} from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = isAdminLoggedIn();
  const isPassenger = isPassengerLoggedIn();
  const loggedInPassenger = getLoggedInPassenger();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, []);

  const showHome =
    location.pathname === "/admin-login" ||
    location.pathname === "/passenger-login" ||
    location.pathname === "/register";

  const handleAdminLogout = () => {
    logoutAdmin();
    navigate("/admin-login");
  };

  const handlePassengerLogout = () => {
    logoutPassenger();
    navigate("/");
  };

  const firstLetter =
    loggedInPassenger?.name?.charAt(0)?.toUpperCase() ||
    "P";

  return (
    <nav className="navbar navbar-expand-lg navbar-dark rb-navbar sticky-top">

      <div className="container">

        {/* =====================================================
            LOGO
        ===================================================== */}

        <Link
          className="navbar-brand fw-bold d-flex align-items-center"
          to="/"
        >
          <FaTrain className="me-2" />

          <span>
            Rail<span className="brand-accent">Book</span>
          </span>
        </Link>

        {/* =====================================================
            MOBILE TOGGLE
        ===================================================== */}

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse"
          id="navbarNav"
        >

          {/* ===================================================
              PASSENGER LOGGED IN
          =================================================== */}

          {isPassenger && !isAdmin ? (

            <>
              <div className="mx-lg-auto">

                <span className="welcome-chip d-inline-flex align-items-center">

                  <span className="chip-avatar">
                    {firstLetter}
                  </span>

                  Welcome, {loggedInPassenger?.name}

                </span>

              </div>

              <ul className="navbar-nav align-items-lg-center gap-lg-1">

                <li className="nav-item">

                  <Link
                    className={`nav-link text-white fw-semibold d-flex align-items-center gap-2 ${
                      location.pathname === "/"
                        ? "active"
                        : ""
                    }`}
                    to="/"
                  >
                    <FaHome />
                    Home
                  </Link>

                </li>

                <li className="nav-item">

                  <Link
                    className={`nav-link text-white fw-semibold d-flex align-items-center gap-2 ${
                      location.pathname === "/my-bookings"
                        ? "active"
                        : ""
                    }`}
                    to="/my-bookings"
                  >
                    <FaClipboardList />
                    My Bookings
                  </Link>

                </li>

                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">

                  <button
                    className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                    onClick={handlePassengerLogout}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>

                </li>

              </ul>
            </>

          ) : isAdmin ? (

            /* =================================================
               ADMIN LOGGED IN
            ================================================= */

            <>

              <div className="mx-lg-auto">

                <span className="welcome-chip d-inline-flex align-items-center">

                  <FaUserShield className="me-2" />

                  Administrator

                </span>

              </div>

              <ul className="navbar-nav align-items-lg-center gap-lg-1">

                <li className="nav-item">

                  <Link
                    className="nav-link text-white fw-semibold d-flex align-items-center gap-2"
                    to="/admin-dashboard"
                  >
                    <FaHome />
                    Dashboard
                  </Link>

                </li>

                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">

                  <button
                    className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                    onClick={handleAdminLogout}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>

                </li>

              </ul>

            </>

          ) : (

            /* =================================================
               NOT LOGGED IN
            ================================================= */

            <ul className="navbar-nav ms-auto align-items-lg-center">

              {showHome && (

                <li className="nav-item me-lg-3">

                  <Link
                    className="nav-link text-white fw-semibold d-flex align-items-center gap-2"
                    to="/"
                  >
                    <FaHome />
                    Home
                  </Link>

                </li>

              )}

              <li
                className="nav-item login-dropdown"
                ref={dropdownRef}
              >

                <button
                  type="button"
                  className="btn btn-light text-primary fw-semibold d-flex align-items-center gap-2"
                  onClick={() =>
                    setShowDropdown(!showDropdown)
                  }
                >

                  <FaUserCircle />

                  LOGIN / REGISTER

                  <FaChevronDown size={11} />

                </button>

                {showDropdown && (

                  <div className="login-menu">

                    <Link
                      className="login-menu-item"
                      to="/passenger-login"
                      onClick={() =>
                        setShowDropdown(false)
                      }
                    >
                      Passenger Login
                    </Link>

                    <Link
                      className="login-menu-item"
                      to="/admin-login"
                      onClick={() =>
                        setShowDropdown(false)
                      }
                    >
                      Admin Login
                    </Link>

                    <div className="login-divider"></div>

                    <Link
                      className="login-menu-item register-item"
                      to="/register"
                      onClick={() =>
                        setShowDropdown(false)
                      }
                    >
                      Create New Account
                    </Link>

                  </div>

                )}

              </li>

            </ul>

          )}

        </div>

      </div>

    </nav>
  );
}

export default Navbar;