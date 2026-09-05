import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rumbo-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rumbo-theme', theme);

    // Update PWA Status Bar theme-color dynamically to match the exact background of each user theme
    const themeColors = {
      'light': '#F2F2F7',
      'light-warm': '#F6F3EC',
      'dark': '#000000',
      'guinda': '#2d060d',
      'guinda-light': '#FDF2F4',
      'coraje': '#F4EBE1',
      'coraje-dark': '#120919',
      'beige-carmesi': '#E8DFD8',
      'google-vibrant': '#F0F4F9'
    };

    const color = themeColors[theme] || '#000000';
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.name = 'theme-color';
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color);
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
