import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Task from "@/lib/models/Task";
import { taskSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await connectToDatabase();
    const tasks = await Task.find().sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = taskSchema.parse(await req.json());
    const task = await Task.create(body);
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
