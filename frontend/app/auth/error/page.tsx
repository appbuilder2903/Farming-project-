'use client';

import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">😔</div>
        <h1 className="text-3xl font-bold text-white mb-3">Login Failed</h1>
        <p className="text-primary-200 mb-8">
          We couldn&apos;t sign you in. This can happen due to a network issue or your account
          not being allowed. Please try again.
        </p>
        <Link href="/" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-3 rounded-xl transition-all">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
