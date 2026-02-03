import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  nome: string;
  email: string;
  password: string;
  cpf: string;
  cargo: string;
  profile_id: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  celular?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with the user's token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated and is a super admin
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is super admin
    const { data: isSuperAdmin, error: checkError } = await supabaseClient
      .rpc("is_user_super_admin", { user_id: user.id });

    if (checkError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Permission check failed: ${checkError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Permission denied. Only super admins can create users.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();

    // Validate required fields
    if (!body.nome || !body.email || !body.password || !body.cpf || !body.cargo || !body.profile_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: nome, email, password, cpf, cargo, profile_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUser?.users.some((u) => u.email === body.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Email already exists" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if CPF already exists in users table
    const { data: existingCpf } = await supabaseAdmin
      .from("users")
      .select("cpf")
      .eq("cpf", body.cpf)
      .maybeSingle();

    if (existingCpf) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF already exists" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user with Admin API - this properly sets all auth fields
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {},
      app_metadata: {},
    });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create auth user: ${authError?.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUserId = authData.user.id;

    // Create user record in users table
    const { error: userInsertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: newUserId,
        nome: body.nome,
        email: body.email,
        cpf: body.cpf,
        cargo: body.cargo,
        ativo: true,
      });

    if (userInsertError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create user record: ${userInsertError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Assign profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        user_id: newUserId,
        profile_id: body.profile_id,
      });

    if (profileError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to assign profile: ${profileError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create address if provided
    if (body.rua) {
      const { error: addressError } = await supabaseAdmin
        .from("user_addresses")
        .insert({
          user_id: newUserId,
          rua: body.rua,
          numero: body.numero,
          complemento: body.complemento,
          bairro: body.bairro,
          cidade: body.cidade,
          estado: body.estado,
          cep: body.cep,
        });

      if (addressError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create address: ${addressError.message}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Create contacts if provided
    if (body.telefone || body.celular) {
      const { error: contactError } = await supabaseAdmin
        .from("user_contacts")
        .insert({
          user_id: newUserId,
          telefone: body.telefone,
          celular: body.celular,
        });

      if (contactError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create contacts: ${contactError.message}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        message: "User created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
