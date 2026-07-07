import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Intern from "@/lib/models/Intern";
import TaskAssignment from "@/lib/models/TaskAssignment";
import TaskProgress from "@/lib/models/TaskProgress";
import { internSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const batch = req.nextUrl.searchParams.get("batch");
    const status = req.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (batch) filter.batch = batch;
    if (status) filter.status = status;
    const interns = await Intern.find(filter).populate("batch", "name").sort({ createdAt: -1 });
    return NextResponse.json(interns);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = internSchema.parse(await req.json());
    const intern = await Intern.create(body);

    if (intern.status === "active") {
      const assignments = await TaskAssignment.find({ batch: intern.batch }).select("_id");
      if (assignments.length > 0) {
        await TaskProgress.insertMany(
          assignments.map((a) => ({ assignment: a._id, intern: intern._id })),
          { ordered: false }
        );
      }
    }

    return NextResponse.json(intern, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
