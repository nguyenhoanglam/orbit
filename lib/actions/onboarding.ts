"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";

const OnboardingSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").trim(),
  teamName: z.string().min(2, "Team name must be at least 2 characters.").trim(),
  teamSlug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(48, "Slug must be at most 48 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
    .trim(),
});

export interface OnboardingState {
  errors?: Record<string, string[]>;
  message?: string;
}

export async function createTeam(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = OnboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    teamName: formData.get("teamName"),
    teamSlug: formData.get("teamSlug"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: "You must be signed in to create a team." };
  }

  const { displayName, teamName, teamSlug } = parsed.data;

  // Update profile display name
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (profileError) {
    return { message: "Failed to update profile." };
  }

  // Check slug uniqueness
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("slug", teamSlug)
    .maybeSingle();

  if (existingTeam) {
    return { errors: { teamSlug: ["This slug is already taken. Please choose another."] } };
  }

  // Create team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name: teamName, slug: teamSlug, created_by: user.id })
    .select("id, slug")
    .single();

  if (teamError || !team) {
    return { message: "Failed to create team." };
  }

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "admin" });

  if (memberError) {
    return { message: "Failed to set team membership." };
  }

  // Create default workspace
  const { error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ team_id: team.id, name: "Main" });

  if (workspaceError) {
    return { message: "Failed to create workspace." };
  }

  // Create Lite subscription
  await supabase.from("subscriptions").insert({ team_id: team.id, plan: "lite", status: "active" });

  // Send welcome email (best-effort)
  await sendWelcomeEmail({
    to: user.email!,
    displayName,
    teamName,
  });

  redirect(`/`);
}
