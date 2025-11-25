# API Client - 401 Authentication Handler

## Overview

This API client provides a centralized way to handle all HTTP requests in the application with automatic 401 (Unauthorized) error detection and redirection to the authentication page.

## Features

- **Automatic 401 Handling**: When any API call receives a 401 status, the user is automatically redirected to `/auth`
- **Convenience Methods**: Pre-configured methods for common HTTP verbs (GET, POST, PUT, PATCH, DELETE)
- **Firebase Token Integration**: Easy integration with Firebase ID tokens for authentication
- **Type-Safe**: Full TypeScript support

## Usage

### Basic Usage

```typescript
import { apiFetch, apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api/apiClient";

// Using the base wrapper
const response = await apiFetch("/api/endpoint", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`
  }
});

// Using convenience methods
const idToken = await user.getIdToken();

// GET request
const response = await apiGet("/api/users", idToken);

// POST request
const response = await apiPost("/api/users", { name: "John" }, idToken);

// PUT request
const response = await apiPut("/api/users/123", { name: "Jane" }, idToken);

// PATCH request
const response = await apiPatch("/api/users/123", { bio: "Updated bio" }, idToken);

// DELETE request
const response = await apiDelete("/api/users/123", idToken);
```

### In Components

```typescript
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet } from "@/lib/api/apiClient";

export function MyComponent() {
  const { user } = useAuth();
  
  const fetchData = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await apiGet("/api/data", idToken);
      const data = await response.json();
      // Handle data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  
  // ...
}
```

## How It Works

1. All API calls go through the `apiFetch` wrapper
2. The wrapper checks the response status code
3. If status is 401:
   - Logs a warning message
   - **Signs out the user from Firebase** (prevents redirect loop)
   - Redirects to `/auth` page
   - Throws an error to prevent further processing
4. Otherwise, returns the response as normal

### Why Sign Out on 401?

When a 401 occurs, the user's token is invalid on the backend but they're still authenticated in Firebase (client-side). If we just redirect to `/auth`, the auth page would see the Firebase user and redirect back to home, creating an infinite loop:

```
401 → /auth → sees Firebase user → / → 401 → /auth → ...
```

By signing out from Firebase first, we break this loop:

```
401 → sign out Firebase → /auth → user needs to login → ✓
```

## Migration

All existing `fetch()` calls in the codebase have been updated to use the API client:

- ✅ `ForYouTabs.tsx`
- ✅ `Recents.tsx`
- ✅ `Projects page`
- ✅ `Teams page`
- ✅ `Profile page`
- ✅ `Project detail page`
- ✅ `SideBar.tsx`
- ✅ `SyncUser.ts`
- ✅ `updateLastSignIn.ts`

## Notes

- The API client only handles client-side fetch calls
- Server-side API routes (Next.js API routes) continue to use native fetch
- 401 errors from the backend will automatically trigger a redirect
- The redirect only happens in the browser (client-side)

