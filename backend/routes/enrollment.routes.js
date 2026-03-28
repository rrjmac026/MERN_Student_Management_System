const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  getEnrollments,
  getMyEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} = require("../controllers/enrollment.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const enrollmentValidation = [
  body("student").notEmpty().withMessage("Student is required"),
  body("subjects").isArray({ min: 1 }).withMessage("At least one subject is required"),
  body("academicYear")
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Academic year must be in format YYYY-YYYY"),
  body("semester")
    .isIn(["1st Semester", "2nd Semester", "Summer"])
    .withMessage("Invalid semester"),
  body("yearLevel")
    .isInt({ min: 1, max: 5 })
    .withMessage("Year level must be between 1 and 5"),
];

router.get("/my", protect, getMyEnrollments);
router.get("/", protect, authorize("admin"), getEnrollments);
router.get("/:id", protect, getEnrollment);
router.post("/", protect, authorize("admin"), enrollmentValidation, createEnrollment);
router.put("/:id", protect, authorize("admin"), updateEnrollment);
router.delete("/:id", protect, authorize("admin"), deleteEnrollment);

module.exports = router;
