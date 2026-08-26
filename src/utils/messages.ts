// Centralized messages for Oversea ClockIn application

export const MESSAGES = {
  // Success
  SUCCESS: {
    CLOCK_IN_OK: 'Clock In recorded successfully',
    CLOCK_OUT_OK: 'Clock Out recorded successfully',
    SYNC_OK: 'Synchronization completed',
    CORRECTION_SENT: 'Request submitted successfully',
  },
  
  // General errors
  ERROR: {
    NETWORK: 'Connection issue - Please check your internet connection',
    SERVER: 'Server error - Please try again later',
    UNKNOWN: 'An unexpected error occurred',
    CORRECTION_FAILED: 'Failed to submit correction request',
    CORRECTION_LOAD_FAILED: 'Failed to load correction requests',
  },
  
  // GPS errors
  GPS: {
    UNAVAILABLE: 'GPS position unavailable',
    PERMISSION_DENIED: 'GPS permission denied - Enable location in settings',
    INACTIVE: 'GPS inactive - Please enable your GPS',
    INSUFFICIENT_ACCURACY: 'Low accuracy - Move to improve GPS signal',
    TIMEOUT: 'GPS request timed out - Please retry',
  },
  
  // Time tracking errors
  POINTAGE: {
    ALREADY_IN: 'You have already clocked in today',
    ALREADY_OUT: 'You have already clocked out today',
    NO_IN: 'You must clock in first',
    HORS_ZONE: 'You are outside the call center authorized zone',
    AGENT_INACTIVE: 'Your account is deactivated - Please contact your manager',
  },
  
  // Information
  INFO: {
    GPS_INACTIVE: 'GPS inactive - Click CLOCK IN or CLOCK OUT',
    GPS_SEARCHING: 'Acquiring GPS signal...',
    GPS_OK: 'GPS OK - Accuracy:',
    LOADING: 'Loading...',
    SAVING: 'Saving...',
  }
} as const;

/**
 * Helper to format messages with positional parameters {0}, {1}, etc.
 */
export function formatMessage(message: string, ...args: (string | number)[]): string {
  return message.replace(/{(\d+)}/g, (match, numberStr) => {
    const number = parseInt(numberStr, 10);
    return typeof args[number] !== 'undefined' ? String(args[number]) : match;
  });
}

