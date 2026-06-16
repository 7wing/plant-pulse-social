import { createClient } from "jsr:@supabase/supabase-js@2";

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

  // Validate environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Supabase configuration missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Verify auth header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Create service_role client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Verify user and role
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Get user's role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const isModerator = profile.role === "moderator" || profile.role === "admin";
  const isAdmin = profile.role === "admin";

  if (!isModerator) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Parse request body
  let body: { action?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const { action, data } = body;

  if (!action) {
    return new Response(JSON.stringify({ error: "Action is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Helper for consistent response format
  const jsonResponse = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  // Route to action handler
  switch (action) {
    // ========================================
    // get-stats (moderator+)
    // ========================================
    case "get-stats": {
      const [proposals, reports, users] = await Promise.all([
        supabaseAdmin
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabaseAdmin
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabaseAdmin
          .from("profiles")
          .select("*", { count: "exact", head: true }),
      ]);
      return jsonResponse({
        proposals: proposals.count || 0,
        reports: reports.count || 0,
        users: users.count || 0,
      });
    }

    // ========================================
    // list-proposals (moderator+)
    // ========================================
    case "list-proposals": {
      const { data: proposals, error } = await supabaseAdmin
        .from("proposals")
        .select("*, submitter:profiles(username, display_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ data: proposals });
    }

    // ========================================
    // schedule-proposal (moderator+)
    // ========================================
    case "schedule-proposal": {
      const { id, scheduled_at } = data;

      if (!id) {
        return jsonResponse({ error: "Proposal ID is required" }, 400);
      }

      const { error } = await supabaseAdmin
        .from("proposals")
        .update({ status: "approved", scheduled_at })
        .eq("id", id);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ success: true });
    }

    // ========================================
    // reject-proposal (moderator+)
    // ========================================
    case "reject-proposal": {
      const { id, moderator_note } = data;

      if (!id) {
        return jsonResponse({ error: "Proposal ID is required" }, 400);
      }

      const { error } = await supabaseAdmin
        .from("proposals")
        .update({ status: "rejected", moderator_note })
        .eq("id", id);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ success: true });
    }

    // ========================================
    // list-reports (moderator+)
    // ========================================
    case "list-reports": {
      const { data: reports, error } = await supabaseAdmin
        .from("reports")
        .select("*, reporter:profiles(username, display_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ data: reports });
    }

    // ========================================
    // resolve-report (moderator+)
    // ========================================
    case "resolve-report": {
      const { id, status, moderator_note, remove_content } = data;

      if (!id) {
        return jsonResponse({ error: "Report ID is required" }, 400);
      }

      if (!status || !["resolved", "dismissed"].includes(status)) {
        return jsonResponse({ error: "Status must be 'resolved' or 'dismissed'" }, 400);
      }

      // Optionally remove content
      if (remove_content) {
        const { data: report } = await supabaseAdmin
          .from("reports")
          .select("target_type, target_id")
          .eq("id", id)
          .single();

        if (report?.target_type === "post") {
          await supabaseAdmin.from("posts").delete().eq("id", report.target_id);
        }
        if (report?.target_type === "comment") {
          await supabaseAdmin.from("comments").delete().eq("id", report.target_id);
        }
      }

      const { error } = await supabaseAdmin
        .from("reports")
        .update({
          status,
          moderator_note,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ success: true });
    }

    // ========================================
    // list-users (admin only)
    // ========================================
    case "list-users": {
      if (!isAdmin) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const { search } = data || {};
      let query = supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data: users, error } = await query;

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ data: users });
    }

    // ========================================
    // update-user (admin only)
    // ========================================
    case "update-user": {
      if (!isAdmin) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const { id, status, role, suspended_until } = data;

      if (!id) {
        return jsonResponse({ error: "User ID is required" }, 400);
      }

      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (role) updates.role = role;
      if (suspended_until !== undefined) updates.suspended_until = suspended_until;

      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", id);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      // Insert violation record if provided
      if (data.action && data.reason) {
        await supabaseAdmin.from("violations").insert({
          user_id: id,
          action: data.action,
          reason: data.reason,
          duration_hours: data.duration_hours,
          created_by: user.id,
        });
      }

      return jsonResponse({ success: true });
    }

    // ========================================
    // list-library (admin only)
    // ========================================
    case "list-library": {
      if (!isAdmin) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const { source } = data || {};
      let query = supabaseAdmin
        .from("plant_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (source) {
        query = query.eq("source", source);
      }

      const { data: entries, error } = await query;

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ data: entries });
    }

    // ========================================
    // update-library (admin only)
    // ========================================
    case "update-library": {
      if (!isAdmin) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const { id, ...updates } = data;

      if (!id) {
        return jsonResponse({ error: "Library entry ID is required" }, 400);
      }

      const { error } = await supabaseAdmin
        .from("plant_library")
        .update(updates)
        .eq("id", id);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ success: true });
    }

    // ========================================
    // Unknown action
    // ========================================
    default:
      return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  }
});