// Paths should contain a leading slash, because they are appended to the base URL
export const testPaths = [
  "", // root
  "foo", // single path
  "foo-*", // wildcard path
];

export const testQueryParams = [
  "", // empty
  "foo=bar", // single value
  "foo", // no value
  "foo=", // empty value
  "foo=bar&foo=baz", // multiple values
];
