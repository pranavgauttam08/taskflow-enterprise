import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parseISO, differenceInDays } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'MMM dd, yyyy');
export const formatDateFull = (date) => format(new Date(date), 'EEEE, MMMM dd, yyyy');
export const formatDateShort = (date) => format(new Date(date), 'MM/dd');
export const formatDateISO = (date) => format(new Date(date), 'yyyy-MM-dd');
export const formatMonth = (date) => format(new Date(date), 'yyyy-MM');
export const formatMonthLabel = (date) => format(new Date(date), 'MMMM yyyy');
export const formatTime = (hour) => `${String(hour).padStart(2, '0')}:00`;
export const formatTimeSlot = (hour) => `${formatTime(hour)} – ${formatTime(hour + 1)}`;

export function getCalendarDays(year, month) {
  const firstDay = startOfMonth(new Date(year, month));
  const lastDay = endOfMonth(new Date(year, month));
  const calendarStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(lastDay, { weekStartsOn: 1 });

  const days = [];
  let current = calendarStart;
  while (current <= calendarEnd) {
    days.push({
      date: new Date(current),
      dateStr: formatDateISO(current),
      isCurrentMonth: isSameMonth(current, firstDay),
      isToday: isToday(current),
      dayOfMonth: current.getDate(),
    });
    current = addDays(current, 1);
  }
  return days;
}

export function getDayName(date) {
  return format(new Date(date), 'EEE');
}

export function getRelativeDay(date) {
  const diff = differenceInDays(new Date(), new Date(date));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(date);
}

export { isToday, isSameDay, parseISO };
