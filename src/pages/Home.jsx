import { useState } from "react";

import SearchForm from "../components/SearchForm";
import PNRStatus from "../components/PNRStatus";

import {
  FaTrain,
  FaRupeeSign,
  FaChair,
  FaSearch,
  FaTicketAlt,
  FaPlane,
  FaEye,
  FaUtensils,
  FaCheckCircle,
  FaShieldAlt,
  FaBolt,
  FaHeadset,
} from "react-icons/fa";

function Home() {
  const [activeTab, setActiveTab] = useState("search");

  const servicesList = [
    { id: 1, title: "Running Status", icon: <FaTrain /> },
    { id: 2, title: "PNR Status Enquiry", icon: <FaTicketAlt /> },
    { id: 3, title: "Seat Availability", icon: <FaChair /> },
    { id: 4, title: "Search By Name/Number", icon: <FaSearch /> },
    { id: 5, title: "Tatkal Reservation", icon: <FaRupeeSign /> },
    { id: 6, title: "Vande Bharat Express", icon: <FaTrain /> },
    { id: 7, title: "IRCTC Food Booking", icon: <FaUtensils /> },
    { id: 8, title: "Flight Service", icon: <FaPlane /> },
    { id: 9, title: "Rail Drishti", icon: <FaEye /> },
  ];

  const features = [
    {
      id: 1,
      icon: <FaBolt />,
      title: "Instant Booking",
      text: "Confirm your seat in just a few clicks.",
    },
    {
      id: 2,
      icon: <FaShieldAlt />,
      title: "Safe & Secure",
      text: "Your journey details stay protected.",
    },
    {
      id: 3,
      icon: <FaTicketAlt />,
      title: "Easy Cancellation",
      text: "Cancel a single ticket or full booking.",
    },
    {
      id: 4,
      icon: <FaHeadset />,
      title: "24x7 Support",
      text: "Help is available whenever you need it.",
    },
  ];

  return (
    <>
      {/* ==================== HERO ==================== */}

      <section className="home-hero">

        <div className="hero-overlay"></div>

        <div className="container hero-content">
          <div className="row align-items-center g-4">

            {/* Left Text */}
            <div className="col-lg-5 order-lg-2">

              <div className="hero-tagline">

                <span className="hero-badge">
                  Indian Railways · Online Reservation
                </span>

                <h1>
                  Your Journey Begins With{" "}
                  <span className="accent">RailBook</span>
                </h1>

                <p>
                  Search trains, compare classes, check
                  live seat availability and book
                  confirmed tickets — everything in one
                  simple place.
                </p>

                <ul className="hero-points">
                  <li>
                    <FaCheckCircle /> 1A · 2A · Sleeper
                  </li>
                  <li>
                    <FaCheckCircle /> Instant PNR Status
                  </li>
                  <li>
                    <FaCheckCircle /> Up to 6 Seats
                  </li>
                </ul>

              </div>

            </div>

            {/* Booking Box */}
            <div className="col-lg-7 order-lg-1">

              <div className="booking-box">

                <div className="booking-title">
                  <span>🚆</span>
                  <h2>BOOK YOUR TICKET</h2>
                </div>

                <div className="booking-tabs mb-4">

                  <button
                    type="button"
                    className={`booking-tab ${
                      activeTab === "search" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("search")}
                  >
                    🔎 Search Trains
                  </button>

                  <button
                    type="button"
                    className={`booking-tab ${
                      activeTab === "pnr" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("pnr")}
                  >
                    🎫 PNR Status
                  </button>

                </div>

                {activeTab === "search" ? (
                  <SearchForm />
                ) : (
                  <PNRStatus />
                )}

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ==================== FEATURES ==================== */}

      <section className="feature-strip">
        <div className="container">

          <div className="row g-3">

            {features.map((feature) => (
              <div
                className="col-6 col-lg-3"
                key={feature.id}
              >
                <div className="feature-item">

                  <div className="feature-icon">
                    {feature.icon}
                  </div>

                  <h5>{feature.title}</h5>

                  <p>{feature.text}</p>

                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ==================== EXPLORE ==================== */}

      <section className="explore-section">
        <div className="container">

          <h3 className="section-title">
            Explore More With RailBook
          </h3>

          <p className="section-subtitle">
            Quick links to the services travellers use the
            most
          </p>

          <div className="row g-3">

            {servicesList.map((service) => (
              <div
                className="col-4 col-sm-3 col-md-2"
                key={service.id}
              >
                <div className="explore-card">

                  <div className="explore-icon">
                    {service.icon}
                  </div>

                  <h6>{service.title}</h6>

                </div>
              </div>
            ))}

          </div>

        </div>
      </section>
    </>
  );
}

export default Home;
