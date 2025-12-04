import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { v2 as cloudinary } from "npm:cloudinary@1.41.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), { status: 401, headers: corsHeaders });
    }

    // Retrieve role from profiles
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError) {
      return new Response(JSON.stringify({ error: "Unauthorized: Could not retrieve user role" }), { status: 401, headers: corsHeaders });
    }
    const authenticatedUserRole = profile.role;

    const body = await req.json().catch(() => ({}));
    const { action, publicId, userId: targetRecordId } = body; // Renamed userId to targetRecordId for clarity

    console.log(`Edge Function: Action=${action}, publicId=${publicId}, targetRecordId=${targetRecordId}, byUser=${user.id} (role=${authenticatedUserRole})`);

    if (!targetRecordId) {
      return new Response(JSON.stringify({ error: "targetRecordId is required" }), { status: 400, headers: corsHeaders });
    }

    // Permission check: User can delete their own avatar, admins/staff can delete others'
    let isOwner = false;
    let recordTable: string | null = null;

    // Check if it's a student's avatar
    const { data: studentData, error: studentFetchError } = await supabase
      .from('students')
      .select('user_id, cloudinary_public_id')
      .eq('user_id', targetRecordId) // Students table links to auth.users.id via user_id
      .eq('cloudinary_public_id', publicId)
      .single();

    if (studentData) {
      isOwner = studentData.user_id === user.id;
      recordTable = 'students';
    } else if (studentFetchError && studentFetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error("Error checking student record:", studentFetchError);
      return new Response(JSON.stringify({ error: "Failed to verify student record" }), { status: 500, headers: corsHeaders });
    }

    // If not a student's avatar, check if it's a faculty's avatar
    if (!recordTable) {
      const { data: facultyData, error: facultyFetchError } = await supabase
        .from('faculty')
        .select('user_id, cloudinary_public_id')
        .eq('user_id', targetRecordId) // Faculty table links to auth.users.id via user_id
        .eq('cloudinary_public_id', publicId)
        .single();

      if (facultyData) {
        isOwner = facultyData.user_id === user.id;
        recordTable = 'faculty';
      } else if (facultyFetchError && facultyFetchError.code !== 'PGRST116') {
        console.error("Error checking faculty record:", facultyFetchError);
        return new Response(JSON.stringify({ error: "Failed to verify faculty record" }), { status: 500, headers: corsHeaders });
      }
    }

    // If not a student's or faculty's avatar, check if it's an alumni's avatar
    if (!recordTable) {
      const { data: alumniData, error: alumniFetchError } = await supabase
        .from('alumni')
        .select('id, cloudinary_public_id')
        .eq('id', targetRecordId) // Alumni table uses its own 'id' as the unique identifier
        .eq('cloudinary_public_id', publicId)
        .single();

      if (alumniData) {
        // For alumni, we assume only admins/staff can manage their avatars,
        // or if an alumni profile is linked to an auth.user (which is not the current setup).
        // For now, only admin/staff can delete alumni avatars.
        isOwner = false; // Alumni are not directly linked to auth.users for self-management in this context
        recordTable = 'alumni';
      } else if (alumniFetchError && alumniFetchError.code !== 'PGRST116') {
        console.error("Error checking alumni record:", alumniFetchError);
        return new Response(JSON.stringify({ error: "Failed to verify alumni record" }), { status: 500, headers: corsHeaders });
      }
    }

    // Admins and Staff can delete any image. Owners can delete their own.
    if (!isOwner && authenticatedUserRole !== "admin" && authenticatedUserRole !== "staff") {
      return new Response(JSON.stringify({ error: "Forbidden: You do not have permission to delete this image" }), { status: 403, headers: corsHeaders });
    }

    // Cloudinary env
    const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary env vars");
      return new Response(JSON.stringify({ error: "Cloudinary environment is not configured" }), { status: 500, headers: corsHeaders });
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });

    if (action === "delete") {
      if (!publicId) {
        return new Response(JSON.stringify({ error: "publicId is required for delete" }), { status: 400, headers: corsHeaders });
      }

      try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary delete result:", result);

        if (result.result === "ok") {
          return new Response(JSON.stringify({ success: true, message: "Image deleted successfully" }), { headers: corsHeaders });
        } else {
          return new Response(JSON.stringify({ error: result.result || "Cloudinary deletion failed" }), { status: 500, headers: corsHeaders });
        }
      } catch (err) {
        console.error("Cloudinary delete failed:", err);
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Cloudinary delete failed" }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error("Edge Function: Unexpected error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});