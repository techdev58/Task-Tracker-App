import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Task from "@/lib/models/Task";
import TaskAssignment from "@/lib/models/TaskAssignment";
import TaskProgress from "@/lib/models/TaskProgress";
import { taskSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const task = await Task.findById(id);
    if (!task) return jsonError("Task not found", 404);
    return NextResponse.json(task);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = taskSchema.partial().parse(await req.json());
    const task = await Task.findByIdAndUpdate(id, body, { new: true });
    if (!task) return jsonError("Task not found", 404);
    return NextResponse.json(task);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const assignmentIds = (await TaskAssignment.find({ task: id }).select("_id")).map((a) => a._id);
    await TaskProgress.deleteMany({ assignment: { $in: assignmentIds } });
    await TaskAssignment.deleteMany({ task: id });
    const task = await Task.findByIdAndDelete(id);
    if (!task) return jsonError("Task not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
