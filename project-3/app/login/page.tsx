'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleCredentialResponse = async (response: any) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user_role', data.user.role);
          localStorage.setItem('user_name', data.user.name);

          if (data.user.role === 'manager') {
            router.push('/manager');
          } else {
            router.push('/employee');
          }
        } else {
          const errData = await res.json();
          setError(errData.error || 'Login failed');
        }
      } catch (err) {
        setError('An error occurred during login');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", text: "signin_with" }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      const scriptTag = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptTag) scriptTag.remove();
    };
  }, [router]);

  // Initial render shell to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">Matcha POS</h1>
            <p className="text-gray-500 mt-2">Initializing login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Matcha POS</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-center py-4">
          <div id="googleBtn"></div>
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-500 animate-pulse">
            Verifying account...
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex justify-center">
          <button 
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-xl border-2 border-[#2f7a5f] text-[#2f7a5f] font-bold hover:bg-[#2f7a5f] hover:text-white transition-all duration-200"
          >
            Back to Home
          </button>
        </div>

        <div className="text-center text-xs text-gray-400">
          Authorized personnel only. Only pre-approved Google accounts can sign in.
        </div>
      </div>
    </div>
  );
}
