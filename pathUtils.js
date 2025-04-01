// Utility function to resolve paths based on the current environment
function getBasePath() {
    // If we're on GitHub Pages, use the repository name
    if (window.location.hostname.includes('github.io')) {
        return '/CURSED-DEPTHS-3-DESKTOP/';
    }
    
    // For local development, use root
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