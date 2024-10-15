// userRoute.js

const express = require("express");
const multer = require("multer");
const authenticate = require("../middlewares/authMiddleware");

const {
  uploadProfilePicture,
  updateUser,
  getUserInfo,
} = require("../controllers/userController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Temporary storage
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

// Route to upload the profile picture
router.post(
  "/uploadProfilePicture",
  authenticate,
  upload.single("profilePicture"),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  },
  uploadProfilePicture
);

router.get("/testToken", authenticate, (req, res) => {
  res.status(200).json({ message: "Token is valid", userId: req.userId });
});

// Other routes
router.get("/info", authenticate, getUserInfo);
router.put("/update", authenticate, updateUser);

module.exports = router;
