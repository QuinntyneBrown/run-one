import type { Page, Request } from '@playwright/test';

/**
 * What a handler answers: a status (200 by default), a JSON body (none for 204) and any headers, such as Retry-After; or,
 * with `offline`, no answer at all, as when the network is down.
 */
export interface ApiReply {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  offline?: true;
}

export type Handler = (request: Request) => ApiReply | Promise<ApiReply>;

/**
 * Answers the app's requests to an API (`/api/…` on localhost) with what the spec declared (L2-148 AC1). A request
 * no answer matches gets 501, and the shared fixture fails the spec. The latest answer for a method and path wins, so
 * a spec can change one mid-test; `requests` lists what the page sent, in order, and `sentBodies` the JSON it sent.
 * Telo Ride 1 has no backend (ADR 0037, ADR 0043): the app makes no such request, so no answer is declared and any it
 * makes fails the spec.
 */
export class ApiFixture {
  private readonly answers = new Map<string, Handler>();
  private readonly sent: string[] = [];
  private readonly bodies: { readonly key: string; readonly body: unknown }[] = [];
  private readonly missed: string[] = [];
  private noNetwork = false;

  private constructor() {}

  static async install(page: Page): Promise<ApiFixture> {
    const api = new ApiFixture();
    // On the context, not the page: once the app cache's service worker controls the page, it makes the requests.
    await page.context().route(
      (url) =>
        ['localhost', '127.0.0.1'].includes(url.hostname) && url.pathname.startsWith('/api/'),
      async (route) => {
        const request = route.request();
        const key = `${request.method()} ${new URL(request.url()).pathname}`;
        api.sent.push(key);
        if (request.postData() !== null) api.bodies.push({ key, body: request.postDataJSON() });
        const handler = api.answers.get(key);
        if (!handler && api.noNetwork) {
          await route.abort('internetdisconnected');
          return;
        }
        if (!handler) {
          api.missed.push(key);
          await route.fulfill({
            status: 501,
            contentType: 'application/problem+json',
            body: '{"code":"unanswered"}',
          });
          return;
        }
        const reply = await handler(request);
        if (reply.offline || api.noNetwork) {
          await route.abort('internetdisconnected');
          return;
        }
        const status = reply.status ?? 200;
        const headers = reply.headers;
        await route.fulfill(
          reply.body === undefined
            ? { status, headers }
            : {
                status,
                headers,
                contentType: status >= 400 ? 'application/problem+json' : 'application/json',
                body: JSON.stringify(reply.body),
              },
        );
      },
    );
    return api;
  }

  /** Answers `method path` with 200 and `body`, or with whatever `handler` returns for the request. */
  answer(method: string, path: string, reply: Handler | unknown): void {
    this.answers.set(
      `${method} ${path}`,
      typeof reply === 'function' ? (reply as Handler) : () => ({ status: 200, body: reply }),
    );
  }

  /**
   * No network from now on: every request fails as a lost connection does, once its handler has replied, so an answer
   * a spec holds back still decides when the failure arrives.
   */
  offline(): void {
    this.noNetwork = true;
  }

  /** Every request the page sent to an API, as "METHOD /path", oldest first. */
  requests(): string[] {
    return [...this.sent];
  }

  /** The JSON bodies the page sent with `method path`, oldest first. */
  sentBodies(method: string, path: string): unknown[] {
    return this.bodies.filter((sent) => sent.key === `${method} ${path}`).map((sent) => sent.body);
  }

  /** The requests no answer matched; the shared fixture fails the spec when there are any. */
  unanswered(): string[] {
    return [...this.missed];
  }
}
