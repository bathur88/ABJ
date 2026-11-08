// Public demo credentials published on https://www.saucedemo.com
export const users = {
  standard: { username: 'standard_user', password: process.env.SAUCE_PASSWORD ?? 'secret_sauce' },
  lockedOut: { username: 'locked_out_user', password: process.env.SAUCE_PASSWORD ?? 'secret_sauce' },
} as const;

export type User = (typeof users)[keyof typeof users];
