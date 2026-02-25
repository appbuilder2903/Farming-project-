'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const provider = searchParams.get('provider') || 'OAuth';

    refreshUser().then(() => {
      toast.success(`Logged in successfully via ${provider}!`);
      router.replace('/dashboard');
    });
  }, [refreshUser, router, searchParams]);

  return null;
}

export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🌾</div>
        <p className="text-white font-medium text-lg">Signing you in…</p>
      </div>
      <Suspense>
        <AuthSuccessContent />
      </Suspense>
    </div>
  );
}
