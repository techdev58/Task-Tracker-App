import { Schema, model, models, InferSchemaType } from "mongoose";

const InternSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    joinDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
  },
  { timestamps: true }
);

export type Intern = InferSchemaType<typeof InternSchema> & { _id: string };

export default models.Intern || model("Intern", InternSchema);
