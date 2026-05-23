import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout({ mode = 'freelancer' }) {
  return (
    <div className="min-h-screen bg-background font-body">
      <Sidebar mode={mode} />
      {/* On mobile: top padding for the fixed topbar. On desktop: left margin for sidebar. */}
      <main className="pt-14 md:pt-0 md:ml-60 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}