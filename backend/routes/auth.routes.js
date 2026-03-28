const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  register,
  login,
  getMe,
  changePassword,
  getUsers,
  toggleUserStatus,
} = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.get("/users", protect, authorize("admin"), getUsers);
router.put("/users/:id/toggle", protect, authorize("admin"), toggleUserStatus);

module.exports = router;
