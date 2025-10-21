import mongoose from "mongoose";

const yachtSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        capacity: { type: Number, required: true }, // max pax
        runningCost: { type: Number, required: true },
        price: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
        yachtPhotos: [String],
        company: {
            type: String,
            required: true
        },
        // Extra details
        boardingLocation: { type: String },
        description: { type: String },
        registrationNumber: { type: String },
        size: { type: String },
        captain: { type: String },
        company: { type: String },
        driverName: { type: String },
        totalCrew: { type: Number },
        sailingArea: { type: String, enum: ["Seaside", "Backwaters"] },

        // Sale options
        agentsSale: { type: Boolean, default: true },
        websiteSale: { type: Boolean, default: true },

        // Availability tracking
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true }
);

export const YachtModel = mongoose.model("Yacht", yachtSchema);
