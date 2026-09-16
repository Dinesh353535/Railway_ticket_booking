import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FaTicketAlt, FaSearch } from "react-icons/fa";

import { getBookings } from "../utils/helpers";

/*
  PNR Status form (shown on the Home page).

  - Correct PNR  -> opens the booking details in a
                    separate page (/pnr-status/:pnr)
  - Wrong PNR    -> error message is shown here itself
                    on the home page
*/
function PNRStatus() {
  const [pnr, setPnr] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleCheckPNR = (e) => {
    e.preventDefault();

    setError("");

    const enteredPNR = pnr.trim();

    if (!enteredPNR) {
      setError("Please enter your PNR number.");
      return;
    }

    if (!/^\d{10}$/.test(enteredPNR)) {
      setError(
        "Please enter a valid 10-digit PNR number."
      );
      return;
    }

    const bookings = getBookings();

    const foundBooking = bookings.find(
      (booking) => booking.pnr === enteredPNR
    );

    if (!foundBooking) {
      /* Wrong PNR -> stay on home page with an error */
      setError(
        "No booking found for the entered PNR number. Please check and try again."
      );
      return;
    }

    /* Correct PNR -> open details in a new page */
    navigate(`/pnr-status/${enteredPNR}`);
  };

  return (
    <div className="pnr-status-box">

      <form onSubmit={handleCheckPNR}>

        <div className="mb-3">

          <label className="form-label d-flex align-items-center gap-2">
            <FaTicketAlt className="text-primary" />
            Enter PNR Number
          </label>

          <input
            type="text"
            className={`form-control form-control-lg ${
              error ? "is-invalid" : ""
            }`}
            placeholder="10-digit PNR number"
            value={pnr}
            maxLength="10"
            inputMode="numeric"
            onChange={(e) => {
              const value = e.target.value.replace(
                /\D/g,
                ""
              );

              setPnr(value);
              setError("");
            }}
          />

          <small className="text-muted">
            Your PNR number is printed on the ticket
            confirmation page.
          </small>

        </div>

        {error && (
          <div className="alert alert-danger py-2 mb-3">
            <strong>⚠ </strong>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-100 btn-lg d-flex align-items-center justify-content-center gap-2"
        >
          <FaSearch /> Check PNR Status
        </button>

      </form>

    </div>
  );
}

export default PNRStatus;
