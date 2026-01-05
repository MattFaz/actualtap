# Changelog

## v1.0.22

- Update @actual-app/api from 25.12.0 to 26.1.0


## v1.0.21

- Added sanity check after budget download to detect silent failures (e.g., out-of-sync migrations)
- Server now fails to start with a clear error message when budget fails to open due to version mismatch
- Updated troubleshooting docs with version mismatch error guidance
- Converted to multi-stage Docker build to remove CVE-2025-64756 (glob) and CVE-2025-64118 (tar) from runtime image
- Added integration tests for transaction API and initialization failures (12 tests total)
- Transaction endpoint now returns transaction ID in response for test cleanup support

## v1.0.20

- Update @actual-app/api from 25.11.0 to 25.12.0

## v1.0.19

- Added `/health` endpoint and Docker Compose healthcheck for service monitoring
- Removed redundant manual environment variable validation code in favor of `@fastify/env` built-in validation
- Simplified API key check (removed case-sensitivity redundancy) and fixed hook registration order to safely use `fastify.config`
- Updated `/transaction` route to distinguish between invalid user input (400) and server/API failures (500), improving debugging
- Removed dead code and consolidated hardcoded operational constants (timeout/retries) for cleaner maintenance
- **Bug Fix:** Transaction dates now respect the TZ environment variable instead of always using UTC (#53)
- **Bug Fix:** Fixed env plugin to use `fastify-plugin` wrapper, ensuring `fastify.config` is properly available to subsequent plugins

## v1.0.18

- Increased `pluginTimeout` in server configuration from 30s to 120s to prevent crashes during budget download retries on slow connections

## v1.0.17

- Bump @actual-app/api from 25.10.0 to 25.11.0
- Add pino-pretty for better log formatting
- **Major Improvement:** Enhanced error handling in actualConnector plugin with specific error messages:
  - URL validation with protocol checking
  - Network connectivity verification with timeout and connection error detection
  - Authentication verification with clear password error messages
  - Budget existence verification with available budget IDs listed
  - Encryption password validation with specific error messages
  - Added retry logic for budget downloads (3 attempts with 2s delay) to handle transient network failures
- Improved GitHub Actions workflow:
  - Simplified CHANGELOG.md update process using sed instead of awk
  - Updated token authentication from PAT_TOKEN to GITHUB_TOKEN
- Code formatting improvements for consistency

## v1.0.16

- Bump @actual-app/api from 25.9.0 to 25.10.0

## v1.0.15
- **Major Change:** Now uses OS temporary directories instead of persistent storage
- Simplified retry logic to handle all errors uniformly with automatic retries (up to 3 attempts)
- Added bruno to .gitignore (API testing client)

## v1.0.14
- Password option now only passed to `downloadBudget()` when `ACTUAL_ENCRYPTION_PASSWORD` is set, hopefully preventing sync errors for non-encrypted budgets (issue #36)
- Updated fastify from 5.4.0 to 5.6.1
- Updated fastify-plugin from 5.0.1 to 5.1.0
- Updated @fastify/env from 5.0.2 to 5.0.3
- Updated tar-fs from 2.1.3 to 2.1.4 (security update)

## v1.0.13

- Hotfix for invalid Dockerfile setup

## v1.0.12

- Added support for encrypted budgets via new `ACTUAL_ENCRYPTION_PASSWORD` environment variable
- Added retry logic for budget downloads with automatic cleanup of corrupted data
- Extended plugin timeout to 30 seconds to match Actual API initialization timeout
- Updated error handling for budget download failures with specific handling for metadata corruption
- Removed legacy error message for ACTUAL_BUDGET_ID to ACTUAL_SYNC_ID migration (no longer needed)

## v1.0.11

- Update @actual-app/api to ^25.9.0

## v1.0.10

- Ignore trailing slashes in URL paths to fix compatibility with Tasker which automatically appends trailing slashes (PR #29)

## v1.0.9

- Update @actual-app/api to ^25.8.0
- Add support for deposit transactions (PR #26)

## v1.0.8

### Fixed
- **CRITICAL SECURITY FIX**: Fixed API key authentication bypass issue where authentication hook was not applying to transaction routes due to Fastify plugin encapsulation
- Moved authentication hook from plugin-scoped context to global root level registration to ensure all routes are properly protected
- API requests without valid `X-API-KEY` header are now correctly rejected with 401 Unauthorized status

## v1.0.6 && v1.0.7

This release includes a **BREAKING CHANGE**. You will need to change the variable name `ACTUAL_BUDGET_ID` to `ACTUAL_SYNC_ID`

### Changed
- Renamed environment variable `ACTUAL_BUDGET_ID` to `ACTUAL_SYNC_ID` for better clarity
- Updated all references to use sync ID terminology consistently across documentation and code
- Updated package dependencies to latest versions

## v1.0.5

### Changed
- Updated transaction handling from `importTransactions()` to `addTransactions()` for better API compatibility
- Simplified transaction creation by removing UUID generation and imported_id field
- Updated response handling to properly handle "ok" return value from addTransactions API

### Added
- TZ environment variable to Docker configuration for timezone support

### Fixed
- Fixed 500 error when transactions were successfully added due to incorrect response format handling

## v1.0.4

### Fixed
- Case-insensitive API key header check in auth hook to properly handle different header capitalizations
- Improved transaction ID generation using UUID v4 to ensure uniqueness and prevent duplicate transaction issues
- Enhanced error logging for transaction results to provide more diagnostic information
- Added proper handling for ignored transactions in the updatedPreview array, returning a 409 Conflict status with detailed information instead of a generic error

## v1.0.3

### Added
- Log result for Unexpected Error in `handleTransactionResult()` to assist with diagnosing errors (issue 7)