import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rumbo-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rumbo-theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    if (newTheme) {
      setTheme(newTheme);
    } else {
      setTheme((prev) => {
        if (prev === 'light') return 'light-warm';
        if (prev === 'light-warm') return 'dark';
        if (prev === 'dark') return 'guinda';
        if (prev === 'guinda') return 'guinda-light';
        if (prev === 'guinda-light') return 'coraje';
        if (prev === 'coraje') return 'coraje-dark';
        return 'light';
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
