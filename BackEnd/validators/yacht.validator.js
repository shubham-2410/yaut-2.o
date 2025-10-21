import { z } from "zod";

export const yachtSchema = z.object({
  name: z.string({ required_error: "Yacht name is required" }).min(2),

  capacity: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number({ required_error: "Capacity is required" }).min(1)
  ),

  runningCost: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number({ required_error: "Running cost is required" }).min(0)
  ),

  maxSellingPrice: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number({ required_error: "Max selling price is required" }).min(0)
  ),

  sellingPrice: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number({ required_error: "Selling price is required" }).min(0)
  ),
  price: z.preprocess((val) => Number(val), z.number()),
  yachtPhotos: z
    .array(z.string().url("Invalid photo URL"))
    .nonempty("At least one photo is required").optional(),

  status: z.enum(["active", "inactive"]).default("active"),

  company: z.string().optional(),
});
