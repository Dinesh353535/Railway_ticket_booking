import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";

// .env should contain:
// VITE_API_BASE_URL=http://localhost:5000
//
// Flask registration endpoint:
// http://localhost:5000/api/auth/register

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError("Please fill all the fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password,
          }),
        }
      );

      // Read the response safely in case the server returns non-JSON.
      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Unexpected server response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || !data.success) {
        setError(data.message || `Registration failed (HTTP ${response.status}).`);
        return;
      }

      setSuccess(
        "Registration successful! Redirecting to login..."
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/passenger-login");
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the server. Check that Flask is running and the API URL is correct."
        );
      } else {
        setError(
          err.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-9 col-lg-6">
            <div className="card auth-card">
              <div className="auth-head">
                <div className="auth-icon">
                  <FaUserPlus />
                </div>

                <h2>Create Your Account</h2>

                <p>
                  Register once and book tickets faster
                  every time
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

                {success && (
                  <div
                    className="alert alert-success py-2"
                    role="status"
                  >
                    <strong>✓ </strong>
                    {success}
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  <div className="mb-3">
                    <label
                      htmlFor="register-name"
                      className="form-label d-flex align-items-center gap-2"
                    >
                      <FaUser className="text-primary" />
                      Full Name
                    </label>

                    <input
                      id="register-name"
                      type="text"
                      className="form-control"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="register-email"
                      className="form-label d-flex align-items-center gap-2"
                    >
                      <FaEnvelope className="text-primary" />
                      Email
                    </label>

                    <input
                      id="register-email"
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

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label
                        htmlFor="register-password"
                        className="form-label d-flex align-items-center gap-2"
                      >
                        <FaLock className="text-primary" />
                        Password
                      </label>

                      <input
                        id="register-password"
                        type="password"
                        className="form-control"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        minLength={6}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="col-md-6">
                      <label
                        htmlFor="register-confirm-password"
                        className="form-label d-flex align-items-center gap-2"
                      >
                        <FaLock className="text-primary" />
                        Confirm Password
                      </label>

                      <input
                        id="register-confirm-password"
                        type="password"
                        className="form-control"
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        minLength={6}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 btn-lg mt-4 d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    <FaUserPlus />
                    {loading ? "Registering..." : "Register"}
                  </button>
                </form>

                <p className="text-center mt-4 mb-0 text-muted">
                  Already have an account?{" "}
                  <Link
                    to="/passenger-login"
                    className="fw-semibold"
                  >
                    Login here
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

export default Register;