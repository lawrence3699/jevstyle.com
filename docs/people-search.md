# People Search

The application at `/tools/people-search/` shares the existing JevStyle account session. React/TypeScript source lives in `frontend/people`; `npm ci --prefix frontend/people && npm run build --prefix frontend/people` writes the static application. GitHub Pages builds it before publishing. The private FastAPI backend is deployed separately; it is not in this public repository.

## Available workflows

- Research-topic discovery through OpenAlex. Results keep author-specific publication affiliations; institution country is not residence. Anonymous discovery can be rate limited. A free OpenAlex API key can be configured by the owner.
- Named-person discovery through Wikidata, retaining only human entities. Similar names are not assumed to be the same person.
- Private CSV import with explicit column mapping, up to 100 rows / 500 KB. Free tasks process at most 50 people.
- Connected HTTPS team pages containing Person JSON-LD. Exact approved hostnames are configured by the owner; the reader respects robots rules, validates and pins public IP addresses and does not follow redirects. No sites are implicitly approved.
- JevStyle 2B v4 criterion judgments, with match / mismatch / unknown and original evidence. The output is a screening aid, not a verified fact or employment decision.
- Optional business search through Icypeas and selected work-email lookup through Tomba plus LeadMagic, via Treg. Paid operations require a user-confirmed quote and prepaid balance. They remain unavailable until connected and enabled.

Free and paid tasks use separate source policies. No free task may fall back to a paid provider. Public results and imported lists are never populated with invented candidates. Data-source errors are distinct from an empty result. Private tasks are retained for up to 30 days, temporary imports for one day; users can delete searches earlier. See `/privacy/`.

## Owner configuration

An existing owner account sees **Connections** in People Search. Credentials are entered through that authenticated UI and encrypted on the private server. No credential is returned by configuration GET responses, saved in browser storage, or included in this repository.

Configure a free OpenAlex API key, a Treg team token, and the existing Stripe account's secret key and webhook signing secret. Start Stripe in test mode. Webhook URL:

`https://api.jevstyle.com/control/v1/people/billing/webhook`

Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`.

Do not enable paid sources or checkout until contract calls and Stripe test payments have been verified. The pilot pricing is supplier-cost pass-through, no service markup; the quote reserves an upper limit and returns unused credit after settlement. Missing supplier receipts retain the reservation for reconciliation. A refund or dispute pauses the affected wallet for owner review, including when events arrive before the paid-checkout notification.

## Validation scope

The initial build has database-backed tests for quota atomicity, duplicate requests, user isolation, free/paid source boundaries, budget reservation and settlement, missing receipt recovery, source response contracts, CSV escaping, model uncertainty, URL restrictions, signed payment deduplication and HTTP authorization. Browser QA includes Wikidata with real JevStyle inference and a synthetic three-person CSV spanning match, mismatch and insufficient evidence. These are functional checks, not a measured search-quality benchmark. Paid-provider coverage and real Stripe payments require account configuration before verification.
