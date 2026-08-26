/**
 * Input and Data Validation Helpers
 * Ensures sanitization and format verification across all client forms.
 */

export const validator = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  isValidPassword(password: string): boolean {
    return password.length >= 6;
  },

  isValidDate(dateStr: string): boolean {
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  },

  isValidTime(timeStr: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeStr);
  },

  isWithinLastDays(dateStr: string, maxDays = 7): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    const minDate = new Date();
    minDate.setDate(now.getDate() - maxDays);
    minDate.setHours(0, 0, 0, 0);

    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= minDate && checkDate <= now;
  },

  sanitizeString(input: string): string {
    return input.replace(/[<>]/g, '').trim();
  }
};
