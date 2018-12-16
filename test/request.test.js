import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import * as rq from '../lib';
import { startServer, closeServer } from '../test-server';

describe('Request', () => {
  let successTotal = 41;
  let errorTotal = 8;
  let successCount = 0;
  let errorCount = 0;
  let completeCount = 0;

  rq.catchSuccess(() => successCount++);
  rq.catchError(() => errorCount++);
  rq.catchComplete(() => completeCount++);

  before(() => {
    startServer(8080);
    const { window } = new JSDOM(null, {
      url: 'http://localhost:8080/',
    });
    global.window = window;
    global.document = window.document;
  });

  after(() => closeServer());

  describe('#get()', () => {
    const user = { id: '1234', name: 'test', age: 32 };
    it('should get data (window.fetch)', async () => {
      const data = await rq.get('/api/user/1234');
      expect(data).to.deep.eq(user);
    });
    it('should get data (XHR)', async () => {
      const data = await rq.get('/api/user/1234', null, { useXHR: true });
      expect(data).to.deep.eq(user);
    });

    it('should get data by pass `data` argument (window.fetch)', async () => {
      const data = await rq.get('/api/user/1234', { sex: true });
      expect(data).to.deep.eq({ ...user, sex: 'M' });
    });
    it('should get data by pass `data` argument (XHR)', async () => {
      const data = await rq.get(
        '/api/user/1234',
        { sex: true },
        { useXHR: true }
      );
      expect(data).to.deep.eq({ ...user, sex: 'M' });
    });

    it('should get data by pass `data` argument that need to encoded (window.fetch)', async () => {
      const data = await rq.get('/api/user/1234', { city: 'bj&sz' });
      expect(data).to.deep.eq({ ...user, city: 'bj&sz' });
    });
    it('should get data by pass `data` argument that need to encoded (XHR)', async () => {
      const data = await rq.get(
        '/api/user/1234',
        { city: 'bj&sz' },
        { useXHR: true }
      );
      expect(data).to.deep.eq({ ...user, city: 'bj&sz' });
    });

    it('should get data by pass `data` argument of string type (window.fetch)', async () => {
      const data = await rq.get('/api/user/1234', 'sex=true');
      expect(data).to.deep.eq({ ...user, sex: 'M' });
    });
    it('should get data by pass `data` argument of string type (XHR)', async () => {
      const data = await rq.get('/api/user/1234', 'sex=true', {
        useXHR: true,
      });
      expect(data).to.deep.eq({ ...user, sex: 'M' });
    });

    it('should get data by pass `data` argument of string that encoded (window.fetch)', async () => {
      const data = await rq.get('/api/user/1234', 'city=bj%26sz');
      expect(data).to.deep.eq({ ...user, city: 'bj&sz' });
    });
    it('should get data by pass `data` argument of string that encoded (XHR)', async () => {
      const data = await rq.get('/api/user/1234', 'city=bj%26sz', {
        useXHR: true,
      });
      expect(data).to.deep.eq({ ...user, city: 'bj&sz' });
    });

    it('should get data for cross-domain (window.fetch)', async () => {
      const uri = 'https://httpbin.org/get';
      const data = await rq.get(uri);
      expect(data).to.have.property('url', 'https://httpbin.org/get');
    }).timeout(4000);
    it('should get data for cross-domain (XHR)', async () => {
      const uri = 'https://httpbin.org/get';
      const data = await rq.get(uri, null, { useXHR: true });
      expect(data).to.have.property('url', 'https://httpbin.org/get');
    }).timeout(4000);

    it('should get data of plaintext (window.fetch)', async () => {
      const user = `{"success":true,"statusCode":200,"errorCode":0,"errorMessage":null,"data":{"id":"1234","name":"test","age":32}}`;
      const text = await rq.get('/api/user/1234', null, { dataType: 'text' });
      expect(text).to.eq(user);
    });
    it('should get data of plaintext (XHR)', async () => {
      const user = `{"success":true,"statusCode":200,"errorCode":0,"errorMessage":null,"data":{"id":"1234","name":"test","age":32}}`;
      const text = await rq.get('/api/user/1234', null, {
        dataType: 'text',
        useXHR: true,
      });
      expect(text).to.eq(user);
    });

    it('should get data that throw an error (window.fetch)', async () => {
      try {
        const data = await rq.get('/api/user/digest');
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('message', 'Internal Server Error');
      }
    });
    it('should get data that throw an error (XHR)', async () => {
      try {
        const data = await rq.get('/api/user/digest', null, { useXHR: true });
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('message', 'Internal Server Error');
      }
    });

    it('should get data that throw an error(200 status) (window.fetch)', async () => {
      try {
        const data = await rq.get('/api/user/digest', { code: 200 });
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('message', 'Internal Server Error');
      }
    });
    it('should get data that throw an error(200 status) (XHR)', async () => {
      try {
        const data = await rq.get(
          '/api/user/digest',
          { code: 200 },
          { useXHR: true }
        );
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('message', 'Internal Server Error');
      }
    });

    it('should get data that response 404 - Not Found (window.fetch)', async () => {
      try {
        const data = await rq.get('/api/notfound');
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('status', 404);
      }
    });
    it('should get data that response 404 - Not Found (XHR)', async () => {
      try {
        const data = await rq.get('/api/notfound', null, { useXHR: true });
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('status', 404);
      }
    });

    it('should get data that response data is non-standardized (window.fetch)', async () => {
      const data = await rq.get('/api/old/user/1234');
      expect(data).to.deep.eq(user);
    });
    it('should get data that response data is non-standardized (XHR)', async () => {
      const data = await rq.get('/api/old/user/1234', null, {
        useXHR: true,
      });
      expect(data).to.deep.eq(user);
    });

    const parseOuterData = result => {
      return {
        success: true,
        statusCode: 200,
        errorCode: result.error_code,
        errorMessage: result.error,
        errorStack: null,
        data: result.result,
      };
    };

    it('should get data that response data is customized (window.fetch)', async () => {
      const data = await rq.get('/api/outer/user/1234', null, {
        parse: parseOuterData,
      });
      expect(data).to.deep.eq(user);
    });
    it('should get data that response data is customized (XHR)', async () => {
      const data = await rq.get('/api/outer/user/1234', null, {
        useXHR: true,
        parse: parseOuterData,
      });
      expect(data).to.deep.eq(user);
    });

    it('should get data timeout(2s) (window.fetch)', async () => {
      try {
        const data = await rq.get('/api/timeout', null, { timeout: 2000 });
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('status', 504);
      }
    }).timeout(3000);
    it('should get data timeout(2s) (XHR)', async () => {
      try {
        const data = await rq.get('/api/timeout', null, {
          timeout: 2000,
          useXHR: true,
        });
        expect(data).to.be.false;
      } catch (err) {
        expect(err).to.have.property('status', 504);
      }
    }).timeout(3000);
  });

  describe('#head()', () => {
    it('should head request (window.fetch)', async () => {
      try {
        const data = await rq.head('/api/user/1234');
        expect(data).to.not.false;
      } catch (err) {
        expect(err).to.be.false;
      }
    });
    it('should head request (XHR)', async () => {
      try {
        const data = await rq.head('/api/user/1234', null, { useXHR: true });
        expect(data).to.not.false;
      } catch (err) {
        expect(err).to.be.false;
      }
    });

    it('should head request for cross-domain (window.fetch)', async () => {
      try {
        const data = await rq.head('https://httpbin.org/get');
        expect(data).to.not.false;
      } catch (err) {
        expect(err).to.be.false;
      }
    });

    it('should head request for cross-domain (XHR)', async () => {
      try {
        const data = await rq.head('https://httpbin.org/get', null, {
          useXHR: true,
        });
        expect(data).to.not.false;
      } catch (err) {
        expect(err).to.be.false;
      }
    });
  });

  describe('#post()', () => {
    const user = { name: 'test', age: 32 };
    it('should post data of `json` type (window.fetch)', async () => {
      const id = await rq.post('/api/user', user);
      expect(id).to.eq('1234');
    });
    it('should post data of `json` type (XHR)', async () => {
      const id = await rq.post('/api/user', user, { useXHR: true });
      expect(id).to.eq('1234');
    });

    it('should post data of `urlencoded` type (window.fetch)', async () => {
      const id = await rq.post('/api/user', user, { type: 'urlencoded' });
      expect(id).to.eq('1234');
    });
    it('should post data of `urlencoded` type (XHR)', async () => {
      const id = await rq.post('/api/user', user, {
        type: 'urlencoded',
        useXHR: true,
      });
      expect(id).to.eq('1234');
    });

    it('should post data of `form` type (window.fetch)', async () => {
      const formData = new window.FormData();
      for (const key in user) {
        formData.append(key, user[key]);
      }
      const id = await rq.post('/api/user', formData, { type: 'form' });
      expect(id).to.eq('1234');
    });

    it('should post data of `form` type (XHR)', async () => {
      const formData = new window.FormData();
      for (const key in user) {
        formData.append(key, user[key]);
      }
      const id = await rq.post('/api/user', formData, {
        type: 'form',
        useXHR: true,
      });
      expect(id).to.eq('1234');
    });

    it('should post data of `text` type (window.fetch)', async () => {
      const id = await rq.post(
        '/api/text',
        'React is a JavaScript library for building user interfaces.',
        { type: 'text' }
      );
      expect(id).to.eq('12345');
    });
    it('should post data of `text` type (XHR)', async () => {
      const id = await rq.post(
        '/api/text',
        'React is a JavaScript library for building user interfaces.',
        { type: 'text', useXHR: true }
      );
      expect(id).to.eq('12345');
    });

    it('should post data that has custom header', async () => {
      const headers = { 'X-Mocha-TEST': 'v1.0.0' };
      const id = await rq.post('/api/user', user, { headers });
      expect(id).to.eq('4321');
    });
  });

  describe('#put()', () => {
    const user = { name: 'test', age: 22 };
    it('should put data (window.fetch)', async () => {
      try {
        const res = await rq.put('/api/user/1234', user);
        expect(res).to.not.false;
      } catch (err) {
        expect(err).to.be.false;
      }
    });
    it('should put data (XHR)', async () => {
      try {
        const res = await rq.put('/api/user/1234', user, { useXHR: true });
        expect(res).to.not.false;
      } catch (err) {
        expect(err).to.be.false;
      }
    });
  });

  describe('#patch()', () => {
    it('should patch data (window.fetch)', async () => {
      const data = await rq.patch('/api/user/1234', { age: 28 });
      expect(data).to.deep.eq({ id: '1234', name: 'test', age: 28 });
    });
    it('should patch data (XHR)', async () => {
      const data = await rq.patch(
        '/api/user/1234',
        { age: 28 },
        { useXHR: true }
      );
      expect(data).to.deep.eq({ id: '1234', name: 'test', age: 28 });
    });
  });

  describe('#del()', () => {
    it('should delete data (window.fetch)', async () => {
      const res = await rq.del('/api/user/1234');
      expect(res).to.be.true;
    });
    it('should delete data (XHR)', async () => {
      const res = await rq.del('/api/user/1234', null, { useXHR: true });
      expect(res).to.be.true;
    });
  });

  describe('#fetch()', () => {
    it('should request data by `fetch` method (window.fetch)', async () => {
      const data = await rq.fetch('/api/user/1234', null, { method: 'GET' });
      expect(data).to.deep.eq({ id: '1234', name: 'test', age: 32 });
    });
    it('should request data by `fetch` method (XHR)', async () => {
      const data = await rq.fetch('/api/user/1234', null, {
        method: 'GET',
        useXHR: true,
      });
      expect(data).to.deep.eq({ id: '1234', name: 'test', age: 32 });
    });
  });

  describe('#upload()', () => {
    const dataURI =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIgAAADSCAMAAACmcXjxAAAABGdBTUEAALGPC/xhBQAAArVQTFRF/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sB/2sBAAAA/2sB5g59wgAAAOZ0Uk5TlpIulF+/rGf3bj13vdRdDp5hhJkVI3/CSDWhJHw23EOFRq4XgcDKgnuRWGLRYwVH8xZ5K1aTRJfH6SzGW3Nmq0W+hxonsia7tmrWjnZNTotXOeyk41S4PDvx6286UnDtQTTO9XJMyFXB7y/a0tVopdMpSzLPdTDXXpyPG+JahqjMSZWzUxKn3ebeD9sfeCUtm83qo+6KbXoYifDYXPIcKsMxnbmY4eDnaSFCujjQNxRlEdlR5Q1rtfh0IBkdP4CN/koIt8uaDN9AByiqC/kQAgYz9LCQ9uT8+hMD+wno/VBgCgQBoABE3i1NAAALzElEQVR42r2d918USROHeeO9l3POOefTM5x3Z7xkzjnneKYz3xnOiAQzZgUTQUREVJKISpIswsIui7tr9d/xAi4wO9vVXT1h+yc+TtW3n92dme6uqm7DoK2dGAMhbmNOtP8d1v7nPXdCaDkS3Pf4IGz09lBybB/NMBC2Iy90HK4dDAdhT4QO5AkmAmEfh4rjYyYGuXw8NBzHL0tA2NbzoeA4v5XhIH+1XGMbfPZz+Dbc72sTF+T2/Ytsn/0g+/xd3RaCuLPt5sh2k0BY2jl7Oc6lMRoIu27rbeK7zsQgt9quswg7QSLa+7kleHxbWu0I+zhG1Lb3c08Gwmpsu03O1TAVENtuE80NQgNhV+wBucJUQUoX28GxuFQZhKWWWM9RksoIIB8GGrGb1oPc1HXxIRekWmfFhlnNMUzfQzUNZPcRazmO7KaBXNWbsZn1VnLUzwzq4CoXJCfIztoZwb5g/RwqiDPZOo5kJxXkSrAhm+OxisMzhyN/hQsynmPJ1lsFsp6nPp4Lks4zZZ9bw/E5VzydC3KXa5u20QqOjWlc8bsKIGyBFSALmALIOL4xazTP0YhIj+OCYNYNdWY56hrkn1EDkoBYm/9xFmDKCVyQZMzc7I/TiAonc0G+Ru0bysxwlDWgwl9zQTJQexZrBiQW183ggpThDsxEdC1BIFvGBfEKPF4zPOZ4XhPIerkgUCpw6WEUpIdAtBT4IBMEPs6jxjiOOgWiExCQUwIf9q6hFZfvXZHmKQRkrsiJLTcCslwoORcB6Sr02mkguHZ+p1CyKwJySeilnXJTW7VY8RICskvs5ixW5Sh2ihV3ISC/id3YdVWQ6xLB3xCQVyR+bJ0axzqZ3isIyBmZ47xyFY7yeTK9XxCQGTJH7dRO3u5K5WYgIGOlnicr6BwVJ6VyYxGQl6WeTCHbNkau9jIC4pG7nnZROVyn5WoeBAS+kPumU0HS5VpVgIH8Kncu8NI4vAVyrWUoyHC5M/uOBvIdQWo4CnKC4L2EBrKEIHUCBYkgeLNKCkclRSkCBfmIqX4OrFG+W/YRCrKY4n6YEH8tOUxRWoyCeCju7IIc5AJJyIOCiGetCqutWIrOKcBBfqYInJZOo32nKTrXBSD7SV/pJBnIJJLMfgHI3ySFqTKQqSSZvwUgPUkKt2Qgt0gyqwQgUENRqJGBGFHRgewifRZJsuAISWSXEGSggV83qNHutIFCkDInRSNHDJJD0XCWCUEgjiLygxjkvxSNRBCDfEMROSgGOUjR+EYCUkG542uLRBxFtQSJtAoJCPSlfJzZIpDZFIW+IAPJH2x2AKYMvYPzpSD8tA2e8JElu/ltPMhBXIS75FsRyLeEt6qLAALfy4V+EoH8JPf/Higg3k+kQptFIJul7p94SSCQLVUqFYGUSt151VQ8kNaKNEF7G+d4W+r8F1BBsqaYWNxIlzRTssggsFQm1g8H6SfzXQp0EO9kidgZHEQWAJvsVQCBSsl48ScO8qdknEJ+VQSEUzpBLXK5Kfa8CmogHnF8ozcOskEcX/EogsDEXJHedBxkuhBkIqiCiOPoW3GQrcbi+TiIJ1wgeAcHuSNwC/cYAIGRboEkGl10CZzcI8EIiHAlnIk5ZZJXu3SQorO45kLMaSHuc7bIIAgcvYyKDsJ8BqEul4X5SSEI7FXPmFxDXfaCcRAfmvpZg7msQeMyPhMgkLmTkGoJaL9guclMMAOCftNoqdw+xOEamAPBRr89mP0etbGODlKxQ2345Q++OypMg0DkF0rhK27YqioSzIPAIUpUQbyqOQRWgMAKjvQxzPgYx3gFWAPi+p3zusaMOcPC7y6LQKC4Kkh8DmYbXKRZRUrlk0A4t8kpzPSUkRuEDBL8UB7ALA8ozLMNgBTdoE7R/qczXFtkKQhk6Cu4MUOd2e4MsBYE1ulm9Rf5ZhcDrXLJBRZkEHgnsAukpLMu0OodsB6kPA6r7gv4CQOM4sptAIG61do++vCNemltVitUwiqAwKvaWNAffJs/tHGlV8EekICIAwHkDNgFot2Ck8S3SGq3uAf2geS1v9cK+RaFbQY38mwEgazOVJDOWWAnCGQ7xZPh1sm2U3VDqCpI25oLKchuJK2mrABpvWHFIPfAfhD/DSsEuZEXAhDIahCsOVtKehqyIBQgMNaBF+k1l+M5xkJoQOBJMciTECoQWCkCWQmhA6mPw0Hi6kMIAudTMZBUg+cOGASBYiTReaEYQgpSlIJNFVOKQgmS1DUKu9SlU1LIQFwDHIL4zzXHAFdoQB4KZw+Krj/Iwh8KAUj+P3LF+ecmTZbbId9ukIQCxhIlNa3eRMYKEmwFeTy6uR52m8xs27Ims+jH7QO51ryyGRwvN4xvLrlYfc0mkLKWKZGDdNrDCEfL9Oi8HSCN93e5PUazfqzFuKHRcpBnNknzrIHNn3Xd9Iy1IDNG++utyBugfD/c9xg9w0KQmNYzUm4o7JLztC7GbsdYBbK8dbva0EyV5yCzNXow4d+WgKxq2xFVpXjY0vG2qOilVaZBfCltddTu/qqv7f5tedLDKT5zIPGJsnILYdMUYCXGmwDxpWtCztFGZhnRmgB0us8oSOTzmqhL9wojIBXdtYmESEMg9VO1yfXUjUZn2doo8dR6dZDigKqH3X0MzomhT0CkeHqxIoj3g4Dcs6MQDLdCR0AW+gOvCsjstYFx20/BRPtUF5yfTQb5LMdJTGnSmi7x6cz5jAYySZ+wul1uDqT8tj6lNYkAkvenvuBqielzhEr0+49qe+TJQJKCCpa3WHBkzpEtQWXTSUIQT3VQFc2dSrCgVQYV/LirPThIdrhyMT61cY7yCM9GQPJ5p7d8BRa1rzji6/N5IG/ythu9BJa1l3ibVN8MAimL5qXSj1VYB1LxPK+H6LJAkEXcM2Q2W3pO3DluDXLaIg1IHX83y4FisLQVH+Dvb6lrBbnAPyCk9kewuHXkF6c2jGsBKcEqnOeD5W0+VgVdAmH1icjFlWBDW4ltcqkPw8rxL9XbAVKPndbwQNh7/AtzL4It7SJyksZ7Yfxy+gbbzjfezn8ySsP4hbyLwLa2iNthbhh/H3iSfSBJ3A5/DeMXsG3uZRdHL34p8p6wui3cC7Mm2sMxcRa3uy11YRDF39jjuGsHx10Hf+NPVPMrftsAfv3sG5YfSOp7g19xO2Cbf9DLGMLfxeqylsPF3/U6JEMzDajszjPp9KWVHF924vXxn0rdDG0a79iSgoXWcSzkbYKYNy14quhN4ezkHmXZVODHUZzd5Sle7iw+/7ngUkBnijUcKcHbZquey0fXNTFPB09d9pebxygPrvWvvRkjXOkdDd6V8pbpYy89bwWJbjgqXYQXrtU73YgxxxGjry9kawsp0QDfGv39fTLKDEeU/tScgjU+YqCmqJtuRDj8gnGOF3QHXsy6UqQQutp4NXBQcJ8xynEmcFnvuLpRMZgXv0k3lzY0h63XnZ+1Kd5AnPXFwDN3exuI15T0DpCY+aLByHO/gKjN5J6qHD0D9h0e7G88Fu+dr53q1qhmJ4Zqp+PzvWaSApD/vmaDadU0FY5pmgFjyvuyjLQ8X5O5ov2171YoL9vb/ri4V8gzTpQMVhfN8mw98eGp/5dm0diF4EBLLr7evqXkZ9IS8GL7ITM7Xid1Qcxylh9qe0+fJRSZZbVtXDh5iDh4kxPQeUtbwyynpQHPytYlyoG+5BI9lZrnav9r/44kv93oD6o6qm2qeYZn/dNwdzeRVTf/43LrWRVtxfqRZP/2mafRt5PXf8zVMcXzzJUrahrv58bikCKSbfer51MvqOqq1xh501v27j3KjaBsf7RlT166F+wHaXpJPNV8N3bmfPfJzUPTnaeMRJuM1aGtis1t6jDoPz8Y1gSYG7vKkKTREsGo5vP1Hg78t4eb/mn4Pw0KGgUB6Nj09ozVxOorVjS9dTsaljMOAuXLh7JH2k4jKnuEDV1uYi1mAgTAFTFqmX8SGr9sVISpKIYpEIBzHdJaNpyPrOlgMpNhEgQgcshAgIFDIs3qmAYBGFRYOMi8yv8BOvh/Cv0PmC8AAAAASUVORK5CYII=';

    it('should upload file that from base64 (window.fetch)', async () => {
      const blob = toBlob(dataURI);
      const formData = new window.FormData();
      formData.append('image', blob);
      const res = await rq.upload('/upload/image', formData);
      expect(res).to.have.property('id');
    });
    it('should upload file that from base64 (XHR)', async () => {
      const blob = toBlob(dataURI);
      const formData = new window.FormData();
      formData.append('image', blob);
      const res = await rq.upload('/upload/image', formData, { useXHR: true });
      expect(res).to.have.property('id');
    });
  });

  describe('#catchSuccess()', () => {
    it('should capture all successful requests', () => {
      expect(successCount).to.be.eq(successTotal);
    });
  });

  describe('#catchError()', () => {
    it('should capture all failed requests', () => {
      expect(errorCount).to.be.eq(errorTotal);
    });
  });

  describe('#catchComplete()', () => {
    it('should capture all requests', () => {
      expect(completeCount).to.be.eq(successTotal + errorTotal);
    });
  });
});

function toBlob(dataURI) {
  const mimetype = dataURI.split(';')[0].split(':')[1];
  const bytes = window.atob(dataURI.split(',')[1]);
  const intArray = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    intArray[i] = bytes.charCodeAt(i);
  }
  return new window.Blob([intArray], { type: mimetype });
}
