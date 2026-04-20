import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 lg:ml-0 overflow-auto flex flex-col">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </div>
          <footer className="bg-card border-t border-border h-14 px-6 flex items-center justify-center text-sm text-muted-foreground flex-shrink-0">
            © {new Date().getFullYear()} Innovation Hub. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
};
