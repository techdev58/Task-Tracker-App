import { Schema, model, models, InferSchemaType } from "mongoose";

const AttendanceSchema = new Schema(
  {
    intern: { type: Schema.Types.ObjectId, ref: "Intern", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "leave", "half-day"],
      required: true,
    },
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

AttendanceSchema.index({ intern: 1, date: 1 }, { unique: true });

export type Attendance = InferSchemaType<typeof AttendanceSchema> & {
  _id: string;
};

export default models.Attendance || model("Attendance", AttendanceSchema);
