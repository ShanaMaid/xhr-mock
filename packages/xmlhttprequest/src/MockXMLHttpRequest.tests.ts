/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {Router} from '@xhr-mock/router';
import {MockXMLHttpRequest} from './MockXMLHttpRequest';

const exampleURL = 'http://example.com/';

function failOnError(done: jest.DoneCallback) {
  return function() {
    done.fail('The error event occurred');
  };
}

function successOnEvent(done: jest.DoneCallback) {
  return function() {
    done();
  };
}

const createXHR = () => {
  const events: string[] = [];
  const router = new Router();
  const xhr = new MockXMLHttpRequest();

  MockXMLHttpRequest.router = router;

  // mute logging of successful requests
  router.on('after', jest.fn());

  // record upload events
  const pushUploadEvent = (event: ProgressEvent) => {
    events.push(`upload:${event.type}`);
  };
  xhr.upload.addEventListener('loadstart', pushUploadEvent);
  xhr.upload.addEventListener('progress', pushUploadEvent);
  xhr.upload.addEventListener('load', pushUploadEvent);
  xhr.upload.addEventListener('loadend', pushUploadEvent);

  // record download events
  const pushDownloadEvent = (event: Event) => {
    events.push(
      `xhr:${event.type}${
        event.type === 'readystatechange' ? `[${xhr.readyState}]` : ''
      }`,
    );
  };
  xhr.addEventListener('readystatechange', pushDownloadEvent);
  xhr.addEventListener('loadstart', pushDownloadEvent);
  xhr.addEventListener('progress', pushDownloadEvent);
  xhr.addEventListener('load', pushDownloadEvent);
  xhr.addEventListener('loadend', pushDownloadEvent);

  return {events, router, xhr};
};

describe('MockXMLHttpRequest', () => {
  describe('.response', () => {
    it('should return an empty string when type is empty string and the request is not loading and is not done', () => {
      const {xhr} = createXHR();
      xhr.responseType = '';
      xhr.open('get', exampleURL);
      expect(xhr.response).toEqual('');
    });

    it('should return an empty string when type is text and the request is not loading and is not done', () => {
      const {xhr} = createXHR();
      xhr.responseType = 'text';
      xhr.open('get', exampleURL);
      expect(xhr.response).toEqual('');
    });

    it('should return the responseText when type is empty string and the request is done', done => {
      const {router, xhr} = createXHR();
      router.use(() => ({body: 'Hello World!'}));
      xhr.responseType = '';
      xhr.onload = () => {
        expect(xhr.response).toEqual('Hello World!');
        done();
      };
      xhr.onerror = failOnError(done);
      xhr.open('get', exampleURL);
      xhr.send();
    });

    it('should return the responseText when type is text and the request is done', done => {
      const {router, xhr} = createXHR();
      router.use(() => ({body: 'Hello World!'}));
      xhr.responseType = '';
      xhr.onload = () => {
        expect(xhr.response).toEqual('Hello World!');
        done();
      };
      xhr.onerror = failOnError(done);
      xhr.open('get', exampleURL);
      xhr.send();
    });

    it('should return null when type is json and the request is not done', () => {
      const {router, xhr} = createXHR();
      router.use(() => ({body: '{}'}));
      xhr.responseType = 'json';
      xhr.open('get', exampleURL);
      expect(xhr.response).toEqual(null);
    });

    it('should return json when the type is json and the request is done', done => {
      const {router, xhr} = createXHR();
      router.use(() => ({body: '{"foo": "bar"}'}));
      xhr.responseType = 'json';
      xhr.onload = () => {
        try {
          expect(xhr.response).toEqual({foo: 'bar'});
          done();
        } catch (error) {
          done.fail(error);
        }
      };
      xhr.onerror = failOnError(done);
      xhr.open('get', exampleURL);
      xhr.send();
    });

    it('should return null when the type is other and the request is not done', () => {
      const fakeBuffer = {};
      const {router, xhr} = createXHR();
      router.use(() => ({body: fakeBuffer}));
      xhr.responseType = 'blob';
      xhr.open('get', exampleURL);
      expect(xhr.response).toEqual(null);
    });

    it('should return an object when the type is other and the request is done', done => {
      const fakeBuffer = {};
      const {router, xhr} = createXHR();
      router.use(() => ({body: fakeBuffer}));
      xhr.responseType = 'blob';
      xhr.onload = () => {
        try {
          expect(xhr.response).toBe(fakeBuffer);
          done();
        } catch (error) {
          done.fail(error);
        }
      };
      xhr.onerror = failOnError(done);
      xhr.open('get', exampleURL);
      xhr.send();
    });
  });

  describe('.setRequestHeader()', () => {
    it('should set a header', done => {
      expect.assertions(1);

      const {router, xhr} = createXHR();
      router.use(req => {
        expect(req.headers['content-type']).toEqual('application/json');
        return {};
      });

      xhr.open('GET', exampleURL);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = successOnEvent(done);
      xhr.onerror = failOnError(done);
      xhr.send();
    });
  });

  describe('.getResponseHeader()', () => {
    it('should have a response header', done => {
      expect.assertions(1);
      const {router, xhr} = createXHR();
      router.use(() => {
        return {headers: {'Content-Type': 'application/json'}};
      });
      xhr.open('get', exampleURL);
      xhr.onloadend = () => {
        expect(xhr.getResponseHeader('Content-Type')).toEqual(
          'application/json',
        );
        done();
      };
      xhr.onerror = failOnError(done);
      xhr.send();
    });
  });

  describe('.getAllResponseHeaders()', () => {
    it('should have return headers as a string', done => {
      const {router, xhr} = createXHR();
      router.use(() => {
        return {
          headers: {
            'Content-Type': 'application/json',
            'X-Powered-By': 'SecretSauce',
          },
        };
      });
      xhr.open('get', exampleURL);
      xhr.onload = () => {
        expect(xhr.getAllResponseHeaders()).toEqual(
          'content-type: application/json\r\nx-powered-by: SecretSauce\r\n',
        );
        done();
      };
      xhr.onerror = failOnError(done);
      xhr.send();
    });
  });

  describe('.constructor()', () => {
    it('should set .readyState to UNSENT', () => {
      const {xhr} = createXHR();
      expect(xhr.readyState).toEqual(MockXMLHttpRequest.UNSENT);
    });
  });

  describe('.open()', () => {
    it('should set .readyState to OPEN', () => {
      const {xhr} = createXHR();
      xhr.open('get', exampleURL);
      expect(xhr.readyState).toEqual(MockXMLHttpRequest.OPENED);
    });

    it('should call .onreadystatechange', () => {
      const callback = jest.fn();
      const {xhr} = createXHR();
      xhr.onreadystatechange = callback;
      xhr.open('get', exampleURL);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('.send()', () => {
    it('should throw an error when .open() has not been called', () => {
      const {xhr} = createXHR();
      expect(() => xhr.send()).toThrow();
    });

    describe('async=false', () => {
      it('should dispatch events in order when both the request and response do not contain a body', () => {
        const {events, router, xhr} = createXHR();
        router.use(() => ({}));
        xhr.open('get', exampleURL, false);
        xhr.send();
        expect(events).toEqual([
          'xhr:readystatechange[1]', // OPENED
          'xhr:readystatechange[4]', // DONE
          'xhr:load',
          'xhr:loadend',
        ]);
      });

      it('should dispatch events in order when request has a body', () => {
        const {events, router, xhr} = createXHR();
        router.use(() => ({}));
        xhr.open('put', exampleURL, false);
        xhr.send('hello world!');
        expect(events).toEqual([
          'xhr:readystatechange[1]', // OPENED
          'xhr:readystatechange[4]', // DONE
          'xhr:load',
          'xhr:loadend',
        ]);
      });

      it('should dispatch events in order when response has a body', () => {
        const {events, router, xhr} = createXHR();
        router.use(() => ({body: 'Hello World'}));
        xhr.open('put', exampleURL, false);
        xhr.send();
        expect(events).toEqual([
          'xhr:readystatechange[1]', // OPENED
          'xhr:readystatechange[4]', // DONE
          'xhr:load',
          'xhr:loadend',
        ]);
      });
    });
  });

  describe('async=true', () => {
    it('should dispatch events in order when both the request and response do not contain a body', done => {
      const {events, router, xhr} = createXHR();
      router.use(() => ({}));
      xhr.open('get', exampleURL);
      xhr.onloadend = () => {
        expect(events).toEqual([
          'xhr:readystatechange[1]', // OPENED
          'xhr:loadstart',
          'xhr:readystatechange[2]', // HEADERS_RECEIVED
          'xhr:readystatechange[3]', // LOADING
          'xhr:progress',
          'xhr:readystatechange[4]', // DONE
          'xhr:load',
        ]);
        done();
      };
      xhr.send();
    });

    it('should dispatch events in order when request has a body', done => {
      const {events, router, xhr} = createXHR();
      router.use(() => ({}));
      xhr.open('put', exampleURL);
      xhr.onloadend = () => {
        expect(events).toEqual([
          'xhr:readystatechange[1]', // OPENED
          'xhr:loadstart',
          'upload:loadstart',
          'upload:progress',
          'upload:load',
          'upload:loadend',
          'xhr:readystatechange[2]', // HEADERS_RECEIVED
          'xhr:readystatechange[3]', // LOADING
          'xhr:progress',
          'xhr:readystatechange[4]', // DONE
          'xhr:load',
        ]);
        done();
      };
      xhr.send('hello world!');
    });

    it('should dispatch events in order when response has a body', done => {
      const {events, router, xhr} = createXHR();
      router.use(() => ({body: 'Hello World'}));
      xhr.open('put', exampleURL);
      xhr.onloadend = () => {
        expect(events).toEqual([
          'xhr:readystatechange[1]', // OPENED
          'xhr:loadstart',
          'xhr:readystatechange[2]', // HEADERS_RECEIVED
          'xhr:readystatechange[3]', // LOADING
          'xhr:progress',
          'xhr:readystatechange[4]', // DONE
          'xhr:load',
        ]);
        done();
      };
      xhr.send();
    });
  });
  //TODO: check values of all events

  it('should set the request body when .send() is called with a body', done => {
    const {router, xhr} = createXHR();
    router.use(req => {
      expect(req.body).toEqual('Hello World!');
      return {};
    });
    xhr.onload = successOnEvent(done);
    xhr.onerror = failOnError(done);
    xhr.open('post', exampleURL);
    xhr.send('Hello World!');
  });

  it('should not set the request body when .send() is not called with a body', done => {
    const {router, xhr} = createXHR();
    router.use(req => {
      expect(req.body).toBeUndefined();
      return {};
    });
    xhr.onload = successOnEvent(done);
    xhr.onerror = failOnError(done);
    xhr.open('get', exampleURL);
    xhr.send();
  });

  it('should time out when .timeout > 0 and no response is resloved within the time', done => {
    const start = Date.now();
    let end: number;
    const {router, xhr} = createXHR();
    router.use(
      () =>
        new Promise(() => {
          /* do nothing */
        }),
    );
    xhr.timeout = 100;
    xhr.ontimeout = () => {
      end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
      expect(xhr.readyState).toEqual(4);
      done();
    };
    xhr.onerror = failOnError(done);
    xhr.open('get', exampleURL);
    xhr.send();
  });

  it('should not time out when .timeout > 0 and the request was aborted', done => {
    const {router, xhr} = createXHR();
    router.use(
      () =>
        new Promise(() => {
          /* do nothing */
        }),
    );
    xhr.timeout = 100;
    xhr.ontimeout = failOnError(done);
    xhr.onabort = successOnEvent(done);
    xhr.onerror = failOnError(done);
    xhr.open('get', exampleURL);
    xhr.send();
    xhr.abort();
  });

  it('should not time out when .timeout > 0 and the request errored', done => {
    const {router, xhr} = createXHR();
    router.on('error', jest.fn());
    router.use(() => Promise.reject(new Error('test!')));
    xhr.timeout = 100;
    xhr.ontimeout = failOnError(done);
    xhr.onerror = successOnEvent(done);
    xhr.open('get', exampleURL);
    xhr.send();
  });

  it('should set the request Content-Type header when the request Content-Type header has not been set and a body has been provided', done => {
    const {router, xhr} = createXHR();
    router.use(() => ({
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
      },
    }));
    xhr.onload = successOnEvent(done);
    xhr.onerror = failOnError(done);
    xhr.open('post', exampleURL);
    xhr.send('hello world!');
  });

  it('should not set the request Content-Type header when the request Content-Type header has been set and a body has been provided', done => {
    const {router, xhr} = createXHR();
    router.use(() => ({
      headers: {
        'Content-Type': 'foo/bar',
      },
    }));
    xhr.onload = successOnEvent(done);
    xhr.onerror = failOnError(done);
    xhr.open('post', exampleURL);
    xhr.setRequestHeader('content-type', 'foo/bar');
    xhr.send('hello world!');
  });

  it('should be able to send another request after the previous request errored', done => {
    const {router, xhr} = createXHR();
    router.on('error', jest.fn());
    router.use(() => Promise.reject(new Error('test!')));
    xhr.timeout = 100;
    xhr.ontimeout = failOnError(done);
    xhr.onerror = () => {
      try {
        xhr.open('get', exampleURL);
        xhr.send();
        xhr.abort();
        done();
      } catch (error) {
        done.fail(error);
      }
    };
    xhr.open('get', exampleURL);
    xhr.send();
  });
});
