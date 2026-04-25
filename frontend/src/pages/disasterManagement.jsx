import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const DisasterManagement = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [volunteers, setVolunteers] = useState([]);
  const [camps, setCamps] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [operations, setOperations] = useState([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState([]);

  const [campForm, setCampForm] = useState({ name: "", region: "", district: "", address: "", capacity: 50 });
  const [profileForm, setProfileForm] = useState({ age: "", phone: "", address: "", skills: "", experienceYears: 0, region: "", district: "" });
  const [trainingForm, setTrainingForm] = useState({ title: "", description: "", camp: "", date: "" });
  const [operationForm, setOperationForm] = useState({ title: "", disasterType: "other", location: "", startsAt: "" });
  const [disciplineForm, setDisciplineForm] = useState({ volunteerId: "", actionType: "warning", reason: "" });

  const isOfficer = user?.role === "admin" || user?.role === "camp_officer";
  const isVolunteer = user?.role === "user" || user?.role === "volunteer" || user?.role === "team_leader";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setMessage("");

      const headers = { Authorization: `Bearer ${token}` };
      const calls = [
        axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/camps`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/trainings`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/operations`, { headers })
      ];

      if (isOfficer) {
        calls.push(
          axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/profiles`, { headers }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/volunteers/disciplinary-actions`, { headers })
        );
      }

      const result = await Promise.all(calls);
      setCamps(result[0].data.camps || []);
      setTrainings(result[1].data.trainings || []);
      setOperations(result[2].data.operations || []);

      if (isOfficer) {
        setVolunteers(result[3].data.volunteers || []);
        setDisciplinaryActions(result[4].data.actions || []);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load management dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  const withAuth = { headers: { Authorization: `Bearer ${token}` } };

  const submitVolunteerProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/volunteers/profiles`, {
        ...profileForm,
        age: Number(profileForm.age),
        experienceYears: Number(profileForm.experienceYears || 0),
        skills: profileForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
      }, withAuth);
      setMessage("Volunteer profile submitted successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Profile submit failed");
    }
  };

  const submitCamp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/volunteers/camps`, {
        ...campForm,
        capacity: Number(campForm.capacity)
      }, withAuth);
      setCampForm({ name: "", region: "", district: "", address: "", capacity: 50 });
      setMessage("Camp created");
      fetchDashboardData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Camp creation failed");
    }
  };

  const submitTraining = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/volunteers/trainings`, trainingForm, withAuth);
      setTrainingForm({ title: "", description: "", camp: "", date: "" });
      setMessage("Training scheduled");
      fetchDashboardData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Training creation failed");
    }
  };

  const submitOperation = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/volunteers/operations`, operationForm, withAuth);
      setOperationForm({ title: "", disasterType: "other", location: "", startsAt: "" });
      setMessage("Operation created");
      fetchDashboardData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Operation creation failed");
    }
  };

  const submitDisciplinary = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/volunteers/disciplinary-actions`, disciplineForm, withAuth);
      setDisciplineForm({ volunteerId: "", actionType: "warning", reason: "" });
      setMessage("Disciplinary action recorded");
      fetchDashboardData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Disciplinary action failed");
    }
  };

  const quickAction = async (url) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}${url}`, {}, withAuth);
      setMessage("Action completed");
      fetchDashboardData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="login-container">
      <div className="management-box">
        <h2>Disaster Management Dashboard</h2>
        <p>Role: {user?.role || "unknown"}</p>
        {loading ? <p>Loading data...</p> : null}
        {message ? <p className="message">{message}</p> : null}

        {isVolunteer ? (
          <section className="card-section">
            <h3>Volunteer Enrollment</h3>
            <form className="grid-form" onSubmit={submitVolunteerProfile}>
              <input placeholder="Age" value={profileForm.age} onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} />
              <input placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              <input placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
              <input placeholder="Skills (comma separated)" value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} />
              <input placeholder="Experience years" value={profileForm.experienceYears} onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })} />
              <button className="login-button" type="submit">Submit Volunteer Profile</button>
            </form>
          </section>
        ) : null}

        {isOfficer ? (
          <>
            <section className="card-section">
              <h3>Create Camp</h3>
              <form className="grid-form" onSubmit={submitCamp}>
                <input placeholder="Camp name" value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} />
                <input placeholder="Region" value={campForm.region} onChange={(e) => setCampForm({ ...campForm, region: e.target.value })} />
                <input placeholder="District" value={campForm.district} onChange={(e) => setCampForm({ ...campForm, district: e.target.value })} />
                <input placeholder="Address" value={campForm.address} onChange={(e) => setCampForm({ ...campForm, address: e.target.value })} />
                <input placeholder="Capacity" value={campForm.capacity} onChange={(e) => setCampForm({ ...campForm, capacity: e.target.value })} />
                <button className="login-button" type="submit">Create Camp</button>
              </form>
            </section>

            <section className="card-section">
              <h3>Schedule Training</h3>
              <form className="grid-form" onSubmit={submitTraining}>
                <input placeholder="Training title" value={trainingForm.title} onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })} />
                <input placeholder="Description" value={trainingForm.description} onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })} />
                <select value={trainingForm.camp} onChange={(e) => setTrainingForm({ ...trainingForm, camp: e.target.value })}>
                  <option value="">Select Camp</option>
                  {camps.map((camp) => <option key={camp._id} value={camp._id}>{camp.name}</option>)}
                </select>
                <input type="datetime-local" value={trainingForm.date} onChange={(e) => setTrainingForm({ ...trainingForm, date: e.target.value })} />
                <button className="login-button" type="submit">Create Training</button>
              </form>
            </section>

            <section className="card-section">
              <h3>Create Disaster Operation</h3>
              <form className="grid-form" onSubmit={submitOperation}>
                <input placeholder="Operation title" value={operationForm.title} onChange={(e) => setOperationForm({ ...operationForm, title: e.target.value })} />
                <select value={operationForm.disasterType} onChange={(e) => setOperationForm({ ...operationForm, disasterType: e.target.value })}>
                  <option value="earthquake">Earthquake</option>
                  <option value="flood">Flood</option>
                  <option value="landslide">Landslide</option>
                  <option value="cyclone">Cyclone</option>
                  <option value="other">Other</option>
                </select>
                <input placeholder="Location" value={operationForm.location} onChange={(e) => setOperationForm({ ...operationForm, location: e.target.value })} />
                <input type="datetime-local" value={operationForm.startsAt} onChange={(e) => setOperationForm({ ...operationForm, startsAt: e.target.value })} />
                <button className="login-button" type="submit">Create Operation</button>
              </form>
            </section>

            <section className="card-section">
              <h3>Disciplinary Action</h3>
              <form className="grid-form" onSubmit={submitDisciplinary}>
                <select value={disciplineForm.volunteerId} onChange={(e) => setDisciplineForm({ ...disciplineForm, volunteerId: e.target.value })}>
                  <option value="">Select Volunteer</option>
                  {volunteers.map((vol) => (
                    <option key={vol._id} value={vol._id}>{vol.user?.name || "Unknown"} ({vol.status})</option>
                  ))}
                </select>
                <select value={disciplineForm.actionType} onChange={(e) => setDisciplineForm({ ...disciplineForm, actionType: e.target.value })}>
                  <option value="warning">Warning</option>
                  <option value="suspension">Suspension</option>
                </select>
                <input placeholder="Reason" value={disciplineForm.reason} onChange={(e) => setDisciplineForm({ ...disciplineForm, reason: e.target.value })} />
                <button className="login-button" type="submit">Issue Action</button>
              </form>
            </section>
          </>
        ) : null}

        <section className="card-section">
          <h3>Volunteers</h3>
          {volunteers.length === 0 ? <p>No volunteer records</p> : (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Status</th><th>Certified</th><th>Leader</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((vol) => (
                    <tr key={vol._id}>
                      <td>{vol.user?.name}</td>
                      <td>{vol.status}</td>
                      <td>{vol.certified ? "Yes" : "No"}</td>
                      <td>{vol.teamLeader ? "Yes" : "No"}</td>
                      <td>
                        {isOfficer ? <button className="mini-btn" onClick={() => quickAction(`/api/volunteers/profiles/${vol._id}/approve`)}>Approve</button> : null}
                        {isOfficer ? <button className="mini-btn" onClick={() => quickAction(`/api/volunteers/profiles/${vol._id}/certify`)}>Certify</button> : null}
                        {isOfficer ? <button className="mini-btn" onClick={() => quickAction(`/api/volunteers/profiles/${vol._id}/team-leader`)}>Leader</button> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card-section">
          <h3>Operations</h3>
          {operations.length === 0 ? <p>No operations available</p> : (
            <ul className="compact-list">
              {operations.map((op) => (
                <li key={op._id}>
                  <strong>{op.title}</strong> - {op.disasterType} - {op.location} ({op.status})
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-section">
          <h3>Trainings</h3>
          {trainings.length === 0 ? <p>No trainings available</p> : (
            <ul className="compact-list">
              {trainings.map((t) => (
                <li key={t._id}>
                  <strong>{t.title}</strong> - {new Date(t.date).toLocaleString()} - {t.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-section">
          <h3>Disciplinary Logs</h3>
          {disciplinaryActions.length === 0 ? <p>No disciplinary records</p> : (
            <ul className="compact-list">
              {disciplinaryActions.map((item) => (
                <li key={item._id}>
                  {item.volunteer?.user?.name} - {item.actionType} - {item.reason}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p><Link to="/my-alerts">Back to Alerts</Link></p>
      </div>
    </div>
  );
};

export default DisasterManagement;
