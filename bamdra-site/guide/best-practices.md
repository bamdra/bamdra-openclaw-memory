---
title: Best Practices
description: Recommended patterns for using the Bamdra suite as a real continuity and knowledge system.
---

# Best Practices

## Think in three layers

The cleanest mental model is:

- `bamdra-user-bind` for who the user is
- `bamdra-openclaw-memory` for what work branch is active
- `bamdra-memory-vector` for what local knowledge matters

## Keep knowledge human-maintainable

Use Markdown as the normal editing surface.

Recommended:

- `knowledge/` for stable reusable knowledge
- `docs/` for formal docs and changelogs
- `notes/` for meeting and working notes
- `ideas/` for unfinished but searchable thinking

## Keep private and shared roots separate

Use separate roots for:

- private user knowledge
- shared team or household knowledge

That keeps retrieval useful without blurring privacy.

## Let local recall happen before web search

For local docs, changelogs, SOPs, notes, and Markdown knowledge, the best behavior is:

1. local recall first
2. answer from local recall if good enough
3. only then use web search

This reduces both latency and token waste.

## Use the profile mirror like a living user guide

The editable profile Markdown should hold:

- preferred address
- timezone
- tone preferences
- role and collaboration style
- important personal working defaults

That is the right place for stable per-user personalization.

## Treat the suite as an evolving system

The real magic appears over time:

- the profile gets richer
- the memory gets more reusable
- the knowledge base gets more organized

That is how the assistant gradually evolves with the user.
