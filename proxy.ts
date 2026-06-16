import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: middleware.ts heißt jetzt proxy.ts (läuft im Node.js-Runtime).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Läuft auf allen Routen außer statischen Assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
