import { type RequestOptions, request } from 'node:https';
import { signRequest } from 'aws-sigv4-sign';
import { describe, expect, it } from 'vitest';

const SERVICE = 'iam';
const REGION = 'us-east-1';

interface NodeHttpResponse {
  status: number;
  statusText?: string;
  data?: string;
}

function nodeRequest(url: string, options: RequestOptions, body?: string): Promise<NodeHttpResponse> {
  return new Promise((resolve, reject) => {
    const req = request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          statusText: res.statusMessage,
          data,
        }),
      );
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

describe('node-http', () => {
  describe('GET', () => {
    const url = 'https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08';
    const method = 'GET';

    it('should make request with signed headers', async () => {
      // Arrange
      const signedRequest = await signRequest(url, { method }, { service: SERVICE, region: REGION });

      // Act
      const response = await nodeRequest(signedRequest.url, {
        method,
        headers: Object.fromEntries(signedRequest.headers.entries()),
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toContain('<GetUserResult>');
    });

    it('should fail with unsigned request', async () => {
      // Arrange

      // Act
      const response = await nodeRequest(url, { method });

      // Assert
      expect(response.status).toBe(403);
      expect(response.statusText).toBe('Forbidden');
    });
  });

  describe('POST', () => {
    const url = 'https://iam.amazonaws.com/';
    const method = 'POST';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    };
    const body = 'Action=GetUser&Version=2010-05-08';

    it('should make request with signed headers', async () => {
      // Arrange
      const signedRequest = await signRequest(url, { method, headers, body }, { service: SERVICE, region: REGION });

      // Act
      const response = await nodeRequest(
        signedRequest.url,
        { method, headers: Object.fromEntries(signedRequest.headers.entries()) },
        body,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toContain('<GetUserResult>');
    });

    it('should fail with unsigned request', async () => {
      // Arrange

      // Act
      const response = await nodeRequest(url, { method, headers }, body);

      // Assert
      expect(response.status).toBe(403);
      expect(response.statusText).toBe('Forbidden');
    });
  });
});
