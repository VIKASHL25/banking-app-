
// API URL - Automatically select between local and production environments
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Use the actual Lovable domain for production or localhost for development
export const API_URL = isLocalhost ? "http://localhost:5000/api" : `${window.location.origin}/api`;

// Log the API URL being used to help with debugging
console.log(`Using API URL: ${API_URL}`);
