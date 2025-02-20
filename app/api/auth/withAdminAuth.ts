import { NextRequest, NextResponse } from "next/server";
import { validateJWT } from "@/app/middleware/validateJWT";
import { JwtPayload } from "jsonwebtoken";

export async function withAdminAuth(req: NextRequest) {
  const validation = await validateJWT(req);
  
  // Handle case when validation is an error response
  if (typeof validation === 'object' && 'error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }
  
  // Handle case when validation is successful and has payload
  if (typeof validation === 'object' && 'payload' in validation) {
    const payload = validation.payload;
    // Check if user is admin
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return { valid: true, payload };
  }
  
  // Fallback error case
  return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
}