# Changelog

## v1.0.6

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