import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }
  if (err instanceof ZodError) {
    return jsonError(err.issues.map((i) => i.message).join(", "), 400);
  }
  console.error(err);
  return jsonError("Internal server error", 500);
}
