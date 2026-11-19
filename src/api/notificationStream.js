// Read complete SSE frames even when the network splits a line or a CRLF pair.
export async function readNotificationEvents(body, onEvent) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const type = /^event: ?([^\r\n]+)/m.exec(frame)?.[1];
        const id = /^id: ?([^\r\n]+)/m.exec(frame)?.[1];
        if (type && /^data:/m.test(frame)) onEvent(type, id);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
