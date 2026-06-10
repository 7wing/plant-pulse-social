import { createClient } from "jsr:@supabase/supabase-js@2";
import { SignJWT } from "npm:jose";

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Validate auth header
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Parse body
  let body: { room_name?: string; identity?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const { room_name, identity, role } = body;

  if (!room_name || typeof room_name !== "string") {
    return new Response(JSON.stringify({ error: "Missing or invalid room_name" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!identity || typeof identity !== "string") {
    return new Response(JSON.stringify({ error: "Missing or invalid identity" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (role !== "host" && role !== "viewer") {
    return new Response(JSON.stringify({ error: "Missing or invalid role" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const apiKey = Deno.env.get("LIVEKIT_API_KEY");
  const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
  const wsUrl = Deno.env.get("LIVEKIT_URL");

  if (!apiKey || !apiSecret || !wsUrl) {
    return new Response(JSON.stringify({ error: "LiveKit configuration missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    "video.room": room_name,
    "video.roomJoin": true,
    "video.canPublish": role === "host",
    "video.canSubscribe": true,
    "video.canPublishData": role === "host",
  })
    .setSubject(identity)
    .setIssuer(apiKey)
    .setIssuedAt(now)
    .setNotBefore(now - 60)
    .setExpirationTime(now + 21600)
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(apiSecret));

  return new Response(JSON.stringify({ token: jwt, ws_url: wsUrl }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});