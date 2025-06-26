// Color utility functions for event colors and contrast calculation

// Predefined color palette with light and dark variants
export const COLOR_PALETTE = {
  blue: {
    light: "#3b82f6",
    dark: "#60a5fa",
    name: "Blue",
  },
  emerald: {
    light: "#10b981",
    dark: "#34d399",
    name: "Emerald",
  },
  amber: {
    light: "#f59e0b",
    dark: "#fbbf24",
    name: "Amber",
  },
  violet: {
    light: "#8b5cf6",
    dark: "#a78bfa",
    name: "Violet",
  },
  rose: {
    light: "#f43f5e",
    dark: "#fb7185",
    name: "Rose",
  },
  indigo: {
    light: "#6366f1",
    dark: "#818cf8",
    name: "Indigo",
  },
  cyan: {
    light: "#06b6d4",
    dark: "#22d3ee",
    name: "Cyan",
  },
  orange: {
    light: "#ea580c",
    dark: "#fb923c",
    name: "Orange",
  },
  green: {
    light: "#16a34a",
    dark: "#4ade80",
    name: "Green",
  },
  purple: {
    light: "#9333ea",
    dark: "#c084fc",
    name: "Purple",
  },
} as const;

// Get color based on theme
export function getThemeColor(
  colorKey: keyof typeof COLOR_PALETTE,
  isDark: boolean,
): string {
  const color = COLOR_PALETTE[colorKey];
  return isDark ? color.dark : color.light;
}

// Calculate luminance of a color
function getLuminance(hex: string): number {
  // Remove # if present
  const color = hex.replace("#", "");

  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16) / 255;
  const g = parseInt(color.substr(2, 2), 16) / 255;
  const b = parseInt(color.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const gammaCorrect = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = gammaCorrect(r);
  const gLinear = gammaCorrect(g);
  const bLinear = gammaCorrect(b);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Get high contrast text color (black or white) for a background color
export function getContrastTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, "#ffffff");
  const blackContrast = getContrastRatio(backgroundColor, "#000000");

  // Return the color with better contrast (WCAG AA standard requires 4.5:1)
  return whiteContrast > blackContrast ? "#ffffff" : "#000000";
}

// Get all available colors as an array
export function getColorOptions(isDark: boolean = false) {
  return Object.entries(COLOR_PALETTE).map(([key, value]) => ({
    key: key as keyof typeof COLOR_PALETTE,
    name: value.name,
    value: isDark ? value.dark : value.light,
    lightValue: value.light,
    darkValue: value.dark,
  }));
}

// Find color key by hex value
export function findColorKey(
  hexValue: string,
): keyof typeof COLOR_PALETTE | null {
  for (const [key, color] of Object.entries(COLOR_PALETTE)) {
    if (color.light === hexValue || color.dark === hexValue) {
      return key as keyof typeof COLOR_PALETTE;
    }
  }
  return null;
}

// Validate if a hex color is valid
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}
