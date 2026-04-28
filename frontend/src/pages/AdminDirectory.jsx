import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import StatusModal from "../components/StatusModal";
import "./style.css";

const categoryConfig = {
  volunteers: { title: "Volunteers", endpoint: "/api/volunteers/profiles", key: "volunteers" },
  camps: { title: "Camps", endpoint: "/api/volunteers/camps", key: "camps" },
  "team-leaders": { title: "Team Leaders", endpoint: "/api/volunteers/team-leaders", key: "leaders" },
  "camp-officers": { title: "Camp Officers", endpoint: "/api/volunteers/admin/users", key: "users", role: "camp_officer" },
  users: { title: "Users", endpoint: "/api/volunteers/admin/users", key: "users", role: "user" },
  operations: { title: "Operations", endpoint: "/api/volunteers/operations", key: "operations" },
};

const AdminDirectory = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const config = categoryConfig[category];

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [modal, setModal] = useState({ open: false, type: "error", message: "" });

  const normalizeRows = (payload) => {
    if (!config) return [];
    if (config.key === "volunteers") {
      return (payload.volunteers || []).map((v) => ({
        id: v._id,
        ags: v.user?.AGS_ID || "N/A",
        name: v.user?.name || "Volunteer",
        email: v.user?.email || "N/A",
        profile: v.user || {},
      }));
    }
    if (config.key === "camps") {
      return (payload.camps || []).map((c) => ({
        id: c._id,
        ags: c.campOfficer?.AGS_ID || "N/A",
        name: c.name,
        email: c.campOfficer?.email || "N/A",
        profile: c.campOfficer || {},
        campId: c._id,
      }));
    }
    if (config.key === "leaders") {
      return (payload.leaders || []).map((l) => ({
        id: l.user?._id || l._id,
        ags: l.user?.AGS_ID || "N/A",
        name: l.user?.name || "Team Leader",
        email: l.user?.email || "N/A",
        profile: l.user || {},
      }));
    }
    if (config.key === "operations") {
      return (payload.operations || []).map((op) => ({
        id: op._id,
        ags: op.assignedVolunteers?.[0]?.volunteer?.user?.AGS_ID || "N/A",
        name: op.title,
        email: op.location,
        profile: {
          name: op.title,
          email: op.location,
          AGS_ID: op.assignedVolunteers?.[0]?.volunteer?.user?.AGS_ID || "N/A",
          role: `${op.status || "planned"} | ${new Date(op.startsAt).toLocaleString()}`,
        },
      }));
    }
    return (payload.users || []).map((u) => ({
      id: u._id,
      ags: u.AGS_ID || "N/A",
      name: u.name,
      email: u.email,
      profile: u,
    }));
  };

  const loadList = async (nextPage = 1, append = false) => {
    if (!config) return;
    try {
      setLoading(true);
      const params = { page: nextPage, limit: 8, search };
      if (config.role) params.role = config.role;
      const res = await axios.get(`${process.env.REACT_APP_API_URL}${config.endpoint}`, { headers, params });
      const rows = normalizeRows(res.data);
      setItems((prev) => (append ? [...prev, ...rows] : rows));
      setPage(nextPage);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setModal({ open: true, type: "error", message: err.response?.data?.message || "Failed to load list" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return navigate("/login");
    if (user?.role !== "admin") return navigate("/home");
    if (!config) {
      setModal({ open: true, type: "error", message: "Invalid directory category" });
      return;
    }
    loadList(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role, category]);

  return (
    <div className="login-container">
      <div className="management-box">
        <h2>{config?.title || "Directory"}</h2>
        <div className="row-gap">
          <input className="full-input" placeholder="Search by AGS_ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="button" className="login-button" onClick={() => loadList(1, false)}>Search</button>
        </div>
        {loading ? <p>Loading...</p> : null}
        <ul className="compact-list">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className="loc-pick"
              onClick={() => setSelectedProfile(it.profile)}
              >
                {it.ags} - {it.name}
              </button>
              {category === "camps" ? (
                <button type="button" className="mini-btn" onClick={() => navigate(`/admin/camps/${it.campId}`)}>
                  Open camp detail
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {page < totalPages ? (
          <button type="button" className="home-premium-link-btn ghost" onClick={() => loadList(page + 1, true)}>
            Load more
          </button>
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
        <p>Role: {selectedProfile?.role || "N/A"}</p>
      </StatusModal>

      <StatusModal
        open={modal.open}
        type={modal.type}
        message={modal.message}
        onClose={() => setModal({ open: false, type: "error", message: "" })}
      />
    </div>
  );
};

export default AdminDirectory;
