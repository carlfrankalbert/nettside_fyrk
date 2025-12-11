/**
 * Server-Sent Events (SSE) parsing utilities
 * Handles parsing of SSE streams from both client and server contexts
 */

/**
 * Event data from a parsed SSE line
 */
export interface SSEEvent {
  type: 'text' | 'done' | 'error';
  text?: string;
  error?: string;
}

/**
 * Buffer for accumulating SSE stream data
 */
export interface SSEBuffer {
  buffer: string;
  decoder: TextDecoder;
}

/**
 * Create a new SSE buffer for parsing streaming data
 */
export function createSSEBuffer(): SSEBuffer {
  return {
    buffer: '',
    decoder: new TextDecoder(),
  };
}

/**
 * Parse a single SSE data line
 *
 * @param dataLine - The data portion of an SSE line (after 'data: ')
 * @returns Parsed event or null if the line should be skipped
 */
export function parseSSEDataLine(dataLine: string): SSEEvent | null {
  if (dataLine === '[DONE]') {
    return { type: 'done' };
  }

  try {
    const event = JSON.parse(dataLine);

    if (event.error) {
      return {
        type: 'error',
        error: event.message || event.error,
      };
    }

    if (event.text) {
      return {
        type: 'text',
        text: event.text,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Process incoming SSE chunk data and extract complete lines
 *
 * @param sseBuffer - The SSE buffer to update
 * @param chunk - Raw chunk data from the stream
 * @returns Array of complete data lines ready for parsing
 */
export function processSSEChunk(sseBuffer: SSEBuffer, chunk: Uint8Array): string[] {
  sseBuffer.buffer += sseBuffer.decoder.decode(chunk, { stream: true });

  const lines = sseBuffer.buffer.split('\n');
  sseBuffer.buffer = lines.pop() || '';

  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      dataLines.push(line.slice(6));
    }
  }

  return dataLines;
}

/**
 * Anthropic-specific stream event types
 */
export interface AnthropicStreamEvent {
  type: string;
  delta?: {
    type: string;
    text?: string;
  };
}

/**
 * Parse an Anthropic API stream event
 *
 * @param dataLine - The data line from the SSE stream
 * @returns The extracted text, or null if not a text delta event
 */
export function parseAnthropicStreamEvent(dataLine: string): string | null {
  if (dataLine === '[DONE]') {
    return null;
  }

  try {
    const event = JSON.parse(dataLine) as AnthropicStreamEvent;
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      return event.delta.text || '';
    }
    return null;
  } catch {
    return null;
  }
}
