const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

const topBarDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** "Sep 23  20:00" — my GNOME top bar: date shown, no weekday, 24-hour clock. */
export const formatTopBarClock = (date: Date): string => `${topBarDate.format(date)}  ${timeFormat.format(date)}`;
export const formatTime = (date: Date): string => timeFormat.format(date);
