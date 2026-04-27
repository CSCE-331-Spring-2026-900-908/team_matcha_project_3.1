'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: ('employee' | 'manager')[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let authorizationTimer: number | undefined;
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role') as 'employee' | 'manager';

    if (!token) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    } else if (!allowedRoles.includes(role)) {
      if (role === 'manager') router.push('/manager');
      else router.push('/employee');
    } else {
      authorizationTimer = window.setTimeout(() => setIsAuthorized(true), 0);
    }

    return () => {
      if (authorizationTimer !== undefined) {
        window.clearTimeout(authorizationTimer);
      }
    };
  }, [router, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf6] text-[#6f5848]">
        Verifying access...
      </div>
    );
  }

  return <>{children}</>;
}
