import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
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

  const [msg, setMsg] = useState("");
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
  const [officerEmailSearch, setOfficerEmailSearch] = useState("");
  const [officerCandidates, setOfficerCandidates] = useState([]);
  const [selectedCampDetail, setSelectedCampDetail] = useState(null);

  const [trainForm, setTrainForm] = useState({ title: "", description: "", date: "" });
  const [opForm, setOpForm] = useState({ title: "", disasterType: "other", location: "", startsAt: "", endsAt: "", teamLeaderUsers: [] });

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadRoleData = useCallback(async () => {
    if (!token || !user?.role) return;
    setLoading(true);
    setMsg("");
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
      setMsg(e.response?.data?.message || "Failed to load dashboard");
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
    if (!officerEmailSearch || officerEmailSearch.trim().length < 2) {
      setOfficerCandidates([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/team-leaders`, {
          headers,
          params: { page: 1, limit: 10, search: officerEmailSearch.trim() },
        });
        setOfficerCandidates(res.data.leaders || []);
      } catch {
        setOfficerCandidates([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [officerEmailSearch, headers, user?.role]);

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

  const loadCampDetail = async (campId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camps/${campId}/detail`, { headers });
      setSelectedCampDetail(res.data);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to load camp detail");
    }
  };

  const submitEnroll = async (e) => {
    e.preventDefault();
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
      setMsg("Enrollment saved");
    } catch (err) {
      setMsg(err.response?.data?.message || "Enrollment failed");
    }
  };

  const submitCamp = async (e) => {
    e.preventDefault();
    if (!pickedLoc || !campForm.campOfficerId) {
      setMsg("Pick a location and camp officer");
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
      setMsg("Camp created");
      setPickedLoc(null);
      setLocQuery("");
      loadRoleData();
    } catch (err) {
      setMsg(err.response?.data?.message || "Camp create failed");
    }
  };

  const submitTraining = async (e) => {
    e.preventDefault();
    if (!officerStats?.camp?._id) {
      setMsg("No camp assigned to you");
      return;
    }
    const d = trainForm.date;
    if (!d || new Date(d) < new Date()) {
      setMsg("Training date cannot be in the past");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/volunteers/trainings`,
        {
          title: trainForm.title,
          description: trainForm.description,
          camp: officerStats.camp._id,
          date: d,
        },
        { headers }
      );
      setMsg("Training scheduled");
      loadRoleData();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    }
  };

  const submitOperation = async (e) => {
    e.preventDefault();
    if (!officerStats?.camp?._id) {
      setMsg("No camp");
      return;
    }
    const starts = opForm.startsAt;
    if (!starts || new Date(starts) < new Date()) {
      setMsg("Operation start cannot be in the past");
      return;
    }
    if (opForm.endsAt && new Date(opForm.endsAt) < new Date(opForm.startsAt)) {
      setMsg("End must be after start");
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
      setMsg("Operation created");
      loadRoleData();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
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

      {msg ? <p className="home-inline-msg">{msg}</p> : null}
      {loading ? <p className="home-inline-msg">Loading…</p> : null}

      <section className="home-premium-hero">
        <div>
          <h2>Welcome, {user?.name || "User"}</h2>
          <p>Role-based dashboard. Use the profile menu for FAQ, contact, and logout.</p>
        </div>
        <div className="home-premium-role-badge">
          <span>Role</span>
          <strong>{user?.role}</strong>
        </div>
      </section>

      {user?.role === "user" ? (
        <section className="card-section">
          <h3>
            <FaUserPlus /> Volunteer enrollment
          </h3>
          <form className="grid-form" onSubmit={submitEnroll}>
            <input placeholder="Age" value={enroll.age} onChange={(e) => setEnroll({ ...enroll, age: e.target.value })} />
            <input placeholder="Phone" value={enroll.phone} onChange={(e) => setEnroll({ ...enroll, phone: e.target.value })} />
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
              <li key={m._id}>{m.user?.name || "Volunteer"}</li>
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
                  <input placeholder="Title" value={trainForm.title} onChange={(e) => setTrainForm({ ...trainForm, title: e.target.value })} />
                  <input placeholder="Description" value={trainForm.description} onChange={(e) => setTrainForm({ ...trainForm, description: e.target.value })} />
                  <input type="datetime-local" min={minDateTimeLocal()} value={trainForm.date} onChange={(e) => setTrainForm({ ...trainForm, date: e.target.value })} />
                  <button className="login-button" type="submit">
                    Schedule
                  </button>
                </form>
              </section>
              <section className="card-section">
                <h3>Create disaster operation</h3>
                <form className="grid-form" onSubmit={submitOperation}>
                  <input placeholder="Title" value={opForm.title} onChange={(e) => setOpForm({ ...opForm, title: e.target.value })} />
                  <select value={opForm.disasterType} onChange={(e) => setOpForm({ ...opForm, disasterType: e.target.value })}>
                    <option value="earthquake">Earthquake</option>
                    <option value="flood">Flood</option>
                    <option value="other">Other</option>
                  </select>
                  <input placeholder="Location text" value={opForm.location} onChange={(e) => setOpForm({ ...opForm, location: e.target.value })} />
                  <input type="datetime-local" min={minDateTimeLocal()} value={opForm.startsAt} onChange={(e) => setOpForm({ ...opForm, startsAt: e.target.value })} />
                  <input type="datetime-local" min={minDateTimeLocal()} value={opForm.endsAt} onChange={(e) => setOpForm({ ...opForm, endsAt: e.target.value })} />
                  <p className="home-small-hint">Select team leaders (same camp) by user id list (comma-separated Mongo ids) if needed.</p>
                  <input
                    placeholder="Team leader user IDs comma separated"
                    value={opForm.teamLeaderUsers.join(",")}
                    onChange={(e) =>
                      setOpForm({
                        ...opForm,
                        teamLeaderUsers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
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
            <div>
              <h4>Camps</h4>
              <strong>{adminSummary.camps}</strong>
            </div>
            <div>
              <h4>Camp officers</h4>
              <strong>{adminSummary.campOfficers}</strong>
            </div>
            <div>
              <h4>Team leaders</h4>
              <strong>{adminSummary.teamLeaders}</strong>
            </div>
            <div>
              <h4>Volunteers</h4>
              <strong>{adminSummary.volunteers}</strong>
            </div>
            <div>
              <h4>Users</h4>
              <strong>{adminSummary.users}</strong>
            </div>
            <div>
              <h4>Live/upcoming ops</h4>
              <strong>{adminSummary.liveOrUpcomingOperations}</strong>
            </div>
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
              placeholder="Search camp officer by email"
              value={officerEmailSearch}
              onChange={(e) => setOfficerEmailSearch(e.target.value)}
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
                        setOfficerEmailSearch(candidate.user.email);
                        setOfficerCandidates([]);
                      }}
                    >
                      {candidate.user.email} ({candidate.user.name})
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
              <input className="full-input" placeholder="Search by location name" value={campSearch} onChange={(e) => setCampSearch(e.target.value)} />
              <button type="button" className="login-button" onClick={searchCamps}>
                Search
              </button>
            </div>
            <ul className="compact-list">
              {camps.map((c) => (
                <li key={c._id}>
                  <button type="button" className="home-camp-item-btn" onClick={() => loadCampDetail(c._id)}>
                    {c.name} — officer: {c.campOfficer?.name || c.campOfficer}
                  </button>
                </li>
              ))}
            </ul>
            {selectedCampDetail?.camp ? (
              <div className="card-section nested">
                <h4>Camp detail</h4>
                <p><strong>Name:</strong> {selectedCampDetail.camp.name}</p>
                <p><strong>Officer:</strong> {selectedCampDetail.camp.campOfficer?.name || "N/A"}</p>
                <p><strong>Volunteers:</strong> {selectedCampDetail.volunteersInCamp}</p>
                <p><strong>Team leaders:</strong> {selectedCampDetail.teamLeadersInCamp}</p>
                <p><strong>Live/upcoming operations:</strong> {selectedCampDetail.operations?.length || 0}</p>
              </div>
            ) : null}
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
    </div>
  );
};

export default Home;
