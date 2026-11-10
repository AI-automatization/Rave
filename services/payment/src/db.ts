import { getServiceConnection } from '@shared/utils/serviceConnection';

// Standalone: the default mongoose connection (unchanged behaviour).
// Embedded in `core`: a dedicated connection to this service's own database.
export const dbConnection = getServiceConnection('payment');
