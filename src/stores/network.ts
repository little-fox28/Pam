import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

type NetworkState = {
  isOnline: boolean;
};

export const useNetworkStore = create<NetworkState>(() => ({ isOnline: true }));

let started = false;

/** Subscribes once to connectivity changes. Call at app start. */
export function startNetworkMonitor() {
  if (started) return;
  started = true;
  NetInfo.addEventListener((state) => {
    // `isInternetReachable` is null while unknown; treat unknown as online.
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    if (useNetworkStore.getState().isOnline !== online) {
      useNetworkStore.setState({ isOnline: online });
    }
  });
}

