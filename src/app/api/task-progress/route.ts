import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TaskProgress from "@/lib/models/TaskProgress";
import TaskAssignment from "@/lib/models/TaskAssignment";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const intern = req.nextUrl.searchParams.get("intern");
    const batch = req.nextUrl.searchParams.get("batch");
    const hasReview = req.nextUrl.searchParams.get("hasReview") === "true";

    const filter: Record<string, unknown> = {};
    if (intern) filter.intern = intern;
    if (hasReview) filter.review = { $ne: "" };
    if (batch) {
      const assignmentIds = (await TaskAssignment.find({ batch }).select("_id")).map((a) => a._id);
      filter.assignment = { $in: assignmentIds };
    }

    const progress = await TaskProgress.find(filter)
      .populate({
        path: "assignment",
        select: "task batch dueDate assignedDate",
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
