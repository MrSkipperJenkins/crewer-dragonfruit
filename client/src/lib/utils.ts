import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'scheduled':
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Generate URL-friendly slug from workspace name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Validate slug format
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}