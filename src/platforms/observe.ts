export function observeJsonResponses(match: (url: string) => boolean, ingest: (data: unknown) => void): void {
  const marker = "__scrollplusObserve";
  const holder = window as unknown as Record<string, boolean>;
  if (holder[marker]) return;
  holder[marker] = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const promise = originalFetch(input, init);
    try {
      promise.then((response) => {
        if (!match(response.url)) return;
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
    } catch {
      /* never break the host request */
    }
    return promise;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const observedRequests = new WeakSet<XMLHttpRequest>();
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
    if (!observedRequests.has(this)) {
      observedRequests.add(this);
      this.addEventListener("readystatechange", () => {
        // Snapshot the completed response before a page's load handler can reuse the XHR.
        if (this.readyState !== XMLHttpRequest.DONE || this.status === 0) return;
        try {
          if (!match(this.responseURL)) return;
          if (this.responseType === "json") {
            ingest(this.response);
            return;
          }
          if (this.responseType === "" || this.responseType === "text") ingest(JSON.parse(this.responseText));
        } catch {
          /* ignore */
        }
      });
    }
    Reflect.apply(originalOpen, this, arguments);
  };
}
