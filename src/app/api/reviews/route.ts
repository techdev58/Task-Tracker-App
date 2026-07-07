import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/lib/models/Review";
import { reviewSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const intern = req.nextUrl.searchParams.get("intern");
    const filter: Record<string, unknown> = {};
    if (intern) filter.intern = intern;
    const reviews = await Review.find(filter)
      .populate("intern", "name email")
      .populate("task", "title")
      .sort({ date: -1 });
    return NextResponse.json(reviews);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = reviewSchema.parse(await req.json());
    const review = await Review.create(body);
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
