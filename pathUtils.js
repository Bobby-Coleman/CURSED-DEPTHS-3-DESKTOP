// Utility function to resolve paths based on the current environment
function getBasePath() {
    // Get the current path segments
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    
    // If we're on GitHub Pages, the first segment is the repo name
    if (window.location.hostname.includes('github.io')) {
        return '/' + pathSegments[0] + '/';
    }
    
    // For local development, use the current path up to the last segment
    if (pathSegments.length > 1) {
        return '/' + pathSegments.slice(0, -1).join('/') + '/';
    }
    
    // Default to root
    return '/';
}

// Function to resolve asset paths
function resolveAssetPath(relativePath) {
    const basePath = getBasePath();
    // Remove any leading slash from the relative path
    const cleanRelativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return basePath + cleanRelativePath;
}

// Function to resolve script paths
function resolveScriptPath(relativePath) {
    return resolveAssetPath(relativePath);
}

// Export the functions
window.pathUtils = {
    getBasePath,
    resolveAssetPath,
    resolveScriptPath
}; 