# Supabase Authentication Setup Guide

## Overview
This project now includes Supabase email/password authentication with:
- ✅ Register form for new users
- ✅ Login form for existing users
- ✅ Auth context for state management
- ✅ Auto session restore on page reload
- ✅ Logout functionality
- ✅ Loading states and error handling
- ✅ Fully integrated with existing Property AI chat interface

## Project Structure

```
src/
├── lib/
│   └── supabaseClient.js        # Supabase client initialization
├── context/
│   └── AuthContext.jsx           # Auth provider & hooks (signUp, signIn, signOut)
├── pages/
│   └── AuthPage.jsx              # Login/Register UI component
├── components/
│   └── Header.jsx                # Updated with user info & logout button
└── App.jsx                       # Updated with auth routing logic
```

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project" (or sign in if you have an account)
3. Fill in project details:
   - **Project name**: `property-ai` (or your preferred name)
   - **Database password**: Create a strong password
   - **Region**: Choose closest to your location
4. Wait for project initialization (~2 minutes)

### 2. Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Public Key** → `VITE_SUPABASE_ANON_KEY`

### 3. Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save** the file (do NOT commit this file - it's in `.gitignore`)

### 4. Enable Email Auth in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure "Email" is enabled (should be by default)
3. Go to **Email Templates** to customize verification emails (optional)

### 5. Configure Redirect URLs (Optional but Recommended)

1. Go to **Authentication** → **URL Configuration**
2. Add your local dev URL:
   - Add `http://localhost:5173` to "Redirect URLs"
   - Add `http://localhost:5174` to "Redirect URLs"
3. Add your production URL when you deploy

### 6. Install Dependencies & Run

```bash
# Install Supabase package (already done via npm install @supabase/supabase-js)
npm install

# Start development server
npm run dev
```

The app will start on `http://localhost:5173` (or `5174` if port is in use)

## Usage

### Authentication Flow

1. **Load App**: App checks if user is logged in
   - If loading → Shows "Loading…" spinner
   - If not logged in → Shows **AuthPage** (Login/Register)
   - If logged in → Shows main **Property AI Chat**

2. **Register New User**:
   - Click "Sign up" toggle
   - Enter email and password (min 6 chars)
   - Confirm password
   - Click "Create Account"
   - User is created (depending on Supabase settings, may need email verification)

3. **Login**:
   - Enter email and password
   - Click "Sign In"
   - On success, automatically redirected to main app
   - Session persists across page reloads

4. **Logout**:
   - Click "Logout" button in header (top-right, visible when logged in)
   - Redirected back to AuthPage

### Error Handling

- **Invalid credentials** → Error message on login
- **Password too short** → Error message during registration
- **Passwords don't match** → Error message during registration
- **Missing email/password** → Validation error before API call
- **Network error** → Graceful error message

## Code Overview

### `src/lib/supabaseClient.js`
Initializes Supabase client with environment variables:
- Checks for required env vars on startup
- Throws helpful error if keys are missing

### `src/context/AuthContext.jsx`
Core auth logic:
- **`AuthProvider`**: Wraps app, manages auth state
- **`useAuth()`**: Hook to access auth functions in components
- **Functions**:
  - `signUp(email, password)` → Creates new user
  - `signIn(email, password)` → Logs in existing user
  - `signOut()` → Logs out current user
  - Auto session restore on mount via `supabase.auth.getUser()`
  - Auth state listener for real-time updates

### `src/pages/AuthPage.jsx`
Beautiful login/register UI:
- **Toggle between modes** (Login ↔ Register)
- **Form validation**:
  - Email required
  - Password required
  - Min 6 characters for password
  - Password confirmation match (register only)
- **Error/Success messages** with color-coded alerts
- **Loading state** during submission
- **Accessible form inputs** with labels and placeholders
- **Dark mode support** matching project theme

### `src/App.jsx`
Updated routing:
- Imports `useAuth()` hook
- Shows loading spinner while auth initializes
- Shows `<AuthPage />` if user is null
- Shows main chat app if user exists
- Passes user to Header for display

### `src/components/Header.jsx`
Updated with user info:
- Shows "Logged in as {email}" when user exists
- Displays "Logout" button
- Button triggers `signOut()` and redirects to AuthPage

## Testing Checklist

- [ ] App starts with AuthPage showing
- [ ] Can toggle between "Sign up" and "Sign in" modes
- [ ] Form validation works (empty fields, short password, mismatch)
- [ ] Can register with email/password
- [ ] Can login with registered account
- [ ] Logged in user sees main chat app
- [ ] Header shows email and logout button
- [ ] Logout button works and redirects to AuthPage
- [ ] Page reload maintains logged-in state (session persists)
- [ ] Page reload shows loading spinner then restores session

## Troubleshooting

### "Missing Supabase environment variables" error
- **Fix**: Double-check `.env.local` has correct values from Supabase dashboard
- Restart dev server after updating `.env.local`

### "Invalid login credentials"
- **Fix**: Verify email and password are correct
- Check if account was created successfully (may need email verification)

### Session not persisting on reload
- **Fix**: Check browser localStorage is enabled
- Check Supabase project settings for session expiration

### CORS errors in console
- **Fix**: Ensure Supabase URL is correct (should start with `https://`)
- Check Anon Key is valid

### Login works but app shows blank screen
- **Fix**: Check browser console for errors
- Verify user is being set in auth state
- Try force refreshing the page

## Advanced: Email Verification (Optional)

By default, users can login immediately after registration. To require email verification:

1. Go to **Authentication** → **Providers** → **Email**
2. Enable "Confirm email"
3. Users will get verification link in email
4. They must verify before accessing the app

To handle this in the UI, modify `AuthPage.jsx` to check `user.confirmed_at` after signup.

## Production Deployment

### Before deploying to Vercel/production:

1. **Update redirect URLs** in Supabase:
   - Add your production domain (e.g., `https://yourapp.vercel.app`)

2. **Set environment variables** in deployment platform:
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - These must be public (Anon Key is meant to be public)

3. **Test in production** before going live

### Vercel Deployment Steps:

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
5. Deploy

## Next Steps

- Consider adding social auth (Google, GitHub) via Supabase
- Add user profile page to update profile information
- Add password reset functionality
- Implement role-based access control (RLS) for database
- Add email notifications for important events

## Support

For Supabase documentation, visit: https://supabase.com/docs

For issues with auth logic, check:
- Browser console for error messages
- Supabase dashboard → Auth Logs for API errors
- `.env.local` configuration
