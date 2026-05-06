import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface max-w-lg mx-auto relative">
      <main className="pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
