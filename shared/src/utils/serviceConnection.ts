import mongoose, { Connection } from 'mongoose';

/**
 * Mongoose connection a service's models bind to.
 *
 * Standalone service (default): the process-wide default connection, exactly as before
 * (the service calls `mongoose.connect(...)`).
 *
 * Embedded in `core` (CORE_EMBEDDED=1): services whose database differs from the default one
 * (admin -> cinesync_admin, payment -> cinesync_payment) get a dedicated, initially closed
 * connection that `core` opens with `connection.openUri(...)`. Models registered on it buffer
 * until it is open, so they can be declared at import time.
 */
export const isCoreEmbedded = (): boolean => process.env.CORE_EMBEDDED === '1';

const dedicated = new Map<string, Connection>();

export const getServiceConnection = (name: string): Connection => {
  if (!isCoreEmbedded()) return mongoose.connection;
  let conn = dedicated.get(name);
  if (!conn) {
    conn = mongoose.createConnection();
    dedicated.set(name, conn);
  }
  return conn;
};
