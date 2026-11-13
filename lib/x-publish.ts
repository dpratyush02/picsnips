/**
 * Publishing boundary.
 *
 * Today, PicSnips can only open X's public composer. X does not accept
 * image bytes on that URL, so the composer receives the caption and the
 * person attaches the downloaded files themselves.
 *
 * A future signed-in publisher can implement `XPublisher` with OAuth 2.0
 * (PKCE) and the X media upload API. The UI should keep calling `publish`
 * and should not grow a second posting flow.
 */
export interface PublishRequest {
  text: string;
  imageCount: number;
  filenames: string[];
}

export interface PublishResult {
  mode: "intent" | "api";
  opened: boolean;
}

export interface XPublisher {
  readonly mode: "intent" | "api";
  publish(request: PublishRequest): Promise<PublishResult>;
}

export class IntentComposerPublisher implements XPublisher {
  readonly mode = "intent" as const;

  async publish(request: PublishRequest): Promise<PublishResult> {
    const intent = new URL("https://twitter.com/intent/tweet");
    const text = request.text.trim();
    if (text) intent.searchParams.set("text", text);

    const popup = window.open(intent.toString(), "_blank");
    if (popup) popup.opener = null;

    return { mode: "intent", opened: popup !== null };
  }
}

/**
 * Extension point for authenticated posting. Not wired up: there is no
 * X client id in this build, and the UI must not pretend a post was published.
 */
export class XApiPublisher implements XPublisher {
  readonly mode = "api" as const;

  constructor(private readonly accessToken: string) {}

  async publish(): Promise<PublishResult> {
    if (!this.accessToken) {
      throw new Error("X API publishing is not configured.");
    }
    throw new Error("Direct X publishing is not available in this version.");
  }
}

export function createPublisher(): XPublisher {
  return new IntentComposerPublisher();
}
