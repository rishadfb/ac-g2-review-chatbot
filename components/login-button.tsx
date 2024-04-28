'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import * as React from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGoogle, IconSpinner } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface LoginButtonProps extends ButtonProps {
  showGithubIcon?: boolean
  text?: string
}

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

export function LoginButton({
  text = 'Login with Google',
  showGithubIcon = true,
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  // Create a Supabase client configured to use cookies
  const supabase = createClientComponentClient()

  if (process.env.NEXT_PUBLIC_AUTH_GOOGLE !== 'true') {
    return null
  }

  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${getURL()}/api/auth/callback` }
        })
      }}
      disabled={isLoading}
      className={cn(className)}
      size="lg"
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showGithubIcon ? (
        <IconGoogle className="mr-2" />
      ) : null}
      {text}
    </Button>
  )
}
