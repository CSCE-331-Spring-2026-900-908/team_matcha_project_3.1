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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role') as 'employee' | 'manager';

    if (!token) {
      router.push('/login');
    } else if (!allowedRoles.includes(role)) {
      if (role === 'manager') router.push('/manager');
      else router.push('/employee');
    } else {
      setIsAuthorized(true);
    }
  }, [router, allowedRoles]);

  // Avoid hydration mismatch by waiting for mount
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf6] text-[#6f5848]">
        Initializing...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf6] text-[#6f5848]">
        Verifying access...
      </div>
    );
  }

  return <>{children}</>;
}
