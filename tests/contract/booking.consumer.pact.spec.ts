import path from 'node:path';
import { test, expect } from '@playwright/test';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { BookingClient } from '../../src/clients/BookingClient';

const { like, integer, string, boolean, regex } = MatchersV3;

// Consumer: this test suite's BookingClient. Provider: the Booking API.
// Running this produces pacts/BookingWebClient-BookingAPI.json, which the
// provider team verifies on their side (or via a Pact Broker).
const provider = new PactV3({
  consumer: 'BookingWebClient',
  provider: 'BookingAPI',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

const isoDate = (example: string) => regex(/^\d{4}-\d{2}-\d{2}$/, example);

test.describe('Booking API contract', { tag: '@contract' }, () => {
  test('GET /booking/:id returns a booking', async () => {
    provider
      .given('a booking with id 1 exists')
      .uponReceiving('a request for booking 1')
      .withRequest({
        method: 'GET',
        path: '/booking/1',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': regex(/application\/json/, 'application/json; charset=utf-8') },
        body: {
          firstname: string('Ada'),
          lastname: string('Lovelace'),
          totalprice: integer(250),
          depositpaid: boolean(true),
          bookingdates: {
            checkin: isoDate('2026-12-01'),
            checkout: isoDate('2026-12-05'),
          },
          additionalneeds: like('Breakfast'),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new BookingClient(mockServer.url);
      const booking = await client.getBooking(1);

      expect(booking.firstname).toBe('Ada');
      expect(booking.totalprice).toBe(250);
      expect(booking.bookingdates.checkin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
