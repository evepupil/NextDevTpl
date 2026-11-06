# Local HTTPS Test Certificate

The certificate and private key in this directory are public test fixtures for
local skin-download tests. They identify only `localhost` and `127.0.0.1` and are
not used by any deployed service.

Each test trusts this certificate for its own request. The test suite keeps global
TLS verification enabled. These files are excluded from the published generator
and from generated projects together with the other repository tests.
