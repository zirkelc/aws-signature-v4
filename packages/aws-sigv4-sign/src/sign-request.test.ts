import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bodyFixture, credentials, date, getSignedHeaders, headersSigned, region, service, url } from './fixtures.js';
import { type SignRequestOptions, signRequest } from './sign-request.js';

declare global {
  interface RequestInit {
    duplex?: 'half';
  }

  interface Request {
    duplex?: 'half';
  }
}

vi.useFakeTimers();
vi.setSystemTime(date);

const options: SignRequestOptions = {
  service,
  region,
  credentials,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('signRequest', () => {
  describe('GET', () => {
    it('should fetch with string', async () => {
      const signedRequest = await signRequest(url, options);

      expect(signedRequest.url).toEqual(url);
      expect(signedRequest.method).toEqual('GET');
      expect(signedRequest.body).toEqual(null);

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);

      const authorization = signedHeaders.authorization;
      expect(authorization).toBe(
        'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7',
      );
    });

    it('should fetch with URL', async () => {
      const signedRequest = await signRequest(new URL(url), options);

      expect(signedRequest.url).toEqual(url);
      expect(signedRequest.method).toEqual('GET');
      expect(signedRequest.body).toEqual(null);

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);
      expect(signedHeaders.authorization).toBe(
        'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7',
      );
    });

    it('should fetch with Request', async () => {
      const signedRequest = await signRequest(new Request(url), options);

      expect(signedRequest.url).toEqual(url);
      expect(signedRequest.method).toEqual('GET');
      expect(signedRequest.body).toEqual(null);

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);
      expect(signedHeaders.authorization).toBe(
        'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa773e14e7b0ff9b9c7434ba0fd3b91e16a7707f95875e96ff387c1f4c7094e7',
      );
    });
  });

  describe('POST', () => {
    const method = 'POST';
    describe('Body: undefined', () => {
      const body = undefined;

      it('should fetch with string', async () => {
        const signedRequest = await signRequest(url, { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');
        expect(signedRequest.body).toEqual(null);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        const authorization = signedHeaders.authorization;
        expect(authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30',
        );
      });

      it('should fetch with URL', async () => {
        const signedRequest = await signRequest(new URL(url), { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');
        expect(signedRequest.body).toEqual(null);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30',
        );
      });

      it('should fetch with Request', async () => {
        const signedRequest = await signRequest(new Request(url, { method, body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');
        expect(signedRequest.body).toEqual(null);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=1e3b24fcfd7655c0c245d99ba7b6b5ca6174eab903ebfbda09ce457af062ad30',
        );
      });
    });

    describe('Body: string', () => {
      const { body } = bodyFixture.string;

      it('should fetch with string', async () => {
        const signedRequest = await signRequest(url, { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        const authorization = signedHeaders.authorization;
        expect(authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26',
        );
      });

      it('should fetch with URL', async () => {
        const signedRequest = await signRequest(new URL(url), { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26',
        );
      });

      it('should fetch with Request', async () => {
        const signedRequest = await signRequest(new Request(url, { method, body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26',
        );
      });
    });

    describe('Body: URLSearchParams', () => {
      const { body } = bodyFixture.urlSearchParams;

      it('should fetch with string', async () => {
        const signedRequest = await signRequest(url, { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const text = await signedRequest.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb',
        );
      });

      it('should fetch with URL', async () => {
        const signedRequest = await signRequest(new URL(url), { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const text = await signedRequest.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb',
        );
      });

      it('should fetch with Request', async () => {
        const signedRequest = await signRequest(new Request(url, { method, body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const text = await signedRequest.text();
        expect(text).toEqual(body.toString());

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=a2b8d86879c46ff096f7b7d021a410fe09697269f0630ac31bdd7640e62d4bdb',
        );
      });
    });

    describe('Body: FormData', () => {
      const { body, init } = bodyFixture.formData;

      it('should fetch with string', async () => {
        const signedRequest = await signRequest(url, { method, ...init }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const formData = await signedRequest.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2',
        );
      });

      it('should fetch with URL', async () => {
        const signedRequest = await signRequest(new URL(url), { method, ...init }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const formData = await signedRequest.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2',
        );
      });

      it('should fetch with Request', async () => {
        const signedRequest = await signRequest(new Request(url, { method, ...init }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const formData = await signedRequest.formData();
        expect(formData).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=49b9a46b57b6877323d917ebc6fa3ff0c521d9a3a512f3419ae35ded4f8f58a2',
        );
      });
    });

    describe('Body: Blob', () => {
      const { body } = bodyFixture.blob;

      it('should fetch with string', async () => {
        const signedRequest = await signRequest(url, { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const blob = await signedRequest.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232',
        );
      });

      it('should fetch with URL', async () => {
        const signedRequest = await signRequest(new URL(url), { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const blob = await signedRequest.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232',
        );
      });

      it('should fetch with Request', async () => {
        const signedRequest = await signRequest(new Request(url, { method, body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const blob = await signedRequest.blob();
        expect(blob).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=d645977d43102b68b395bd50c040f691da79150ada63172a42becc54faa2a232',
        );
      });
    });

    describe('Body: Uint8Array', () => {
      const { body } = bodyFixture.arrayBuffer;

      it('should fetch with string', async () => {
        const signedRequest = await signRequest(url, { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const arrayBuffer = await signedRequest.arrayBuffer();
        expect(arrayBuffer).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64',
        );
      });

      it('should fetch with URL', async () => {
        const signedRequest = await signRequest(new URL(url), { method, body }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const arrayBuffer = await signedRequest.arrayBuffer();
        expect(arrayBuffer).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64',
        );
      });

      it('should fetch with Request', async () => {
        const signedRequest = await signRequest(new Request(url, { method, body }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');

        const arrayBuffer = await signedRequest.arrayBuffer();
        expect(arrayBuffer).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=89f092f52faedb8a6be1890b2a511b88e7998389d62bd7d72915e2f4ee271a64',
        );
      });
    });

    describe('Duplex: Half', () => {
      const { body } = bodyFixture.string;

      it('should fetch with string', async () => {
        const signedRequest = await signRequest(url, { method: 'POST', body, duplex: 'half' }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');
        expect(signedRequest.duplex).toEqual('half');

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);

        const authorization = signedHeaders.authorization;
        expect(authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26',
        );
      });

      it('should fetch with URL', async () => {
        const signedRequest = await signRequest(new URL(url), { method: 'POST', body, duplex: 'half' }, options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');
        expect(signedRequest.duplex).toEqual('half');

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26',
        );
      });

      it('should fetch with Request', async () => {
        const signedRequest = await signRequest(new Request(url, { method: 'POST', body, duplex: 'half' }), options);

        expect(signedRequest.url).toEqual(url);
        expect(signedRequest.method).toEqual('POST');
        expect(signedRequest.duplex).toEqual('half');

        const text = await signedRequest.text();
        expect(text).toEqual(body);

        const signedHeaders = getSignedHeaders(signedRequest);
        expect(signedHeaders).toEqual(headersSigned);
        expect(signedHeaders.authorization).toBe(
          'AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/foo/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=9db1a3e5ba8d56d886872466535108231480376835a70889b107abb78766af26',
        );
      });
    });
  });

  describe('S3', () => {
    it.each([
      ['my file.txt', '813afaeb302f21d157ec74731fa061ffe0c2e3e9379a39ee90986e8a0d7ed1ab'],
      ['my%20file.txt', '813afaeb302f21d157ec74731fa061ffe0c2e3e9379a39ee90986e8a0d7ed1ab'],
      ['a/b%2Bc.txt', '0c51a2132cae2f84aa3ddd0af448b7424e409ce904b211b0dbe7c24d08a227dd'],
      ['%E2%82%AC.txt', '63c2792003d867c9380f75752a249bc140dbf90946987217776f33611621dec5'],
      ['dir//double.txt', '6d0929b1eb7825b0cc950e276c82c5cac101b4e697cd6a7620fffc2d8f81ab06'],
    ])('should sign the path of key %s without escaping it again', async (key, signature) => {
      // Arrange
      const s3Url = `https://bucket.s3.${region}.amazonaws.com/${key}`;

      // Act
      const signedRequest = await signRequest(s3Url, { ...options, service: 's3' });

      // Assert
      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders.authorization).toBe(
        `AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
      );
    });

    it.each([
      ['s3express', 'd416bddfba99ce36fb34b4ed888cb44fda12535519912fc22175e2ccdd338c65'],
      ['s3-outposts', 'f494ca536bfa25b31e7978c0208baf77dca5d37605d1e9d6d3bd9e9f431718ba'],
      ['s3-object-lambda', '0bc70c3065ffce62730d2680ed823a7d55b4f9427401c78abb3a34c779ddcfa1'],
    ])('should sign the path for service %s without escaping it again', async (s3Service, signature) => {
      // Arrange
      const s3Url = `https://bucket.s3.${region}.amazonaws.com/dir//my file.txt`;

      // Act
      const signedRequest = await signRequest(s3Url, { ...options, service: s3Service });

      // Assert
      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders.authorization).toBe(
        `AWS4-HMAC-SHA256 Credential=foo/20000101/us-bar-1/${s3Service}/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
      );
    });
  });

  describe('Defaults', () => {
    it('should use default region us-east-1', async () => {
      const signedRequest = await signRequest(url, { ...options, region: undefined });

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);

      const authorization = signedHeaders.authorization;
      expect(authorization).toBe(
        'AWS4-HMAC-SHA256 Credential=foo/20000101/us-east-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=67f6f44fa40ae4a9191fad86c952f4cd2a498ec6d86c57a66609d55cd219cc62',
      );
    });
  });

  describe('Credentials', () => {
    const originalWindow = global.window;
    const originalDocument = global.document;

    beforeEach(() => {
      global.window = undefined as any;
      global.document = undefined as any;

      return () => {
        global.window = originalWindow;
        global.document = originalDocument;
      };
    });

    it('should use default node credentials provider', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'alpha';
      process.env.AWS_SECRET_ACCESS_KEY = 'beta';

      const signedRequest = await signRequest(url, { ...options, credentials: undefined });

      const signedHeaders = getSignedHeaders(signedRequest);
      expect(signedHeaders).toEqual(headersSigned);

      const authorization = signedHeaders.authorization;
      expect(authorization).toBe(
        'AWS4-HMAC-SHA256 Credential=alpha/20000101/us-bar-1/foo/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=aa4d914f9488ac9c9ba7b7fdfd9b9e3d03f87fcaa78718e9bce640b5f134a934',
      );
    });

    it('should throw error if credentials are not provided in browser environment', async () => {
      global.window = {} as any;
      global.document = {} as any;

      const signedRequest = signRequest(url, { ...options, credentials: undefined });

      await expect(signedRequest).rejects.toThrow();
    });
  });
});
