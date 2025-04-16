// dbConnection
const dbConnection = require("../db/dbConfig");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config(); // For environment variables
// Email service configuration

async function register(req, res) {
  const { username, firstname, lastname, email, password } = req.body;
  if (!username || !firstname || !lastname || !email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "All input is required" });
  }
  try {
    const [User] = await dbConnection.query(
      "select user_name,user_id from usertable where user_name = ? or email = ?",
      [username, email]
    );
    if (User.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "User already exists" });
    }
    if (password.length <= 8) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Password must be at least 8 characters long" });
    }

    // encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await dbConnection.query(
      "INSERT INTO usertable (user_name, first_name, last_name, email, password) VALUES (?,?,?,?,?)",
      [username, firstname, lastname, email, hashedPassword]
    );
    return res
      .status(StatusCodes.CREATED)
      .json({ msg: "User registered successfully" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal server error, try again later" });
  }
}
//####################################################################################################
async function login(req, res) {
  const { email, password } = req.body;
  // console.log(email, password);
  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "All input is required" });
  }
  try {
    const [user] = await dbConnection.query(
      "select user_name,user_id,password from usertable where email = ?",
      [email]
    );
    // console.log(user);
    if (user.length == 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Email or Password is Wrong" });
    }
    // compare password
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid credentials" });
    }
    const username = user[0].user_name;
    const user_id = user[0].user_id;
    const token = jwt.sign({ username, user_id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return res
      .status(StatusCodes.OK)
      .json({ msg: "user Login successful", token, username, user_id });
    //return res.json({ user: user[0].password });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal server error, try again later" });
  }
}
//#####################################################################################################
async function checkUser(req, res) {
    console.log("✅ checkUser endpoint hit!");
  const username = req.user?.username;
  // console.log(username);
  const userid = req.user?.user_id;
  // console.log(userid);
  res.status(StatusCodes.OK).json({ msg: "valid user", username, userid });
}

//profile management
// Get user profile
async function getProfile(req, res) {
  const userId = req.user.user_id;

  try {
    const [user] = await dbConnection.query(
      "SELECT user_id, user_name, first_name, last_name, email FROM usertable WHERE user_id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    }

    return res.status(StatusCodes.OK).json(user[0]);
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal server error" });
  }
}

// Update user profile
async function updateProfile(req, res) {
  const userId = req.user.user_id;
  const { username, firstname, lastname, email } = req.body;

  if (!username || !firstname || !lastname || !email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "All fields are required" });
  }

  try {
    // Check if username or email already exists for another user
    const [existingUser] = await dbConnection.query(
      "SELECT user_id FROM usertable WHERE (user_name = ? OR email = ?) AND user_id != ?",
      [username, email, userId]
    );

    if (existingUser.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Username or email already in use" });
    }

    await dbConnection.query(
      "UPDATE usertable SET user_name = ?, first_name = ?, last_name = ?, email = ? WHERE user_id = ?",
      [username, firstname, lastname, email, userId]
    );

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Profile updated successfully" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal server error" });
  }
}

// Change password
async function changePassword(req, res) {
  const userId = req.user.user_id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Both current and new password are required" });
  }

  if (newPassword.length <= 8) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Password must be at least 8 characters long" });
  }

  try {
    // Get current password from DB
    const [user] = await dbConnection.query(
      "SELECT password FROM usertable WHERE user_id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user[0].password);
    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in DB
    await dbConnection.query(
      "UPDATE usertable SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Password changed successfully" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Internal server error" });
  }
}

// In your controller

// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     // 1. Validate email
//     if (!email) {
//       return res.status(400).json({ error: "Email is required" });
//     }

//     // 2. Find user (don't reveal if user doesn't exist)
//     const [users] = await dbConnection.query(
//       "SELECT * FROM usertable WHERE email = ?",
//       [email]
//     );

//     if (users.length > 0) {
//       const user = users[0];

//       // 3. Generate reset token - THIS WAS FAILING
//       const resetToken = crypto.randomBytes(20).toString("hex"); // Now works
//       const resetTokenExpiry = Date.now() + 3600000; // 1 hour

//       // 4. Update user in database
//       await dbConnection.query(
//         "UPDATE usertable SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?",
//         [resetToken, new Date(resetTokenExpiry), user.user_id]
//       );

//       // 5. Send email
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS, // This now uses the app password
//         },
//       });

//       const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

//       await transporter.sendMail({
//         to: email,
//         subject: "Password Reset",
//         html: `<p>Click <a href="${resetUrl}">here</a> to reset your password</p>`,
//       });
//     }

//     return res.status(200).json({
//       msg: "If this email exists in our system, you'll receive a reset link",
//     });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//     });
//   }
// };
// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     if (!email) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ msg: "Email is required" });
//     }

//     const [users] = await dbConnection.query(
//       "SELECT user_id FROM usertable WHERE email = ?",
//       [email]
//     );
//     console.log(users);

//     if (users || users.length !== 0) {
//       return res.status(StatusCodes.OK).json({
//         msg: "If this email exists in our system, you'll receive a reset link",
//       });
//     }

//     const user = users[0];
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     const resetTokenExpiry = new Date(Date.now() + 8640000); // 48 hour expired

//     await dbConnection.query(
//       "UPDATE usertable SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?",
//       [resetToken, resetTokenExpiry, user.user_id]
//     );

//     // Validate email configuration
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       console.error("Missing email credentials in .env file");
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//         msg: "Email configuration error. Please contact support.",
//       });
//     }

//     // Configure nodemailer with more robust settings
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       host: "smtp.gmail.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       tls: {
//         rejectUnauthorized: false,
//       },
//     });

//     // Verify connection configuration
//     await transporter.verify((error, success) => {
//       if (error) {
//         console.error("Error verifying transporter:", error);
//       } else {
//         console.log("Server is ready to take our messages");
//       }
//     });

//     const resetLink = `http://localhost:5173/reset-password/${resetToken}`; // Changed to frontend URL
//     const mailOptions = {
//       from: `"Your App Name" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Password Reset Link",
//       html: `
//         <p>You requested a password reset. Click the link below to reset your password:</p>
//         <a href="${resetLink}">Reset Password</a>
//         <p>This link will expire in 1 hour.</p>
//         <p>If you didn't request this, please ignore this email.</p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log("Reset email sent successfully!");

//     return res.status(StatusCodes.OK).json({
//       msg: "If this email exists in our system, you'll receive a reset link",
//     });
//   } catch (error) {
//     console.error("Forgot password error:", error);

//     // Handle specific email errors
//     if (error.code === "EAUTH") {
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//         msg: "Email authentication failed. Please contact support.",
//       });
//     }

//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       msg: "Internal server error",
//     });
//   }
// };

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // console.log(email);//fine
  try {
    // 1. Validate email
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 2. Find user (don't reveal if user doesn't exist)
    const [users] = await dbConnection.query(
      "SELECT * FROM usertable WHERE email = ?",
      [email]
    );
    // console.log(users);//fine
    if (users.length > 0) {
      const user = users[0];

      // 3. Generate reset token - THIS WAS FAILING
      const resetToken = crypto.randomBytes(20).toString("hex"); // Now works
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour

      console.log(resetToken); // Log the generated token for debugging fine
      console.log(resetTokenExpiry); // Log the expiry time for debugging fine

      // 4. Update user in database
      await dbConnection.query(
        "UPDATE usertable SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?",
        [resetToken, new Date(resetTokenExpiry), user.user_id]
      );

      // 5. Send email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // This now uses the app password
        },
      });
      console.log(transporter); //fine

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      await transporter.sendMail({
        to: email,
        subject: "Password Reset",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password</p>`,
      });
    }

    return res.status(200).json({
      msg: "If this email exists in our system, you'll receive a reset link",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

async function verifyResetToken(req, res) {
  const { token } = req.params;

  try {
    // Check if token exists and is not expired
    const [users] = await dbConnection.query(
      "SELECT user_id FROM usertable WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    // If valid, create a short-lived JWT
    const user = users[0];
    const resetToken = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Token is valid",
      resetToken,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error verifying token",
    });
  }
}

async function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Reset token and new password are required",
    });
  }

  try {
    // Verify the JWT
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await dbConnection.query(
      `UPDATE usertable 
       SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
       WHERE user_id = ?`,
      [hashedPassword, userId]
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Reset token has expired. Please request a new reset link.",
      });
    }

    console.error("Password reset error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error resetting password",
    });
  }
}

module.exports = {
  register,
  login,
  checkUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
