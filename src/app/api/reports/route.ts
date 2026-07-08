import { NextRequest, NextResponse } from "next/server";
import { subMonths } from "date-fns";
import { connectToDatabase } from "@/lib/db";
import { getInternProgressReport, DEFAULT_DANGER_THRESHOLD } from "@/lib/progress";
import { handleApiError, jsonError } from "@/lib/api-utils";

const VALID_MONTHS = [1, 2, 3];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const monthsParam = Number(req.nextUrl.searchParams.get("months"));
    const months = VALID_MONTHS.includes(monthsParam) ? monthsParam : 1;

    const batch = req.nextUrl.searchParams.get("batch") ?? undefined;
    const thresholdParam = req.nextUrl.searchParams.get("threshold");
    const threshold = thresholdParam ? Number(thresholdParam) : DEFAULT_DANGER_THRESHOLD;
    if (Number.isNaN(threshold)) return jsonError("Invalid threshold", 400);

    const end = new Date();
    const start = subMonths(end, months);

    const report = await getInternProgressReport({ start, end, batch, threshold });
    report.sort((a, b) => (a.completionRate ?? 101) - (b.completionRate ?? 101));

    return NextResponse.json({ months, start, end, threshold, interns: report });
  } catch (err) {
    return handleApiError(err);
  }
}
