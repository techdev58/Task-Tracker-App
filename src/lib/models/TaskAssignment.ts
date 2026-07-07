import { Schema, model, models, InferSchemaType } from "mongoose";

const TaskAssignmentSchema = new Schema(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    dueDate: { type: Date, required: true },
    assignedDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export type TaskAssignment = InferSchemaType<typeof TaskAssignmentSchema> & {
  _id: string;
};

export default models.TaskAssignment || model("TaskAssignment", TaskAssignmentSchema);
