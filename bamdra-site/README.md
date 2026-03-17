# bamdra-site

This repository contains the public website source for the Bamdra OpenClaw memory suite.

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm deploy:oss
```

## Aliyun OSS Sync

`pnpm deploy:oss` uses `scripts/deploy-oss.mjs` and expects `ossutil` to be installed locally.

Required environment variables:

- `BAMDRA_OSS_BUCKET`
  The target OSS bucket name

Optional environment variables:

- `BAMDRA_OSS_PREFIX`
  Upload into a subdirectory inside the bucket
- `BAMDRA_OSS_ENDPOINT`
  Explicit OSS endpoint
- `OSSUTIL_BIN`
  Override the `ossutil` binary path

Recommended flow:

```bash
pnpm build
BAMDRA_OSS_BUCKET=your-bucket pnpm deploy:oss
```

The script syncs the current `.vitepress/dist/` output to OSS and is intended to be used locally or in CI once OSS credentials are configured on the machine.
