import { YachtModel } from "../models/yacht.model.js";

// Create Yacht
export const createYacht = async (req, res, next) => {
  try {
    const yacht = await YachtModel.create({ ...req.body, company: req.user.company });
    res.status(201).json({ success: true, yacht });
  } catch (error) {
    next(error);
  }
};

// Get all Yachts (company-scoped)
export const getAllYachts = async (req, res, next) => {
  try {
    const yachts = await YachtModel.find({ company: req.user.company });
    res.json({ success: true, yachts });
  } catch (error) {
    next(error);
  }
};

// Get Yacht by ID
export const getYachtById = async (req, res, next) => {
  try {
    const yacht = await YachtModel.findOne({ _id: req.params.id, company: req.user.company });
    if (!yacht) return res.status(404).json({ success: false, message: "Yacht not found" });
    res.json({ success: true, yacht });
  } catch (error) {
    next(error);
  }
};

// Update Yacht
export const updateYacht = async (req, res, next) => {
  try {
    const yacht = await YachtModel.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true }
    );
    if (!yacht) return res.status(404).json({ success: false, message: "Yacht not found" });
    res.json({ success: true, yacht });
  } catch (error) {
    next(error);
  }
};

// Delete Yacht (soft delete)
export const deleteYacht = async (req, res, next) => {
  try {
    const yacht = await YachtModel.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      { status: "inactive" },
      { new: true }
    );
    if (!yacht) return res.status(404).json({ success: false, message: "Yacht not found" });
    res.json({ success: true, message: "Yacht marked as inactive" });
  } catch (error) {
    next(error);
  }
};
