import ManagerWorkspace from '@/app/manager/ManagerWorkspace';
import AuthGuard from '@/components/AuthGuard';

export default function ManagerPage() {
  return (
    <AuthGuard allowedRoles={['manager']}>
      <ManagerWorkspace />
    </AuthGuard>
  );
}
