import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// ThemeToggle: UI for switching between dark/light mode
const ThemeToggle: React.FC = () => {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center"
      title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {dark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-800" />}
    </button>
  );
};

export default ThemeToggle;
