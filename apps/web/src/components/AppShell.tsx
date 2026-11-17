import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F5F1] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[238px]">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1500px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
