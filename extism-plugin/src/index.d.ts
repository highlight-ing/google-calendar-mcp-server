declare module "main" {
  export type I32 = number;
  export function list_events(): I32;
  export function create_event(): I32;
  export function update_event(): I32;
  export function delete_event(): I32;
} 