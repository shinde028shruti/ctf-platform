export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const isMobileDevice =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(max-width: 767px)').matches
    : false;