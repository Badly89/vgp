// src/styles/theme.ts
// Тёплая терракотовая тема с северными акцентами

export const THEME = {
  colors: {
    // Основная палитра
    primary: "#5C3D2E", // Тёмный шоколад
    primaryDark: "#3B2417", // Глубокий коричневый
    primaryLight: "#8B6F5E", // Светлая кора

    // Акценты
    terracotta: "#C67B5C", // Терракота (основной акцент)
    terracottaLight: "#E8B4A2", // Светлая терракота
    terracottaDark: "#A0523D", // Тёмная терракота

    // Северные акценты
    northernBlue: "#7B9EAF", // Северное небо
    northernIce: "#C8D9E3", // Лёд
    northernAurora: "#5B8C5A", // Северное сияние (зелёный)
    northernSnow: "#F5F0EB", // Снег (тёплый белый)

    // Функциональные цвета
    success: "#5B8C5A", // Мховый зелёный
    warning: "#D4956A", // Янтарный
    danger: "#B8443A", // Кирпичный красный
    info: "#7B9EAF", // Северное небо

    // Нейтральные
    background: "#F5F0EB", // Тёплый снег
    surface: "#FFFAF5", // Кремовый
    surfaceHover: "#F0E8DE", // Бежевый при наведении
    border: "#E0D5C8", // Тёплая граница
    borderLight: "#EDE4D8", // Светлая граница

    // Текст
    textPrimary: "#3B2417", // Тёмный шоколад
    textSecondary: "#7B6E63", // Серо-коричневый
    textMuted: "#A89888", // Приглушённый
    textInverse: "#FFFAF5", // Светлый на тёмном

    // Градиенты
    gradientHeader: "linear-gradient(135deg, #3B2417 0%, #5C3D2E 100%)",
    gradientCard: "linear-gradient(135deg, #C67B5C 0%, #E8B4A2 100%)",
    gradientAurora: "linear-gradient(135deg, #5B8C5A 0%, #7B9EAF 100%)",
    gradientSunset: "linear-gradient(135deg, #C67B5C 0%, #D4956A 100%)",

    // Тени
    shadowSmall: "0 2px 4px rgba(92, 61, 46, 0.06)",
    shadowMedium: "0 4px 12px rgba(92, 61, 46, 0.08)",
    shadowLarge: "0 8px 24px rgba(92, 61, 46, 0.12)",
    shadowGlow: "0 0 20px rgba(198, 123, 92, 0.2)",
  },

  fonts: {
    heading:
      "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Space Mono', 'Fira Code', 'JetBrains Mono', monospace",
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  animation: {
    fast: "0.15s ease",
    normal: "0.25s ease",
    slow: "0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Размеры для компонентов
  sizes: {
    headerHeight: 64,
    sidebarWidth: 240,
    sidebarCollapsed: 64,
    contentMaxWidth: 1400,
    filterDrawerInputWidth: 340,
  },
};

// Алиасы для удобства
export const colors = THEME.colors;
export const fonts = THEME.fonts;
export const radius = THEME.radius;
export const animation = THEME.animation;
export const sizes = THEME.sizes;
export const COLORS = THEME.colors;
