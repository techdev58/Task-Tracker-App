import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/lib/models/Attendance";
import { attendanceSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = attendanceSchema.partial().parse(await req.json());
    const record = await Attendance.findByIdAndUpdate(id, body, { new: true });
    if (!record) return jsonError("Attendance record not found", 404);
    return NextResponse.json(record);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const record = await Attendance.findByIdAndDelete(id);
    if (!record) return jsonError("Attendance record not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
