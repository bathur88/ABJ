// Small typed client for the Booking API. The Pact contract test exercises this
// exact code, so the contract reflects what the consumer really sends and reads.

export type BookingDates = {
  checkin: string;
  checkout: string;
};

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
};

export interface CreatedBooking {
  bookingid: number;
  booking: Booking;
}

export class BookingClient {
  constructor(private readonly baseUrl: string) {}

  async getBooking(id: number): Promise<Booking> {
    const res = await fetch(`${this.baseUrl}/booking/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`GET /booking/${id} failed with ${res.status}`);
    return (await res.json()) as Booking;
  }

  async createBooking(booking: Booking): Promise<CreatedBooking> {
    const res = await fetch(`${this.baseUrl}/booking`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!res.ok) throw new Error(`POST /booking failed with ${res.status}`);
    return (await res.json()) as CreatedBooking;
  }
}
