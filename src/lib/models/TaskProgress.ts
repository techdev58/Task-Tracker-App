import { Schema, model, models, InferSchemaType } from "mongoose";

const TaskProgressSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "TaskAssignment", required: true },
    intern: { type: Schema.Types.ObjectId, ref: "Intern", required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    review: { type: String, default: "" },
  },
  { timestamps: true }
);

TaskProgressSchema.index({ assignment: 1, intern: 1 }, { unique: true });

export type TaskProgress = InferSchemaType<typeof TaskProgressSchema> & {
  _id: string;
};

export default models.TaskProgress || model("TaskProgress", TaskProgressSchema);
