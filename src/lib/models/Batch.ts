import { Schema, model, models, InferSchemaType } from "mongoose";

const BatchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

export type Batch = InferSchemaType<typeof BatchSchema> & { _id: string };

export default models.Batch || model("Batch", BatchSchema);
