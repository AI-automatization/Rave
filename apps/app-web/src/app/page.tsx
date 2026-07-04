import { redirect } from 'next/navigation';

// app.wewatch.uz has no marketing root — send visitors straight into the app.
// The auth middleware bounces unauthenticated users from /home to /login.
export default function AppRoot() {
  redirect('/home');
}
