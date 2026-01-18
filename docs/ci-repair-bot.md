# CI Repair Bot

Automated CI repair system that attempts to fix failing nightly tests using AI-generated patches.

## Overview

The CI Repair Bot monitors the **Nightly Full Suite** workflow and automatically attempts to fix failures by:

1. Detecting when the nightly tests fail on `main`
2. Collecting failure context (logs, metadata, artifacts)
3. Sending context to Claude API to generate a minimal diff patch
4. Applying and verifying the patch
5. Opening a PR with the fix (if verification passes)
6. Creating an issue (if repair fails)

## How It Works

```
Nightly Suite Fails
        │
        ▼
CI Repair Bot Triggered
        │
        ▼
Collect Context ────────────► .ci_context/
  - failed.log                  - failed.log
  - run.json                    - run.json
  - jobs.json                   - jobs.json
  - artifacts/                  - artifacts/
        │
        ▼
Call Claude API ◄──────────── Build prompt with:
        │                       - Error logs
        ▼                       - package.json
Generate Patch                  - File index
        │                       - Relevant source files
        ▼
Validate Patch
  - Max 5 files
  - Max 300 lines
  - No forbidden paths
        │
        ├── Invalid ──────────► Exit (no PR)
        │
        ▼
Apply Patch
        │
        ▼
Run Verification
  - npm run typecheck
  - npm run lint
  - npm run test:unit
  - npm run build
  - playwright smoke tests
        │
        ├── Pass ─────────────► Create PR
        │
        └── Fail ─────────────► Create Issue
```

## Safety Guardrails

### Patch Limits

| Limit | Value | Reason |
|-------|-------|--------|
| Max files | 5 | Prevent large-scale changes |
| Max lines | 300 | Keep changes reviewable |
| Forbidden paths | `.github/workflows/`, `infrastructure/` | Protect critical infrastructure |

### Process Safeguards

- **PR-only**: Never pushes directly to `main`
- **Branch-specific**: Only triggers for `main` branch failures
- **Single execution**: Concurrency limit prevents parallel repairs
- **No secrets in prompts**: Only sends code context, never credentials
- **Human review required**: All PRs need manual approval

## Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci-repair.yml` | GitHub Actions workflow |
| `scripts/ci-repair.mjs` | Node.js script that calls Claude API |

## Configuration

### Required Secrets

Add these secrets in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | API key for Claude (Anthropic) |

The workflow automatically uses `GITHUB_TOKEN` for GitHub API access.

### Workflow Permissions

The workflow requires these permissions:

```yaml
permissions:
  actions: read        # Read workflow run data
  contents: write      # Push repair branch
  pull-requests: write # Create PRs
  issues: write        # Create failure issues
```

## Disabling the Bot

### Temporarily Disable

Rename the workflow file:

```bash
mv .github/workflows/ci-repair.yml .github/workflows/ci-repair.yml.disabled
```

### Permanently Remove

Delete the workflow and script:

```bash
rm .github/workflows/ci-repair.yml
rm scripts/ci-repair.mjs
```

## Verification Steps

Before creating a PR, the bot runs these verification steps:

1. **TypeScript check** (`npm run typecheck`)
2. **ESLint** (`npm run lint`)
3. **Unit tests** (`npm run test:unit`)
4. **Build** (`npm run build`)
5. **E2E smoke tests** (`npx playwright test --project=smoke`)

If any step fails, the bot creates an issue instead of a PR.

## PR Format

Generated PRs include:

- Link to the failing workflow run
- List of verification steps passed
- The generated patch (in a collapsible section)
- Note that human review is required

## Failure Handling

When the bot cannot fix an issue, it:

1. Creates a GitHub Issue titled "CI Repair failed for run #XXX"
2. Includes:
   - Link to the failing workflow run
   - Reason for failure (e.g., "Unit tests failed after applying patch")
   - Excerpt from the failure log
3. Uploads the full `.ci_context/` directory as an artifact

## Monitoring

### Successful Repairs

Look for PRs with the pattern `ci/repair-{run_id}`.

### Failed Repairs

Check GitHub Issues with the label `ci-repair-failed`.

### Context Artifacts

Each repair attempt uploads `.ci_context/` as an artifact, containing:

- `failed.log` - The failure log from the nightly run
- `run.json` - Workflow run metadata
- `jobs.json` - Job details
- `patch.diff` - The generated patch (if any)
- `claude_response.txt` - Raw Claude response (if no valid patch)
- `artifacts/` - Downloaded artifacts from the failing run

## Troubleshooting

### Bot Not Triggering

1. Verify the nightly workflow is named exactly "Nightly Full Suite"
2. Check the failure happened on `main` branch
3. Ensure `ANTHROPIC_API_KEY` secret is set

### Invalid Patches

If Claude generates patches that don't apply:

1. Check the `claude_response.txt` in the artifacts
2. The logs may be truncated - consider increasing `maxLogChars`
3. The error context may be insufficient

### Verification Failures

If patches apply but verification fails:

1. Review the workflow run logs
2. The fix may be incomplete or introduce new issues
3. Consider the patch stats - complex fixes may need manual intervention

## Development

### Testing Locally

```bash
# Set up environment
export ANTHROPIC_API_KEY="your-key"
export RUN_ID="12345"
export RUN_URL="https://github.com/..."

# Create mock context
mkdir -p .ci_context
echo "Error: test failed" > .ci_context/failed.log

# Run script
node scripts/ci-repair.mjs
```

### Modifying Limits

Edit `scripts/ci-repair.mjs`:

```javascript
const CONFIG = {
  maxFiles: 5,        // Increase for larger fixes
  maxLines: 300,      // Increase for complex fixes
  maxLogChars: 20000, // Increase for verbose logs
  // ...
};
```

## Security Considerations

1. **API Key Protection**: `ANTHROPIC_API_KEY` is never logged or included in prompts
2. **No Code Execution**: Patches are applied with `git apply`, not executed
3. **Review Required**: All changes go through PR review
4. **Limited Scope**: Cannot modify workflow files or infrastructure
5. **Audit Trail**: All attempts are logged as artifacts
