
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUserShield,
  FaUser,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";

import { loginAdmin } from "../utils/auth";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Admin login failed.");
        return;
      }

      // Preserve the existing app's admin login helper.
      loginAdmin();

      navigate("/admin-dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      setError(
        "Cannot connect to Flask. Please check whether the backend is running."
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
                  <FaUserShield />
                </div>

                <h2>Admin Login</h2>

                <p>
                  Manage trains and passenger bookings
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
                    <label className="form-label d-flex align-items-center gap-2">
                      <FaUser className="text-primary" />
                      Username
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      required
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
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      required
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
