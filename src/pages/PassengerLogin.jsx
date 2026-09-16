import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUserCircle,
  FaEnvelope,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";

import { loginPassenger } from "../utils/auth";

function PassengerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    const users =
      JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
      (item) =>
        item.email === email &&
        item.password === password
    );

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    /* Login is stored in sessionStorage,
       so closing the window logs the user out. */
    loginPassenger(user);

    const pendingTrainId = sessionStorage.getItem(
      "pendingBookingTrainId"
    );

    if (pendingTrainId) {
      sessionStorage.removeItem("pendingBookingTrainId");
      navigate(`/booking/${pendingTrainId}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">

            <div className="card auth-card">

              <div className="auth-head">

                <div className="auth-icon">
                  <FaUserCircle />
                </div>

                <h2>Passenger Login</h2>

                <p>
                  Login to book tickets and manage your
                  journeys
                </p>

              </div>

              <div className="card-body p-4 p-md-5">

                {error && (
                  <div className="alert alert-danger py-2">
                    <strong>⚠ </strong>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>

                  <div className="mb-3">

                    <label className="form-label d-flex align-items-center gap-2">
                      <FaEnvelope className="text-primary" />
                      Email
                    </label>

                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                    />

                  </div>

                  <div className="mb-4">

                    <label className="form-label d-flex align-items-center gap-2">
                      <FaLock className="text-primary" />
                      Password
                    </label>

                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                    />

                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 btn-lg d-flex align-items-center justify-content-center gap-2"
                  >
                    <FaSignInAlt /> Login
                  </button>

                </form>

                <p className="text-center mt-4 mb-0 text-muted">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/register"
                    className="fw-semibold"
                  >
                    Register here
                  </Link>
                </p>

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default PassengerLogin;
