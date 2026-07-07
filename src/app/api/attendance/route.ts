import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/lib/models/Attendance";
import Intern from "@/lib/models/Intern";
import { attendanceSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const intern = req.nextUrl.searchParams.get("intern");
    const batch = req.nextUrl.searchParams.get("batch");
    const date = req.nextUrl.searchParams.get("date");
    const filter: Record<string, unknown> = {};
    if (intern) filter.intern = intern;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    if (batch && !intern) {
      const internIds = (await Intern.find({ batch }).select("_id")).map((i) => i._id);
      filter.intern = { $in: internIds };
    }
    const records = await Attendance.find(filter)
      .populate({ path: "intern", select: "name email batch", populate: { path: "batch", select: "name" } })
      .sort({ date: -1 });
    return NextResponse.json(records);
  } catch (err) {
    return handleApiError(err);
  }
}

// Accepts a single attendance record or an array (for marking a whole batch's
// attendance in one submission). Upserts on (intern, date) since a given
// intern can only have one attendance status per day.
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await req.json();
    const records = Array.isArray(payload) ? payload : [payload];
    const parsed = records.map((r) => attendanceSchema.parse(r));

    const results = await Promise.all(
      parsed.map((record) =>
        Attendance.findOneAndUpdate(
          { intern: record.intern, date: record.date },
          record,
          { new: true, upsert: true }
        )
      )
    );

    return NextResponse.json(Array.isArray(payload) ? results : results[0], { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
