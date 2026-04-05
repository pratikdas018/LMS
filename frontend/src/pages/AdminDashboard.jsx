import { useEffect, useMemo, useState } from "react";
import api from "../utils/axios";
import AppLoader from "../components/AppLoader";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/users")
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const updateUserRole = (id, role) => {
    api
      .put(`/users/${id}/role`, { role })
      .then(() => {
        setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, role } : user)));
      })
      .catch(() => alert("Failed to update role"));
  };

  const filteredUsers = users.filter((user) => {
    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const term = search.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((user) => user.role === "admin").length;
    const teachers = users.filter((user) => user.role === "teacher").length;
    const students = users.filter((user) => user.role === "student").length;

    return { total, admins, teachers, students };
  }, [users]);

  const roleBadgeClass = (role) => {
    if (role === "admin") return "bg-violet-100 text-violet-700 border-violet-200";
    if (role === "teacher") return "bg-sky-100 text-sky-700 border-sky-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  if (loading) {
    return <AppLoader message="Loading users..." className="p-6" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-indigo-700">ADMIN CONTROL CENTER</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">User & Role Management</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Manage user access, assign roles, and keep the LMS ecosystem balanced and secure.
        </p>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-indigo-100 bg-white p-3">
            <p className="text-xs text-slate-500">Total Users</p>
            <p className="text-xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-3">
            <p className="text-xs text-slate-500">Admins</p>
            <p className="text-xl font-black text-violet-700">{stats.admins}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-3">
            <p className="text-xs text-slate-500">Teachers</p>
            <p className="text-xl font-black text-sky-700">{stats.teachers}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-3">
            <p className="text-xs text-slate-500">Students</p>
            <p className="text-xl font-black text-emerald-700">{stats.students}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <label className="block text-xs font-semibold text-slate-600 mb-1">Search Users</label>
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-extrabold text-slate-900">Users</h3>
          <p className="text-xs text-slate-600">Showing {filteredUsers.length} result(s)</p>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Change Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{user.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${roleBadgeClass(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3 p-4">
          {filteredUsers.map((user) => (
            <article key={user._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                  <p className="text-xs text-slate-600 truncate">{user.email}</p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${roleBadgeClass(user.role)}`}>
                  {user.role.toUpperCase()}
                </span>
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Change Role</label>
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user._id, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </article>
          ))}

          {filteredUsers.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              No users found for this search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
