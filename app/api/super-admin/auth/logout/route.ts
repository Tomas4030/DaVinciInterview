import { NextResponse } from "next/server";
import { SUPER_ADMIN_SESSION_COOKIE } from "@/lib/super-admin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(SUPER_ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
