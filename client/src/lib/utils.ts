import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'h:mm a');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return dateString;
  }
}

export function getDayOfWeek(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'EEEE');
  } catch {
    return dateString;
  }
}

export function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function getWeekDates(date = new Date()): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day;
  
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    dates.push(currentDate);
  }
  
  return dates;
}

export function getResourceTypeLabel(type: string) {
  switch (type) {
    case 'studio':
      return 'Studio';
    case 'control_room':
      return 'Control Room';
    case 'equipment':
      return 'Equipment';
    default:
      return type;
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-amber-100 text-amber-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'declined':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
