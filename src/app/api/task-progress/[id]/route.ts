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
    const progress = await TaskProgress.findByIdAndUpdate(id, body, { new: true });
    if (!progress) return jsonError("Progress record not found", 404);
    return NextResponse.json(progress);
  } catch (err) {
    return handleApiError(err);
  }
}
