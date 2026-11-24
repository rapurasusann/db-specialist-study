# CS-03 isolated deployment approval — limited initial creation

2026-11-24/25 JST conversation: operator explicitly stated 「はい、承認します」 in response to the proposed creation of one Worker and one SQLite Durable Object class in Certification-Study only, Free plan maintained, public and preview URLs disabled, no production or other app changes.

Approved scope: initial dark deployment of browser JWT candidate `cs03-browser-isolated-candidate-not-approved`, based on tested commit `2da665d6ff0d8e5fe701245e2938ed4d1acb5ca5`, configuration `docs/cs03-browser-worker-config-review-only.json.example`. Dedicated account ID `9829f590b4afea346993621ca3a0c13f`. No routes, no workers.dev, no preview URLs, no mode flag, no secrets or upstream bindings. SQLite DO class migration only; instances need not exist until used. No paid plan or payment changes.

Evidence: earlier local suite 205/205 on 84ed853; changed guard/config tests 10/10 on 2da665d. Operator confirmed Cloudflare Free; Neon organization API returned free. Live ingress, actual cost/usage and end-to-end safety remain unverified. The existing deployment guard remains BLOCKED for live operation; this record does not override it. Initial resource creation is limited to a dark, disabled candidate and requires exact account, config, and absent-name verification. No existing Worker overwrite.

Excluded: any public or preview URL, Access policy changes, secret registration, Neon redeployment, DB changes, actual user traffic, production/main, GitHub Actions, deletion, billing changes. Separate approval required. Stop on unexpected state. Verify deployment and disabled routes before proceeding. No claim of successful cloud creation until operator output confirms it.
