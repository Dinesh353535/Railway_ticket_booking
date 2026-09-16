import { Navigate } from "react-router-dom";

import { isAdminLoggedIn } from "../utils/auth";

function ProtectedAdminRoute({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;
