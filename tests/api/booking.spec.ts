import { test, expect, type APIRequestContext } from '@playwright/test';
import { newBooking } from '../../src/data/bookings';

// Restful-Booker publishes these demo admin credentials in its public docs.
const ADMIN = {
  username: process.env.BOOKER_USER ?? 'admin',
  password: process.env.BOOKER_PASSWORD ?? 'password123',
};

async function authToken(request: APIRequestContext): Promise<string> {
  const res = await request.post('/auth', { data: ADMIN });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  expect(token, 'auth token').toBeTruthy();
  return token;
}

test.describe('Booking API', { tag: '@api' }, () => {
  test('health check responds', async ({ request }) => {
    const res = await request.get('/ping');
    expect(res.status()).toBe(201);
  });

  test('lists booking ids', async ({ request }) => {
    const res = await request.get('/booking');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty('bookingid');
  });

  test('create, read, update and delete a booking', async ({ request }) => {
    const booking = newBooking();

    // Create
    const created = await request.post('/booking', { data: booking });
    expect(created.status()).toBe(200);
    const { bookingid, booking: saved } = await created.json();
    expect(typeof bookingid).toBe('number');
    expect(saved).toMatchObject(booking);

    // Read
    const fetched = await request.get(`/booking/${bookingid}`);
    expect(fetched.status()).toBe(200);
    expect(await fetched.json()).toMatchObject(booking);

    // Update (needs auth)
    const token = await authToken(request);
    const updated = await request.patch(`/booking/${bookingid}`, {
      headers: { Cookie: `token=${token}` },
      data: { firstname: 'Grace', totalprice: 300 },
    });
    expect(updated.status()).toBe(200);
    expect(await updated.json()).toMatchObject({ firstname: 'Grace', totalprice: 300 });

    // Delete
    const deleted = await request.delete(`/booking/${bookingid}`, {
      headers: { Cookie: `token=${token}` },
    });
    expect(deleted.status()).toBe(201);
    expect((await request.get(`/booking/${bookingid}`)).status()).toBe(404);
  });

  test('update without a token is forbidden', async ({ request }) => {
    const res = await request.patch('/booking/1', { data: { firstname: 'Nope' } });
    expect(res.status()).toBe(403);
  });
});
