const User = require("../models/User");
const Volunteer = require("../models/volunteer");
const Camp = require("../models/camp");
const TrainingSession = require("../models/trainingSession");
const DisasterOperation = require("../models/disasterOperation");
const DisciplinaryAction = require("../models/disciplinaryAction");

const createCamp = async (req, res) => {
  try {
    const { name, region, district, address, capacity } = req.body;
    if (!name || !region || !district || !address || !capacity) {
      return res.status(400).json({ message: "Please fill all camp fields" });
    }

    const camp = await Camp.create({
      name,
      region,
      district,
      address,
      capacity,
      campOfficer: req.user.id
    });

    res.status(201).json({ message: "Camp created", camp });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCamps = async (req, res) => {
  try {
    const camps = await Camp.find().populate("campOfficer", "name email role").sort({ createdAt: -1 });
    res.json({ camps });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createVolunteerProfile = async (req, res) => {
  try {
    const { age, phone, address, skills, experienceYears, region, district } = req.body;
    if (!age || !phone || !address) {
      return res.status(400).json({ message: "Age, phone and address are required" });
    }

    const existing = await Volunteer.findOne({ user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "Volunteer profile already exists" });
    }

    const volunteer = await Volunteer.create({
      user: req.user.id,
      age,
      phone,
      address,
      skills: Array.isArray(skills) ? skills : [],
      experienceYears: experienceYears || 0,
      region: region || "",
      district: district || "",
      status: "pending"
    });

    res.status(201).json({ message: "Volunteer profile submitted", volunteer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find()
      .populate("user", "name email role")
      .populate("assignedCamp", "name region district")
      .sort({ createdAt: -1 });
    res.json({ volunteers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const approveVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    volunteer.status = "approved";
    volunteer.approvedBy = req.user.id;
    volunteer.approvedAt = new Date();
    await volunteer.save();

    await User.findByIdAndUpdate(volunteer.user, { role: "volunteer" });

    res.json({ message: "Volunteer approved", volunteer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createTraining = async (req, res) => {
  try {
    const { title, description, camp, date, volunteerIds } = req.body;
    if (!title || !camp || !date) {
      return res.status(400).json({ message: "Title, camp and date required" });
    }

    const training = await TrainingSession.create({
      title,
      description: description || "",
      camp,
      date,
      campOfficer: req.user.id,
      volunteers: Array.isArray(volunteerIds) ? volunteerIds : []
    });

    res.status(201).json({ message: "Training scheduled", training });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTrainings = async (req, res) => {
  try {
    const trainings = await TrainingSession.find()
      .populate("camp", "name district region")
      .populate("campOfficer", "name")
      .populate({ path: "volunteers", populate: { path: "user", select: "name email" } })
      .sort({ date: -1 });
    res.json({ trainings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const certifyVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    volunteer.certified = true;
    await volunteer.save();
    res.json({ message: "Volunteer certified", volunteer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createOperation = async (req, res) => {
  try {
    const { title, disasterType, location, startsAt, endsAt, status } = req.body;
    if (!title || !location || !startsAt) {
      return res.status(400).json({ message: "Title, location and startsAt required" });
    }

    const operation = await DisasterOperation.create({
      title,
      disasterType: disasterType || "other",
      location,
      startsAt,
      endsAt: endsAt || null,
      status: status || "planned",
      createdBy: req.user.id
    });

    res.status(201).json({ message: "Operation created", operation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const assignVolunteerToOperation = async (req, res) => {
  try {
    const { operationId, volunteerId } = req.params;
    const operation = await DisasterOperation.findById(operationId);
    if (!operation) {
      return res.status(404).json({ message: "Operation not found" });
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    const alreadyAssigned = operation.assignedVolunteers.some((v) => String(v.volunteer) === String(volunteerId));
    if (alreadyAssigned) {
      return res.status(400).json({ message: "Volunteer already assigned" });
    }

    operation.assignedVolunteers.push({
      volunteer: volunteerId,
      assignedBy: req.user.id
    });
    await operation.save();

    volunteer.status = "deployed";
    await volunteer.save();

    res.json({ message: "Volunteer assigned to operation", operation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOperations = async (req, res) => {
  try {
    const operations = await DisasterOperation.find()
      .populate("createdBy", "name role")
      .populate({
        path: "assignedVolunteers.volunteer",
        populate: { path: "user", select: "name email" }
      })
      .sort({ createdAt: -1 });
    res.json({ operations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const myVolunteerOperations = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user.id });
    if (!volunteer) {
      return res.json({ operations: [] });
    }

    const operations = await DisasterOperation.find({
      "assignedVolunteers.volunteer": volunteer._id
    }).sort({ createdAt: -1 });

    res.json({ operations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const markTeamLeader = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    volunteer.teamLeader = true;
    await volunteer.save();
    await User.findByIdAndUpdate(volunteer.user, { role: "team_leader" });

    res.json({ message: "Volunteer promoted as team leader", volunteer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const issueDisciplinaryAction = async (req, res) => {
  try {
    const { volunteerId, actionType, reason } = req.body;
    if (!volunteerId || !actionType || !reason) {
      return res.status(400).json({ message: "volunteerId, actionType and reason are required" });
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    const action = await DisciplinaryAction.create({
      volunteer: volunteerId,
      actionType,
      reason,
      issuedBy: req.user.id
    });

    if (actionType === "suspension") {
      volunteer.status = "suspended";
      await volunteer.save();
    }

    res.status(201).json({ message: "Disciplinary action recorded", action });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDisciplinaryActions = async (req, res) => {
  try {
    const actions = await DisciplinaryAction.find()
      .populate({ path: "volunteer", populate: { path: "user", select: "name email" } })
      .populate("issuedBy", "name role")
      .sort({ createdAt: -1 });
    res.json({ actions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createCamp,
  getCamps,
  createVolunteerProfile,
  getVolunteers,
  approveVolunteer,
  createTraining,
  getTrainings,
  certifyVolunteer,
  createOperation,
  assignVolunteerToOperation,
  getOperations,
  myVolunteerOperations,
  markTeamLeader,
  issueDisciplinaryAction,
  getDisciplinaryActions
};
