// WeWatch — YouTube Innertube API client
// Used as fallback when YouTube IFrame embed is blocked (error 101/150).
// ANDROID client returns stream URLs locked to the requesting device's IP — playable locally.

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player';
const ANDROID_YT_VERSION = '19.09.37';
const ANDROID_SDK = 34;

interface InnertubeFormat {
  itag: number;
  url?: string;
  mimeType: string;
  bitrate: number;
  width?: number;
  height?: number;
  quality: string;
  qualityLabel?: string;
  audioQuality?: string;
}

interface InnertubeResponse {
  streamingData?: {
    formats?: InnertubeFormat[];
    adaptiveFormats?: InnertubeFormat[];
    expiresInSeconds?: string;
  };
  videoDetails?: {
    title?: string;
    thumbnail?: { thumbnails?: { url: string; width: number; height: number }[] };
  };
  playabilityStatus?: {
    status: string;
    reason?: string;
  };
}

export interface YoutubeStreamResult {
  videoUrl: string;
  type: 'mp4' | 'hls';
  title: string;
  poster: string;
}

/** Pick best progressive MP4 from formats list (prefers 720p > 480p > 360p) */
function pickBestMp4(formats: InnertubeFormat[]): InnertubeFormat | null {
  const progressive = formats.filter(
    f => f.url && f.mimeType.startsWith('video/mp4') && f.qualityLabel,
  );
  if (!progressive.length) return null;
  const order = ['720p', '480p', '1080p', '360p', '240p'];
  for (const q of order) {
    const match = progressive.find(f => f.qualityLabel === q);
    if (match) return match;
  }
  return progressive[0] ?? null;
}

export async function extractYouTubeStream(videoId: string): Promise<YoutubeStreamResult | null> {
  try {
    const body = {
      videoId,
      context: {
        client: {
          hl: 'en',
          gl: 'US',
          clientName: 'ANDROID',
          clientVersion: ANDROID_YT_VERSION,
          androidSdkVersion: ANDROID_SDK,
          userAgent: `com.google.android.youtube/${ANDROID_YT_VERSION}(Linux; U; Android 14) gzip`,
          timeZone: 'UTC',
          utcOffsetMinutes: 0,
        },
      },
    };

    const res = await fetch(INNERTUBE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `com.google.android.youtube/${ANDROID_YT_VERSION}(Linux; U; Android 14) gzip`,
        'X-YouTube-Client-Name': '3',
        'X-YouTube-Client-Version': ANDROID_YT_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as InnertubeResponse;

    if (data.playabilityStatus?.status === 'ERROR') return null;

    const formats = [
      ...(data.streamingData?.formats ?? []),
      ...(data.streamingData?.adaptiveFormats ?? []),
    ];

    const best = pickBestMp4(formats);
    if (!best?.url) return null;

    const thumbnails = data.videoDetails?.thumbnail?.thumbnails ?? [];
    const poster = thumbnails[thumbnails.length - 1]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoUrl: best.url,
      type: 'mp4',
      title: data.videoDetails?.title ?? '',
      poster,
    };
  } catch {
    return null;
  }
}
