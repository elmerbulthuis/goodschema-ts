export function normalizeUrl(url: URL) {
  if (url.hash === "") {
    return new URL("#", url);
  }

  url.hash = url.hash.replaceAll(/%([0-9A-F]{2})/g, ($0, $1) => {
    const value = parseInt($1, 16);
    const char = String.fromCharCode(value);
    switch (char) {
      case "/":
        return $0;
      default:
        return char;
    }
  });

  return url;
}
