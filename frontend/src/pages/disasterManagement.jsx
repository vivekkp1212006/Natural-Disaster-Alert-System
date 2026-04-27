import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const MODULES = [
  { key: "disaster_basics", label: "Disaster basics" },
  { key: "first_aid", label: "First aid" },
  { key: "evacuation_coord", label: "Evacuation coordination" },
];

const DisasterManagement = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [tlList, setTlList] = useState([]);
  const [tlPage, setTlPage] = useState(1);
  const [tlTotalPages, setTlTotalPages] = useState(1);
  const [tlSearch, setTlSearch] = useState("");
  const [selectedLeader, setSelectedLeader] = useState(null);

  const [disciplineForm, setDisciplineForm] = useState({
    volunteerId: "",
    actionType: "warning",
    reason: "",
    suspensionStart: "",
    suspensionEnd: "",
  });

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "camp_officer") {
      navigate("/home");
    }
  }, [token, user?.role, navigate]);

  const loadRequests = async (p = 1, append = false) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/roles/volunteer-requests/pending`, {
        headers,
        params: { page: p, limit: 6, search },
      });
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
      setRequests((prev) => (append ? [...prev, ...(res.data.requests || [])] : res.data.requests || []));
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const loadLeaders = async (p = 1, append = false) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/team-leaders`, {
      headers,
      params: { page: p, limit: 8, search: tlSearch },
    });
    setTlTotalPages(res.data.totalPages || 1);
    setTlPage(p);
    setTlList((prev) => (append ? [...prev, ...(res.data.leaders || [])] : res.data.leaders || []));
  };

  useEffect(() => {
    if (user?.role === "camp_officer") {
      loadRequests(1, false);
      loadLeaders(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const toggleTraining = async (userId, moduleKey, completed) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/roles/volunteer-requests/${userId}/training/${moduleKey}`,
        { completed },
        { headers }
      );
      setMessage(res.data.promotion?.promoted ? "User promoted to volunteer" : "Training updated");
      loadRequests(1, false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    }
  };

  const rejectReq = async (userId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/roles/volunteer-requests/${userId}/reject`, {}, { headers });
      setMessage("Rejected");
      loadRequests(1, false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Reject failed");
    }
  };

  const submitDiscipline = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/volunteers/disciplinary-actions`, disciplineForm, { headers });
      setMessage("Disciplinary action saved");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed");
    }
  };

  if (user?.role !== "camp_officer") {
    return null;
  }

  return (
    <div className="login-container">
      <div className="management-box">
        <h2>Camp officer management</h2>
        {loading ? <p>Loading…</p> : null}
        {message ? <p className="message">{message}</p> : null}

        <section className="card-section">
          <h3>Volunteer role requests & training</h3>
          <div className="row-gap">
            <input
              className="full-input"
              placeholder="Search by name/email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" className="login-button" onClick={() => loadRequests(1, false)}>
              Search
            </button>
          </div>
          <ul className="compact-list">
            {requests.map((row) => (
              <li key={row.user._id}>
                <strong>{row.user.name}</strong> ({row.user.email})
                <div className="training-row">
                  {MODULES.map((m) => {
                    const prog = (row.trainingProgress || []).find((p) => p.moduleKey === m.key);
                    return (
                      <label key={m.key} className="training-toggle">
                        <input
                          type="checkbox"
                          checked={!!prog?.completed}
                          onChange={(e) => toggleTraining(row.user._id, m.key, e.target.checked)}
                        />
                        {m.label}
                      </label>
                    );
                  })}
                </div>
                <button type="button" className="mini-btn" onClick={() => rejectReq(row.user._id)}>
                  Reject request
                </button>
              </li>
            ))}
          </ul>
          {page < totalPages ? (
            <button type="button" className="home-premium-link-btn ghost" onClick={() => loadRequests(page + 1, true)}>
              Load more requests
            </button>
          ) : null}
        </section>

        <section className="card-section">
          <h3>Team leaders</h3>
          <div className="row-gap">
            <input className="full-input" placeholder="Search name" value={tlSearch} onChange={(e) => setTlSearch(e.target.value)} />
            <button type="button" className="login-button" onClick={() => loadLeaders(1, false)}>
              Search
            </button>
          </div>
          <ul className="compact-list">
            {tlList.map((row) => (
              <li key={row.user._id}>
                <button type="button" className="loc-pick" onClick={() => setSelectedLeader(row)}>
                  {row.user.name} — badge: {row.rankingBadge || "None"}
                </button>
              </li>
            ))}
          </ul>
          {tlPage < tlTotalPages ? (
            <button type="button" className="home-premium-link-btn ghost" onClick={() => loadLeaders(tlPage + 1, true)}>
              Load more leaders
            </button>
          ) : null}
          {selectedLeader ? (
            <div className="card-section nested">
              <h4>Profile</h4>
              <p>
                {selectedLeader.user.name} — {selectedLeader.user.email}
              </p>
              <p>Badge: {selectedLeader.rankingBadge}</p>
              <p>Volunteers under leader: {(selectedLeader.volunteer?.team && "see team API") || 0}</p>
            </div>
          ) : null}
        </section>

        <section className="card-section">
          <h3>Disciplinary action</h3>
          <form className="grid-form" onSubmit={submitDiscipline}>
            <input
              placeholder="Volunteer Mongo _id"
              value={disciplineForm.volunteerId}
              onChange={(e) => setDisciplineForm({ ...disciplineForm, volunteerId: e.target.value })}
            />
            <select value={disciplineForm.actionType} onChange={(e) => setDisciplineForm({ ...disciplineForm, actionType: e.target.value })}>
              <option value="warning">Warning</option>
              <option value="suspension">Suspension</option>
            </select>
            <input placeholder="Reason" value={disciplineForm.reason} onChange={(e) => setDisciplineForm({ ...disciplineForm, reason: e.target.value })} />
            <input
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              value={disciplineForm.suspensionStart}
              onChange={(e) => setDisciplineForm({ ...disciplineForm, suspensionStart: e.target.value })}
            />
            <input
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              value={disciplineForm.suspensionEnd}
              onChange={(e) => setDisciplineForm({ ...disciplineForm, suspensionEnd: e.target.value })}
            />
            <button className="login-button" type="submit">
              Submit
            </button>
          </form>
        </section>

        <p>
          <Link to="/home">Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default DisasterManagement;
