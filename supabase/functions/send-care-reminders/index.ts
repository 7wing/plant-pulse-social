import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push";

// Set VAPID details for all outgoing notifications
webpush.setVapidDetails(
  "mailto:plantpal@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Query plants that need watering
  const now = new Date().toISOString();
  const { data: plants, error: plantsError } = await supabase
    .from("plants")
    .select("id, nickname, species, image_url, owner_id")
    .lte("next_water_at", now);

  if (plantsError) {
    return new Response(JSON.stringify({ error: plantsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!plants || plants.length === 0) {
    return new Response("OK", { status: 200 });
  }

  // Collect unique owner IDs
  const ownerIds = [...new Set(plants.map((p) => p.owner_id))];

  // Fetch push tokens for all owners in one query
  const { data: tokenRows, error: tokenError } = await supabase
    .from("push_tokens")
    .select("user_id, token")
    .in("user_id", ownerIds);

  if (tokenError) {
    return new Response(JSON.stringify({ error: tokenError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Group tokens by owner
  const tokensByOwner = new Map<string, string[]>();
  if (tokenRows) {
    for (const row of tokenRows) {
      const existing = tokensByOwner.get(row.user_id) ?? [];
      existing.push(row.token);
      tokensByOwner.set(row.user_id, existing);
    }
  }

  // Send a notification for each plant → each token
  const results = await Promise.allSettled(
    plants.flatMap((plant) => {
      const tokens = tokensByOwner.get(plant.owner_id) ?? [];
      return tokens.map((tokenJson) => {
        const subscription = JSON.parse(tokenJson);
        const payload = JSON.stringify({
          title: `${plant.nickname} needs water! 💧`,
          body: `Time to water your ${plant.species}`,
          icon: plant.image_url,
          data: { url: `/plant/${plant.id}` },
        });
        return webpush.sendNotification(subscription, payload);
      });
    })
  );

  // Log any failures without blocking the response
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error("Push notification failures:", failures.map((f) => (f as PromiseRejectedResult).reason));
  }

  return new Response("OK", { status: 200 });
});