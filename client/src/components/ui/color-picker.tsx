import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  COLOR_PALETTE,
  getColorOptions,
  type COLOR_PALETTE as ColorPaletteType,
} from "@/lib/colors";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colorOptions = getColorOptions(isDark);

  // Find the current color option
  const currentColor = colorOptions.find(
    (option) =>
      option.value === value ||
      option.lightValue === value ||
      option.darkValue === value,
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-gray-300"
              style={{ backgroundColor: value || "#3b82f6" }}
            />
            {currentColor ? currentColor.name : "Select color"}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-5 gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.key}
              onClick={() => onChange(color.value)}
              className={cn(
                "relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                value === color.value ||
                  value === color.lightValue ||
                  value === color.darkValue
                  ? "border-gray-900 dark:border-gray-100"
                  : "border-gray-300",
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {(value === color.value ||
                value === color.lightValue ||
                value === color.darkValue) && (
                <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Choose a color for your event. Colors automatically adapt to light
            and dark themes.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
