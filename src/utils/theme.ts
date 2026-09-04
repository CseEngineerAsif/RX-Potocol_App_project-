import React from 'react';
import {
  ShieldAlert,
  Activity,
  Scissors,
  Baby,
  Heart,
  Stethoscope,
  Pill,
  Brain,
  Bone,
  Eye,
  Flame,
  Sparkles,
  Folder,
  Thermometer,
  Syringe,
  FileText,
  Layers,
  Bandage,
  AlertTriangle,
  BookOpen,
  LucideIcon,
} from 'lucide-react';
import { AccentColor } from '../types';

export const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
  ShieldAlert,
  Activity,
  Scissors,
  Baby,
  Heart,
  Stethoscope,
  Pill,
  Brain,
  Bone,
  Eye,
  Flame,
  Sparkles,
  Folder,
  Thermometer,
  Syringe,
  FileText,
  Layers,
  Bandage,
  AlertTriangle,
  BookOpen,
};

export const ACCENT_COLOR_CLASSES: Record<
  AccentColor,
  {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    ring: string;
    button: string;
    buttonHover: string;
    lightBg: string;
    gradient: string;
  }
> = {
  blue: {
    bg: 'bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-600 dark:border-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    ring: 'focus:ring-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    buttonHover: 'hover:bg-blue-50 dark:hover:bg-blue-950/40',
    lightBg: 'bg-blue-500/10',
    gradient: 'from-blue-600 to-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-600 dark:border-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    ring: 'focus:ring-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    buttonHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    lightBg: 'bg-emerald-500/10',
    gradient: 'from-emerald-600 to-teal-700',
  },
  indigo: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-600 dark:border-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    ring: 'focus:ring-indigo-500',
    button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    buttonHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
    lightBg: 'bg-indigo-500/10',
    gradient: 'from-indigo-600 to-purple-700',
  },
  rose: {
    bg: 'bg-rose-600',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-600 dark:border-rose-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    ring: 'focus:ring-rose-500',
    button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    buttonHover: 'hover:bg-rose-50 dark:hover:bg-rose-950/40',
    lightBg: 'bg-rose-500/10',
    gradient: 'from-rose-600 to-red-700',
  },
  teal: {
    bg: 'bg-teal-600',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-600 dark:border-teal-500',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
    ring: 'focus:ring-teal-500',
    button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm',
    buttonHover: 'hover:bg-teal-50 dark:hover:bg-teal-950/40',
    lightBg: 'bg-teal-500/10',
    gradient: 'from-teal-600 to-cyan-700',
  },
  amber: {
    bg: 'bg-amber-600',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-600 dark:border-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    ring: 'focus:ring-amber-500',
    button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
    buttonHover: 'hover:bg-amber-50 dark:hover:bg-amber-950/40',
    lightBg: 'bg-amber-500/10',
    gradient: 'from-amber-600 to-orange-700',
  },
  slate: {
    bg: 'bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-700 dark:border-slate-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200',
    ring: 'focus:ring-slate-500',
    button: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600',
    buttonHover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    lightBg: 'bg-slate-500/10',
    gradient: 'from-slate-700 to-slate-900',
  },
};

export function getDepartmentIcon(iconName?: string): LucideIcon {
  if (!iconName) return Folder;
  return DEPARTMENT_ICONS[iconName] || Folder;
}
