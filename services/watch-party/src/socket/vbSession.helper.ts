// WeWatch — shared VB session start/switch logic, used by both:
//   - vbEvents.handler.ts (owner manually clicks "Виртуальный браузер")
//   - roomEvents.handler.ts (CHANGE_MEDIA auto-falls back to VB when content-service's
//     extraction pipeline can't produce a playable result for a submitted URL)
// Same lifecycle either way: start the session, broadcast frames, and switch the room over to
// whatever media the live network/capture sniffer eventually catches.
import { Server as SocketServer } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { VideoPlatform } from '@shared/types';
import { watchPartyServiceUrl } from '@shared/utils/serviceConfig';
import { VB_VIEWPORT, startSession, stopSession, pauseScreencast } from '../services/virtualBrowser.service';

// Some CDNs 403 anything not coming from the IP that first requested the URL (same class of
// protection already seen on VK/Rutube). VB's Playwright browser ran inside THIS service's
// container, so re-fetching through vbMediaProxy (also this service) keeps playback on the same
// egress IP the CDN saw — handing app-web's proxy-stream the raw CDN URL directly would fetch
// from a different Railway service/IP and 403 on CDNs that check this.
function proxiedMediaUrl(mediaUrl: string, mediaType: 'mp4' | 'hls'): string {
  const ext = mediaType === 'hls' ? 'm3u8' : 'mp4';
  return `${watchPartyServiceUrl}/api/v1/watch-party/vb-media-proxy/stream.${ext}?url=${encodeURIComponent(mediaUrl)}`;
}

export async function startVBForRoom(
  io: SocketServer,
  watchPartyService: WatchPartyService,
  roomId: string,
  ownerId: string,
  url: string,
): Promise<void> {
  await startSession(roomId, ownerId, url, (base64Jpeg) => {
    // volatile: a lagging viewer jumps to the latest frame instead of draining a backlog.
    io.to(roomId).volatile.emit(SERVER_EVENTS.VB_FRAME, { data: base64Jpeg });
  }, (mediaUrl, mediaType, kind) => {
    void (async () => {
      // 'url' (categories A) — independently fetchable, close the VB browser.
      // 'capture' (categories B/C) — mediaUrl is our own vb-capture endpoint, only fed by this
      // browser continuing to play the source — must stay alive, just stop the JPEG screencast.
      if (kind === 'url') {
        await stopSession(roomId);
      } else {
        await pauseScreencast(roomId);
      }
      // 'capture' mediaUrl already points at our own vb-capture endpoint — only 'url' (a raw,
      // independently-fetchable CDN URL) needs the same-IP proxy wrapper.
      const roomVideoUrl = kind === 'url' ? proxiedMediaUrl(mediaUrl, mediaType) : mediaUrl;
      try {
        const updated = await watchPartyService.updateRoomMedia(ownerId, roomId, {
          videoUrl: roomVideoUrl,
          videoTitle: null,
          videoPlatform: 'generic' as VideoPlatform,
        });
        io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);
      } catch (e) {
        logger.error('VB: failed to switch room to intercepted media', { roomId, mediaUrl, kind, error: (e as Error).message });
      }
      io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, { reason: 'media_found', url: mediaUrl, mediaType });
      logger.info('VB: switched room to intercepted media', { roomId, mediaUrl, mediaType, kind });
    })();
  });

  io.to(roomId).emit(SERVER_EVENTS.VB_STARTED, { url, width: VB_VIEWPORT.width, height: VB_VIEWPORT.height, ownerId });
}
