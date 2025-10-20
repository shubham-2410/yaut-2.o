import { z } from "zod";

export const yachtSchema = z.object({
  name: z
    .string({ required_error: "Yacht name is required" })
    .min(2, "Yacht name must be at least 2 characters"),

  capacity: z
    .number({ required_error: "Capacity is required" })
    .min(1, "At least 1 person required"),

  runningCost: z
    .number({ required_error: "Running cost (B2B) is required" })
    .min(0, "Cost cannot be negative"),

  maxSellingPrice: z
    .number({ required_error: "Max selling price is required" })
    .min(0, "Price cannot be negative"),

  sellingPrice: z
    .number({ required_error: "Actual selling price is required" })
    .min(0, "Price cannot be negative"),

  yachtPhotos: z
    .array(z.string().url("Invalid photo URL"))
    .nonempty("At least one photo is required"),

  boardingLocation: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      mapLink: z.string().url("Invalid map link").optional(),
    })
    .optional(),

  description: z
    .string()
    .max(2000, "Description too long")
    .optional(),

  registrationNumber: z.string().optional(),
  size: z.string().optional(),

  captain: z.string().optional(),
  company: z.string().optional(),
  driverName: z.string().optional(),
  totalCrew: z.number().optional(),

  tripStartTime: z.string().optional(),
  tripEndTime: z.string().optional(),

  monthsOperational: z.array(z.string()).optional(),
  couponCodes: z.array(z.string()).optional(),

  sailingArea: z.enum(["seaside", "backwaters"], {
    required_error: "Sailing area is required",
  }).optional(),

  agentsSale: z.boolean().optional(),
  websiteSale: z.boolean().optional(),

  status: z.enum(["active", "inactive"]).default("active"),
});
