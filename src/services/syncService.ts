// Service for syncing offline clock-ins

export const syncService = {
  syncPendingClockIns: async () => {
    console.log('Synchronizing pending clock-ins...');
    // Implémentation future de la synchronisation hors-ligne
    return true;
  },
  
  saveClockInOffline: (data: any) => {
    console.log('Saving clock-in offline', data);
    // Implémentation future du stockage local
  }
};
