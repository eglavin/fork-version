/**
 * Environment option to disable brittle tests that may rely on timing, such as those that check commit order.
 *
 * To enable, set the environment variable `e2e` to "true" when running tests.
 *
 * @example
 * ```bash
 * e2e=true pnpm test
 * ```
 *
 * @example
 * ```pwsh
 * $env:e2e="true"; pnpm test
 * ```
 */
export const IS_E2E = process.env.e2e === "true";
