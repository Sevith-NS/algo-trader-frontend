// Reading Server-Sent Events off a fetch body.
//
// The backend's streaming endpoints are POST — the request carries a strategy
// parameter map, a cost model and a date window, none of which belong in a
// query string — and EventSource can only issue a GET. So the frames are read
// off the response body stream by hand.

/**
 * Consume an SSE response, invoking `onEvent` once per frame.
 *
 * Resolves when the stream ends. A frame that will not parse is skipped rather
 * than ending the run: one malformed event is not worth discarding the
 * hundreds that already arrived.
 */
export async function readSseStream<T>(
  res: Response,
  onEvent: (event: T) => void,
): Promise<void> {
  if (!res.body) throw new Error('This browser cannot read a streaming response.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const emit = (frame: string) => {
    const line = frame.split('\n').find((l) => l.startsWith('data:'));
    if (!line) return;
    try {
      onEvent(JSON.parse(line.slice(5).trim()) as T);
    } catch {
      /* malformed frame */
    }
  };

  // Frames are separated by a blank line, and chunk boundaries fall anywhere,
  // so a partial frame waits in the buffer until its terminator arrives.
  const drain = (flush = false) => {
    let split = buffer.indexOf('\n\n');
    while (split !== -1) {
      emit(buffer.slice(0, split));
      buffer = buffer.slice(split + 2);
      split = buffer.indexOf('\n\n');
    }
    if (flush && buffer.trim()) {
      emit(buffer);
      buffer = '';
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      drain();
    }
    buffer += decoder.decode();
    drain(true);
  } finally {
    reader.releaseLock();
  }
}
