import { NetworkRequest } from '../types';

export class HarExporter {
  static export(requests: NetworkRequest[]): string {
    const entries = requests.map((req) => {
      const requestHeaders = Object.entries(req.headers || {}).map(([name, value]) => ({
        name,
        value: String(value)
      }));
      const responseHeaders = Object.entries(req.responseHeaders || {}).map(([name, value]) => ({
        name,
        value: String(value)
      }));

      let postDataObj = undefined;
      if (req.postData && req.method !== 'GET') {
        const text = typeof req.postData === 'string' ? req.postData : req.postData.text || '';
        postDataObj = {
          mimeType:
            req.headers?.['Content-Type'] || req.headers?.['content-type'] || 'application/json',
          text: text
        };
      }

      const timestampInMs = (req.timestamp || Date.now() / 1000) * 1000;
      const responseTimestampInMs = (req.responseTimestamp || req.timestamp || 0) * 1000;
      const timeMs = Math.max(0, responseTimestampInMs - timestampInMs);

      return {
        startedDateTime: new Date(timestampInMs).toISOString(),
        time: timeMs,
        request: {
          method: req.method,
          url: req.url,
          httpVersion: 'HTTP/1.1',
          cookies: [], // Can parse cookies if necessary
          headers: requestHeaders,
          queryString: this.parseQueryString(req.url),
          postData: postDataObj,
          headersSize: -1,
          bodySize: -1
        },
        response: {
          status: req.responseStatus || 0,
          statusText: '',
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: responseHeaders,
          content: {
            size: -1,
            mimeType: req.mimeType || 'application/json',
            text: req.errorText || ''
          },
          redirectURL: '',
          headersSize: -1,
          bodySize: -1
        },
        cache: {},
        timings: {
          send: 0,
          wait: timeMs,
          receive: 0
        }
      };
    });

    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'Easy API Collector',
          version: '1.0.0'
        },
        entries: entries
      }
    };
    return JSON.stringify(har, null, 2);
  }

  private static parseQueryString(url: string): { name: string; value: string }[] {
    try {
      const parsedUrl = new URL(url);
      const params: { name: string; value: string }[] = [];
      parsedUrl.searchParams.forEach((value, name) => {
        params.push({ name, value });
      });
      return params;
    } catch {
      return [];
    }
  }
}
