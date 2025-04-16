// original
const express = require("express");
const router = express.Router();
const middleware = require("../middleware/authMiddleware");
// user controller
const {
  register,
  login,
  checkUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require("../controller/userController");

//registering the routes
router.post("/register", register);

//login route
router.post("/login", login);

// check user route
router.post("/checkUser", middleware, checkUser);

//select user profile route
router.get("/profile", middleware, getProfile);

//update user profile route
router.put("/profile", middleware, updateProfile);

//change password route
router.put("/change-password", middleware, changePassword);

// forgot password route
router.post("/forgot-password", forgotPassword);

// verify reset token route
router.get("/verify-reset-token/:token", verifyResetToken);

// reset password route
router.post("/reset-password", resetPassword);

module.exports = router;
