// Response shapes of the API. Dates arrive as ISO strings; money as integer paise.
export type EventSummary = {
  id: string;
  name: string;
  venue: string;
  city: string;
  startsAt: string;
  pricePaise: number;
  capacity: number;
  ticketsLeft: number;
};

export type Me = { id: string; name: string; role: "FAN" | "STAFF" };

export type Ticket = {
  id: string;
  code: string;
  checkedInAt: string | null;
  createdAt: string;
  event: { id: string; name: string; venue: string; city: string; startsAt: string };
};

export type CheckedInTicket = Ticket & { holderName: string };
