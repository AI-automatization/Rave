'use client';

interface Props {
  text: string;
  isMine: boolean;
  time: string;
}

export function MessageBubble({ text, isMine, time }: Props) {
  return (
    <div className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`max-w-[78%] px-3.5 py-2.5 flex flex-col gap-0.5 ${
          isMine
            ? 'rounded-[18px] rounded-br-[5px] text-white'
            : 'rounded-[18px] rounded-bl-[5px] text-white/85 border border-white/[0.06]'
        }`}
        style={isMine ? { backgroundColor: '#7B72F8' } : { backgroundColor: '#1C1C2E' }}
      >
        <p className="text-sm break-words leading-[1.45]">{text}</p>
        <p className={`text-[9px] self-end leading-none ${isMine ? 'text-white/50' : 'text-white/28'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}
