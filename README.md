# Playwright + Pact + Xray test framework

[![Tests](https://github.com/bathur88/ABJ/actions/workflows/tests.yml/badge.svg)](https://github.com/bathur88/ABJ/actions/workflows/tests.yml)

A small, production-style test automation framework in **TypeScript**:

| Layer | Tool | Target |
|---|---|---|
| UI tests | Playwright (Chromium), Page Object Model | [SauceDemo](https://www.saucedemo.com) |
| API tests | Playwright `request` fixture | [Restful-Booker](https://restful-booker.herokuapp.com) |
| Contract test | Pact JS (consumer side, Pact spec V3) | Pact mock server |
| CI | GitHub Actions | push, PR, nightly, manual |
| Test management | Xray Cloud (JUnit import) | Jira project of your choice |

## Project layout

```
src/
  pages/        Page objects (LoginPage, InventoryPage, CheckoutPage)
  clients/      Typed API client used by the Pact consumer test
  data/         Test data builders and demo users
tests/
  ui/           Browser tests
  api/          REST API tests (auth, CRUD, negative case)
  contract/     Pact consumer contract test
scripts/
  xray-import.sh  Authenticates with Xray and uploads reports/junit.xml
.github/workflows/tests.yml
```

## Run locally

```bash
npm ci
npx playwright install chromium
npm test                 # everything
npm run test:ui          # UI only
npm run test:api         # API only
npm run test:contract    # Pact only, writes pacts/BookingWebClient-BookingAPI.json
npm run report           # open the HTML report
```

Base URLs can be overridden with `UI_BASE_URL` and `API_BASE_URL`.

## Pact contract

`tests/contract/booking.consumer.pact.spec.ts` drives the real `BookingClient` against a Pact mock server
and records the interaction (`GET /booking/:id`) with type and regex matchers rather than fixed values.
The generated pact file is uploaded as a CI artifact. In a full setup it would be published to a
Pact Broker / PactFlow and verified by the provider pipeline, with `can-i-deploy` gating releases.

## CI pipeline

`.github/workflows/tests.yml`:

1. Install dependencies and type check
2. Install Chromium and run all three Playwright projects (`ui`, `api`, `contract`)
3. Upload the HTML report, traces/videos on failure, and the pact file
4. Push the JUnit results to Xray (runs even when tests fail, so failures are recorded)
5. Fail the job if any test failed

## Xray integration

Playwright writes `reports/junit.xml`. The pipeline sends it to the Xray Cloud REST API
(`/api/v2/import/execution/junit`), which creates a **Test Execution** in Jira and links or creates a
**Test** issue for each test case.

**Setup** (repo Settings → Secrets and variables → Actions):

| Name | Type | Example |
|---|---|---|
| `XRAY_CLIENT_ID` | Secret | from Xray → Settings → API Keys |
| `XRAY_CLIENT_SECRET` | Secret | from Xray → Settings → API Keys |
| `XRAY_PROJECT_KEY` | Variable | `ABJ` |
| `XRAY_TEST_PLAN_KEY` | Variable (optional) | `ABJ-10` |
| `XRAY_BASE_URL` | Variable (optional) | `https://eu.xray.cloud.getxray.app` |

Without these, the Xray step is skipped with a notice and the rest of the pipeline still runs.

**Linking to existing Xray Tests:** add a `test_key` annotation. The JUnit reporter is configured with
`embedAnnotationsAsProperties`, so Xray picks it up:

```ts
test('standard user can log in', async ({ page }) => {
  test.info().annotations.push({ type: 'test_key', description: 'ABJ-1' });
  // ...
});
```

Manual upload from your machine:

```bash
XRAY_CLIENT_ID=... XRAY_CLIENT_SECRET=... XRAY_PROJECT_KEY=ABJ npm run xray:import
```

## Legacy

The original Selenium + Cucumber (Java) sample lives in `legacy/selenium-cucumber-java/`.
