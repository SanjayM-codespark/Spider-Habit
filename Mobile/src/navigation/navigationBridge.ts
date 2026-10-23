import type { MainTabType } from './AppNavigator';

/**
 * Allows code outside the navigator (e.g. the FreeTrial context) to
 * trigger navigation inside AppNavigator, which keeps its own state.
 */
let navigateFn: ((screen: MainTabType) => void) | null = null;

export const setNavigationBridge = (fn: (screen: MainTabType) => void) => {
  navigateFn = fn;
};

export const clearNavigationBridge = () => {
  navigateFn = null;
};

export const navigateToScreen = (screen: MainTabType) => navigateFn?.(screen);

export default { setNavigationBridge, clearNavigationBridge, navigateToScreen };