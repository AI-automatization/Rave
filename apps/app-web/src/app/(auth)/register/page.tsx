'use client';

import { Suspense, useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { VerifyEmail } from './VerifyEmail';

// Suspense: both forms read ?redirect= / ?plan= via useSearchParams (same as /login).
export default function RegisterPage() {
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  return (
    <Suspense>
      {verifyEmail ? <VerifyEmail email={verifyEmail} /> : <RegisterForm onVerify={setVerifyEmail} />}
    </Suspense>
  );
}
