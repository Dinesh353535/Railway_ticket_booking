
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUserCircle,
  FaEnvelope,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";

import { loginPassenger } from "../utils/auth";

// Keep the base URL without the /api suffix.
// .env: VITE_API_BASE_URL=http://localhost:5000
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function PassengerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Unexpected server response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || !data.success) {
        setError(
          data.message || "Login failed. Please check your credentials."
        );
        return;
      }

      const user = data.user;

      if (!user || !user.id || !user.role) {
        setError("Login response is incomplete. Please try again.");
        return;
      }

      // Save the user in the existing frontend login helper.
      loginPassenger(user);

      // Continue a booking if the passenger was redirected here to log in.
      const pendingTrainId = sessionStorage.getItem(
        "pendingBookingTrainId"
      );

      if (pendingTrainId) {
        sessionStorage.removeItem("pendingBookingTrainId");
        navigate(`/booking/${encodeURIComponent(pendingTrainId)}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Check Flask and the API URL."
          : err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
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
                  <div
                    className="alert alert-danger py-2"
                    role="alert"
                  >
                    <strong>⚠ </strong>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label
                      htmlFor="passenger-email"
                      className="form-label d-flex align-items-center gap-2"
                    >
                      <FaEnvelope className="text-primary" />
                      Email
                    </label>

                    <input
                      id="passenger-email"
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="passenger-password"
                      className="form-label d-flex align-items-center gap-2"
                    >
                      <FaLock className="text-primary" />
                      Password
                    </label>

                    <input
                      id="passenger-password"
                      type="password"
                      className="form-control"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 btn-lg d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    <FaSignInAlt />
                    {loading ? "Logging in..." : "Login"}
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
