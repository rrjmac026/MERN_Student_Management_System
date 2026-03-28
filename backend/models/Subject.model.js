const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: [true, "Subject code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    units: {
      type: Number,
      required: [true, "Units are required"],
      min: [1, "Units must be at least 1"],
      max: [6, "Units cannot exceed 6"],
    },
    type: {
      type: String,
      enum: ["Lecture", "Laboratory", "Lecture/Laboratory"],
      default: "Lecture",
    },
    course: {
      type: String,
      trim: true,
    },
    yearLevel: {
      type: Number,
      min: 1,
      max: 5,
    },
    semester: {
      type: String,
      enum: ["1st Semester", "2nd Semester", "Summer"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
