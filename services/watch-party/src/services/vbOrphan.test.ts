import test from 'node:test';
import assert from 'node:assert/strict';
import { pickOrphanedSessions, ORPHAN_EMPTY_GRACE_MS } from './vbOrphan';

const base = (over: Partial<Parameters<typeof pickOrphanedSessions>[0]> = {}) => ({
  sessionRoomIds: ['a'],
  liveRoomIds: new Set(['a']),
  isOccupied: () => false,
  now: 1_000_000,
  emptySince: new Map<string, number>(),
  ...over,
});

test('session of an ended/deleted room is orphaned immediately (REST DELETE leak)', () => {
  assert.deepEqual(pickOrphanedSessions(base({ liveRoomIds: new Set() })), ['a']);
});

test('live room without sockets is kept until the grace period elapses (never-joined owner leak)', () => {
  const emptySince = new Map<string, number>();
  assert.deepEqual(pickOrphanedSessions(base({ emptySince })), []);
  assert.equal(emptySince.get('a'), 1_000_000);
  assert.deepEqual(pickOrphanedSessions(base({ emptySince, now: 1_000_000 + ORPHAN_EMPTY_GRACE_MS - 1 })), []);
  assert.deepEqual(pickOrphanedSessions(base({ emptySince, now: 1_000_000 + ORPHAN_EMPTY_GRACE_MS })), ['a']);
});

test('an occupied room is never orphaned and resets the empty clock', () => {
  const emptySince = new Map([['a', 0]]);
  assert.deepEqual(pickOrphanedSessions(base({ emptySince, isOccupied: () => true, now: 99 * ORPHAN_EMPTY_GRACE_MS })), []);
  assert.equal(emptySince.has('a'), false);
});

test('emptySince entries for rooms without a session are pruned (no map growth)', () => {
  const emptySince = new Map([['gone', 5]]);
  pickOrphanedSessions(base({ emptySince, sessionRoomIds: [], liveRoomIds: new Set() }));
  assert.equal(emptySince.size, 0);
});
