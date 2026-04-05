import { useContext, useEffect, useState } from "react";
import api from "../utils/axios";
import { AuthContext } from "../context/AuthContext";
import AppLoader from "../components/AppLoader";

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/progress/user/${user._id}`)
      .then(res => {
        setProgress(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <AppLoader message="Loading courses..." className="p-6" />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Courses</h2>

      {progress.length === 0 && (
        <p className="text-gray-500">You are not enrolled in any course yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {progress.map(p => {
          const percent = p.totalTasks
            ? Math.round((p.completedTasks / p.totalTasks) * 100)
            : 0;

          return (
            <div key={p._id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">{p.courseId.title}</h3>

              <p className="text-sm mt-2">
                Tasks: {p.completedTasks} / {p.totalTasks}
              </p>

              <div className="w-full bg-gray-200 rounded h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-xs mt-1">{percent}% Completed</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
