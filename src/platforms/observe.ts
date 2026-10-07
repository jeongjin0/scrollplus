export function observeJsonResponses(match: (url: string) => boolean, ingest: (data: unknown) => void): void {
  const marker = "__slfObserve";
  const holder = window as unknown as Record<string, boolean>;
  if (holder[marker]) return;
  holder[marker] = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const promise = originalFetch(input, init);
    try {
      const url = readUrl(input);
      if (match(url)) {
        promise.then((response) => {
          try {
            response.clone().json().then((data) => {
              try {
                ingest(data);
              } catch {
                /* ignore malformed payloads */
              }
            }).catch(() => {});
          } catch {
            /* ignore clone failures */
          }
        }).catch(() => {});
      }
    } catch {
      /* never break the host request */
    }
    return promise;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
    (this as XMLHttpRequest & { __slfUrl?: string }).__slfUrl = String(url);
    originalOpen.call(this, method, url, async ?? true, username, password);
  };
  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
    this.addEventListener("load", () => {
      try {
        const url = (this as XMLHttpRequest & { __slfUrl?: string }).__slfUrl || "";
        if (!match(url)) return;
        if (this.responseType === "json") {
          ingest(this.response);
          return;
        }
        if (this.responseType === "" || this.responseType === "text") ingest(JSON.parse(this.responseText));
      } catch {
        /* ignore */
      }
    });
    originalSend.call(this, body);
  };
}

function readUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}
