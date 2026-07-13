import { signRequest } from 'aws-sigv4-sign';
import { describe, expect, it } from 'vitest';

const SERVICE = 'iam';
const REGION = 'us-east-1';

describe('fetch', () => {
  describe('GET', () => {
    const url = 'https://iam.amazonaws.com/?Action=GetUser&Version=2010-05-08';

    it('should make request with signed headers', async () => {
      // Arrange
      const signedRequest = await signRequest(url, { service: SERVICE, region: REGION });

      // Act
      const response = await fetch(signedRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('<GetUserResult>');
    });

    it('should fail with unsigned request', async () => {
      // Arrange

      // Act
      const response = await fetch(url);

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
      const response = await fetch(signedRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('<GetUserResult>');
    });

    it('should fail with unsigned request', async () => {
      // Arrange

      // Act
      const response = await fetch(url, { method, headers, body });

      // Assert
      expect(response.status).toBe(403);
      expect(response.statusText).toBe('Forbidden');
    });
  });
});
