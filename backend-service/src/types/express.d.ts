import 'express';

declare module 'express' {
  interface Locals {
    correlation?: string;
    user_id?: string;
  }

  export interface Response {
    locals: Locals;
  }
}
