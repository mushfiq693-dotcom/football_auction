import React, { createContext, useContext, useState, useEffect } from 'react';
import { GlobalState, Phase } from '../types';
import { api } from '../services/api';
import { useSocket } from './SocketContext';

interface GlobalStateContextType {
  activePhase: Phase;
  globalState: GlobalState | null;
  refetchState: () => void;
}

const GlobalStateContext = createContext<GlobalStateContextType>({} as GlobalStateContextType);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const { socket } = useSocket();

  const fetchState = async () => {
    try {
      const res = await api.get('/global-state');
      setGlobalState(res.data.data);
    } catch (err) {
      console.error('Failed to fetch global state:', err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('phase:changed', (newState: GlobalState) => {
      console.log('🔄 Global Phase Changed:', newState.activePhase);
      setGlobalState(newState);
    });

    return () => {
      socket.off('phase:changed');
    };
  }, [socket]);

  const activePhase = globalState?.activePhase || 'SETUP';

  return (
    <GlobalStateContext.Provider value={{ activePhase, globalState, refetchState: fetchState }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalPhase = () => useContext(GlobalStateContext);
