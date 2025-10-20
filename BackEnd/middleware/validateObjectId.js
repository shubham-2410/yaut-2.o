import mongoose from "mongoose";

export const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: `${paramName} is not a valid ObjectId` });
  }
  next();
};
