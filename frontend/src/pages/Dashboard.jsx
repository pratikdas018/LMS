import { useContext, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Topbar from "../components/Topbar";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    const isDashboardRoot =
      location.pathname === "/dashboard" || location.pathname === "/dashboard/";

    if (!isDashboardRoot) return;

    if (user.role === "admin") navigate("/dashboard/admin");
    else if (user.role === "teacher") navigate("/dashboard/teacher");
    else navigate("/dashboard/my-courses");
  }, [user, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <Topbar name={user.name} logout={logout} />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
