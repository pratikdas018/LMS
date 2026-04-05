import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AppLoader from "./AppLoader";

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <AppLoader compact message="Checking access..." className="p-6" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

