import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AppLoader from "./AppLoader";

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <AppLoader compact message="Checking session..." className="p-6" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

