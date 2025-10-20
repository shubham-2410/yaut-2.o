import express from "express";
import {
  createYacht,
  getAllYachts,
  getYachtById,
  updateYacht,
  deleteYacht,
} from "../controllers/yacht.controller.js";

import { yachtSchema } from "../validators/yacht.validator.js";
import { validate } from "../middleware/validate.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";
import { authMiddleware, onlyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Create Yacht (Admin Only)
router.post(
  "/",
  authMiddleware,
  onlyAdmin,
  upload.array("yachtPhotos"), // Multiple photos
  // Merge uploaded files into body for validation
  (req, res, next) => {
    if (req.files) {
      req.body.yachtPhotos = req.files.map(file => file.path || file.buffer);
    }
    next();
  },
  validate(yachtSchema),
  uploadToCloudinary("yaut/yachts"), // Upload to Cloudinary
  createYacht
);

// Get all yachts
router.get("/", authMiddleware, getAllYachts);

// Get yacht by ID
router.get("/:id", authMiddleware, getYachtById);

// Update yacht (Admin Only)
router.put(
  "/:id",
  authMiddleware,
  onlyAdmin,
  upload.array("yachtPhotos"),
  (req, res, next) => {
    if (req.files) {
      req.body.yachtPhotos = req.files.map(file => file.path || file.buffer);
    }
    next();
  },
  validate(yachtSchema),
  uploadToCloudinary("yaut/yachts"),
  updateYacht
);

// Delete yacht (Admin Only)
router.delete("/:id", authMiddleware, onlyAdmin, deleteYacht);

export default router;
