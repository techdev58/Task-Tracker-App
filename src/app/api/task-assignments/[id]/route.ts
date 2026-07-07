import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TaskAssignment from "@/lib/models/TaskAssignment";
import TaskProgress from "@/lib/models/TaskProgress";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const assignment = await TaskAssignment.findById(id)
      .populate("task", "title description priority")
      .populate("batch", "name");
    if (!assignment) return jsonError("Assignment not found", 404);

    const progress = await TaskProgress.find({ assignment: id }).populate("intern", "name email");

    return NextResponse.json({ assignment, progress });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await TaskProgress.deleteMany({ assignment: id });
    const assignment = await TaskAssignment.findByIdAndDelete(id);
    if (!assignment) return jsonError("Assignment not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
