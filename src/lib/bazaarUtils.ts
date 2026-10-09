export const isBazaarEnvironment = (): boolean => {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return navigator.userAgent.includes('BazaarVersion');
  }
  return false;
};
