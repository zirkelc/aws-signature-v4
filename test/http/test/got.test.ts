import { signRequest } from 'aws-sigv4-sign';
import got from 'got';
import { describe, expect, it } from 'vitest';

const SERVICE = 'iam';
const REGION = 'us-east-1';

describe('got', () => {
  describe('GET', () => {
    const url = 'https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08';

    it('should make request with signed headers', async () => {
      // Arrange
      const signedRequest = await signRequest(url, { service: SERVICE, region: REGION });

      // Act
      const response = await got(signedRequest.url, {
        headers: Object.fromEntries(signedRequest.headers.entries()),
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('<GetUserResult>');
    });

    it('should fail with unsigned request', async () => {
      // Arrange

      // Act
      const result = got(url);

      // Assert
      await expect(result).rejects.toThrow();
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
      const response = await got(signedRequest.url, {
        method,
        headers: Object.fromEntries(signedRequest.headers.entries()),
        body,
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('<GetUserResult>');
    });

    it('should fail with unsigned request', async () => {
      // Arrange

      // Act
      const result = got(url, { method, headers, body });

      // Assert
      await expect(result).rejects.toThrow();
    });
  });
});
