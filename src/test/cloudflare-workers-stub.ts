/**
 * Stand-in for the `cloudflare:workers` module, which only exists inside
 * workerd. Vitest aliases the module here. Tests set bindings by mutating `env`.
 */
export const env: Partial<Cloudflare.Env> = {};
