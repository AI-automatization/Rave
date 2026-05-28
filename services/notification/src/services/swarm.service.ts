import { logger } from '@shared/utils/logger';
import knowledgeData from '../data/knowledge.json';

const BOT_NAME = 'WeWatch Bot';
const GROUP_CHAT_ID = parseInt(process.env.SWARM_GROUP_CHAT_ID ?? '-1003874059304', 10);
const CONFIDENCE_THRESHOLD = 0.5;
const COOLDOWN_MS = 30_000;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60_000;

interface KnowledgeEntry {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  source: string;
  confidence: number;
}

interface SwarmMessage {
  messageId: number;
  chatId: number;
  fromId: number;
  isBot: boolean;
  text: string;
}

const knowledge: KnowledgeEntry[] = knowledgeData as KnowledgeEntry[];

// In-memory rate limiting state
let lastReplyTime = 0;
const repliedMessageIds = new Set<number>();
const sentTimestamps: number[] = [];

function isGroupMessage(chatId: number): boolean {
  return chatId === GROUP_CHAT_ID;
}

function hasSwarmTag(text: string): boolean {
  return /#(question|savol|skill|pattern|solved|answer)/i.test(text);
}

function isQuestion(text: string): boolean {
  return /#question/i.test(text) || (/#savol/i.test(text)) || text.includes('?');
}

function isSkillShare(text: string): boolean {
  return /#(skill|pattern)/i.test(text);
}

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps outside window
  while (sentTimestamps.length > 0 && now - sentTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    sentTimestamps.shift();
  }
  return sentTimestamps.length < RATE_LIMIT_MAX && now - lastReplyTime >= COOLDOWN_MS;
}

function recordSent(): void {
  const now = Date.now();
  lastReplyTime = now;
  sentTimestamps.push(now);
}

function searchKnowledge(text: string): { answer: string; source: string; confidence: number } | null {
  const lower = text.toLowerCase();
  let best: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledge) {
    const matches = entry.keywords.filter(k => lower.includes(k.toLowerCase()));
    if (matches.length === 0) continue;

    const score = (matches.length / entry.keywords.length) * entry.confidence;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore < CONFIDENCE_THRESHOLD) return null;

  return { answer: best.answer, source: best.source, confidence: bestScore };
}

export function isSwarmMessage(msg: SwarmMessage): boolean {
  return isGroupMessage(msg.chatId) && hasSwarmTag(msg.text);
}

export async function handleSwarmMessage(
  msg: SwarmMessage,
  sendReply: (chatId: number, text: string, replyToId: number) => Promise<void>,
): Promise<void> {
  if (!hasSwarmTag(msg.text)) return;
  if (repliedMessageIds.has(msg.messageId)) return;

  if (isQuestion(msg.text)) {
    if (!checkRateLimit()) {
      logger.debug('Swarm: rate limit / cooldown active, skipping', { messageId: msg.messageId });
      return;
    }

    const result = searchKnowledge(msg.text);
    if (!result) {
      logger.debug('Swarm: no confident answer found', { messageId: msg.messageId });
      return;
    }

    const reply = `[${BOT_NAME}]\n\n${result.answer}\n\nManba: ${result.source}\n\n#answer`;
    await sendReply(msg.chatId, reply, msg.messageId);
    repliedMessageIds.add(msg.messageId);
    recordSent();

    logger.info('Swarm: answered question', { messageId: msg.messageId, confidence: result.confidence });
    return;
  }

  if (isSkillShare(msg.text)) {
    // Log skill shares for future knowledge extraction
    logger.info('Swarm: skill/pattern received', {
      from: msg.fromId,
      preview: msg.text.slice(0, 100),
    });
  }
}
