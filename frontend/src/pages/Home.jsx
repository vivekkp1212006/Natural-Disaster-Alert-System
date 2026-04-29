import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import StatusModal from "../components/StatusModal";
import {
  FaBell,
  FaClipboardList,
  FaHandsHelping,
  FaMapMarkedAlt,
  FaPhoneAlt,
  FaShieldAlt,
  FaUserPlus,
} from "react-icons/fa";
import "./style.css";
import aegisLogo from "../resources/aegis-logo.png";

const minDateTimeLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const Home = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  const [modal, setModal] = useState({ open: false, type: "success", title: "", message: "" });
  const [loading, setLoading] = useState(false);

  const [enroll, setEnroll] = useState({ age: "", phone: "", address: "", skills: "", experienceYears: 0 });
  const [officerStats, setOfficerStats] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [camps, setCamps] = useState([]);
  const [campPage, setCampPage] = useState(1);
  const [campTotalPages, setCampTotalPages] = useState(1);
  const [campSearch, setCampSearch] = useState("");
  const campSearchRef = useRef("");
  const [volOps, setVolOps] = useState([]);
  const [tlDash, setTlDash] = useState(null);

  const [locQuery, setLocQuery] = useState("");
  const [locHits, setLocHits] = useState([]);
  const [pickedLoc, setPickedLoc] = useState(null);
  const [campForm, setCampForm] = useState({ campOfficerId: "" });
  const [officerAgsSearch, setOfficerAgsSearch] = useState("");
  const [officerCandidates, setOfficerCandidates] = useState([]);

  const [trainForm, setTrainForm] = useState({ title: "", trainingType: "Disaster Basics", date: "" });
  const [opForm, setOpForm] = useState({ title: "", disasterType: "other", location: "", startsAt: "", endsAt: "", teamLeaderUsers: [] });
  const [opLeaderSearch, setOpLeaderSearch] = useState("");
  const [opLeaderCandidates, setOpLeaderCandidates] = useState([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const showModal = (type, message, title = "") => setModal({ open: true, type, message, title });

  const loadRoleData = useCallback(async () => {
    if (!token || !user?.role) return;
    setLoading(true);
    try {
      if (user.role === "camp_officer") {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camp-officer/home-stats`, { headers });
        setOfficerStats(res.data);
      }
      if (user.role === "admin") {
        const [s, c] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/admin/summary`, { headers }),
            axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camps`, {
            headers,
            params: { page: 1, limit: 5, search: campSearchRef.current },
          }),
        ]);
        setAdminSummary(s.data);
        setCamps(c.data.camps || []);
        setCampTotalPages(c.data.totalPages || 1);
        setCampPage(1);
      }
      if (user.role === "volunteer") {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/operations/me`, { headers });
        setVolOps(res.data.operations || []);
      }
      if (user.role === "team_leader") {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/team-leader/dashboard`, { headers });
        setTlDash(res.data);
      }
    } catch (e) {
      showModal("error", e.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, user?.role, headers]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadRoleData();
  }, [token, navigate, loadRoleData]);

  useEffect(() => {
    if (!locQuery || locQuery.length < 2) {
      setLocHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/location/search`, {
          headers,
          params: { q: locQuery },
        });
        setLocHits(res.data.results || []);
      } catch {
        setLocHits([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [locQuery, headers]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (!officerAgsSearch || officerAgsSearch.trim().length < 2) {
      setOfficerCandidates([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/team-leaders`, {
          headers,
          params: { page: 1, limit: 10, search: officerAgsSearch.trim() },
        });
        setOfficerCandidates(res.data.leaders || []);
      } catch {
        setOfficerCandidates([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [officerAgsSearch, headers, user?.role]);

  useEffect(() => {
    if (user?.role !== "camp_officer" || !officerStats?.camp?._id) return;
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camp-officer/team-leaders`, {
          headers,
          params: { page: 1, limit: 20, search: opLeaderSearch.trim() },
        });
        setOpLeaderCandidates(res.data.leaders || []);
      } catch {
        setOpLeaderCandidates([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [opLeaderSearch, headers, user?.role, officerStats?.camp?._id]);

  const loadMoreCamps = async () => {
    if (campPage >= campTotalPages) return;
    const next = campPage + 1;
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camps`, {
      headers,
      params: { page: next, limit: 5, search: campSearchRef.current || campSearch },
    });
    setCamps((prev) => [...prev, ...(res.data.camps || [])]);
    setCampPage(next);
  };

  const searchCamps = async () => {
    campSearchRef.current = campSearch;
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camps`, {
      headers,
      params: { page: 1, limit: 5, search: campSearch },
    });
    setCamps(res.data.camps || []);
    setCampPage(1);
    setCampTotalPages(res.data.totalPages || 1);
  };

  const submitEnroll = async (e) => {
    e.preventDefault();
    if (!enroll.age || !enroll.phone || !enroll.address) {
      showModal("error", "Age, phone and address are required");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/volunteers/profiles`,
        {
          ...enroll,
          age: Number(enroll.age),
          experienceYears: Number(enroll.experienceYears || 0),
          skills: enroll.skills.split(",").map((s) => s.trim()).filter(Boolean),
        },
        { headers }
      );
      setEnroll({ age: "", phone: "", address: "", skills: "", experienceYears: 0 });
      showModal("success", "Enrollment saved");
    } catch (err) {
      showModal("error", err.response?.data?.message || "Enrollment failed");
    }
  };

  const submitCamp = async (e) => {
    e.preventDefault();
    if (!pickedLoc || !campForm.campOfficerId) {
      showModal("error", "Pick a location and camp officer");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/volunteers/camps`,
        {
          name: pickedLoc.name,
          lat: pickedLoc.lat,
          lng: pickedLoc.lng,
          campOfficerId: campForm.campOfficerId,
        },
        { headers }
      );
      showModal("success", "Camp created");
      setPickedLoc(null);
      setLocQuery("");
      setCampForm({ campOfficerId: "" });
      setOfficerAgsSearch("");
      loadRoleData();
    } catch (err) {
      showModal("error", err.response?.data?.message || "Camp create failed");
    }
  };

  const submitTraining = async (e) => {
    e.preventDefault();
    if (!officerStats?.camp?._id) {
      showModal("error", "No camp assigned to you");
      return;
    }
    const d = trainForm.date;
    if (!d || new Date(d) < new Date()) {
      showModal("error", "Training date cannot be in the past");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/volunteers/trainings`,
        {
          title: trainForm.title,
          trainingType: trainForm.trainingType,
          camp: officerStats.camp._id,
          date: d,
        },
        { headers }
      );
      setTrainForm({ title: "", trainingType: "Disaster Basics", date: "" });
      showModal("success", "Training scheduled");
      loadRoleData();
    } catch (err) {
      showModal("error", err.response?.data?.message || "Failed");
    }
  };

  const submitOperation = async (e) => {
    e.preventDefault();
    if (!officerStats?.camp?._id) {
      showModal("error", "No camp");
      return;
    }
    const starts = opForm.startsAt;
    if (!starts || new Date(starts) < new Date()) {
      showModal("error", "Operation start cannot be in the past");
      return;
    }
    if (opForm.endsAt && new Date(opForm.endsAt) < new Date(opForm.startsAt)) {
      showModal("error", "End must be after start");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/volunteers/operations`,
        {
          ...opForm,
          camp: officerStats.camp._id,
          teamLeaderUsers: opForm.teamLeaderUsers.filter(Boolean),
        },
        { headers }
      );
      setOpForm({ title: "", disasterType: "other", location: "", startsAt: "", endsAt: "", teamLeaderUsers: [] });
      setOpLeaderSearch("");
      showModal("success", "Operation created");
      loadRoleData();
    } catch (err) {
      showModal("error", err.response?.data?.message || "Failed");
    }
  };

  if (!token) return null;

  return (
    <div className="home-premium-page">
      <header className="home-premium-top">
        <div className="home-premium-brand">
          <img src={aegisLogo} alt="Aegis logo" />
          <div>
            <h1>Response Hub</h1>
            <p>Multi-hazard alerts & volunteer coordination</p>
          </div>
        </div>
        <a href="tel:112" className="sos-premium-btn">
          <FaPhoneAlt /> Emergency 112
        </a>
      </header>

      {loading ? <p className="home-inline-msg">Loading…</p> : null}
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ open: false, type: "success", title: "", message: "" })}
      />

      <section className="home-premium-hero">
        <div>
          <h2>Welcome, {user?.name || "User"}</h2>
          <p>Stay informed. Response faster. Protect lives.</p>
        </div>
      </section>

      {user?.role === "user" ? (
        <section className="card-section">
          <h3>
            <FaUserPlus /> Volunteer enrollment
          </h3>
          <form className="grid-form" onSubmit={submitEnroll}>
            <input type="number" min="16" max="100" placeholder="Age" value={enroll.age} onChange={(e) => setEnroll({ ...enroll, age: e.target.value })} />
            <input type="tel" pattern="^\+?[0-9]{8,15}$" placeholder="Phone" value={enroll.phone} onChange={(e) => setEnroll({ ...enroll, phone: e.target.value })} />
            <input placeholder="Address" value={enroll.address} onChange={(e) => setEnroll({ ...enroll, address: e.target.value })} />
            <input placeholder="Skills (comma)" value={enroll.skills} onChange={(e) => setEnroll({ ...enroll, skills: e.target.value })} />
            <button className="login-button" type="submit">
              Save enrollment
            </button>
          </form>
          <div className="home-quick-links">
            <Link className="home-premium-link-btn" to="/request-role">
              Request volunteer role
            </Link>
            <Link className="home-premium-link-btn ghost" to="/my-alerts">
              <FaBell /> My alerts
            </Link>
          </div>
        </section>
      ) : null}

      {user?.role === "volunteer" ? (
        <section className="card-section">
          <h3>Live & upcoming operations</h3>
          {volOps.length === 0 ? (
            <p>No operations assigned.</p>
          ) : (
            <ul className="compact-list">
              {volOps.map((op) => (
                <li key={op._id}>
                  <strong>{op.title}</strong> — {op.location} — {new Date(op.startsAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
          <Link className="home-premium-link-btn" to="/my-alerts">
            <FaBell /> Alerts
          </Link>
        </section>
      ) : null}

      {user?.role === "team_leader" && tlDash ? (
        <section className="card-section">
          <h3>Your team</h3>
          <p>Members (max 5): {(tlDash.team?.members || []).length}</p>
          <ul className="compact-list">
            {(tlDash.team?.members || []).map((m) => (
              <li key={m._id}>
                <button type="button" className="loc-pick" onClick={() => setSelectedTeamMember(m)}>
                  {m.user?.AGS_ID || "N/A"} - {m.user?.name || "Volunteer"}
                </button>
              </li>
            ))}
          </ul>
          <h3>Assigned operations</h3>
          <ul className="compact-list">
            {(tlDash.operations || []).map((op) => (
              <li key={op._id}>
                <strong>{op.title}</strong> — {new Date(op.startsAt).toLocaleString()}
              </li>
            ))}
          </ul>
          <Link className="home-premium-link-btn" to="/my-alerts">
            Alerts
          </Link>
        </section>
      ) : null}

      {user?.role === "camp_officer" && officerStats ? (
        <>
          <section className="card-section">
            <h3>Camp overview</h3>
            {officerStats.camp ? (
              <ul className="compact-list">
                <li>Camp: {officerStats.camp.name}</li>
                <li>Team leaders: {officerStats.teamLeaders}</li>
                <li>Volunteers: {officerStats.volunteers}</li>
                <li>Scheduled trainings: {officerStats.scheduledTrainings}</li>
                <li>Live / upcoming operations: {(officerStats.operations || []).length}</li>
              </ul>
            ) : (
              <p>No camp assigned to your officer account yet.</p>
            )}
            <Link className="home-premium-link-btn" to="/management">
              <FaHandsHelping /> Management dashboard
            </Link>
            <Link className="home-premium-link-btn ghost" to="/my-alerts">
              <FaBell /> Alerts
            </Link>
          </section>
          {officerStats.camp ? (
            <>
              <section className="card-section">
                <h3>Schedule training</h3>
                <form className="grid-form" onSubmit={submitTraining}>
                  <input placeholder="Title" minLength={3} value={trainForm.title} onChange={(e) => setTrainForm({ ...trainForm, title: e.target.value })} />
                  <select value={trainForm.trainingType} onChange={(e) => setTrainForm({ ...trainForm, trainingType: e.target.value })}>
                    <option value="Disaster Basics">Disaster Basics</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Evacuation Coordination">Evacuation Coordination</option>
                  </select>
                  <input type="datetime-local" min={minDateTimeLocal()} value={trainForm.date} onChange={(e) => setTrainForm({ ...trainForm, date: e.target.value })} />
                  <button className="login-button" type="submit">
                    Schedule
                  </button>
                </form>
              </section>
              <section className="card-section">
                <h3>Create disaster operation</h3>
                <form className="grid-form" onSubmit={submitOperation}>
                  <input placeholder="Title" minLength={3} value={opForm.title} onChange={(e) => setOpForm({ ...opForm, title: e.target.value })} />
                  <select value={opForm.disasterType} onChange={(e) => setOpForm({ ...opForm, disasterType: e.target.value })}>
                    <option value="earthquake">Earthquake</option>
                    <option value="flood">Flood</option>
                    <option value="other">Other</option>
                  </select>
                  <input placeholder="Location text" value={opForm.location} onChange={(e) => setOpForm({ ...opForm, location: e.target.value })} />
                  <input type="datetime-local" min={minDateTimeLocal()} value={opForm.startsAt} onChange={(e) => setOpForm({ ...opForm, startsAt: e.target.value })} />
                  <input type="datetime-local" min={minDateTimeLocal()} value={opForm.endsAt} onChange={(e) => setOpForm({ ...opForm, endsAt: e.target.value })} />
                  <p className="home-small-hint">Select team leaders in your camp by AGS_ID only.</p>
                  <input
                    className="full-input"
                    placeholder="Search team leaders by AGS_ID"
                    value={opLeaderSearch}
                    onChange={(e) => setOpLeaderSearch(e.target.value)}
                  />
                  {opLeaderCandidates.length > 0 ? (
                    <ul className="loc-dropdown">
                      {opLeaderCandidates.map((c) => {
                        const isSelected = opForm.teamLeaderUsers.includes(c.user._id);
                        return (
                          <li key={c.user._id}>
                            <button
                              type="button"
                              className="loc-pick"
                              onClick={() =>
                                setOpForm((prev) => ({
                                  ...prev,
                                  teamLeaderUsers: isSelected
                                    ? prev.teamLeaderUsers.filter((id) => id !== c.user._id)
                                    : [...prev.teamLeaderUsers, c.user._id],
                                }))
                              }
                            >
                              {isSelected ? "✓ " : ""}{c.user.AGS_ID} - {c.user.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  <input
                    placeholder="Selected team leader user IDs"
                    value={opForm.teamLeaderUsers.join(",")}
                    readOnly
                  />
                  <button className="login-button" type="submit">
                    Create operation
                  </button>
                </form>
              </section>
            </>
          ) : null}
        </>
      ) : null}

      {user?.role === "admin" && adminSummary ? (
        <>
          <section className="card-section admin-summary-grid">
            <button type="button" className="home-camp-item-btn" onClick={() => navigate("/admin/directory/camps")}>
              <h4>Camps</h4>
              <strong>{adminSummary.camps}</strong>
            </button>
            <button type="button" className="home-camp-item-btn" onClick={() => navigate("/admin/directory/camp-officers")}>
              <h4>Camp officers</h4>
              <strong>{adminSummary.campOfficers}</strong>
            </button>
            <button type="button" className="home-camp-item-btn" onClick={() => navigate("/admin/directory/team-leaders")}>
              <h4>Team leaders</h4>
              <strong>{adminSummary.teamLeaders}</strong>
            </button>
            <button type="button" className="home-camp-item-btn" onClick={() => navigate("/admin/directory/volunteers")}>
              <h4>Volunteers</h4>
              <strong>{adminSummary.volunteers}</strong>
            </button>
            <button type="button" className="home-camp-item-btn" onClick={() => navigate("/admin/directory/users")}>
              <h4>Users</h4>
              <strong>{adminSummary.users}</strong>
            </button>
            <button type="button" className="home-camp-item-btn" onClick={() => navigate("/admin/directory/operations")}>
              <h4>Live/upcoming ops</h4>
              <strong>{adminSummary.liveOrUpcomingOperations}</strong>
            </button>
          </section>
          <section className="card-section">
            <h3>Create camp (location search)</h3>
            <input className="full-input" placeholder="Search place…" value={locQuery} onChange={(e) => setLocQuery(e.target.value)} />
            {locHits.length > 0 ? (
              <ul className="loc-dropdown">
                {locHits.map((h, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="loc-pick"
                      onClick={() => {
                        setPickedLoc(h);
                        setLocHits([]);
                        setLocQuery(h.name);
                      }}
                    >
                      {h.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {pickedLoc ? (
              <p className="picked-loc">
                Selected: {pickedLoc.name} ({pickedLoc.lat.toFixed(4)}, {pickedLoc.lng.toFixed(4)})
              </p>
            ) : null}
            <input
              className="full-input"
              placeholder="Search camp officer by AGS_ID"
              value={officerAgsSearch}
              onChange={(e) => setOfficerAgsSearch(e.target.value)}
            />
            {officerCandidates.length > 0 ? (
              <ul className="loc-dropdown">
                {officerCandidates.map((candidate) => (
                  <li key={candidate.user._id}>
                    <button
                      type="button"
                      className="loc-pick"
                      onClick={() => {
                        setCampForm({ ...campForm, campOfficerId: candidate.user._id });
                        setOfficerAgsSearch(candidate.user.AGS_ID || "");
                        setOfficerCandidates([]);
                      }}
                    >
                      {candidate.user.AGS_ID} - {candidate.user.email} ({candidate.user.name})
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {campForm.campOfficerId ? <p className="picked-loc">Selected officer id: {campForm.campOfficerId}</p> : null}
            <button className="login-button" type="button" onClick={submitCamp}>
              Create camp
            </button>
          </section>
          <section className="card-section">
            <h3>Camps list</h3>
            <div className="row-gap">
              <input className="full-input" placeholder="Search by camp officer AGS_ID" value={campSearch} onChange={(e) => setCampSearch(e.target.value)} />
              <button type="button" className="login-button" onClick={searchCamps}>
                Search
              </button>
            </div>
            <ul className="compact-list">
              {camps.map((c) => (
                <li key={c._id}>
                  <button type="button" className="home-camp-item-btn" onClick={() => navigate(`/admin/camps/${c._id}`)}>
                    {c.name} — officer: {c.campOfficer?.name || c.campOfficer}
                  </button>
                </li>
              ))}
            </ul>
            {campPage < campTotalPages ? (
              <button type="button" className="home-premium-link-btn ghost" onClick={loadMoreCamps}>
                Load more
              </button>
            ) : null}
          </section>
          <div className="home-quick-links">
            <Link className="home-premium-link-btn" to="/admin/alerts">
              <FaShieldAlt /> Admin alerts
            </Link>
            <Link className="home-premium-link-btn ghost" to="/admin/role-requests">
              <FaClipboardList /> Role queue (legacy)
            </Link>
            <Link className="home-premium-link-btn ghost" to="/my-alerts">
              <FaBell /> My alerts
            </Link>
          </div>
        </>
      ) : null}

      <section className="home-premium-footer-links">
        <a href="https://earthquake.usgs.gov/" target="_blank" rel="noreferrer">
          <FaMapMarkedAlt /> USGS
        </a>
        <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">
          <FaMapMarkedAlt /> OpenWeather
        </a>
      </section>
      <StatusModal
        open={!!selectedTeamMember}
        type="success"
        title="Volunteer Profile"
        onClose={() => setSelectedTeamMember(null)}
      >
        <p>Name: {selectedTeamMember?.user?.name || "N/A"}</p>
        <p>Email: {selectedTeamMember?.user?.email || "N/A"}</p>
        <p>AGS ID: {selectedTeamMember?.user?.AGS_ID || "N/A"}</p>
        <p>Role: {selectedTeamMember?.user?.role || "N/A"}</p>
      </StatusModal>
    </div>
  );
};

export default Home;
