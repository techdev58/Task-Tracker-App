import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/lib/models/Review";
import { reviewSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = reviewSchema.partial().parse(await req.json());
    const review = await Review.findByIdAndUpdate(id, body, { new: true });
    if (!review) return jsonError("Review not found", 404);
    return NextResponse.json(review);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) return jsonError("Review not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
