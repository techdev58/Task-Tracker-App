import { Schema, model, models, InferSchemaType } from "mongoose";

const ReviewSchema = new Schema(
  {
    intern: { type: Schema.Types.ObjectId, ref: "Intern", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task" },
    reviewerName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String, default: "" },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

export type Review = InferSchemaType<typeof ReviewSchema> & { _id: string };

export default models.Review || model("Review", ReviewSchema);
