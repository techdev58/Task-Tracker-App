import { Schema, model, models, InferSchemaType } from "mongoose";

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

export type Task = InferSchemaType<typeof TaskSchema> & { _id: string };

export default models.Task || model("Task", TaskSchema);
