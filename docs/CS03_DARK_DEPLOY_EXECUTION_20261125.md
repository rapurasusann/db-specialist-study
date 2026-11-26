# Initial dark deployment execution contract (02:00 JST)

Based on c4efcf2, the read-only preflight and 18 offline tests exist but are unexecuted. The approved scope remains the single dark Worker and SQLite class; no cloud writes in this run.

## Required execution sequence
1. Fetch the approved branch and pin the exact reviewed HEAD. Stop on fetch failure. Use a fresh disposable checkout (not the existing dirty worktree); install locked dependencies with npm ci --ignore-scripts, then run the new preflight tests. Do not copy local .env, .dev.vars, Wrangler state, or credentials into this checkout.
2. Run the read-only preflight using an account-scoped API token supplied in process memory only, never on the command line or in a transcript. The preflight uses explicit allowed paths and exact reviewed blob IDs for the two additional historical documents. Require clean checkout including untracked files outside installed dependencies.
3. Materialize the exact validated JSON config at the repository root (not under docs, because Wrangler resolves main relative to its config file). Use a unique temporary filename and exclusive creation; do not overwrite any existing file. Validate the materialized config again. Do not add vars, routes, account overrides, assets or secrets. Pin Wrangler 4.168.0 and the dedicated account ID. Do not use --env or a different name. Run wrangler deploy --dry-run --config <root temporary config> first; dry-run is not proof of live deployment. Ensure the pinned CLI is available and fails if not; avoid silently installing a different version.
4. Before actual deployment, repeat the exact account-scoped absence check and verify the deploy credential targets the same account (a read token alone cannot establish the write credential identity). If the API list is incomplete or any error occurs, stop. Do not infer absence from a failed Wrangler command. The API list/check and deploy are not atomic: use an exclusive operator window with no concurrent creation of this name. If exclusivity cannot be established, stop rather than risk overwriting an existing Worker.
5. Only on the development PC and within the existing approval, deploy with the same config and pinned CLI, no overrides. Never retry automatically after ambiguous failure. Inspect the exact Worker and its routes, workers.dev/preview state and migration via read-only provider evidence; distinguish a registered SQLite class from an instantiated DO. Stop on any unexpected exposure, do not delete or change resources without approval.
6. Remove only the temporary local config created by this procedure, clear temporary credential variables, and report sanitized status, commit, deployment ID, route/preview state and blockers. Never print token or full provider error bodies. Keep the live guard BLOCKED; no secrets or public access in this stage.

## Current implementation reconciliation (2026-11-26; source HEAD 9647047)
The earlier broad docs exception is superseded by current source. The execution sequence remains the safety contract, not proof of acceptance.

| Requirement | Source status |
|---|---|
| Exact HEAD, ancestor, explicit file allowlist, clean tracked/untracked tree | Implemented in cs03-dark-preflight.mjs |
| Root temporary config, exclusive creation, validation, cleanup, pinned Wrangler | Implemented in cs03-dark-dry-run.mjs |
| Same credential for account-scoped absence and CLI, reject alternate credentials | Implemented in cs03-dark-credential.mjs; read access does not prove write authorization |
| Preparation default, explicit deploy and exclusive-window flags, repeat checks, no retry on ambiguous deploy | Implemented in cs03-dark-prepare.mjs |
| Four corresponding test files | Present; execution evidence not established for this HEAD |
| Provider-side post-deploy inspection | Not implemented in prepare; result explicitly reports LIVE_VERIFIED=NO |

## Blocking differences requiring resolution before execution
- The two additional documentation changes are now accepted only at their exact reviewed Git blob IDs. Actual GitHub diff and extracted validator: 7 cases PASS, including rejection of altered blobs, unrelated paths and dirty status. Full local Git preflight and Node test suite remain unexecuted. No generic docs exception.
- Direct dependencies are now pinned in package.json: jose 6.0.0, pg 8.16.3, @neon/auth 0.8.2, esbuild 0.28.2, Wrangler 4.168.0. These are the previous manifest's lower bounds and the previously specified Wrangler version, not a claim of compatibility or registry availability. The manifest is checked by exact blob identity. Registry access from the remote container failed (EAI_AGAIN), so no lockfile was generated. On a disposable development-PC checkout, without cloud credentials, generate with `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`; inspect resolved versions, integrity and registry origins, then commit the reviewed lockfile and add its exact blob ID to the preflight before `npm ci --ignore-scripts`. The current preflight must reject an unreviewed lockfile. Do not deploy until lockfile, clean-worktree handling for installed dependencies and changed tests are verified. `npm run test:cs03-dark` groups the four preparation test files.
- The operator's exclusive-window flag is an assertion, not a technical lock. Provider-side absence and post-deploy verification remain required.
- No cloud change, test execution or new deployment evidence was obtained in this documentation review. Progress remains 9/13 and live guard BLOCKED.

Source: [reviewed HEAD](https://github.com/rapurasusann/db-specialist-study/tree/96470478832fd6c566ea1bb2081ef9bd0d084e82). Earlier contract remains in Git history.
