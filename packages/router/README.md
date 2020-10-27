# @xhr-mock/router

A router for dispatching requests and responses.

## Installation

```bash
yarn add @xhr-mock/router
```

## Usage

```js
import Router, {Mode} from '@xhr-mock/router';

const router = new Router()
  .get('/', {status: 200, body: 'Hello World!'})
  .use((req) => ({
    status: 200,
    body: JSON.stringify(req),
  }));

const response = router.routeSync(
  {
    method: 'get',
    url: '/foo/bar',
  },
  {},
);
```

> Depending on your runtime environment you may require a polyfill for `URL` e.g. `url-polyfill`.

## API

### `new Router()`

### `.on(event, listener)`

### `.off(event, listener)`

### `.use(middleware)`

### `.use(method, url, response)`

### `.use(method, url, middleware)`

### `.all(url, response)`

### `.all(url, middleware)`

### `.get(url, response)`

### `.get(url, middleware)`

### `.post(url, response)`

### `.post(url, middleware)`

### `.put(url, response)`

### `.put(url, middleware)`

### `.delete(url, response)`

### `.delete(url, middleware)`

### `.routeSync(request, response)`

### `.routeAsync(request, response)`

## How To

### How to match query strings

Matching requests based on query strings isn't supported out-of-the-box yet. You can implement it yourself like this:

```js
mock.get('/search', (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get('q') === 'cats') {
    return {status: 200};
  } else {
    return {status: 404};
  }
});
```

## License

MIT Licensed. Copyright (c) James Newell 2014.
