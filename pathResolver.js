const BASE_PATH = window.location.hostname.includes('github.io') 
    ? '/CURSED-DEPTHS-3-DESKTOP'
    : '';

export function getPath(path) {
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    return BASE_PATH + normalizedPath;
} 