/*
 * Temporary placeholder Supabase types to satisfy typecheck in local dev
 * Replace by running `pnpm run typegen` to regenerate from your Supabase schema
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = any;

export type Tables = any;
export type TablesInsert = any;
export type TablesUpdate = any;
