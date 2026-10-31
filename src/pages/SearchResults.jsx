
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTrain,
} from "react-icons/fa";

import TrainCard from "../components/TrainCard";
import { loadTrains, formatDate } from "../utils/helpers";

function SearchResults() {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();

  const source = searchParams.get("source") || "";
  const destination = searchParams.get("destination") || "";
  const date = searchParams.get("date") || "";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await loadTrains({
          source,
          destination,
          date,
        });

        if (!cancelled) {
          setTrains(data);
        }
      } catch (err) {
        console.error("Unable to search trains:", err);

        if (!cancelled) {
          setTrains([]);
          setError(
            "Unable to load trains. Please check the server and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [source, destination, date]);

  const filteredTrains = trains;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="d-flex align-items-center gap-2">
                <FaTrain /> Available Trains
              </h2>

              <p>
                {source} → {destination} · {formatDate(date)}
              </p>
            </div>

            <Link
              to="/"
              className="btn btn-light d-flex align-items-center gap-2"
            >
              <FaArrowLeft /> Modify Search
            </Link>
          </div>
        </div>
      </div>

      <div className="container page-body pb-5">
        {/* Search Summary */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <span className="info-label">
                  <FaMapMarkerAlt /> From
                </span>

                <p className="info-value">{source}</p>
              </div>

              <div className="col-md-4">
                <span className="info-label">
                  <FaMapMarkerAlt /> To
                </span>

                <p className="info-value">{destination}</p>
              </div>

              <div className="col-md-4">
                <span className="info-label">
                  <FaCalendarAlt /> Journey Date
                </span>

                <p className="info-value">{formatDate(date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border text-primary"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : filteredTrains.length > 0 ? (
          <>
            <p className="text-muted mb-3">
              <strong>{filteredTrains.length}</strong>{" "}
              train{filteredTrains.length > 1 ? "s" : ""} found
              for your search
            </p>

            {filteredTrains.map((train) => (
              <TrainCard key={train.id} train={train} />
            ))}
          </>
        ) : (
          <div className="card text-center p-4 p-md-5">
            <div className="fs-1 mb-3">🚫</div>

            <h4>No Trains Available</h4>

            <p className="text-muted">
              No trains are available for the selected
              source, destination and journey date.
            </p>

            <div>
              <Link to="/" className="btn btn-primary">
                Try Another Search
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SearchResults;
