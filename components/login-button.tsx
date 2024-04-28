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
          options: { redirectTo: `${location.origin}/api/auth/callback` }
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
