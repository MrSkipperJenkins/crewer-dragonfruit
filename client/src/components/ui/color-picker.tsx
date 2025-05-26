import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Curated color palette with light and dark mode variants
export const colorPalette = [
  { name: "Blue", light: "#3b82f6", dark: "#60a5fa" },
  { name: "Green", light: "#22c55e", dark: "#4ade80" },
  { name: "Orange", light: "#f97316", dark: "#fb923c" },
  { name: "Purple", light: "#8b5cf6", dark: "#a78bfa" },
  { name: "Rose", light: "#f43f5e", dark: "#fb7185" },
  { name: "Emerald", light: "#10b981", dark: "#34d399" },
  { name: "Amber", light: "#f59e0b", dark: "#fbbf24" },
  { name: "Violet", light: "#7c3aed", dark: "#8b5cf6" },
  { name: "Pink", light: "#ec4899", dark: "#f472b6" },
  { name: "Indigo", light: "#6366f1", dark: "#818cf8" },
  { name: "Teal", light: "#14b8a6", dark: "#2dd4bf" },
  { name: "Red", light: "#ef4444", dark: "#f87171" },
];

// Utility to determine if a color is light or dark for contrast
export function getContrastTextColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value = "#3b82f6", onChange, className }: ColorPickerProps) {
  // Determine if we're in dark mode (this would be connected to your theme provider)
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", className)}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded border border-gray-300"
              style={{ backgroundColor: value }}
            />
            <span>Color</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <h4 className="font-medium leading-none">Select a color</h4>
          <div className="grid grid-cols-6 gap-2">
            {colorPalette.map((colorOption) => {
              const colorValue = isDarkMode ? colorOption.dark : colorOption.light;
              const isSelected = value === colorValue;
              
              return (
                <button
                  key={colorOption.name}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                    isSelected 
                      ? "border-gray-900 dark:border-gray-100 ring-2 ring-offset-2 ring-gray-400" 
                      : "border-gray-300 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: colorValue }}
                  onClick={() => onChange(colorValue)}
                  title={colorOption.name}
                />
              );
            })}
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              Colors automatically adapt to light and dark modes
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}