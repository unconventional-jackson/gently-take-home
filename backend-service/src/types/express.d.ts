import 'express';

import { UserId } from '@unconventional-jackson/gently-database-service';

declare module 'express' {
  interface Locals {
    correlation?: string;
    user_id?: UserId | null;
  }

  export interface Response {
    locals: Locals;
  }
}
