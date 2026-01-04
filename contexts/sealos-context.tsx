'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createSealosApp, sealosApp } from '@zjy365/sealos-desktop-sdk/app';
import type { SessionV1 } from '@zjy365/sealos-desktop-sdk';

interface SealosContextType {
  kubeconfig: string | null;
  session: SessionV1 | null;
  loading: boolean;
  error: string | null;
}

const SealosContext = createContext<SealosContextType>({
  kubeconfig: null,
  session: null,
  loading: true,
  error: null,
});

export function SealosProvider({ children }: { children: ReactNode }) {
  const [kubeconfig, setKubeconfig] = useState<string | null>(null);
  const [session, setSession] = useState<SessionV1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initSealos = async () => {
      try {
        // Initialize Sealos SDK
        cleanup = createSealosApp();

        // Get session from Sealos
        const userSession = await sealosApp.getSession();

        setSession(userSession);
        setKubeconfig(userSession.kubeconfig);
        setError(null);

        console.log('[SealosProvider] Session loaded successfully');
      } catch (err) {
        console.warn('[SealosProvider] Failed to initialize Sealos SDK:', err);

        // Fallback to environment variable if SDK fails
        // This allows the app to work both in Sealos Desktop and standalone
        const envKubeconfig = process.env.NEXT_PUBLIC_KUBECONFIG;
        if (envKubeconfig) {
          setKubeconfig(envKubeconfig);
          console.log('[SealosProvider] Using fallback kubeconfig from environment');
        } else {
          setError('Sealos SDK not available and no fallback kubeconfig found');
        }
      } finally {
        setLoading(false);
      }
    };

    initSealos();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <SealosContext.Provider value={{ kubeconfig, session, loading, error }}>
      {children}
    </SealosContext.Provider>
  );
}

export function useSealos() {
  const context = useContext(SealosContext);
  if (!context) {
    throw new Error('useSealos must be used within SealosProvider');
  }
  return context;
}
