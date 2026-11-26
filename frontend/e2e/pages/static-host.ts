import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

/** What the host answered for one address: its status, its content type and its headers, names in lower case. */
export interface HostAnswer {
  readonly status: number;
  readonly type: string;
  readonly headers: Readonly<Record<string, string>>;
}

/** The host's configuration as Azure Static Web Apps reads it (ADR 0043): the parts the specs hold to L2. */
export interface HostConfiguration {
  readonly navigationFallback: { readonly rewrite: string; readonly exclude: readonly string[] };
  readonly globalHeaders: Readonly<Record<string, string>>;
  readonly routes: readonly {
    readonly route: string;
    readonly headers?: Readonly<Record<string, string>>;
  }[];
}

/**
 * The static host as a browser meets it (L2-149 AC1, L2-009 AC2; ADR 0043): what it answers for an address, and the
 * configuration the production build carries for it. The spec server (`scripts/serve-dist.mjs`) serves the build as
 * that file says, so an answer here is the file's doing.
 */
export class StaticHost {
  constructor(private readonly page: Page) {}

  /** `staticwebapp.config.json` as the production build carries it, beside `index.html`. */
  static configuration(): HostConfiguration {
    return JSON.parse(
      readFileSync(join(__dirname, '../../dist/ride/browser/staticwebapp.config.json'), 'utf8'),
    ) as HostConfiguration;
  }

  /** Opens `path` as a rider does, by its address, and resolves to what the host answered. */
  async open(path: string): Promise<HostAnswer> {
    const response = await this.page.goto(path);
    if (response === null) throw new Error(`${path} was not answered`);
    return {
      status: response.status(),
      type: StaticHost.type(response.headers()),
      headers: response.headers(),
    };
  }

  /** Asks the host for `path` without opening it. */
  async answer(path: string): Promise<HostAnswer> {
    const response = await this.page.request.get(path);
    return {
      status: response.status(),
      type: StaticHost.type(response.headers()),
      headers: response.headers(),
    };
  }

  /** The scripts and stylesheets the open page loaded from its own origin, as paths: the build's hashed files. */
  hashedFiles(): Promise<string[]> {
    return this.page.evaluate(() =>
      [
        ...[...document.scripts].map((script) => script.src),
        ...[...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(
          (link) => link.href,
        ),
      ]
        .filter((address) => address.startsWith(location.origin))
        .map((address) => new URL(address).pathname),
    );
  }

  private static type(headers: Record<string, string>): string {
    return (headers['content-type'] ?? '').split(';')[0]!;
  }
}
