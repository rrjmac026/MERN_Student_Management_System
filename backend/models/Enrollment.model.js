const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    subjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        schedule: {
          type: String,
          trim: true,
        },
        room: {
          type: String,
          trim: true,
        },
      },
    ],
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      match: [/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"],
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: ["1st Semester", "2nd Semester", "Summer"],
    },
    yearLevel: {
      type: Number,
      required: [true, "Year level is required"],
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ["Enrolled", "Dropped", "Completed", "Pending"],
      default: "Enrolled",
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    totalUnits: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent duplicate enrollment per student per academic year per semester
enrollmentSchema.index(
  { student: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
