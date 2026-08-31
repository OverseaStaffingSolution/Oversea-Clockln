// src/components/ui/ConnectionStatus.tsx
import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

type ConnectionState = 'online' | 'offline' | 'degraded';

export function ConnectionStatus() {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<ConnectionState>('online');

  // Vérification de la qualité de la connexion (ping)
  useEffect(() => {
    if (!isOnline) {
      setState('offline');
      return;
    }

    // Tester la connexion avec un ping à un serveur fiable (ex: Supabase)
    const checkConnectionQuality = async () => {
      try {
        const start = Date.now();
        const response = await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-store',
        });
        const elapsed = Date.now() - start;
        // Si le ping est > 1000ms, on considère la connexion comme dégradée
        if (elapsed > 1000) {
          setState('degraded');
        } else {
          setState('online');
        }
      } catch (error) {
        // Si la requête échoue, on considère que la connexion est dégradée (ou offline)
        setState('degraded');
      }
    };

    // Lancer le test toutes les 10 secondes
    const interval = setInterval(checkConnectionQuality, 10000);
    // Premier test immédiat
    checkConnectionQuality();

    return () => clearInterval(interval);
  }, [isOnline]);

  const config = {
    online: {
      label: 'Online',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      icon: <Wifi className="w-3 h-3" />,
    },
    offline: {
      label: 'Offline',
      color: 'text-red-500',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      icon: <WifiOff className="w-3 h-3" />,
    },
    degraded: {
      label: 'Bad Connection',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };

  const current = config[state];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${current.bg} ${current.border} border`}>
      <span className={`${current.color}`}>{current.icon}</span>
      <span className={`text-xs font-medium ${current.color}`}>{current.label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${current.color} animate-pulse`}></span>
    </div>
  );
}