---
title: FAQ
description: Frequently asked questions about bamdra-openclaw-memory, deployment, and daily use.
---

# FAQ

## Do I need an extra cache service?

No. SQLite plus the default in-process cache is the recommended starting point for most teams.

## Is this only for developers?

No. The product is technical to install, but its value is broader: product, operations, research, and knowledge workflows all benefit from better continuity.

## What does it remember well?

It is strongest at durable facts, branch continuity, compact summaries, and resuming earlier threads without replaying whole sessions.

## What should not be stored?

Do not treat memory as a raw secret dump. Sensitive values should follow your normal security policy.

## Can it survive restarts?

Yes. Restart recovery is one of the main reasons to use a SQLite-backed memory layer.

## Where is the source code?

GitHub home: [github.com/bamdra](https://github.com/bamdra)
