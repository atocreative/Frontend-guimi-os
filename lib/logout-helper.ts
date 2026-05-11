"use client"

import { signOut as nextAuthSignOut } from "next-auth/react"
import { clearMenuConfigFromStorage } from "@/lib/menu-config-context"

/**
 * Sign out the user and clear all client-side state
 * Ensures menu config doesn't leak to next user
 */
export async function signOut(options?: { callbackUrl?: string; redirect?: boolean }) {
  // Clear menu config from localStorage before signing out
  clearMenuConfigFromStorage()

  // Sign out from NextAuth
  const signOutOptions: any = { redirect: false }
  if (options?.callbackUrl) {
    signOutOptions.callbackUrl = options.callbackUrl
    signOutOptions.redirect = true
  }
  await nextAuthSignOut(signOutOptions)
}
