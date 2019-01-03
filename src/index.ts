/**
 * A simple and lightweight HTTP request library by TypeScript for browsers.
 * The library prefers the window.fetch API and uses XMLHttpRequest without support.
 *
 * @author billjs
 * @see https://github.com/billjs/request
 * @license MIT(https://github.com/billjs/request/blob/master/LICENSE)
 */

import * as qs from '@billjs/query-string';
import { EventEmitter } from '@billjs/event-emitter';

export type RequestMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS';

export type RequestHeaders = Record<string, string>;

export type RequestType = 'json' | 'text' | 'urlencoded' | 'form';

export type RequestDataType = 'json' | 'text';

export type RequestContentType = string | false;

export type ParseFunction = (result: any) => ResponseData;

export interface RequestOptions {
  /**
   * The HTTP request method: `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, default `GET`.
   * This property value is case insensitive, meaning that `get` equals `GET`.
   *
   * @type {RequestMethod}
   * @memberof RequestOptions
   */
  method?: RequestMethod;

  /**
   * The customized HTTP request header. e.g. { "X-CSRF-Token": "123" }.
   *
   * @type {RequestHeaders}
   * @memberof RequestOptions
   */
  headers?: RequestHeaders;

  /**
   * The data submission type: `json`, `text`, `urlencoded`, `form`, default `json`.
   * The corresponding `Content-Type` request header will be set automatically by submission type.
   *  - **json**: submit by JSON, the request `Content-Type` is `application/json`.
   *  - **text**: submit by plainText, the request `Content-Type` is `text/plain`.
   *  - **urlencoded**: submit by form of urlEncoded, the request `Content-Type` is `application/x-www-form-urlencoded`.
   *  - **form**: submit by formData, the request `Content-Type` is `multipart/form-data`.
   *
   * @type {RequestType}
   * @memberof RequestOptions
   */
  type?: RequestType;

  /**
   * The response data types accepted: `json`, `text`, default `json`.
   * The corresponding `Content-Type` response header will be set by data type.
   *  - **json**: accept by JSON, the response `Content-Type` is `application/json`.
   *  - **text**: accpet by plainText, the response `Content-Type` is `text/plain`.
   *
   * @type {RequestDataType}
   * @memberof RequestOptions
   */
  dataType?: RequestDataType;

  /**
   * The request `Content-Type`, default `application/json`.
   * if the `type` is specified, the contentType corresponding to type is preferred.
   *
   * @type {RequestContentType}
   * @memberof RequestOptions
   */
  contentType?: RequestContentType;

  /**
   * The HTTP request timeout, default `0`, that means not set timeout.
   *
   * @type {number}
   * @memberof RequestOptions
   */
  timeout?: number;

  /**
   * Is forced to use XHR(`XMLHttpRequest`)? default `false`, will to uses `window.fetch` API.
   * In most cases, we recommend that you use the `window.fetch` API.
   *
   * @type {boolean}
   * @memberof RequestOptions
   */
  useXHR?: boolean;

  /**
   * Do you need to send `cookie` credentials?
   * if it is same origin, default is `true`.
   * Otherwise cross-domain, it is `false`, that means not send `cookie` credentials.
   * if you need to send `cookie` credentials for cross-domain, you need to specify it as `true`.
   *
   * @type {boolean}
   * @memberof RequestOptions
   */
  credentials?: boolean;

  /**
   * The customized HTTP response data parser for this request.
   * If it is not specified, will be to uses the global customized parser or the default parser.
   *
   * @type {ParseFunction}
   * @memberof RequestOptions
   */
  parse?: ParseFunction;

  /**
   * The HTTP request progress event handler.
   *
   * @memberof RequestOptions
   */
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * The RequestError class, it extends from Error.
 * Add `status` and `code` properties for it.
 * The `status` property is HTTP status.
 * The `code` property is error code of business.
 *
 * @export
 * @class RequestError
 * @extends {Error}
 */
export class RequestError extends Error {
  status: number = REQUEST_SUCCESS_STATUS;
  code: string = '' + REQUEST_SUCCESS_STATUS;
  constructor(
    status: number,
    code: string,
    msg: string,
    stack?: string | null
  ) {
    super(msg);
    this.status = status;
    this.code = code;
    if (stack) this.stack = stack;
  }
}

/**
 * The standardized response data structure.
 *
 * @export
 * @interface ResponseData
 */
export interface ResponseData {
  success: boolean;
  statusCode: number;
  errorCode: string | number;
  errorMessage: string | null;
  errorStack: string | null;
  data: any | null;
}

// the HTTP response data parser for `json` dataType.
let responseParseFunction: (ParseFunction) | null = null;

const eventEmitter = new EventEmitter();

/**
 * HTTP request.
 * It's a basic request method, you can use it to send request of any methods.
 * The `success` event will be triggered when the request succeeds, that means the `catchSuccess` will be called.
 * The `error` event will be triggered when the request fails, that means the `catchError` will be called.
 * And, whether successful or failed for request, the `complete` event all be triggered, that means the `catchComplete` all be called.
 *
 * @export
 * @param  {string} url request url
 * @param  {*} [data] request data
 * @param  {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<any>}
 * @example
 * fetch('/api/user/1234', null, { method: 'GET' })
 *  .then(data => console.log(data))
 *  .catch(err => console.log(err));
 */
export function fetch(url: string, data?: any, options: RequestOptions = {}) {
  // tslint:disable-next-line:no-use-before-declare
  const req = new Request(url, data, options);
  return req
    .request()
    .then(data => {
      eventEmitter.fire('success', { data, req });
      eventEmitter.fire('complete', { error: null, data, req });
      return data;
    })
    .catch(error => {
      eventEmitter.fire('error', { error, req });
      eventEmitter.fire('complete', { error, data: null, req });
      throw error;
    });
}

/**
 * Get data. It will be uses `GET` method to send request.
 * This is an idempotent request.
 *
 * @export
 * @param {string} url get request url
 * @param {string | Record<string, any> | null} [data] query argument. It can be either a stringified string or an object.
 * @param {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<any>}
 * @example
 * get('/api/user/1234')
 *  .then(user => console.log(user))
 *  .catch(err => console.log(err));
 */
export function get(
  url: string,
  data?: string | Record<string, any> | null,
  options: RequestOptions = {}
) {
  options.method = 'GET';
  return fetch(url, data, options);
}

/**
 * The `HEAD` method requests the same response as the `GET` request, but no response body.
 * You can use it to check if the API is working properly.
 * This is an idempotent request.
 *
 * @export
 * @param  {string} url head request url
 * @param  {string | Record<string, any> | null} [data] query argument. It can be either a stringified string or an object.
 * @param  {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<void>}
 * @example
 * head('/api/user/1234')
 *  .catch(err => console.log(err));
 */
export function head(
  url: string,
  data?: string | Record<string, any> | null,
  options: RequestOptions = {}
) {
  options.method = 'HEAD';
  return fetch(url, data, options);
}

/**
 * Submit data for new resource. It will be uses `POST` method to send request.
 * This is a non-idempotent request.
 *
 * @export
 * @param  {string} url post request url
 * @param  {*} data data of submitted to the server, that can be of any data type.
 * @param  {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<any>}
 * @example
 * post('/api/user', { name: 'test', age: 32 })
 *  .then(id => console.log(id))
 *  .catch(err => console.log(err));
 */
export function post(url: string, data: any, options: RequestOptions = {}) {
  options.method = 'POST';
  return fetch(url, data, options);
}

/**
 * Update data to replace resource. It will be uses `PUT` method to send request.
 * This is an idempotent request.
 *
 * @export
 * @param  {string} url put request url
 * @param  {*} data data of submitted to the server, that can be of any data type.
 * @param  {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<any>}
 * @example
 * put('/api/user/1234', { name: 'test', age: 22 })
 *  .catch(err => console.log(err));
 */
export function put(url: string, data: any, options: RequestOptions = {}) {
  options.method = 'PUT';
  return fetch(url, data, options);
}

/**
 * Similar to `PUT` requests, but only for local modifications. It will be uses `PATCH` method to send request.
 * This is a non-idempotent request.
 *
 * @export
 * @param {string} url patch request url
 * @param {*} data data of submitted to the server, that can be of any data type.
 * @param {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @returns {Promise<any>}
 * @example
 * patch('/api/user/1234', { age: 28 })
 *  .then(user => console.log(user))
 *  .catch(err => console.log(err));
 */
export function patch(url: string, data: any, options: RequestOptions = {}) {
  options.method = 'PATCH';
  return fetch(url, data, options);
}

/**
 * Delete data. It will be uses `DELETE` method to send request.
 * This is an idempotent request.
 *
 * @export
 * @param  {string} url delete request url
 * @param  {*} [data] data of submitted to the server, that can be of any data type.
 * @param  {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<any>}
 * @example
 * del('/api/user/1234')
 *  .then(success => console.log(success))
 *  .catch(err => console.log(err));
 */
export function del(url: string, data?: any, options: RequestOptions = {}) {
  options.method = 'DELETE';
  return fetch(url, data, options);
}

/**
 * The `OPTIONS` request, often used for cross-domain exploring.
 * This is an idempotent request.
 *
 * @export
 * @param  {string} url options request url
 * @param  {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<any>}
 * @example
 * options('/api/user')
 *  .then(res => console.log(res))
 *  .catch(err => console.log(err));
 */
export function options(url: string, options: RequestOptions = {}) {
  options.method = 'OPTIONS';
  return fetch(url, null, options);
}

/**
 * Upload form-data, such as file, etc.
 * It will be uses `Content-Type` of `multipart/form-data` to upload form-data.
 *
 * @export
 * @param  {string} url upload url
 * @param  {FormData} data form-data
 * @param  {RequestOptions} [options={}] additional options, such as `headers` and `type`, etc.
 * @return {Promise<any>}
 * @example
 * const formData = new FormData();
 * formData.append('image', blob);
 * upload('/api/upload/image', formData)
 *  .then(data => console.log(data))
 *  .catch(err => console.log(err));
 */
export function upload(
  url: string,
  data: FormData,
  options: RequestOptions = {}
) {
  options.type = 'form';
  return post(url, data, options);
}

/**
 * Global capture of all successful requests, then you can do something.
 *
 * @export
 * @param {(data: any, req: Request) => void} cb callback function. Any successful request will call this callback function.
 * @example
 * catchSuccess((data, req) => {
 *  console.log(data);
 * });
 */
export function catchSuccess(cb: (data: any, req: Request) => void) {
  eventEmitter.on('success', ({ data }) => cb(data.data, data.req));
}

/**
 * Global capture of all failed requets, then you can do something, such as to show an error message tips.
 *
 * @export
 * @param {(err: RequestError, req: Request) => void} cb callback function. Any failed request will call this callback function.
 * @example
 * catchError((err, req) => {
 *  Message.error(err.message);
 * });
 */
export function catchError(cb: (err: RequestError, req: Request) => void) {
  eventEmitter.on('error', ({ data }) => cb(data.error, data.req));
}

/**
 * Global capture all requests, whether successful or failed, then you can do something.
 *
 * @export
 * @param {((err: RequestError | null, data: any, req: Request) => void)} cb callback function. Any request will call this callback function.
 * @example
 * catchComplete((err, data, req) => {
 *  console.log(err, data);
 * });
 */
export function catchComplete(
  cb: (err: RequestError | null, data: any, req: Request) => void
) {
  eventEmitter.on('complete', ({ data }) => {
    cb(data.error, data.data, data.req);
  });
}

/**
 * The global customized HTTP response data parser, it only working for `json` dataType.
 * You can to specify the customized parser to parse response data for yourself case.
 * But you must have to return a correct response data by the `ResponseData` structure.
 * If your server responsive data structure is same as `ResponseData`, you don't need to specify the parse.
 *
 * @export
 * @param {ParseFunction} cb parser, the `result` argument is your server responsive data.
 * @example
 *  // if you have yourself response data structure, you can do it.
 *  parseResponse(result => {
 *    return {
 *      success: result.success,
 *      statusCode: 200,
 *      errorCode: result.error_code,
 *      errorMessage: result.error_msg,
 *      errorStack: result.error_stack ? result.error_stack : null,
 *      data: result.data,
 *    };
 *  });
 */
export function parseResponse(cb: ParseFunction) {
  responseParseFunction = cb;
}

// regexp for match absolute path, such as:
// `http://xxx`
// `https://xxx`
// `//xxx`
const ABSOLUTE_PATH_REG = /^(?:http[s]?:)?\/\/(.*?)/i;

// map for `dataType` and `Content-Type`
const contentTypes = {
  json: 'application/json',
  text: 'text/plain',
  urlencoded: 'application/x-www-form-urlencoded',
  form: 'multipart/form-data',
};

const REQUEST_SUCCESS_STATUS = 200;
const REQUEST_300_STATUS = 300;
const REQUEST_CACHE_STATUS = 304;

const REQUEST_TIMEOUT_STATUS = 504;
const REQUEST_TIMEOUT_CODE = '1001';
const REQUEST_TIMEOUT_MSG = 'Request Timeout';

const REQUEST_ERROR_STATUS = 500;
const REQUEST_ERROR_CODE = '1000';
const REQUEST_ERROR_MSG = 'Unknow Error';

const REQUEST_ABORT_STATUS = 400;
const REQUEST_ABORT_CODE = '1002';
const REQUEST_ABORT_MSG = 'Request Aborted';

export class Request {
  private _url: string = '';
  private _data: any = null;
  private _type: RequestType = 'json';
  private _dataType: RequestDataType = 'json';
  private headers: RequestHeaders = {
    Accept: contentTypes.json,
    'Content-Type': contentTypes.json,
  };
  private method: RequestMethod = 'GET';
  private timeout: number = 0;
  private useXHR: boolean = false;
  private cors: boolean = false;
  private credentials: boolean = false;
  private parse: (ParseFunction) | null = null;
  private onProgress?: (loaded: number, total: number) => void;

  private xhr: XMLHttpRequest | null = null;
  private fetchTimeoutTimer: number = 0;

  constructor(url: string, data: any, options: RequestOptions) {
    if (options.method) this.method = options.method;
    if (options.type) this.type = options.type;
    if (options.dataType) this.dataType = options.dataType;
    if (options.contentType !== void 0) this.contentType = options.contentType;
    if (options.timeout !== void 0) this.timeout = Math.max(0, options.timeout);
    if (options.useXHR !== void 0) this.useXHR = options.useXHR;
    if (options.credentials !== void 0) this.credentials = options.credentials;
    if (options.parse) this.parse = options.parse;
    this.onProgress = options.onProgress;
    this.url = this.resolveURL(url, data);
    this.data = data;
    // By default, non-cross-domain requests force to pass cookie credentials.
    // It means the `credentials` option of `options` will be ignored.
    if (!this.cors) this.credentials = true;
    if (options.headers) Object.assign(this.headers, options.headers);
  }

  resolveURL(url: string, data: any) {
    if (this.isQuery() && data) {
      if (typeof data !== 'string') data = qs.stringify(data);
      url += /^\?/.test(data) ? data : `?${data}`;
    }
    return url;
  }

  get url() {
    return this._url;
  }

  set url(val: string) {
    this._url = val;
    if (ABSOLUTE_PATH_REG.test(val)) {
      const domain = RegExp.$1;
      if (domain !== window.location.hostname) {
        this.cors = true;
      }
    }
  }

  get data() {
    return this._data;
  }

  set data(val: any) {
    if (this.isQuery() || val == null) {
      this._data = null;
      return;
    }
    if (this.type === 'json') {
      this._data = JSON.stringify(val);
      return;
    }
    if (this.type === 'urlencoded') {
      this._data = qs.stringify(val);
      return;
    }
    this._data = val;
  }

  get type() {
    return this._type;
  }

  set type(val: RequestType) {
    this._type = val;
    if (val === 'form') {
      this.contentType = false;
      return;
    }
    this.contentType = contentTypes[val];
  }

  get dataType() {
    return this._dataType;
  }

  set dataType(val: RequestDataType) {
    this._dataType = val;
    const accept = contentTypes[val];
    this.setHeader('Accept', accept || '*/*');
  }

  set contentType(val: RequestContentType) {
    if (val === false) {
      this.removeHeader('Content-Type');
      return;
    }
    this.setHeader('Content-Type', val);
  }

  setHeader(key: string, val: string) {
    this.headers[key] = val;
  }

  removeHeader(key: string) {
    delete this.headers[key];
  }

  isQuery() {
    return ['GET', 'HEAD'].includes(this.method);
  }

  request() {
    if (window.fetch && !this.useXHR) {
      return this.requestByFetchApi();
    }
    return this.requestByXHR();
  }

  private requestByFetchApi() {
    const settings: RequestInit = {
      body: this.data != null ? this.data : undefined,
      method: this.method,
      headers: this.headers,
      credentials: this.credentials ? 'include' : undefined,
      mode: this.cors ? 'cors' : undefined,
      cache: 'default',
    };

    const tasks = [];

    if (this.timeout > 0) tasks.push(this.createFetchTimeout());

    const { promise: abortPromise, abort } = this.createFetchAbort();
    tasks.push(abortPromise);

    const fetchPromise = window
      .fetch(this.url, settings)
      .then(res => this.onFetchLoad(res))
      .catch(err => this.onFetchError(err));
    tasks.push(fetchPromise);

    // `fetch`, `timeout`, `abort` 3 promises,
    // any one of which takes the load in changing the state,
    // that is, the requests ends.
    return Promise.race(tasks);
  }

  private requestByXHR() {
    const xhr = new (window as any).XMLHttpRequest();
    this.xhr = xhr;

    xhr.withCredentials = this.credentials;
    xhr.open(this.method, this.url);

    for (const name in this.headers) {
      xhr.setRequestHeader(name, this.headers[name]);
    }

    xhr.upload.addEventListener('progress', this.progressHandler, false);

    // wrap as `Promise`
    const promise = new Promise<any>((resolve, reject) => {
      // 错误事件捕捉
      xhr.onerror = this.onXHRError(reject);
      xhr.onabort = this.onXHRAbort(reject);
      if (this.timeout > 0) {
        xhr.timeout = this.timeout;
        xhr.ontimeout = this.onXHRTimeout(reject);
      }
      xhr.onload = this.onXHRLoad(resolve, reject);
    });

    xhr.send(this.data);

    return promise;
  }

  private onFetchLoad(res: Response) {
    this.finallyFetch();
    return new Promise((resolve, reject) => {
      const status = res.status;
      this.parseFetchData(res)
        .then(result => {
          // if HTTP status is exceptional, such as <200 or >=300, then throw error.
          if (
            status < REQUEST_SUCCESS_STATUS ||
            (status >= REQUEST_300_STATUS && status !== REQUEST_CACHE_STATUS)
          ) {
            const msg = result.errormsg || res.statusText || REQUEST_ERROR_MSG;
            reject(
              new RequestError(status, result.errorcode || '' + status, msg)
            );
            return;
          }
          try {
            resolve(this.parseResponse(result));
          } catch (err) {
            reject(err);
          }
        })
        .catch(reject);
    });
  }

  private parseFetchData(res: Response) {
    switch (this.dataType) {
      case 'json':
        return this.parseFetchJSONData(res);
      case 'text':
        return this.parseFetchTextData(res);
      default:
        return Promise.resolve('');
    }
  }

  private parseFetchJSONData(res: Response) {
    return new Promise<any>(resolve => {
      res
        .json()
        .then(resolve)
        .catch(() => resolve({}));
    });
  }

  private parseFetchTextData(res: Response) {
    return new Promise<string>(resolve => {
      res
        .text()
        .then(resolve)
        .catch(() => resolve(''));
    });
  }

  private onFetchError(err: any) {
    this.finallyFetch();
    throw err;
  }

  private createFetchAbort() {
    let abort!: () => void;
    const promise = new Promise((resolve, reject) => {
      abort = () => {
        const err = new RequestError(
          REQUEST_ABORT_STATUS,
          REQUEST_ABORT_CODE,
          REQUEST_ABORT_MSG
        );
        reject(err);
        this.finallyFetch();
      };
    });
    return { promise, abort };
  }

  private createFetchTimeout() {
    return new Promise((resolve, reject) => {
      this.fetchTimeoutTimer = window.setTimeout(() => {
        const err = new RequestError(
          REQUEST_TIMEOUT_STATUS,
          REQUEST_TIMEOUT_CODE,
          REQUEST_TIMEOUT_MSG
        );
        reject(err);
        this.finallyFetch();
      }, this.timeout);
    });
  }

  private finallyFetch() {
    if (this.fetchTimeoutTimer) {
      window.clearTimeout(this.fetchTimeoutTimer);
      this.fetchTimeoutTimer = 0;
    }
  }

  private onXHRLoad(
    resolve: (value?: any) => void,
    reject: (reason?: any) => void
  ) {
    return () => {
      if (!this.xhr) return;
      const xhr = this.xhr;
      if (xhr.readyState === 4) {
        this.finallyXHR();

        let result: any = xhr.responseText || '';
        if (this.dataType === 'json') {
          result = result ? JSON.parse(result) : {};
        }

        const status = xhr.status;
        // if HTTP status is exceptional, such as <200 or >=300, then throw error.
        if (
          status < REQUEST_SUCCESS_STATUS ||
          (status >= REQUEST_300_STATUS && status !== REQUEST_CACHE_STATUS)
        ) {
          const msg = result.errormsg || xhr.statusText || REQUEST_ERROR_MSG;
          reject(
            new RequestError(status, result.errorcode || '' + status, msg)
          );
          return;
        }

        try {
          resolve(this.parseResponse(result));
        } catch (err) {
          reject(err);
        }
      }
    };
  }

  private onXHRError(reject: (reason?: any) => void) {
    return () => {
      const err = new RequestError(
        REQUEST_ERROR_STATUS,
        REQUEST_ERROR_CODE,
        REQUEST_ERROR_MSG
      );
      reject(err);
      this.finallyXHR();
    };
  }

  private onXHRAbort(reject: (reason?: any) => void) {
    return () => {
      const err = new RequestError(
        REQUEST_ABORT_STATUS,
        REQUEST_ABORT_CODE,
        REQUEST_ABORT_MSG
      );
      reject(err);
      this.finallyXHR();
    };
  }

  private onXHRTimeout(reject: (reason?: any) => void) {
    return () => {
      const err = new RequestError(
        REQUEST_TIMEOUT_STATUS,
        REQUEST_TIMEOUT_CODE,
        REQUEST_TIMEOUT_MSG
      );
      reject(err);
      this.finallyXHR();
    };
  }

  private finallyXHR() {
    if (!this.xhr) return;
    this.xhr.upload.removeEventListener('progress', this.progressHandler);
    this.xhr.ontimeout = this.xhr.onload = this.xhr.onerror = this.xhr.onabort = null;
    this.xhr = null;
  }

  private progressHandler = (evt: ProgressEvent) => {
    if (this.onProgress) {
      this.onProgress(evt.loaded, evt.total);
    }
  };

  private parseResponse(result: any) {
    if (this.dataType === 'json') {
      const parse = this.parse || responseParseFunction || defaultParseResponse;
      const responseData = parse(result);
      // When the request is failed, then throw an error,
      // and the caller decides whether to catch the error and display the error prompt feedback.
      // When the caller does not do any error capture processing, the error will overflow to the top scope.
      // Then it, the browser finally throws out the script running error and prints the error stack on the console.
      if (!responseData.success) {
        throw new RequestError(
          responseData.statusCode,
          '' + responseData.errorCode,
          responseData.errorMessage || REQUEST_ERROR_MSG,
          responseData.errorStack
        );
      }
      return responseData.data;
    }
    return result;
  }
}

function defaultParseResponse(result: any) {
  let responseData: ResponseData;
  if (result.hasOwnProperty('success') && result.hasOwnProperty('data')) {
    responseData = result;
    if (!responseData.statusCode) {
      responseData.statusCode = REQUEST_SUCCESS_STATUS;
    }
    if (!responseData.errorCode) responseData.errorCode = 0;
    if (responseData.errorMessage === void 0) responseData.errorMessage = null;
    if (responseData.errorStack === void 0) responseData.errorStack = null;
    return responseData;
  }
  return {
    success: true,
    statusCode: REQUEST_SUCCESS_STATUS,
    errorCode: 0,
    errorMessage: null,
    errorStack: null,
    data: result,
  };
}
