# T-201 manual Firefox experiment

Temporary Manifest V3 extension, plain JavaScript with no build step. Not the finished product. Only course pages receive the diagnostic panel. No storage, login access, network requests, credentials, signed URLs or subtitle body logging are implemented.

Load manifest.json via about:debugging#/runtime/this-firefox → Load Temporary Add-on, then reload the Submeta course page. Explicitly click each experiment button and inspect the independently read iframe media state. Korean and 1.25 are temporary test values, not user preferences. Restore the original speed and captions afterwards.

The SDK test reads the actual media element through the frame probe: the SDK's optimistic cache is not sufficient proof of success. A failed late SDK handshake must be distinguished from an unsupported property. Frame messages validate parent/source/origin and expose only a small allowlist of reversible media commands. This diagnostic bridge is not a production authorization mechanism.

Cloudflare SDK downloaded from https://embed.cloudflarestream.com/embed/sdk.latest.js on 2026-09-06 and included locally without edits. Verify SHA-256 alongside the experiment results. Runtime CDN loading is not used. Redistribution/license review is required before a production package incorporates this vendor file.

Tests: SDK speed 1.25 → actual read; restore 1.0; DOM speed 1.25 → actual read; Korean selection → UI state plus visible subtitle rendering; Off → UI state plus subtitle disappearance; restore initial values. A UI selection alone does not prove visual rendering. Record failures without silently marking them successful.
