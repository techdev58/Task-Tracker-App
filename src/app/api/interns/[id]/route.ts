import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Intern from "@/lib/models/Intern";
import TaskProgress from "@/lib/models/TaskProgress";
import Attendance from "@/lib/models/Attendance";
import Review from "@/lib/models/Review";
import { internSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const intern = await Intern.findById(id).populate("batch", "name");
    if (!intern) return jsonError("Intern not found", 404);
    return NextResponse.json(intern);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = internSchema.partial().parse(await req.json());
    const intern = await Intern.findByIdAndUpdate(id, body, { new: true });
    if (!intern) return jsonError("Intern not found", 404);
    return NextResponse.json(intern);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await TaskProgress.deleteMany({ intern: id });
    await Attendance.deleteMany({ intern: id });
    await Review.deleteMany({ intern: id });
    const intern = await Intern.findByIdAndDelete(id);
    if (!intern) return jsonError("Intern not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
