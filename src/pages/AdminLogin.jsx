import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUserShield,
  FaUser,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";

import { loginAdmin } from "../utils/auth";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    setError("");

    if (
      username === "admin" &&
      password === "admin123"
    ) {
      /* Stored in sessionStorage -> closing the
         window logs the admin out automatically. */
      loginAdmin();
      navigate("/admin-dashboard");
    } else {
      setError("Invalid username or password.");
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
                  <FaUserShield />
                </div>

                <h2>Admin Login</h2>

                <p>
                  Manage trains and passenger bookings
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
                      <FaUser className="text-primary" />
                      Username
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
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
                      placeholder="Enter password"
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

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
