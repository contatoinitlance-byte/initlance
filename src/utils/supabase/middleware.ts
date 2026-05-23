import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Returns an object with `supabase` (server client) and `response` (NextResponse)
export const createMiddlewareClient = (request: NextRequest) => {
  let response = NextResponse.next();

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookie on the response so browser receives them
            response.cookies.set(name, value, options as any)
          })
        },
      },
    },
  );

  return { supabase, response };
};
