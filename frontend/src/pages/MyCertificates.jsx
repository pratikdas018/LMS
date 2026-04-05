import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axios";
import AppLoader from "../components/AppLoader";

export default function MyCertificates() {
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

  if (loading) return <AppLoader message="Loading certificates..." className="p-6" />;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Certificates 🎓</h1>
      
      {certificates.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">You haven't earned any certificates yet.</p>
          <p className="text-gray-400">Complete all tasks in a course to earn one!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div key={cert._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="font-bold text-xl text-blue-900 mb-1">{cert.courseId?.title || "Course Certificate"}</h3>
                <p className="text-sm text-gray-500">
                  Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
              </div>
              
              <a 
                href={`${api.defaults.baseURL}/certificates/download/${cert._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Download PDF 📥
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
