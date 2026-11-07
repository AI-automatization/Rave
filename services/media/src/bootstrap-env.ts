// MUST be the first import of server.ts: it runs before any service module is loaded.
//
// MEDIA_EMBEDDED=1 makes content bind its models to a dedicated mongoose connection
// (see shared/src/utils/serviceConnection.ts); watch-party keeps the default connection.
// Without it content's models would land on watch-party's database.
process.env.MEDIA_EMBEDDED = '1';

// Log label (shared logger reads SERVICE_NAME at import time).
if (!process.env.SERVICE_NAME) process.env.SERVICE_NAME = 'media';
