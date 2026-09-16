import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill all the fields.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const users =
      JSON.parse(localStorage.getItem("users")) || [];

    const existingUser = users.find(
      (user) => user.email === email.trim()
    );

    if (existingUser) {
      setError("This email is already registered.");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      password: password,
    };

    localStorage.setItem(
      "users",
      JSON.stringify([...users, newUser])
    );

    setSuccess(
      "Registration successful! Redirecting to login..."
    );

    setTimeout(() => {
      navigate("/passenger-login");
    }, 1200);
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
                  <div className="alert alert-danger py-2">
                    <strong>⚠ </strong>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success py-2">
                    <strong>✓ </strong>
                    {success}
                  </div>
                )}

                <form onSubmit={handleRegister}>

                  <div className="mb-3">

                    <label className="form-label d-flex align-items-center gap-2">
                      <FaUser className="text-primary" />
                      Full Name
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                    />

                  </div>

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

                  <div className="row g-3">

                    <div className="col-md-6">

                      <label className="form-label d-flex align-items-center gap-2">
                        <FaLock className="text-primary" />
                        Password
                      </label>

                      <input
                        type="password"
                        className="form-control"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                      />

                    </div>

                    <div className="col-md-6">

                      <label className="form-label d-flex align-items-center gap-2">
                        <FaLock className="text-primary" />
                        Confirm Password
                      </label>

                      <input
                        type="password"
                        className="form-control"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(
                            e.target.value
                          );
                          setError("");
                        }}
                      />

                    </div>

                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 btn-lg mt-4 d-flex align-items-center justify-content-center gap-2"
                  >
                    <FaUserPlus /> Register
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
