
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider.jsx';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Don't show header on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              HETO / ሕቶ
            </span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg)] transition-all duration-200 active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-[var(--text)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--text)]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
