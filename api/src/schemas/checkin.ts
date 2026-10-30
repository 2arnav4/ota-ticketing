import { z } from "zod";
import { normalizeTicketCode } from "../domain/ticketCode";

// Accepts the code as scanned (raw) or typed (dashes, lowercase); outputs the canonical 12 characters.
// max(64) caps work on junk input before normalising.
export const CheckinBody = z.strictObject({
  code: z
    .string()
    .max(64)
    .transform((value, ctx) => {
      const code = normalizeTicketCode(value);
      if (!code) {
        ctx.addIssue({ code: "custom", message: "Not a valid ticket code" });
        return z.NEVER;
      }
      return code;
    }),
});
