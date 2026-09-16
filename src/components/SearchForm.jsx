import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSearch,
  FaExchangeAlt,
} from "react-icons/fa";

import { loadTrains } from "../utils/helpers";

function SearchForm() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");

  const [locations, setLocations] = useState([]);

  const [
    showSourceSuggestions,
    setShowSourceSuggestions,
  ] = useState(false);

  const [
    showDestinationSuggestions,
    setShowDestinationSuggestions,
  ] = useState(false);

  const [error, setError] = useState("");

  const navigate = useNavigate();

  /* Build the station list from the train data */
  useEffect(() => {
    const loadLocations = async () => {
      const trains = await loadTrains();

      const allLocations = [
        ...trains.map((train) => train.source),
        ...trains.map((train) => train.destination),
      ];

      setLocations([...new Set(allLocations)]);
    };

    loadLocations();
  }, []);

  const sourceSuggestions = locations.filter((location) =>
    location.toLowerCase().includes(source.toLowerCase())
  );

  const destinationSuggestions = locations.filter(
    (location) =>
      location
        .toLowerCase()
        .includes(destination.toLowerCase())
  );

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!source.trim() || !destination.trim() || !date) {
      setError("Please fill in all search details.");
      return;
    }

    if (
      source.trim().toLowerCase() ===
      destination.trim().toLowerCase()
    ) {
      setError(
        "Source and destination cannot be the same."
      );
      return;
    }

    setError("");

    navigate(
      `/search?source=${encodeURIComponent(
        source.trim()
      )}&destination=${encodeURIComponent(
        destination.trim()
      )}&date=${date}`
    );
  };

  return (
    <div className="card shadow p-4 search-card">

      <h3 className="text-center mb-4">Search Trains</h3>

      {error && (
        <div className="alert alert-danger py-2">
          <strong>⚠ </strong>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="row g-3">

          {/* FROM */}
          <div className="col-12 col-md-5 position-relative">

            <label className="form-label d-flex align-items-center gap-2">
              <FaMapMarkerAlt className="text-primary" />
              From
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter source station"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setShowSourceSuggestions(true);
                setError("");
              }}
              onFocus={() =>
                setShowSourceSuggestions(true)
              }
              onBlur={() => {
                setTimeout(
                  () => setShowSourceSuggestions(false),
                  150
                );
              }}
            />

            {showSourceSuggestions &&
              source.trim() !== "" &&
              sourceSuggestions.length > 0 && (
                <div className="suggestion-box">
                  {sourceSuggestions.map(
                    (location, index) => (
                      <button
                        type="button"
                        className="suggestion-item"
                        key={index}
                        onMouseDown={() => {
                          setSource(location);
                          setShowSourceSuggestions(false);
                        }}
                      >
                        📍 {location}
                      </button>
                    )
                  )}
                </div>
              )}

          </div>

          {/* SWAP */}
          <div className="col-12 col-md-2 d-flex align-items-end justify-content-center">

            <button
              type="button"
              className="btn btn-outline-primary w-100"
              onClick={handleSwap}
              title="Swap stations"
            >
              <FaExchangeAlt />
            </button>

          </div>

          {/* TO */}
          <div className="col-12 col-md-5 position-relative">

            <label className="form-label d-flex align-items-center gap-2">
              <FaMapMarkerAlt className="text-primary" />
              To
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter destination station"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowDestinationSuggestions(true);
                setError("");
              }}
              onFocus={() =>
                setShowDestinationSuggestions(true)
              }
              onBlur={() => {
                setTimeout(
                  () =>
                    setShowDestinationSuggestions(false),
                  150
                );
              }}
            />

            {showDestinationSuggestions &&
              destination.trim() !== "" &&
              destinationSuggestions.length > 0 && (
                <div className="suggestion-box">
                  {destinationSuggestions.map(
                    (location, index) => (
                      <button
                        type="button"
                        className="suggestion-item"
                        key={index}
                        onMouseDown={() => {
                          setDestination(location);
                          setShowDestinationSuggestions(
                            false
                          );
                        }}
                      >
                        📍 {location}
                      </button>
                    )
                  )}
                </div>
              )}

          </div>

          {/* DATE */}
          <div className="col-12">

            <label className="form-label d-flex align-items-center gap-2">
              <FaCalendarAlt className="text-primary" />
              Journey Date
            </label>

            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError("");
              }}
            />

          </div>

          {/* SUBMIT */}
          <div className="col-12">

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <FaSearch /> Search Trains
            </button>

          </div>

        </div>

      </form>

    </div>
  );
}

export default SearchForm;
