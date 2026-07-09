import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/lib/models/Batch";
import Intern from "@/lib/models/Intern";
import TaskAssignment from "@/lib/models/TaskAssignment";
import TaskProgress from "@/lib/models/TaskProgress";
import Attendance from "@/lib/models/Attendance";
import { batchSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const batch = await Batch.findById(id);
    if (!batch) return jsonError("Batch not found", 404);
    return NextResponse.json(batch);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = batchSchema.partial().parse(await req.json());
    const batch = await Batch.findByIdAndUpdate(id, body, { new: true });
    if (!batch) return jsonError("Batch not found", 404);
    return NextResponse.json(batch);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const internIds = (await Intern.find({ batch: id }).select("_id")).map((i) => i._id);
    const assignmentIds = (await TaskAssignment.find({ batch: id }).select("_id")).map((a) => a._id);
    await TaskProgress.deleteMany({
      $or: [{ intern: { $in: internIds } }, { assignment: { $in: assignmentIds } }],
    });
    await TaskAssignment.deleteMany({ batch: id });
    await Attendance.deleteMany({ intern: { $in: internIds } });
    await Intern.deleteMany({ batch: id });
    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) return jsonError("Batch not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
