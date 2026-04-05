import { useEffect, useState, useContext } from "react";
import api from "../utils/axios";
import { AuthContext } from "../context/AuthContext";
import AppLoader from "../components/AppLoader";

export default function AdminPanel() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/users")
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const changeRole = async (id, role) => {
    if (id === user._id) {
      return alert("You cannot change your own role");
    }

    try {
      await api.put("/admin/role", { userId: id, role });
      setUsers(users.map(u =>
        u._id === id ? { ...u, role } : u
      ));
    } catch {
      alert("Failed to update role");
    }
  };

  if (loading) return <AppLoader message="Loading users..." className="p-6" />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

      {users.map(u => (
        <div
          key={u._id}
          className="bg-white p-3 mb-2 flex justify-between items-center rounded shadow"
        >
          <span>
            {u.name} <span className="text-sm text-gray-500">({u.role})</span>
          </span>

          <select
            value={u.role}
            onChange={e => changeRole(u._id, e.target.value)}
            className="border p-1 rounded"
            disabled={u._id === user._id}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      ))}
    </div>
  );
}
