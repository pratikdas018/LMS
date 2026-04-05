import { useEffect, useState } from "react";
import api from "../utils/axios";
import AppLoader from "../components/AppLoader";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/certificates")
      .then((res) => {
        setCertificates(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch certificates", err);
        setLoading(false);
      });
  }, []);

  const handleDownload = (certId) => {
    // Open download link in new tab
    window.open(`${api.defaults.baseURL}/certificates/download/${certId}`, "_blank");
  };

  if (loading) return <AppLoader message="Loading certificates..." className="p-6" />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Certificates</h2>

      {certificates.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-lg">You haven't earned any certificates yet.</p>
          <p className="text-gray-400 text-sm mt-2">Complete all tasks in a course to unlock your certificate.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div key={cert._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center transition hover:shadow-md">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 text-3xl shadow-sm">
                🎓
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{cert.courseId?.title || "Course Certificate"}</h3>
              <p className="text-xs text-gray-500 mb-6 uppercase tracking-wide">
                Issued: {new Date(cert.issuedAt).toLocaleDateString()}
              </p>

              <button
                onClick={() => handleDownload(cert._id)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Download PDF</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
