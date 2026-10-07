import { expect, test } from "@playwright/test";

test("observing fetch preserves the original promise, response and request", async ({ page }) => {
  let request: { method: string; body: string | null; header: string } | undefined;
  await page.route("**/observed/fetch", async (route) => {
    request = { method: route.request().method(), body: route.request().postData(), header: route.request().headers()["x-observer-test"] };
    await route.fulfill({ status: 201, headers: { "content-type": "application/json", "x-fixture": "original" }, body: '{"count":1}' });
  });
  await page.goto("/player.html");
  const result = await page.evaluate(async () => {
    const nativeFetch = window.fetch.bind(window);
    let original: Promise<Response>;
    window.fetch = (...args) => { original = nativeFetch(...args); return original; };
    let resolveObserved: () => void;
    const observed = new Promise<void>((resolve) => { resolveObserved = resolve; });
    let observations = 0;
    const install = (window as any).__scrollplusObserverQa;
    install((url: string) => url.includes("/observed/"), (data: any) => { observations++; data.count = 999; resolveObserved(); });
    install(() => true, () => { observations++; });
    const input = new Request(new URL("/observed/fetch", location.href), { method: "POST", headers: { "x-observer-test": "unchanged" }, body: "unchanged body" });
    const returned = fetch(input);
    const samePromise = returned === original!;
    const response = await returned;
    await observed;
    const sameResponse = response === await original!;
    const bodyUsed = response.bodyUsed;
    return { samePromise, sameResponse, bodyUsed, observations, status: response.status, header: response.headers.get("x-fixture"), body: await response.json() };
  });
  expect(result).toEqual({ samePromise: true, sameResponse: true, bodyUsed: false, observations: 1, status: 201, header: "original", body: { count: 1 } });
  expect(request).toEqual({ method: "POST", body: "unchanged body", header: "unchanged" });
});

test("a reused native XHR observes each matching response once", async ({ page }) => {
  await page.route("**/xhr-data/**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ count: Number(new URL(route.request().url()).pathname.split("/").at(-1)) }) });
  });
  await page.goto("/player.html");
  const result = await page.evaluate(async () => {
    const observed: unknown[] = [];
    (window as any).__scrollplusObserverQa((url: string) => url.startsWith(location.origin + "/xhr-data/observed/"), (data: unknown) => observed.push(data));
    const xhr = new XMLHttpRequest();
    const bodies = [];
    for (const [path, type] of [["observed/1", "json"], ["observed/2", "text"], ["other/9", "json"], ["observed/3", "json"]] as const) {
      const loaded = new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => resolve(), { once: true });
        xhr.addEventListener("error", () => reject(new Error("XHR failed")), { once: true });
      });
      xhr.open("GET", "/xhr-data/" + path);
      xhr.responseType = type;
      xhr.send();
      await loaded;
      bodies.push({ status: xhr.status, body: type === "json" ? xhr.response : JSON.parse(xhr.responseText) });
    }
    return { observed, bodies };
  });
  expect(result.observed).toEqual([{ count: 1 }, { count: 2 }, { count: 3 }]);
  expect(result.bodies).toEqual([1, 2, 9, 3].map((count) => ({ status: 200, body: { count } })));
});

test("observer errors and failed requests do not change host outcomes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/observed/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/failed")) { await route.abort("failed"); return; }
    await route.fulfill({ contentType: "application/json", body: path.endsWith("/invalid") ? "not json" : '{"count":1}' });
  });
  await page.goto("/player.html");
  const result = await page.evaluate(async () => {
    let matchThrows = false;
    const nativeFetch = window.fetch.bind(window);
    let original: Promise<Response>;
    window.fetch = (...args) => { original = nativeFetch(...args); return original; };
    (window as any).__scrollplusObserverQa(() => { if (matchThrows) throw new Error("observer match failed"); return true; }, () => { throw new Error("observer ingest failed"); });
    const invalid = await (await fetch("/observed/invalid")).text();
    const valid = await (await fetch("/observed/valid")).json();
    matchThrows = true;
    const matchingError = await (await fetch("/observed/match-error")).json();
    const failed = fetch("/observed/failed");
    const sameFailedPromise = failed === original!;
    const expectedError = await original!.catch((error) => error);
    const returnedError = await failed.catch((error) => error);
    matchThrows = false;
    const xhr = new XMLHttpRequest();
    const loaded = new Promise<void>((resolve, reject) => {
      xhr.onload = () => resolve(); xhr.onerror = () => reject(new Error("host XHR failed"));
    });
    xhr.open("GET", "/observed/xhr"); xhr.responseType = "json"; xhr.send(); await loaded;
    return { invalid, valid, matchingError, sameFailedPromise, sameError: expectedError === returnedError, failedType: returnedError.name, xhr: xhr.response, xhrStatus: xhr.status };
  });
  expect(result).toEqual({ invalid: "not json", valid: { count: 1 }, matchingError: { count: 1 }, sameFailedPromise: true, sameError: true, failedType: "TypeError", xhr: { count: 1 }, xhrStatus: 200 });
  expect(errors).toEqual([]);
});
