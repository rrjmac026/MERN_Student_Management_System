const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  searchSubjects,
} = require("../controllers/subject.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const subjectValidation = [
  body("subjectCode").trim().notEmpty().withMessage("Subject code is required"),
  body("subjectName").trim().notEmpty().withMessage("Subject name is required"),
  body("units")
    .isInt({ min: 1, max: 6 })
    .withMessage("Units must be between 1 and 6"),
];

router.get("/search", protect, searchSubjects);
router.get("/", protect, getSubjects);
router.get("/:id", protect, getSubject);
router.post("/", protect, authorize("admin"), subjectValidation, createSubject);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    body("units")
      .optional()
      .isInt({ min: 1, max: 6 })
      .withMessage("Units must be between 1 and 6"),
  ],
  updateSubject
);
router.delete("/:id", protect, authorize("admin"), deleteSubject);

module.exports = router;
