
import { matchPath } from "react-router-dom";

/**
 * Checks if a given route path is currently active
 * @param path The route path to check
 * @param exact Whether the match should be exact or allow sub-routes
 * @returns Boolean indicating if the route is active
 */
export function isActive(path: string, exact: boolean = false): boolean {
  // Get the current path from window.location
  const currentPath = window.location.pathname;
  
  if (exact) {
    return currentPath === path;
  }
  
  // For home route, only match exactly
  if (path === '/') {
    return currentPath === '/';
  }
  
  // Use matchPath from react-router-dom for more complex matching
  return !!matchPath(
    { path, end: exact },
    currentPath
  );
}
