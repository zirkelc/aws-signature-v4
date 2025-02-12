interface ParsedRequest {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body?: ArrayBuffer;
}

/**
 * Copy the properties of `Headers` to a plain object.
 * Lowercase the keys of the headers.
 */
export const copyHeaders = (headers: Headers): Record<string, string> => {
  const headersMap = new Map<string, string>();
  headers.forEach((value, key) => headersMap.set(key.toLowerCase(), value));

  return Object.fromEntries(headersMap.entries());
};

/**
 * Extract the URL, method, body, and headers from a request.
 * Input can be a `string`, `URL`, or `Request` object.
 * Init is an optional `RequestInit` object. If provided, it will override the values in the `Request` object.
 */
export const parseRequest = async (input: string | Request | URL, init?: RequestInit): Promise<ParsedRequest> => {
  let request: Request;

  /**
   * Input can be a `string`, `URL`, or `Request` object
   * `RequestInfo` is a union of `Request` and `string`
   */
  if (typeof input === "string" || input instanceof URL) {
    const url = input instanceof URL ? input.href : input;
    request = new Request(url, init);
  } else {
    // Creating a request from a request object will consume the body
    // Clone the request to keep the original request intact
    request = new Request(input.clone(), init);
  }

  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const headers = copyHeaders(request.headers);
  const buffer = await request.arrayBuffer();
  const body = buffer.byteLength > 0 ? buffer : undefined;

  return {
    method,
    headers,
    url,
    body,
  };
};
