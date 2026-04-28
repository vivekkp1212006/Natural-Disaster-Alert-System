import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import StatusModal from "../components/StatusModal";
import "./style.css";

const AdminCampDetail = () => {
  const { campId } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [detail, setDetail] = useState(null);
  const [section, setSection] = useState("team_leaders");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [modal, setModal] = useState({ open: false, type: "error", message: "" });
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!token) return navigate("/login");
    if (user?.role !== "admin") return navigate("/home");
    const load = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camps/${campId}/detail`, { headers });
        setDetail(res.data);
      } catch (err) {
        setModal({ open: true, type: "error", message: err.response?.data?.message || "Failed to load camp details" });
      }
    };
    load();
  }, [campId, headers, navigate, token, user?.role]);

  const leaders = detail?.teams || [];
  const volunteers = (detail?.teams || []).flatMap((t) => t.members || []);
  const operations = detail?.operations || [];

  return (
    <div className="login-container">
      <div className="management-box">
        <h2>Camp details</h2>
        <p>{detail?.camp?.name || "Loading..."}</p>
        <div className="home-quick-links">
          <button type="button" className="home-premium-link-btn ghost" onClick={() => setSection("team_leaders")}>Team leaders</button>
          <button type="button" className="home-premium-link-btn ghost" onClick={() => setSection("volunteers")}>Volunteers</button>
          <button type="button" className="home-premium-link-btn ghost" onClick={() => setSection("camp_officer")}>Camp officer</button>
          <button type="button" className="home-premium-link-btn ghost" onClick={() => setSection("operations")}>Operations</button>
        </div>

        {section === "camp_officer" && detail?.camp?.campOfficer ? (
          <button type="button" className="loc-pick" onClick={() => setSelectedProfile(detail.camp.campOfficer)}>
            {detail.camp.campOfficer.name} ({detail.camp.campOfficer.AGS_ID})
          </button>
        ) : null}
        {section === "team_leaders" ? (
          <ul className="compact-list">
            {leaders.map((t) => (
              <li key={t._id}>
                <button type="button" className="loc-pick" onClick={() => setSelectedProfile(t.leader || { name: "Leader", AGS_ID: "N/A" })}>
                  {(t.leader?.name || "Team leader")} ({t.leader?.AGS_ID || "N/A"})
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {section === "volunteers" ? (
          <ul className="compact-list">
            {volunteers.map((v) => (
              <li key={v._id}>
                <button type="button" className="loc-pick" onClick={() => setSelectedProfile(v.user || v)}>
                  {v.user?.name || "Volunteer"} ({v.user?.AGS_ID || "N/A"})
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {section === "operations" ? (
          <ul className="compact-list">
            {operations.map((op) => (
              <li key={op._id}>
                <button type="button" className="loc-pick" onClick={() => setSelectedProfile({
                  name: op.title,
                  email: "N/A",
                  AGS_ID: "N/A",
                  role: `Status: ${op.status || "planned"} | Starts: ${new Date(op.startsAt).toLocaleString()}`,
                })}>
                  {op.title} - {new Date(op.startsAt).toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <p><Link to="/home">Back to home</Link></p>
      </div>
      <StatusModal
        open={!!selectedProfile}
        type="success"
        title="Profile"
        onClose={() => setSelectedProfile(null)}
      >
        <p>Name: {selectedProfile?.name || "N/A"}</p>
        <p>Email: {selectedProfile?.email || "N/A"}</p>
        <p>AGS ID: {selectedProfile?.AGS_ID || "N/A"}</p>
        <p>Role/Details: {selectedProfile?.role || "N/A"}</p>
      </StatusModal>
      <StatusModal open={modal.open} type={modal.type} message={modal.message} onClose={() => setModal({ open: false, type: "error", message: "" })} />
    </div>
  );
};

export default AdminCampDetail;
