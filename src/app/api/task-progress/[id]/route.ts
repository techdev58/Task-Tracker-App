import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import TaskProgress from "@/lib/models/TaskProgress";
import { taskProgressSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = taskProgressSchema.parse(await req.json());

    const existing = await TaskProgress.findById(id);
    if (!existing) return jsonError("Progress record not found", 404);

    const update: typeof body = { ...body };
    if (body.status === "completed") {
      // Mark the completion time now unless the caller explicitly set one
      // (e.g. backdating) or one was already recorded.
      if (body.completedAt === undefined && !existing.completedAt) {
        update.completedAt = new Date();
      }
    } else if (body.status) {
      update.completedAt = null;
    }

    const progress = await TaskProgress.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(progress);
  } catch (err) {
    return handleApiError(err);
  }
}
