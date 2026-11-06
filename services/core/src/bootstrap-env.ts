// MUST be the first import of server.ts: it runs before any service module is loaded.
//
// CORE_EMBEDDED=1 makes admin/payment bind their models to dedicated mongoose connections
// (see shared/src/utils/serviceConnection.ts). Without it they would all land on the default
// connection (auth/user/notification database) and write to the wrong database.
process.env.CORE_EMBEDDED = '1';

// Log label (shared logger reads SERVICE_NAME at import time).
if (!process.env.SERVICE_NAME) process.env.SERVICE_NAME = 'core';
