# request [![Travis-ci Status](https://api.travis-ci.org/billjs/request.svg?branch=master)](https://travis-ci.org/billjs/request) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/billjs/request/blob/master/LICENSE) ![typescript | javascript | node.js](https://img.shields.io/badge/language-typescript%20%7C%20javascript%20%7C%20node.js-yellow.svg) [![Npm Version](https://img.shields.io/npm/v/@billjs/request.svg)](https://www.npmjs.com/package/@billjs/request) [![NPM Download](https://img.shields.io/npm/dm/@billjs/request.svg)](https://npmcharts.com/compare/@billjs/request?minimal=true)

A simple and lightweight HTTP request library by TypeScript for browsers.
The library prefers the `window.fetch` API and uses `XMLHttpRequest` without support.

## Installation

Installation is done using the `npm install` command:

```shell
npm install -S @billjs/request
```

## Overview

- [fetch](#fetch)
- [get](#get)
- [head](#head)
- [post](#post)
- [put](#put)
- [patch](#patch)
- [del](#del)
- [options](#options)
- [upload](#upload)
- [catchSuccess](#catchsuccess)
- [catchError](#catcherror)
- [catchComplete](#catchcomplete)
- [parseResponse](#parseresponse)

## API

### fetch

HTTP request.
It's a basic request method, you can use it to send request of any methods.
The `success` event will be triggered when the request succeeds, that means the [catchSuccess](#catchsuccess) will be called.
The `error` event will be triggered when the request fails, that means the [catchError](#catcherror) will be called.
And, whether successful or failed for request, the `complete` event all be triggered, that means the [catchComplete](#catchcomplete) all be called.

- **url** (`string`) request url
- _**[data]**_ (`any` `optional`) request data, such as `text` `JSON` `FormData`, etc.
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`) it return a `Promise`, you can use `then` and `catch` methods of `Promise` or `async/await` to resolve result.

Use `then` and `catch` methods of `Promise` to resolve result.

```typescript
fetch('/api/user/1234', null, { method: 'GET' })
  .then(data => console.log(data))
  .catch(err => console.log(err));
```

Use `async/await` to resolve result.

```typescript
async function getUser(uid: string) {
  try {
    const user = await fetch('/api/user/1234', null, { method: 'GET' });
    console.log(user);
  } catch (err) {
    console.error(err);
  }
}
```

### get

Get data.
It will be uses `GET` method to send request. This is an idempotent request.

- **url** (`string`) get request url
- _**[data]**_ (`string | object | null`) query argument. It can be either a stringified string or an object.
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
get('/api/user/1234')
  .then(user => console.log(user))
  .catch(err => console.log(err));
```

### head

The `HEAD` method requests the same response as the `GET` request, but no response body. You can use it to check if the API is working properly. This is an idempotent request.

- **url** (`string`) head request url
- _**[data]**_ (`string | object | null`) query argument. It can be either a stringified string or an object.
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
head('/api/user/1234').catch(err => console.log(err));
```

### post

Submit data for new resource. It will be uses `POST` method to send request. This is a non-idempotent request.

- **url** (`string`) post request url
- _**[data]**_ (`any`) data of submitted to the server, that can be of any data type.
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
post('/api/user', { name: 'test', age: 32 })
  .then(id => console.log(id))
  .catch(err => console.log(err));
```

### put

Update data to replace resource. It will be uses `PUT` method to send request. This is an idempotent request.

- **url** (`string`) put request url
- _**[data]**_ (`any`) data of submitted to the server, that can be of any data type.
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
put('/api/user/1234', { name: 'test', age: 22 }).catch(err => console.log(err));
```

### patch

Similar to `PUT` requests, but only for local modifications. It will be uses `PATCH` method to send request. This is a non-idempotent request.

- **url** (`string`) patch request url
- _**[data]**_ (`any`) data of submitted to the server, that can be of any data type.
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
patch('/api/user/1234', { age: 28 })
  .then(user => console.log(user))
  .catch(err => console.log(err));
```

### del

Delete data. It will be uses `DELETE` method to send request. This is an idempotent request.

- **url** (`string`) delete request url
- _**[data]**_ (`any`) data of submitted to the server, that can be of any data type.
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
del('/api/user/1234')
  .then(success => console.log(success))
  .catch(err => console.log(err));
```

### options

The `OPTIONS` request, often used for cross-domain exploring. This is an idempotent request.

- **url** (`string`) options request url
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
options('/api/user')
  .then(res => console.log(res))
  .catch(err => console.log(err));
```

### upload

Upload form-data, such as file, etc. It will be uses `Content-Type` of `multipart/form-data` to upload form-data.

- **url** (`string`) upload url
- _**[data]**_ (`FormData`) form-data
- _**[options]**_ ([RequestOptions](#requestoptions) `optional`) additional options, such as `headers` and `type`, etc.
- **return** (`Promise`)

```typescript
const formData = new FormData();
formData.append('image', blob);
upload('/api/upload/image', formData)
  .then(data => console.log(data))
  .catch(err => console.log(err));
```

### catchSuccess

Global capture of all successful requests, then you can do something.

- **cb** (`(data: any, req: Request) => void`) callback function. Any successful request will call this callback function. The `req` argument is a [Request](#request) instance.

```typescript
catchSuccess((data, req) => {
  console.log(data);
});
```

### catchError

Global capture of all failed requets, then you can do something, such as to show an error message tips.

- **cb** (`(err: RequestError, req: Request) => void`) callback function. Any failed request will call this callback function. The `err` argument is a [RequestError](#requesterror) instance.

```typescript
catchError((err, req) => {
  // show an error message
  Message.error(err.message);
});
```

### catchComplete

Global capture all requests, whether successful or failed, then you can do something.

- **cb** (`(err: RequestError | null, data: any, req: Request) => void`) callback function. Any request will call this callback function.

```typescript
catchComplete((err, data, req) => {
  console.log(err, data);
});
```

### parseResponse

The global customized HTTP response data parser, it only working for `json` dataType.
You can to specify the customized parser to parse response data for yourself case. But you must have to return a correct response data by the `ResponseData` structure.
If your server responsive data structure is same as `ResponseData`, you don't need to specify the parse.

- **cb** (`ParseFunction`) parser, the `result` argument is your server responsive data. The `return` is an [ResponseData](#responsedata) instance.

If you have yourself response data structure, you can do it.
Such as it:

```typescript
parseResponse(result => {
  return {
    success: result.success,
    statusCode: 200,
    errorCode: result.error_code,
    errorMessage: result.error_msg,
    errorStack: result.error_stack ? result.error_stack : null,
    data: result.data,
  };
});
```

## Request

A class for HTTP request, name it as `Request`. It implements all the logical details of request.
Most of the time, you don't need to create a `Request` instance to send HTTP requests, just call the above shortcuts.

The declaration of constructor like this:

```typescript
constructor(url: string, data: any, options: RequestOptions);
```

- **url** (`string`) request url
- **data** (`any`) request data, such as `text` `JSON` `FormData`, etc.
- **options** ([RequestOptions](#requestoptions)) additional options, such as `headers` and `type`, etc.

## RequestOptions

The options for every request, you can to pass some options to `Request` for your case.

The option list:

- **method** (`RequestMethod`) The HTTP request method, see [RequestMethod](#requestmethod), default `GET`.
- **headers** (`RequestHeaders`) The customized HTTP request header. e.g. { "X-CSRF-Token": "123" }. It is key-value Map.
- **type** (`RequestType`) The data submission type, see [RequestType](#requesttype), default `json`.
- **dataType** (`RequestDataType`) The response data types accepted, see [RequestDataType](#requestdatatype), default `json`.
- **contentType** (`RequestContentType`) The request `Content-Type`, see [RequestContentType](#requestcontenttype), default `application/json`.
- **timeout** (`number`) The HTTP request timeout, default `0`, that means not set timeout.
- **useXHR** (`boolean`) Is forced to use XHR(`XMLHttpRequest`)? default `false`, will to uses `window.fetch` API. In most cases, we recommend that you use the `window.fetch` API.
- **credentials** (`boolean`) Do you need to send `cookie` credentials? If it is same origin, default is `true`. Otherwise cross-domain, it is `false`, that means not send `cookie` credentials. If you need to send `cookie` credentials for cross-domain, you need to specify it as `true`.
- **parse** (`ParseFunction`) The customized HTTP response data parser for this request. If it is not specified, will be to uses the global customized parser or the default parser.
- **onProgress** (`(loaded: number, total: number) => void`) The HTTP request progress event handler.

### RequestMethod

The HTTP request method: `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
This property value is case insensitive, meaning that `get` equals `GET`.

### RequestType

The data submission type: `json`, `text`, `urlencoded`, `form`.
The corresponding `Content-Type` request header will be set automatically by submission type.

- **json**: submit by JSON, the request `Content-Type` is `application/json`.
- **text**: submit by plainText, the request `Content-Type` is `text/plain`.
- **urlencoded**: submit by form of urlEncoded, the request `Content-Type` is `application/x-www-form-urlencoded`.
- **form**: submit by formData, the request `Content-Type` is `multipart/form-data`.

### RequestDataType

The response data types accepted: `json`, `text`.
The corresponding `Content-Type` response header will be set by data type.

- **json**: accept by JSON, the response `Content-Type` is `application/json`.
- **text**: accpet by plainText, the response `Content-Type` is `text/plain`.

### RequestContentType

The request `Content-Type`, default `application/json`.
If the `type` is specified, the contentType corresponding to type is preferred.
If the value is `false`, that means not set `Content-Type` customize header. Such as, When you upload a file, you need to specify it as `false`.

## RequestError

The RequestError class, it extends from Error.
Add `status` and `code` properties for it. The `status` property is HTTP status. The `code` property is error code of business.

The declaration of constructor like this:

```typescript
constructor(status: number, code: string, msg: string, stack?: string | null);
```

## ResponseData

The standardized response data structure.

- **success** (`boolean`) the status of success or failure.
- **statusCode** (`number`) the status code, it same as HTTP status.
- **errorCode** (`string` | `number`) the error code, when request is failure.
- **errorMessage** (`string` | `null`) the error message, when request is failed. If request is successful, it is `null`.
- **errorStack** (`string` | `null`) the error stack, when request is failed. Only for `development` mode, otherwise is `null`.
- **data** (`any` | `null`) the response data, it is any type. If request is failed, it is `null`.

But as a caller, you will be only got `data` property to keep it simple, and you don't need to care about otherthings.

## License

[MIT License](LICENSE)
