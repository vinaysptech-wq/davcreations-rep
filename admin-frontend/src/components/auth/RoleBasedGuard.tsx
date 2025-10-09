"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RoleBasedGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export default function RoleBasedGuard({
  children,
  allowedRoles = [],
  requireAuth = true
}: RoleBasedGuardProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (allowedRoles.length > 0 && user?.user_type_name) {
      if (!allowedRoles.includes(user.user_type_name)) {
        // Redirect unauthorized users
        if (user.user_type_name === 'User') {
          router.push('/profile');
        } else {
          router.push('/admin'); // or some default admin page
        }
        return;
      }
    }
  }, [isAuthenticated, user, allowedRoles, requireAuth, router, mounted]);

  // Show loading on server and initial client render
  if (!mounted) {
    return <div>Loading...</div>;
  }

  // Show loading or nothing while checking
  if (requireAuth && !isAuthenticated) {
    return <div>Loading...</div>;
  }

  if (allowedRoles.length > 0 && user?.user_type_name && !allowedRoles.includes(user.user_type_name)) {
    return <div>Access Denied</div>;
  }

  return <>{children}</>;
}