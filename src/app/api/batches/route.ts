import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/lib/models/Batch";
import Intern from "@/lib/models/Intern";
import { batchSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const status = req.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const batches = await Batch.find(filter).sort({ createdAt: -1 }).lean();
    const counts = await Intern.aggregate([
      { $group: { _id: "$batch", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const withCounts = batches.map((b) => ({
      ...b,
      internCount: countMap.get(String(b._id)) ?? 0,
    }));
    return NextResponse.json(withCounts);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = batchSchema.parse(await req.json());
    const batch = await Batch.create(body);
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
