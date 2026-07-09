import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const batchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["active", "completed"]).optional().default("active"),
});

export const internSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().default(""),
  batch: objectId,
  joinDate: z.coerce.date(),
  status: z.enum(["active", "completed", "dropped"]).optional().default("active"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

export const taskAssignmentSchema = z.object({
  task: objectId,
  batch: objectId,
  dueDate: z.coerce.date(),
});

export const taskProgressSchema = z.object({
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  review: z.string().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export const attendanceSchema = z.object({
  intern: objectId,
  date: z.coerce.date(),
  status: z.enum(["present", "absent", "leave", "half-day"]),
  remarks: z.string().optional().default(""),
});
