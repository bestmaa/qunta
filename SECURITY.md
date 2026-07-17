# Security Policy

Qunta handles local workspaces, command execution, authentication, and server-side model routing. Security reports are treated seriously and should be disclosed responsibly.

## Supported versions

Qunta is currently in a private-beta foundation stage. Security fixes target the latest code on the `main` branch unless a release note states otherwise.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

1. Use the repository's **Security** tab and **Report a vulnerability** option when it is available.
2. If private vulnerability reporting is unavailable, contact the maintainer through [wovvtech.site](https://wovvtech.site) and request a private reporting channel without including exploit details in the initial message.
3. Include the affected component, reproduction steps, expected impact, and any safe proof-of-concept material.
4. Remove secrets, provider keys, personal data, customer content, and unrelated workspace files from the report.

Please allow reasonable time for investigation and remediation before public disclosure.

## Scope

High-value reports include:

- workspace boundary or path traversal bypasses;
- unauthorized command or file execution;
- secret, token, prompt, or provider-key exposure;
- authentication or authorization bypasses;
- update-signature or package-integrity failures;
- sandbox, approval, or audit-log bypasses;
- server-side request forgery or unsafe network access.

General product bugs, feature requests, and setup questions belong in the public issue tracker.

## Safe harbor

Good-faith research that avoids privacy violations, data destruction, service disruption, social engineering, and unnecessary access will be handled respectfully. Do not access data that is not your own, and stop testing once a vulnerability is confirmed.
