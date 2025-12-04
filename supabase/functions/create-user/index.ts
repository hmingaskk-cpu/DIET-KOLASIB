import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, role, name, studentDetails, facultyDetails } = await req.json(); // Expecting 'name' instead of 'first_name', 'last_name'

    if (!email || !password || !role || !name) { // 'name' is now required
      return new Response(JSON.stringify({ error: 'Missing email, password, role, or name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create the user using the admin client
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Admin confirms email directly
      user_metadata: { role, name }, // Pass 'name' to the handle_new_user trigger
    });

    if (error) {
      console.error("Supabase admin createUser error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = data.user?.id;

    if (newUserId) {
      // Insert student details if provided
      if (role === "student" && studentDetails) {
        const { error: studentInsertError } = await supabaseAdmin
          .from('students')
          .insert({
            user_id: newUserId,
            name: studentDetails.name,
            email: email, // Use the provided email for the student record
            rollno: studentDetails.rollno,
            course: studentDetails.course,
            year: studentDetails.year,
            status: studentDetails.status,
            phone_number: studentDetails.phone_number,
            address: studentDetails.address,
          });
        if (studentInsertError) {
          console.error("Error inserting student details:", studentInsertError);
          // Optionally, delete the created auth user if detail insertion fails
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          return new Response(JSON.stringify({ error: `Failed to add student details: ${studentInsertError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Insert faculty details if provided
      if (role === "faculty" && facultyDetails) {
        const { error: facultyInsertError } = await supabaseAdmin
          .from('faculty')
          .insert({
            user_id: newUserId,
            name: facultyDetails.name,
            branch: facultyDetails.branch,
            abbreviation: facultyDetails.abbreviation,
            email: email, // Use the provided email for the faculty record
            phone: facultyDetails.phone,
            status: facultyDetails.status,
          });
        if (facultyInsertError) {
          console.error("Error inserting faculty details:", facultyInsertError);
          // Optionally, delete the created auth user if detail insertion fails
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          return new Response(JSON.stringify({ error: `Failed to add faculty details: ${facultyInsertError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }


    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});