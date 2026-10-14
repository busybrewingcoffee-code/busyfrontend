# Busy Brewing

One React + TypeScript + Vite app. `/` preserves the coming-soon coffee truck page. `/staff` requires Supabase email/password authentication and an active staff membership.

## Run locally

```sh
npm ci
cp .env.example .env.local
# Fill in Supabase project URL and publishable key (never service-role key).
npm run dev -- --port 5174
npm test
npm run build
```

## Repository and hosting

This branch continues the history of `busybrewingcoffee-code/busyfrontend`. The old app and untracked artwork remain untouched in the original BBC checkout. The integrated working directory is `Developer/busy-brewing-integrated`.

Vercel automatically deploys `main`; feature-branch deployments remain disabled. The two public Supabase environment variables are configured in Vercel. Merge approved, tested changes through a PR. The committed output directory is `dist`; it supersedes the old `dist/public` layout. The `/staff` rewrite supports direct navigation. Unknown paths render a 404 message locally; the host handles other unmatched routes.

## Backend

Applied migrations are in `supabase/migrations`. Project: `mochapot` (`yjmdqgbzrfgapafpijod`).

- `menu_items`: 34 menu entries, integer paise prices, allowed serving options, availability and art identifiers.
- `addons`: six choices including None.
- `orders`: server ticket numbers, payment method recorded by staff, note, timestamps, status/version, submission UUID and original payload for retries.
- `order_items`: immutable name/price/option/add-on snapshots and quantities.
- `order_events`: audit of state changes with actor, before/after status and mutation UUID.
- `staff_members`: approved Auth users. No self-enrolment or client writes.
- `private.staff_emails`: administrator-managed provisioning allowlist. Not readable by staff or anonymous clients. RLS intentionally has no policies (deny all); only the owner-run provisioning trigger reads it.

Staff can read shared data but cannot write tables directly. `create_order` validates options/quantities, calculates totals from the database and atomically creates the order and lines. Retrying the same UUID and payload returns the original ticket. Reusing it with a different payload is rejected.

`move_order` locks the row, checks the expected version and logs the change atomically. Both buttons and drag/drop use it. Drag captures the version at pickup. Any of the four board columns is a valid destination, including moving backwards. Duplicate mutations are idempotent. Conflicts roll back the optimistic UI and refresh; they are not automatically retried over another staff member's action.

The client polls every five seconds while visible and refreshes on reconnect/focus. Requests are serialized for each ticket. Version checks prevent a late read from rolling back an acknowledged change. This is online-first, not a full offline queue. Draft baskets are local to each signed-in browser. Uncertain checkouts are durably saved before sending, and remain locked for retry with the same submission UUID, even after reload. Confirm payment only after verifying cash or UPI receipt; the app does not process or verify payments.

Summary and CSV include all stored event orders, not only today's sales. Orders are fetched in pages so the server row limit does not truncate totals.

## First staff account

The approved first email has been configured privately in the database, not committed here. In Supabase Authentication > Users > Add user > Create new user, enter that email and choose a password, leaving Auto confirm user enabled. A database trigger creates the staff membership automatically for an approved, confirmed account. Do not put passwords in SQL, source code or chat.

To approve a future account, an administrator adds its lowercase email to `private.staff_emails` before creating it. For an already-confirmed existing Auth user, explicitly insert its user ID into `staff_members`. To revoke access, set its membership `active=false`; data reads and mutations check this live.

No public sign-up is provided. Supabase's Auth signup endpoint may still be enabled, but accounts outside the allowlist cannot access app data. Password recovery is not implemented in the UI yet; account administration is through Supabase.

## Verification

`npm test`: four hook tests covering uncertain checkout retry across remount, duplicate submit blocking, stale drag rollback and editing after validation failure.

`tests/database.sql`: transaction-scoped fixtures, rolled back after verification. Covers menu count, authoritative totals, duplicate/reused submission IDs, atomic rollback, quantity/option validation, version conflicts, idempotent mutations, reverse moves, direct-write denial, and anonymous/unapproved access denial. Run via Supabase SQL tooling. Identity sequences may have harmless gaps after rollback.

Manual checks: public landing, login guard, signed-in checkout with Hot Matcha Latte and Fried Veg Momo, status-button move, desktop drag to Ready, cancellation, sales exclusion and restoration. Before event use, verify two devices moving the same ticket, network loss during checkout, reconnect, logout and CSV totals. Production release follows the approved PR merge.

## Cancellation

Cancel order appears among secondary ticket actions and in the order history. A confirmation requires a short reason. Cancelled orders leave the Kanban board, remain in history and CSV, and are excluded from displayed sales totals. The summary separately shows their originally recorded payments; refunds must be handled and reconciled outside this app. Restore to queue reverses an accidental cancellation. Cancellation checks the displayed order version and logs its actor and transition. No bulk deletion UI is exposed.
