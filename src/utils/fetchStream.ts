const DEFAULT_STREAM_SEPARATOR = '\n\n';

const DEFAULT_PART_SEPARATOR = '\n';

const DEFAULT_KV_SEPARATOR = ':';

const isValidString = (str: string) => (str ?? '').trim() !== '';

/**
 * @description A TransformStream inst that splits a stream into parts based on {@link DEFAULT_STREAM_SEPARATOR}
 * @example
 *
 * `event: delta
 * data: { content: 'hello' }
 *
 * event: delta
 * data: { key: 'world!' }
 *
 * `
 */
function splitStream() {
  let buffer = '';

  return new TransformStream<string, string>({
    transform(streamChunk, controller) {
      buffer += streamChunk;

      const parts = buffer.split(DEFAULT_STREAM_SEPARATOR);

      parts.slice(0, -1).forEach((part) => {
        if (isValidString(part)) {
          controller.enqueue(part);
        }
      });

      buffer = parts[parts.length - 1];
    },
    flush(controller) {
      if (isValidString(buffer)) {
        controller.enqueue(buffer);
      }
    },
  });
}

export type SSEFields = 'data' | 'event' | 'id' | 'retry';

/**
 * @example
 * const sseObject = {
 *    event: 'delta',
 *    data: '{ key: "world!" }',
 * };
 */
export type SSEOutput = Partial<Record<SSEFields, any>>;

function splitPart() {
  return new TransformStream<string, SSEOutput>({
    transform(partChunk, controller) {
      const lines = partChunk.split(DEFAULT_PART_SEPARATOR);

      const sseEvent = lines.reduce<SSEOutput>((acc, line) => {
        const separatorIndex = line.indexOf(DEFAULT_KV_SEPARATOR);

        if (separatorIndex === -1) {
          throw new Error(
            `The key-value separator "${DEFAULT_KV_SEPARATOR}" is not found in the sse line chunk!`,
          );
        }

        const key = line.slice(0, separatorIndex);

        if (!isValidString(key)) return acc;

        const value = line.slice(separatorIndex + 1);

        return { ...acc, [key]: value };
      }, {});

      if (Object.keys(sseEvent).length === 0) return;

      controller.enqueue(sseEvent);
    },
  });
}

export interface XStreamOptions<Output> {
  readableStream: ReadableStream<Uint8Array>;

  transformStream?: TransformStream<string, Output>;
}

type XReadableStream<R = SSEOutput> = ReadableStream<R> & AsyncGenerator<R>;

function fetchStream<Output = SSEOutput>(options: XStreamOptions<Output>) {
  const { readableStream, transformStream } = options;

  if (!(readableStream instanceof ReadableStream)) {
    throw new Error(
      'The options.readableStream must be an instance of ReadableStream.',
    );
  }

  // Default encoding is `utf-8`
  const decoderStream = new TextDecoderStream();

  const stream = (
    transformStream
      ? readableStream.pipeThrough(decoderStream).pipeThrough(transformStream)
      : readableStream
          .pipeThrough(decoderStream)
          .pipeThrough(splitStream())
          .pipeThrough(splitPart())
  ) as XReadableStream<Output>;

  /** support async iterator */
  stream[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      if (!value) continue;

      yield value;
    }
  };

  return stream;
}

export { fetchStream };
