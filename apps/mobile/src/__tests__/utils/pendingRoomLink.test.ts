import { parseRoomLink, pendingRoomLink } from '../../utils/pendingRoomLink';

describe('parseRoomLink', () => {
  it('parses wewatch://join/CODE', () => {
    expect(parseRoomLink('wewatch://join/ab12cd')).toEqual({ kind: 'join', inviteCode: 'AB12CD' });
  });
  it('parses room link with code', () => {
    expect(parseRoomLink('https://app.wewatch.uz/room/abc123?code=xy12z9')).toEqual({
      kind: 'room', roomId: 'abc123', inviteCode: 'XY12Z9',
    });
  });
  it('parses room link without code', () => {
    expect(parseRoomLink('https://app.wewatch.uz/room/abc123')).toEqual({ kind: 'room', roomId: 'abc123' });
  });
  it('ignores unrelated urls', () => {
    expect(parseRoomLink('https://app.wewatch.uz/bind-email')).toBeNull();
  });
});

describe('pendingRoomLink', () => {
  it('take() returns once then clears', () => {
    pendingRoomLink.set({ kind: 'join', inviteCode: 'AAAAAA' });
    expect(pendingRoomLink.take()).toEqual({ kind: 'join', inviteCode: 'AAAAAA' });
    expect(pendingRoomLink.take()).toBeNull();
  });
});
