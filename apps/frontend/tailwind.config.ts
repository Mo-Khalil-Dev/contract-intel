import type { Config } from 'tailwindcss';
import {
  colors,
  typography,
  spacing,
  radius,
  shadow,
  breakpoints,
} from './src/config/designTokens';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      mobile: breakpoints.mobile,
      sm: breakpoints.sm,
      md: breakpoints.md,
      lg: breakpoints.lg,
      xl: breakpoints.xl,
    },
    extend: {
      colors: {
        bg: colors.bg,
        bgAlt: colors.bgAlt,
        surface: colors.surface,
        surfaceAlt: colors.surfaceAlt,
        ink: {
          DEFAULT: colors.ink,
          mid: colors.inkMid,
          soft: colors.inkSoft,
          mute: colors.inkMute,
        },
        border: {
          DEFAULT: colors.border,
          mid: colors.borderMid,
        },
        blue: {
          DEFAULT: colors.blue,
          dark: colors.blueDark,
          light: colors.blueLight,
          mid: colors.blueMid,
        },
        green: {
          DEFAULT: colors.green,
          dark: colors.greenDark,
          bg: colors.greenBg,
          border: colors.greenBorder,
        },
        orange: {
          DEFAULT: colors.orange,
          dark: colors.orangeDark,
          bg: colors.orangeBg,
          border: colors.orangeBorder,
        },
        red: {
          DEFAULT: colors.red,
          dark: colors.redDark,
          bg: colors.redBg,
          border: colors.redBorder,
        },
        nav: {
          DEFAULT: colors.nav,
          border: colors.navBorder,
        },
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      letterSpacing: typography.letterSpacing,
      spacing,
      borderRadius: radius,
      boxShadow: shadow,
    },
  },
  plugins: [],
};

export default config;
