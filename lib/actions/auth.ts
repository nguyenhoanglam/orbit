'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email.').trim(),
  password: z.string().min(1, 'Password is required.'),
})

const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email.').trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .trim(),
  displayName: z.string().min(2, 'Name must be at least 2 characters.').trim(),
})

const MagicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email.').trim(),
})

export interface AuthState {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { message: error.message }
  }

  redirect('/')
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.displayName },
    },
  })

  if (error) {
    return { message: error.message }
  }

  redirect('/onboarding')
}

export async function loginWithMagicLink(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = MagicLinkSchema.safeParse({ email: formData.get('email') })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { message: error.message }
  }

  return { success: true, message: 'Check your email for the magic link.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
