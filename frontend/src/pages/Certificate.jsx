import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/axios";
import AppLoader from "../components/AppLoader";

export default function Certificate() {
  const { user } = useContext(AuthContext);
  const [certs, setCerts] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    setLoading(true);

    Promise.all([api.get("/certificates"), api.get("/courses")])
      .then(([certRes, courseRes]) => {
        setCerts(Array.isArray(certRes.data) ? certRes.data : []);

        const courseMap = {};
        const list = Array.isArray(courseRes.data) ? courseRes.data : [];
        list.forEach((course) => {
          courseMap[course._id] = course;
        });
        setCourses(courseMap);
      })
      .catch(() => {
        setCerts([]);
        setCourses({});
      })
      .finally(() => setLoading(false));
  }, [user?._id]);

  const preparedCertificates = useMemo(() => {
    return certs.map((cert) => {
      const courseId = typeof cert.courseId === "object" ? cert.courseId?._id : cert.courseId;
      const courseTitle = cert.courseId?.title || courses[courseId]?.title || "Course";
      return {
        ...cert,
        courseTitle,
        issuedLabel: cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "N/A"
      };
    });
  }, [certs, courses]);

  if (loading) {
    return <AppLoader message="Loading certificates..." className="p-6" />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-amber-700">ACHIEVEMENTS</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">My Certificates</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Certificates are awarded when you complete course requirements. Download and
          share your learning achievements.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-white px-3 py-1 border border-amber-100 text-slate-700">
            Earned Certificates: {preparedCertificates.length}
          </span>
          <Link
            to="/dashboard/progress"
            className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-700 transition"
          >
            Track Progress
          </Link>
        </div>
      </section>

      {preparedCertificates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">No certificates earned yet</h3>
          <p className="text-sm text-slate-600 mt-1">
            Complete course tasks and quizzes to unlock your first certificate.
          </p>
          <Link
            to="/dashboard/my-courses"
            className="inline-flex mt-4 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
          >
            Continue Learning
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {preparedCertificates.map((cert) => (
            <article
              key={cert._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
            >
              <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <p className="text-xs font-bold tracking-[0.12em] text-amber-700">CERTIFICATE OF COMPLETION</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">{cert.courseTitle}</h3>
                <p className="mt-1 text-xs text-slate-600">Issued on {cert.issuedLabel}</p>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                This certifies that <span className="font-semibold text-slate-900">{user.name}</span>
                {" "}has successfully completed the course requirements.
              </p>

              <a
                href={`${api.defaults.baseURL}/certificates/download/${cert._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex mt-5 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Download Certificate PDF
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
