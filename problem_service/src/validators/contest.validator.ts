import mongoose from "mongoose";
import { z } from "zod";

export const objectIdSchema = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "Invalid id of problem",
  })
  .transform((id) => new mongoose.Types.ObjectId(id));

export const createContestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  problems: z
    .array(
      z.object({
        problemId: objectIdSchema,
        points: z.number(),
      }),
    )
    .min(2, "At least 2 problems are required")
    .max(2, "Maximum 2 problems allowed"),
});

export const updateContestSchema = createContestSchema.partial();

export type CreateContestDto = z.infer<typeof createContestSchema>;
export type UpdateContestDto = z.infer<typeof updateContestSchema>;
