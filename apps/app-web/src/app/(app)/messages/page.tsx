import { Suspense } from 'react';
import { MessagesContent } from './MessagesContent';

export const metadata = {
  title: 'Messages',
};

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesContent />
    </Suspense>
  );
}
