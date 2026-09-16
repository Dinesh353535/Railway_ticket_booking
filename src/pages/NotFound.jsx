import { Link } from "react-router-dom";
import { FaHome } from "react-icons/fa";

function NotFound() {
  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">

          <div className="card text-center p-4 p-md-5">

            <div className="fs-1 mb-3">🚧</div>

            <h2 className="mb-2">Page Not Found</h2>

            <p className="text-muted">
              The page you are looking for does not exist
              or has been moved.
            </p>

            <div>
              <Link
                to="/"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
              >
                <FaHome /> Back to Home
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default NotFound;
