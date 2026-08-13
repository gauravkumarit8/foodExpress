import { ValueTransformer } from 'typeorm';

/**
 * Postgres numeric/decimal columns come back from the `pg` driver as
 * strings (deliberately, to avoid silent precision loss) — correct driver
 * behavior, but a foot-gun for any consumer (including a frontend) expecting
 * `order.subtotal` to actually be a number. This converts on the way out.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number) => value,
  from: (value?: string) => (value === null || value === undefined ? value : parseFloat(value)),
};
