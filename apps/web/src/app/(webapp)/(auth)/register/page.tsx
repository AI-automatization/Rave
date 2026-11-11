'use client';

import { useState } from 'react';
import { RegisterForm } from './RegisterForm';
import { VerifyEmail } from './VerifyEmail';

export default function RegisterPage() {
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  if (verifyEmail) {
    return <VerifyEmail email={verifyEmail} />;
  }

  return <RegisterForm onVerify={setVerifyEmail} />;
}
