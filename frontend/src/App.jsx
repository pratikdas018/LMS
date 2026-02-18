import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AvailableCourses from "./pages/AvailableCourses";
import MyCourses from "./pages/MyCourses";
import Progress from "./pages/Progress";
import Certificate from "./pages/Certificate";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import TeacherDashboard from "./pages/TeacherDashboard";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import RoleRoute from "./components/RoleRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GoogleCallback from "./pages/GoogleCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/google/callback" element={<GoogleCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              >
                <Route index element={<MyCourses />} />
                <Route path="courses" element={<AvailableCourses />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="progress" element={<Progress />} />
                <Route path="certificates" element={<Certificate />} />
                <Route path="profile" element={<Profile />} />
                <Route path="quiz/:courseId" element={<Quiz />} />

                {/* 👨‍🏫 TEACHER */}
                <Route
                  path="teacher"
                  element={
                    <RoleRoute allowedRoles={["teacher"]}>
                      <TeacherDashboard />
                    </RoleRoute>
                  }
                />

                <Route
                  path="admin"
                  element={
                    <RoleRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </RoleRoute>
                  }
                />

              </Route>
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
