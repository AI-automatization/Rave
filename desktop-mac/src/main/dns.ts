import { app } from 'electron';
import { DOH_MODE, DOH_URL } from './config';

// Provider DNS blocks some sites (the product's users are mostly behind such providers); DNS-over-HTTPS
// resolves them. Applies to the whole app, as in the Windows build.
//
// Deliberate difference from the Windows build: mode 'automatic' (DoH first, system DNS as fallback)
// instead of 'secure' (DoH only). With 'secure', a network that blocks the DoH server leaves the whole
// app unable to resolve even app.wewatch.uz; with 'automatic' it degrades to the pre-DoH behaviour.
// Switches must be added BEFORE the app is ready (see index.ts); this one is called from `ready`.
export function configureDns(): void {
  app.configureHostResolver({ secureDnsMode: DOH_MODE, secureDnsServers: [DOH_URL] });
}

/**
 * With our DoH, Chromium also reads the HTTPS/SVCB records of Cloudflare-fronted hosts (alpn=h3,h2 + ECH)
 * and changes how it connects. In the Windows build the room websocket to stream.wewatch.uz then died with
 * ERR_CONNECTION_RESET while the same app on system DNS connected (checked 2026-11-02). Ignoring those
 * records keeps the DoH filter. NOT yet verified on macOS — kept because it is harmless.
 */
export function addDnsSwitches(): void {
  app.commandLine.appendSwitch('disable-features', 'UseDnsHttpsSvcbAlpn,UseDnsHttpsSvcb');
}
