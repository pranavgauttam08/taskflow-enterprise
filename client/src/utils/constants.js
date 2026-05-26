export const COLORS = {
  primary: '#0A0F2E',
  accent: '#5C4AE4',
  gold: '#F2B94B',
  surface: '#111827',
  cardSurface: '#1A2035',
  textPrimary: '#F0F4FF',
  textMuted: '#8892B0',
  success: '#10D9A0',
  danger: '#FF4D6D',
  warning: '#F59E0B',
  accentLight: 'rgba(92, 74, 228, 0.15)',
  accentGlow: 'rgba(92, 74, 228, 0.4)',
  goldGlow: 'rgba(242, 185, 75, 0.3)',
};

export const STATUS_CONFIG = {
  COMPLETED: { label: 'Completed', color: COLORS.success, bg: 'rgba(16, 217, 160, 0.15)' },
  PENDING: { label: 'Pending', color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)' },
  NOT_COMPLETED: { label: 'Not Completed', color: COLORS.danger, bg: 'rgba(255, 77, 109, 0.15)' },
};

export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' },
  MEDIUM: { label: 'Medium', color: COLORS.accent, bg: COLORS.accentLight },
  HIGH: { label: 'High', color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)' },
  CRITICAL: { label: 'Critical', color: COLORS.danger, bg: 'rgba(255, 77, 109, 0.15)' },
};

export const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Sales', 'HR',
  'Design', 'Operations', 'Finance', 'Product',
];

export const REASON_CATEGORIES = [
  'Blocked by dependency',
  'Insufficient resources',
  'Scope change',
  'Personal emergency',
  'Technical issue',
  'Other',
];

export const WORK_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20

export const TIME_SLOTS = WORK_HOURS.map(h => ({
  hour: h,
  label: `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00`,
  value: `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`,
}));
