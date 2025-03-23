import { NodeLogger } from '@unconventional-code/observability-sdk';

import { main } from './app';

const log = new NodeLogger({ name: 'app' });

main().catch((err) => {
  log.error(err);
  // Allow time for logs to flush
  setTimeout(() => {
    process.exit(1);
  }, 5000);
});
