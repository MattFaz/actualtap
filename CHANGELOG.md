# Changelog

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