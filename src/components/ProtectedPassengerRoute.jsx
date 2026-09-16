import { Navigate } from "react-router-dom";

import { isPassengerLoggedIn } from "../utils/auth";

function ProtectedPassengerRoute({ children }) {
  if (!isPassengerLoggedIn()) {
    return <Navigate to="/passenger-login" replace />;
  }

  return children;
}

export default ProtectedPassengerRoute;
