import { Types } from 'mongoose';
import { DirectMessage, IDirectMessageDocument } from '../models/directMessage.model';
import { User } from '../models/user.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '@shared/utils/errors';
import { sendInternalNotification } from '@shared/utils/serviceClient';
import { encryptText, decryptText } from '../utils/dmCrypto';

const PAGE_SIZE = 50;
const REPLY_SNIPPET_MAX = 300;
const MAX_PINNED_CONVERSATIONS = 5;
const UNREAD_PUSH_PREVIEW_LIMIT = 5;

export interface DMMessage {
  // Must be `_id` (not `id`): the mobile client, keyExtractor and socket-echo
  // dedup all key on `_id`. Returning `id` left every message with `_id: undefined`
  // → broken FlatList keys → sent message flickered out until re-entering the chat.
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  replyToId: string | null;
  replyToText: string | null;
  replyToSender: string | null;
  forwardFrom: string | null;
  pinned: boolean;
  createdAt: Date;
}

// Yangi xabar yaratishda ixtiyoriy reply/forward metama'lumotlari.
export interface SendOptions {
  replyToId?: string | null;
  forwardFrom?: string | null;
}

function toDMMessage(m: Pick<IDirectMessageDocument, 'senderId' | 'receiverId' | 'text' | 'read' | 'replyToId' | 'replyToText' | 'replyToSender' | 'forwardFrom' | 'pinned' | 'createdAt'> & { _id: unknown }): DMMessage {
  return {
    _id: String(m._id),
    senderId: m.senderId,
    receiverId: m.receiverId,
    text: decryptText(m.text),
    read: m.read,
    replyToId: m.replyToId ?? null,
    replyToText: m.replyToText ? decryptText(m.replyToText) : null,
    replyToSender: m.replyToSender ?? null,
    forwardFrom: m.forwardFrom ?? null,
    pinned: m.pinned ?? false,
    createdAt: m.createdAt,
  };
}

export interface Conversation {
  peerId: string;
  peerUsername: string;
  peerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
}

export class DMService {
  async getHistory(myId: string, peerId: string, before?: string): Promise<DMMessage[]> {
    const peer = await User.findById(peerId).lean();
    if (!peer) throw new NotFoundError('User not found');

    const query: Record<string, unknown> = {
      $or: [
        { senderId: myId, receiverId: peerId },
        { senderId: peerId, receiverId: myId },
      ],
    };

    if (before && Types.ObjectId.isValid(before)) {
      const cursor = await DirectMessage.findById(before).lean();
      if (cursor) {
        query['createdAt'] = { $lt: cursor.createdAt };
      }
    }

    const msgs = await DirectMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .lean();

    return msgs.reverse().map((m) => toDMMessage(m));
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
    opts: SendOptions = {},
  ): Promise<DMMessage> {
    if (senderId === receiverId) throw new BadRequestError('Cannot message yourself');

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId).select('username mutedPeerIds').lean(),
      User.findById(senderId).select('username').lean(),
    ]);
    if (!receiver) throw new NotFoundError('User not found');

    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestError('Message cannot be empty');
    if (trimmed.length > 2000) throw new BadRequestError('Message too long');

    // Reply snapshot — javob berilayotgan xabarni yuklab, qisqa matnini snapshot qilamiz.
    let replyToId: string | null = null;
    let replyToText: string | null = null;
    let replyToSender: string | null = null;
    if (opts.replyToId && Types.ObjectId.isValid(opts.replyToId)) {
      const orig = await DirectMessage.findById(opts.replyToId).lean();
      // Faqat shu ikki foydalanuvchi orasidagi xabarga javob berish mumkin.
      if (orig && (
        (orig.senderId === senderId && orig.receiverId === receiverId) ||
        (orig.senderId === receiverId && orig.receiverId === senderId)
      )) {
        replyToId = String(orig._id);
        const origSenderName = orig.senderId === senderId
          ? (sender?.username ?? '')
          : receiver.username;
        replyToSender = origSenderName;
        // replyToText shifrlanган holda saqlanadi (asosiy text kabi at-rest encryption).
        replyToText = encryptText(decryptText(orig.text).slice(0, REPLY_SNIPPET_MAX));
      }
    }

    const forwardFrom = opts.forwardFrom?.trim() ? opts.forwardFrom.trim().slice(0, 80) : null;

    // Encrypt at rest; the returned object keeps the plaintext for live delivery.
    const msg = await DirectMessage.create({
      senderId,
      receiverId,
      text: encryptText(trimmed),
      replyToId,
      replyToText,
      replyToSender,
      forwardFrom,
    });

    // Telefonga push — qabul qiluvchi offline bo'lsa ham xabar keladi (Telegram uslubi).
    // Muted bo'lsa — push yubormaymiz, lekin xabarning o'zi baribir yetib boradi
    // (socket orqali, agar chat ochiq bo'lsa) va unread hisoblagichga qo'shiladi.
    const isMuted = (receiver.mutedPeerIds ?? []).includes(senderId);
    if (!isMuted) {
      // Shu jo'natuvchidan hali o'qilmagan xabarlarni yig'amiz — agar bir nechta
      // ketma-ket xabar o'qilmagan bo'lsa, ularning hammasi bitta notification'da
      // ko'rsatiladi (Telegram uslubi), alohida-alohida push'lar o'rniga.
      const unread = await DirectMessage.find({ senderId, receiverId, read: false })
        .sort({ createdAt: 1 })
        .select('text forwardFrom')
        .lean();
      const unreadTexts = unread.map((m) => {
        const t = decryptText(m.text);
        return m.forwardFrom ? `↪ ${t}` : t;
      });
      const body = unreadTexts.length > 1
        ? unreadTexts.slice(-UNREAD_PUSH_PREVIEW_LIMIT).join('\n')
        : (forwardFrom ? `↪ ${trimmed}` : trimmed);
      // `tag' — expo-notifications FCM data'dan shu qiymatni notification identifikatori
      // sifatida ishlatadi (Android: notify(tag, id, ...)) — bir xil tag bilan kelgan
      // keyingi push avvalgi tray yozuvini ALMASHTIRADI, yangi qator qo'shmaydi.
      void sendInternalNotification({
        userId: receiverId,
        type: 'dm_message',
        title: unreadTexts.length > 1 ? `${sender?.username ?? 'Yangi xabar'} (${unreadTexts.length})` : (sender?.username ?? 'Yangi xabar'),
        body,
        data: {
          peerId: senderId,
          peerName: sender?.username ?? '',
          screen: 'DMChat',
          categoryId: 'dm_reply',
          tag: `dm_${senderId}`,
        },
      });
    }

    return toDMMessage(msg);
  }

  // Boshqa suhbatdan xabarni forward qilish. Original muallif allowForward'ni
  // o'chirgan bo'lsa — 403 (o'z xabarини forward qilish har doim mumkin).
  async forwardMessage(senderId: string, receiverId: string, messageId: string): Promise<DMMessage> {
    if (!Types.ObjectId.isValid(messageId)) throw new BadRequestError('Invalid message id');

    const source = await DirectMessage.findById(messageId).lean();
    if (!source) throw new NotFoundError('Message not found');

    // Faqat o'zi ishtirok etgan suhbatdagi xabarni forward qila oladi.
    if (source.senderId !== senderId && source.receiverId !== senderId) {
      throw new ForbiddenError('Cannot forward this message');
    }

    // Original muallif — forward qilinayotgan xabarni kim yozgan.
    const originalAuthorId = source.senderId;
    const originalAuthor = await User.findById(originalAuthorId).select('username settings').lean();

    // Privacy: original muallif (o'zim emas) forward'ni taqiqlagan bo'lsa — bloklash.
    if (
      originalAuthorId !== senderId &&
      originalAuthor?.settings?.privacy?.allowForward === false
    ) {
      throw new ForbiddenError('Original sender does not allow forwarding');
    }

    const forwardName = source.forwardFrom ?? originalAuthor?.username ?? 'Foydalanuvchi';
    return this.sendMessage(senderId, receiverId, decryptText(source.text), { forwardFrom: forwardName });
  }

  async markRead(myId: string, peerId: string): Promise<void> {
    await DirectMessage.updateMany(
      { senderId: peerId, receiverId: myId, read: false },
      { $set: { read: true } },
    );
  }

  // View-based read receipt: only messages up to (and including) the one the reader
  // actually scrolled to are marked read — not the whole conversation on open.
  // Returns the read-up-to timestamp so the caller can emit a realtime tick update
  // to the sender, or null if nothing changed (already read / no matching messages).
  async markReadUpTo(myId: string, peerId: string, messageId: string): Promise<Date | null> {
    if (!Types.ObjectId.isValid(messageId)) throw new BadRequestError('Invalid message id');
    const cursor = await DirectMessage.findById(messageId).lean();
    if (!cursor) throw new NotFoundError('Message not found');

    const belongs = (cursor.senderId === peerId && cursor.receiverId === myId) ||
      (cursor.senderId === myId && cursor.receiverId === peerId);
    if (!belongs) throw new ForbiddenError('Message does not belong to this conversation');

    const result = await DirectMessage.updateMany(
      { senderId: peerId, receiverId: myId, read: false, createdAt: { $lte: cursor.createdAt } },
      { $set: { read: true } },
    );
    return result.modifiedCount > 0 ? cursor.createdAt : null;
  }

  async toggleMute(myId: string, peerId: string, muted: boolean): Promise<void> {
    await User.updateOne(
      { _id: myId },
      muted ? { $addToSet: { mutedPeerIds: peerId } } : { $pull: { mutedPeerIds: peerId } },
    );
  }

  async togglePinConversation(myId: string, peerId: string, pinned: boolean): Promise<void> {
    if (pinned) {
      const me = await User.findById(myId).select('pinnedPeerIds').lean();
      const current = me?.pinnedPeerIds ?? [];
      if (!current.includes(peerId) && current.length >= MAX_PINNED_CONVERSATIONS) {
        throw new BadRequestError(`Cannot pin more than ${MAX_PINNED_CONVERSATIONS} conversations`);
      }
      await User.updateOne({ _id: myId }, { $addToSet: { pinnedPeerIds: peerId } });
    } else {
      await User.updateOne({ _id: myId }, { $pull: { pinnedPeerIds: peerId } });
    }
  }

  // Pin state is shared between both participants (Telegram DM behavior) — either
  // side can pin/unpin, and both see the result.
  async togglePinMessage(myId: string, peerId: string, messageId: string, pinned: boolean): Promise<DMMessage> {
    if (!Types.ObjectId.isValid(messageId)) throw new BadRequestError('Invalid message id');
    const msg = await DirectMessage.findById(messageId);
    if (!msg) throw new NotFoundError('Message not found');

    const belongs = (msg.senderId === myId && msg.receiverId === peerId) ||
      (msg.senderId === peerId && msg.receiverId === myId);
    if (!belongs) throw new ForbiddenError('Message does not belong to this conversation');

    msg.pinned = pinned;
    await msg.save();
    return toDMMessage(msg);
  }

  async getPinnedMessages(myId: string, peerId: string): Promise<DMMessage[]> {
    const msgs = await DirectMessage.find({
      $or: [
        { senderId: myId, receiverId: peerId },
        { senderId: peerId, receiverId: myId },
      ],
      pinned: true,
    }).sort({ createdAt: 1 }).lean();
    return msgs.map((m) => toDMMessage(m));
  }

  async getConversations(myId: string): Promise<Conversation[]> {
    // Aggregate: последнее сообщение для каждого собеседника
    const rows = await DirectMessage.aggregate([
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', myId] }, '$receiverId', '$senderId'],
          },
          lastMessage: { $first: '$text' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', myId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 50 },
    ]);

    const peerIds = rows.map((r) => r._id);
    const [peers, me] = await Promise.all([
      User.find({ _id: { $in: peerIds } }).select('_id username avatar').lean(),
      User.findById(myId).select('mutedPeerIds pinnedPeerIds').lean(),
    ]);

    const peerMap = new Map(peers.map((p) => [String(p._id), p]));
    const mutedSet = new Set(me?.mutedPeerIds ?? []);
    const pinnedOrder = me?.pinnedPeerIds ?? [];

    const conversations: Conversation[] = rows
      .filter((r) => peerMap.has(r._id))
      .map((r) => {
        const peer = peerMap.get(r._id)!;
        return {
          peerId: String(peer._id),
          peerUsername: peer.username,
          peerAvatar: peer.avatar ?? null,
          lastMessage: decryptText(r.lastMessage),
          lastMessageAt: r.lastMessageAt,
          unreadCount: r.unreadCount,
          isMuted: mutedSet.has(String(peer._id)),
          isPinned: pinnedOrder.includes(String(peer._id)),
        };
      });

    // Pinned conversations float to the top, in the order they were pinned
    // (matches pinnedPeerIds array order); everything else keeps its
    // most-recent-first order from the aggregation above.
    return conversations.sort((a, b) => {
      const aPin = pinnedOrder.indexOf(a.peerId);
      const bPin = pinnedOrder.indexOf(b.peerId);
      if (aPin !== -1 && bPin !== -1) return aPin - bPin;
      if (aPin !== -1) return -1;
      if (bPin !== -1) return 1;
      return 0; // stable sort preserves the incoming most-recent-first order
    });
  }
}
