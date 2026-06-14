'use client';

interface Props {
  text: string;
  isMine: boolean;
  time: string;
}

export function MessageBubble({ text, isMine, time }: Props) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
        isMine
          ? 'bg-violet-600/30 text-violet-100 rounded-br-sm'
          : 'bg-white/[0.06] text-slate-200 rounded-bl-sm'
      }`}>
        <p className="text-sm break-words">{text}</p>
        <p className={`text-[10px] mt-0.5 ${isMine ? 'text-violet-300/60' : 'text-slate-500'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}
