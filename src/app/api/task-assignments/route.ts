import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TaskAssignment from "@/lib/models/TaskAssignment";
import TaskProgress from "@/lib/models/TaskProgress";
import Intern from "@/lib/models/Intern";
import { taskAssignmentSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const batch = req.nextUrl.searchParams.get("batch");
    const task = req.nextUrl.searchParams.get("task");
    const filter: Record<string, unknown> = {};
    if (batch) filter.batch = batch;
    if (task) filter.task = task;

    const assignments = await TaskAssignment.find(filter)
      .populate("task", "title description priority")
      .populate("batch", "name")
      .sort({ createdAt: -1 })
      .lean();

    const counts = await TaskProgress.aggregate([
      { $match: { assignment: { $in: assignments.map((a) => a._id) } } },
      {
        $group: {
          _id: "$assignment",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c]));

    const withCounts = assignments.map((a) => ({
      ...a,
      totalInterns: countMap.get(String(a._id))?.total ?? 0,
      completedCount: countMap.get(String(a._id))?.completed ?? 0,
    }));

    return NextResponse.json(withCounts);
  } catch (err) {
    return handleApiError(err);
  }
}

// Assigns a catalog task to every active intern in a batch: creates the
// TaskAssignment, then fans out one TaskProgress row per active intern.
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = taskAssignmentSchema.parse(await req.json());
    const assignment = await TaskAssignment.create(body);

    const interns = await Intern.find({ batch: body.batch, status: "active" }).select("_id");
    if (interns.length > 0) {
      await TaskProgress.insertMany(
        interns.map((intern) => ({ assignment: assignment._id, intern: intern._id })),
        { ordered: false }
      );
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
