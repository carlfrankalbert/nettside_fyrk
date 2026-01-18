#!/usr/bin/env node
/* global console, process */

/**
 * CI Repair Script
 *
 * This script:
 * 1. Reads failure context from .ci_context/
 * 2. Builds a prompt for Claude API
 * 3. Requests a minimal unified diff patch
 * 4. Validates and applies the patch
 *
 * Safety limits:
 * - Max 5 files changed
 * - Max 300 lines changed (insertions + deletions)
 * - Cannot modify .github/workflows/ or infrastructure/
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  maxFiles: 5,
  maxLines: 300,
  maxLogChars: 20000,
  maxSourceFileChars: 5000,
  forbiddenPaths: ['.github/workflows/', 'infrastructure/'],
  contextDir: '.ci_context',
  model: 'claude-sonnet-4-20250514',
};

// =============================================================================
// Utility Functions
// =============================================================================

function log(message) {
  console.log(`[ci-repair] ${message}`);
}

function error(message) {
  console.error(`[ci-repair] ERROR: ${message}`);
}

function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  }
}

function readFileIfExists(filePath, defaultValue = '') {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return defaultValue;
  }
}

function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(-maxLength); // Keep the end (most relevant for logs)
}

function getRepoFileIndex() {
  try {
    const result = execSync(
      'find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/.ci_context/*" | head -500',
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 }
    );
    return result.trim();
  } catch {
    return '';
  }
}

function extractFilePathsFromLog(logContent) {
  // Match common stack trace patterns and file references
  const patterns = [
    /(?:at\s+.+?\s+\()?([./][\w\-./]+\.[tj]sx?):(\d+)/g,
    /Error in ([./][\w\-./]+\.[tj]sx?)/g,
    /FAIL\s+([./][\w\-./]+\.[tj]sx?)/g,
    /●\s+([./][\w\-./]+\.[tj]sx?)/g,
  ];

  const files = new Set();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(logContent)) !== null) {
      const filePath = match[1];
      // Normalize path
      const normalized = filePath.startsWith('./')
        ? filePath
        : `./${filePath}`;

      // Skip node_modules and test files in stack traces
      if (
        !normalized.includes('node_modules') &&
        fs.existsSync(normalized.replace('./', ''))
      ) {
        files.add(normalized);
      }
    }
  }

  return Array.from(files).slice(0, 5); // Max 5 files
}

function readSourceFile(filePath) {
  try {
    const content = fs.readFileSync(
      filePath.replace('./', ''),
      'utf-8'
    );
    return truncate(content, CONFIG.maxSourceFileChars);
  } catch {
    return null;
  }
}

// =============================================================================
// Patch Validation
// =============================================================================

function parseDiffStats(patch) {
  const lines = patch.split('\n');
  const files = new Set();
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    // Match file paths in diff headers
    const fileMatch = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (fileMatch) {
      files.add(fileMatch[2]);
      continue;
    }

    // Count insertions and deletions
    if (line.startsWith('+') && !line.startsWith('+++')) {
      insertions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  return {
    files: Array.from(files),
    fileCount: files.size,
    insertions,
    deletions,
    totalLines: insertions + deletions,
  };
}

function validatePatch(patch) {
  const errors = [];

  // Check if patch contains diff header
  if (!patch.includes('diff --git')) {
    errors.push('Patch does not contain valid diff header');
    return { valid: false, errors, stats: null };
  }

  const stats = parseDiffStats(patch);

  // Check file count
  if (stats.fileCount > CONFIG.maxFiles) {
    errors.push(
      `Patch changes ${stats.fileCount} files (max ${CONFIG.maxFiles})`
    );
  }

  // Check line count
  if (stats.totalLines > CONFIG.maxLines) {
    errors.push(
      `Patch changes ${stats.totalLines} lines (max ${CONFIG.maxLines})`
    );
  }

  // Check forbidden paths
  for (const file of stats.files) {
    for (const forbidden of CONFIG.forbiddenPaths) {
      if (file.startsWith(forbidden) || file.includes(`/${forbidden}`)) {
        errors.push(`Patch modifies forbidden path: ${file}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stats,
  };
}

// =============================================================================
// Claude API Integration
// =============================================================================

function buildPrompt(failedLog, packageJson, fileIndex, sourceFiles) {
  const sourceFilesSection = sourceFiles.length > 0
    ? `\n\n## Relevant Source Files\n\n${sourceFiles.map(f => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')}`
    : '';

  return `You are a CI repair bot. Your task is to analyze the failing CI logs and generate a minimal unified diff patch to fix the issue.

## Constraints
- Output ONLY a valid unified diff patch (starting with \`diff --git\`)
- Make minimal changes - only what's necessary to fix the failing tests
- Do not add new features or refactor unrelated code
- Do not modify any files in .github/workflows/ or infrastructure/
- Maximum 5 files changed
- Maximum 300 lines changed (insertions + deletions combined)
- If you cannot determine a fix, output exactly: NO_FIX_POSSIBLE

## Repository Context

### package.json
\`\`\`json
${packageJson}
\`\`\`

### File Index (partial)
\`\`\`
${fileIndex}
\`\`\`
${sourceFilesSection}

## Failing CI Logs
\`\`\`
${failedLog}
\`\`\`

## Instructions
1. Analyze the error messages and stack traces
2. Identify the root cause
3. Generate a minimal unified diff patch to fix the issue
4. Output ONLY the patch, nothing else

Output your unified diff patch now:`;
}

async function callClaudeAPI(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  const client = new Anthropic({ apiKey });

  log('Calling Claude API...');

  const response = await client.messages.create({
    model: CONFIG.model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: `You are a precise CI repair bot. You output ONLY valid unified diff patches. No explanations, no markdown code blocks around the diff, just the raw diff starting with "diff --git". If you cannot fix the issue, output exactly "NO_FIX_POSSIBLE".`,
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  return content.text.trim();
}

// =============================================================================
// Patch Application
// =============================================================================

function applyPatch(patch) {
  const patchPath = path.join(CONFIG.contextDir, 'patch.diff');
  fs.writeFileSync(patchPath, patch);

  try {
    execSync(`git apply --whitespace=fix "${patchPath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return true;
  } catch (err) {
    error(`Failed to apply patch: ${err.message}`);
    return false;
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  log('Starting CI repair process...');

  const runId = process.env.RUN_ID;
  const runUrl = process.env.RUN_URL;

  if (!runId) {
    error('RUN_ID environment variable not set');
    process.exit(1);
  }

  log(`Processing failed run: ${runId}`);
  log(`Run URL: ${runUrl}`);

  // Read context files
  const failedLogPath = path.join(CONFIG.contextDir, 'failed.log');
  const failedLog = truncate(
    readFileIfExists(failedLogPath, 'No failed log available'),
    CONFIG.maxLogChars
  );

  if (failedLog === 'No failed log available' || failedLog.trim() === '') {
    error('No failure log found');
    setOutput('patch_applied', 'false');
    process.exit(1);
  }

  log(`Read ${failedLog.length} characters of failure log`);

  // Read package.json
  const packageJson = readFileIfExists('package.json', '{}');

  // Get file index
  const fileIndex = getRepoFileIndex();
  log(`Indexed ${fileIndex.split('\n').length} files`);

  // Extract and read relevant source files from log
  const relevantPaths = extractFilePathsFromLog(failedLog);
  log(`Found ${relevantPaths.length} relevant source files in logs`);

  const sourceFiles = relevantPaths
    .map(p => ({ path: p, content: readSourceFile(p) }))
    .filter(f => f.content !== null);

  // Build prompt and call Claude
  const prompt = buildPrompt(failedLog, packageJson, fileIndex, sourceFiles);

  let patchContent;
  try {
    patchContent = await callClaudeAPI(prompt);
  } catch (err) {
    error(`Claude API call failed: ${err.message}`);
    setOutput('patch_applied', 'false');
    process.exit(1);
  }

  // Check for no-fix response
  if (patchContent === 'NO_FIX_POSSIBLE' || !patchContent.includes('diff --git')) {
    log('Claude could not determine a fix');
    setOutput('patch_applied', 'false');

    // Save the response for debugging
    fs.writeFileSync(
      path.join(CONFIG.contextDir, 'claude_response.txt'),
      patchContent
    );

    process.exit(1);
  }

  // Extract just the diff part (in case there's any extra text)
  const diffStart = patchContent.indexOf('diff --git');
  const cleanPatch = patchContent.slice(diffStart);

  // Validate patch
  log('Validating patch...');
  const validation = validatePatch(cleanPatch);

  if (!validation.valid) {
    error('Patch validation failed:');
    for (const err of validation.errors) {
      error(`  - ${err}`);
    }
    fs.writeFileSync(
      path.join(CONFIG.contextDir, 'patch.diff'),
      cleanPatch
    );
    setOutput('patch_applied', 'false');
    process.exit(1);
  }

  log(`Patch stats: ${validation.stats.fileCount} files, ${validation.stats.totalLines} lines`);
  log(`Files to modify: ${validation.stats.files.join(', ')}`);

  // Apply patch
  log('Applying patch...');
  const applied = applyPatch(cleanPatch);

  if (!applied) {
    setOutput('patch_applied', 'false');
    process.exit(1);
  }

  log('Patch applied successfully!');
  setOutput('patch_applied', 'true');
}

main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  setOutput('patch_applied', 'false');
  process.exit(1);
});
