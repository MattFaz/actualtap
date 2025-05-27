# Changelog

## v1.0.4

### Fixed
- Case-insensitive API key header check in auth hook to properly handle different header capitalizations
- Improved transaction ID generation using UUID v4 to ensure uniqueness and prevent duplicate transaction issues
- Enhanced error logging for transaction results to provide more diagnostic information
- Added proper handling for ignored transactions in the updatedPreview array, returning a 409 Conflict status with detailed information instead of a generic error

## v1.0.3

### Added
- Log result for Unexpected Error in `handleTransactionResult()` to assist with diagnosing errors (issue 7)