const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
  getStudentStats,
} = require("../controllers/student.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const studentValidation = [
  body("studentNumber").trim().notEmpty().withMessage("Student number is required"),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("course").trim().notEmpty().withMessage("Course is required"),
  body("yearLevel")
    .isInt({ min: 1, max: 5 })
    .withMessage("Year level must be between 1 and 5"),
];

router.get("/search", protect, authorize("admin"), searchStudents);
router.get("/stats", protect, authorize("admin"), getStudentStats);
router.get("/", protect, authorize("admin"), getStudents);
router.get("/:id", protect, getStudent);
router.post("/", protect, authorize("admin"), studentValidation, createStudent);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("yearLevel")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Year level must be between 1 and 5"),
  ],
  updateStudent
);
router.delete("/:id", protect, authorize("admin"), deleteStudent);

module.exports = router;
