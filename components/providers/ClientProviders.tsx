"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query/client";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GoogleOAuthProviderWrapper } from "@/components/auth/google-oauth-provider";
import { CallBridge } from "@/components/call/CallBridge";
import { PushNotificationBridge } from "@/components/push/PushNotificationBridge";
import { UnreadMessagesSync } from "@/components/chat/UnreadMessagesSync";
import { LenisProvider } from "@/components/lenis-provider";

export function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LenisProvider>
        <div className="app-background" aria-hidden="true" />
        <GoogleOAuthProviderWrapper>
          <ThemeProvider>
            <AuthProvider>
              <CallBridge>
                <PushNotificationBridge />
                <UnreadMessagesSync />
                {children}
              </CallBridge>
            </AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProviderWrapper>
      </LenisProvider>
    </QueryClientProvider>
  );
}
