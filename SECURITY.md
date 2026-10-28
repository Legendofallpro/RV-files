# Security Policy

## Supported versions

Only the latest commit on `main` receives security fixes. RV Files is a hardened fork of Pingvin Share X; issues that also affect upstream should be reported there too.

## Reporting a vulnerability

Please do not open a public issue, because the vulnerability could be exploited before it is fixed.

Report it privately through GitHub instead: open the repository's **Security** tab and choose **Report a vulnerability**. Include the steps to reproduce, the affected endpoint or file, and the impact you expect.

## Scope

In scope: the share access checks (expiry, revoke, view limit, password), file upload limits and the extension blocklist, safe file serving headers, the tripwire, and the audit log.

Known limitations are listed in the README under "Known limitations". Reports about those are still welcome if you can show a concrete exploit.
