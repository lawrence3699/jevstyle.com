# People Search

The application at `/tools/people-search/` shares the existing JevStyle account session. React/TypeScript source lives in `frontend/people`; `npm ci --prefix frontend/people && npm run build --prefix frontend/people` writes the static application. GitHub Pages builds it before publishing. The private FastAPI backend is deployed separately; it is not in this public repository.

## What it does (v3, November 2026)

Three entries, in this order:

- **Screen my list** (main entry). Upload a CSV of people (up to 500 rows, 500 KB; a name column plus any description, role or institution columns) and write criteria, one per line. JevStyle judges every person from the text in the file only: match / mismatch / unknown per criterion, with the evidence shown. Nothing is looked up elsewhere. Imports are private to the account and kept 30 days.
- **Find researchers.** By topic (OpenAlex works search, then one batch author lookup that adds the latest recorded institution, affiliation history, topics, publication and citation counts, h-index and ORCID) or by name (Wikidata plus the OpenAlex author index, joined only on a shared ORCID). A "PhD supervisor" focus puts people first who published on the topic recently and whose latest recorded institution is a university or research institute; "collaborator" drops the institution requirement. These facts come from the record itself, not from the model. Written criteria are optional and are judged by JevStyle from titles, abstract excerpts and the record facts.
- **Check one profile.** Paste a CV excerpt, bio or homepage text and criteria; one judgment per criterion.

Per-person links: source record, ORCID, OpenAlex, a Google Scholar search and a web search. An ORCID homepage / public email / current employment line is fetched only when the user asks for it on one profile.

Not available: connected team websites (no approved hosts) and paid business data (Icypeas / Tomba / LeadMagic via Treg, Stripe credit). The interface only shows those entries when the backend reports them as available.

## Limits and sources

- Free: 10 searches per account per UTC day; open-data searches return at most 50 people; a list screen handles up to 500 people; runs are kept 30 days and can be deleted earlier.
- OpenAlex: anonymous keyword searches share a site-wide daily allowance (60; 700 with the owner's free API key, set under *Service connections*). Author batch reads are cheaper and have their own allowance. Europe PMC publication types are cross-checked for biomedical DOIs. Wikidata and ORCID public APIs are read without credentials.
- Source errors are distinct from empty results, no free task may fall back to a paid provider, and no candidate is ever invented. If one name source fails the other still answers and the failure is shown as a warning.

## Usage counter

The page posts one `view` event to `/control/v1/people/visits` on load. The backend stores daily totals (views, signed-in views, searches by kind, completed runs, people screened) and, for distinct-visitor counts, a hash of address plus user agent salted with a random per-day value that is deleted two days later. No query text, account id or address is stored. The owner sees the numbers under *Usage stats* in the sidebar (`GET /control/v1/people/admin/stats`).

## Owner configuration

An existing owner account sees **Service connections** and **Usage stats** in People Search. Credentials are entered through that authenticated UI and encrypted on the private server. No credential is returned by configuration GET responses, saved in browser storage, or included in this repository.

Configure a free OpenAlex API key, a Treg team token, and the existing Stripe account's secret key and webhook signing secret. Start Stripe in test mode. Webhook URL:

`https://api.jevstyle.com/control/v1/people/billing/webhook`

Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`.

Do not enable paid sources or checkout until contract calls and Stripe test payments have been verified. The pilot pricing is supplier-cost pass-through, no service markup; the quote reserves an upper limit and returns unused credit after settlement. Missing supplier receipts retain the reservation for reconciliation. A refund or dispute pauses the affected wallet for owner review, including when events arrive before the paid-checkout notification.

## Validation scope

Backend: 55 database-backed tests (quota atomicity, duplicate requests, user isolation, free/paid source boundaries, budget reservation and settlement, missing receipt recovery, source response contracts, CSV escaping, model uncertainty, URL restrictions, signed payment deduplication, HTTP authorization; v3 adds list and pasted-profile rules, author hydration and ORCID-only joins, structured source facts, Chinese name routing, the worker pool and the usage counters). Frontend: 15 presentation tests. These are functional checks, not a measured search-quality benchmark.
