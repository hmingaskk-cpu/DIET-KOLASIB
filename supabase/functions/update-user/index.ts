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
    const { userId, role, name, studentDetails, facultyDetails, password, updatePasswordOnly } = await req.json(); // Expecting 'name' instead of 'first_name', 'last_name'

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If only password update is requested
    if (updatePasswordOnly && password) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: password }
      );

      if (authUpdateError) {
        console.error("Supabase admin password update error:", authUpdateError);
        return new Response(JSON.stringify({ error: `Failed to update password: ${authUpdateError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If not just password update, then role and profile details are expected
    if (!role) {
      return new Response(JSON.stringify({ error: 'Missing role for profile update' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Update the user's role and name in the public.profiles table
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ role, name }) // Update 'name'
      .eq('id', userId);

    if (profileUpdateError) {
      console.error("Supabase profile update error:", profileUpdateError);
      return new Response(JSON.stringify({ error: `Failed to update user profile: ${profileUpdateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Handle updates for role-specific tables
    if (role === "student") {
      if (studentDetails) {
        // Check if student details exist, if not, insert them
        const { data: existingStudent, error: fetchStudentError } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (fetchStudentError && fetchStudentError.code !== 'PGRST116') { // PGRST116 is "No rows found"
          console.error("Error checking existing student details:", fetchStudentError);
          return new Response(JSON.stringify({ error: `Failed to check student details: ${fetchStudentError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (existingStudent) {
          // Update existing student details
          const { error: studentUpdateError } = await supabaseAdmin
            .from('students')
            .update({
              name: studentDetails.name,
              rollno: studentDetails.rollno,
              year: studentDetails.year,
              status: studentDetails.status,
              course: studentDetails.course,
              phone_number: studentDetails.phone_number,
              address: studentDetails.address,
            })
            .eq('user_id', userId);
          if (studentUpdateError) {
            console.error("Error updating student details:", studentUpdateError);
            return new Response(JSON.stringify({ error: `Failed to update student details: ${studentUpdateError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          // Insert new student details if they didn't exist
          const { error: studentInsertError } = await supabaseAdmin
            .from('students')
            .insert({
              user_id: userId,
              name: studentDetails.name,
              email: studentDetails.email, // Assuming email is passed or can be derived
              rollno: studentDetails.rollno,
              course: studentDetails.course,
              year: studentDetails.year,
              status: studentDetails.status,
              phone_number: studentDetails.phone_number,
              address: studentDetails.address,
            });
          if (studentInsertError) {
            console.error("Error inserting student details:", studentInsertError);
            return new Response(JSON.stringify({ error: `Failed to insert student details: ${studentInsertError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
      // If role changed from faculty/admin to student, delete old faculty record if exists
      await supabaseAdmin.from('faculty').delete().eq('user_id', userId);

    } else if (role === "faculty") {
      if (facultyDetails) {
        // Check if faculty details exist, if not, insert them
        const { data: existingFaculty, error: fetchFacultyError } = await supabaseAdmin
          .from('faculty')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (fetchFacultyError && fetchFacultyError.code !== 'PGRST116') {
          console.error("Error checking existing faculty details:", fetchFacultyError);
          return new Response(JSON.stringify({ error: `Failed to check faculty details: ${fetchFacultyError.message}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (existingFaculty) {
          // Update existing faculty details
          const { error: facultyUpdateError } = await supabaseAdmin
            .from('faculty')
            .update({
              name: facultyDetails.name,
              branch: facultyDetails.branch,
              abbreviation: facultyDetails.abbreviation,
              phone: facultyDetails.phone,
              status: facultyDetails.status,
            })
            .eq('user_id', userId);
          if (facultyUpdateError) {
            console.error("Error updating faculty details:", facultyUpdateError);
            return new Response(JSON.stringify({ error: `Failed to update faculty details: ${facultyUpdateError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          // Insert new faculty details if they didn't exist
          const { error: facultyInsertError } = await supabaseAdmin
            .from('faculty')
            .insert({
              user_id: userId,
              name: facultyDetails.name,
              email: facultyDetails.email, // Assuming email is passed or can be derived
              branch: facultyDetails.branch,
              abbreviation: facultyDetails.abbreviation,
              phone: facultyDetails.phone,
              status: facultyDetails.status,
            });
          if (facultyInsertError) {
            console.error("Error inserting faculty details:", facultyInsertError);
            return new Response(JSON.stringify({ error: `Failed to insert faculty details: ${facultyInsertError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
      // If role changed from student/admin to faculty, delete old student record if exists
      await supabaseAdmin.from('students').delete().eq('user_id', userId);

    } else { // Admin or Staff role
      // If role changed from student/faculty to admin/staff, delete old student/faculty records if they exist
      await supabaseAdmin.from('students').delete().eq('user_id', userId);
      await supabaseAdmin.from('faculty').delete().eq('user_id', userId);
    }

    return new Response(JSON.stringify({ message: 'User updated successfully' }), {
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