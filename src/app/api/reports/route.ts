import { NextRequest, NextResponse } from "next/server";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { connectToDatabase } from "@/lib/db";
import { getInternProgressReport, DEFAULT_DANGER_THRESHOLD } from "@/lib/progress";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const period = req.nextUrl.searchParams.get("period") === "week" ? "week" : "month";
    const dateParam = req.nextUrl.searchParams.get("date");
    const referenceDate = dateParam ? new Date(dateParam) : new Date();
    if (Number.isNaN(referenceDate.getTime())) return jsonError("Invalid date", 400);

    const batch = req.nextUrl.searchParams.get("batch") ?? undefined;
    const thresholdParam = req.nextUrl.searchParams.get("threshold");
    const threshold = thresholdParam ? Number(thresholdParam) : DEFAULT_DANGER_THRESHOLD;

    const start = period === "week" ? startOfWeek(referenceDate) : startOfMonth(referenceDate);
    const end = period === "week" ? endOfWeek(referenceDate) : endOfMonth(referenceDate);

    const report = await getInternProgressReport({ start, end, batch, threshold });
    report.sort((a, b) => (a.completionRate ?? 101) - (b.completionRate ?? 101));

    return NextResponse.json({ period, start, end, threshold, interns: report });
  } catch (err) {
    return handleApiError(err);
  }
}
