import { Suspense } from 'react';
import { GuestJoinForm } from './GuestJoinForm';

export default function GuestPage() {
  return (
    <Suspense>
      <GuestJoinForm />
    </Suspense>
  );
}
