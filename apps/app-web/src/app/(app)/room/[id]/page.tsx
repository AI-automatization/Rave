import { RoomContent } from './RoomContent';

export const metadata = {
  title: 'Watch Party',
};

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomContent roomId={id} />;
}
