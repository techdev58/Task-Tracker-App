import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TaskProgress from "@/lib/models/TaskProgress";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const intern = req.nextUrl.searchParams.get("intern");
    const filter: Record<string, unknown> = {};
    if (intern) filter.intern = intern;

    const progress = await TaskProgress.find(filter)
      .populate({
        path: "assignment",
        select: "task batch dueDate",
        populate: [
          { path: "task", select: "title description priority" },
          { path: "batch", select: "name" },
        ],
      })
      .populate("intern", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(progress);
  } catch (err) {
    return handleApiError(err);
  }
}
