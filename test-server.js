import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: './tmp',
});
const upload = multer({ storage });

const response = {
  json(res, data) {
    res.json({
      success: true,
      statusCode: 200,
      errorCode: 0,
      errorMessage: null,
      data,
    });
  },
  text(res, data) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).end(
      JSON.stringify({
        success: true,
        statusCode: 200,
        errorCode: 0,
        errorMessage: null,
        data,
      })
    );
  },
  error(res, err, code) {
    const status = err.status || 500;
    res.status(code || status).send({
      success: false,
      statusCode: status,
      errorCode: status,
      errorMessage: err.message || 'Internal Server Error',
      data: null,
    });
  },
};

let server = null;

export function startServer(port) {
  const app = express();

  app.use(bodyParser.text());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/api/user/1234', (req, res) => {
    const user = { id: '1234', name: 'test', age: 32 };
    if (req.query.sex) user.sex = 'M';
    if (req.query.city) user.city = req.query.city;
    const accept = req.get('accept');
    if (accept === 'text/plain') {
      response.text(res, user);
      return;
    }
    response.json(res, user);
  });

  app.get('/api/user/digest', (req, res) => {
    const code = req.query.code;
    response.error(res, new Error(), code ? +code : undefined);
  });

  app.head('/api/user/1234', (req, res) => {
    res.status(200).end();
  });

  app.post('/api/user', multer().single(), (req, res) => {
    const data = req.body;
    if (!data || !data.name) {
      const err = new Error('Bad Request');
      err.status = 400;
      response.error(res, err);
      return;
    }
    const header = req.header('X-Mocha-TEST');
    response.json(res, header === 'v1.0.0' ? '4321' : '1234');
  });

  app.post('/api/text', (req, res) => {
    response.json(res, '12345');
  });

  app.put('/api/user/:id', (req, res) => {
    res.status(204).end();
  });

  app.patch('/api/user/:id', (req, res) => {
    const data = req.body;
    response.json(res, {
      id: req.params.id,
      name: data.name || 'test',
      age: data.age || 32,
    });
  });

  app.delete('/api/user/:id', (req, res) => {
    response.json(res, true);
  });

  app.get('/api/old/user/:id', async (req, res) => {
    const user = { id: '1234', name: 'test', age: 32 };
    res.status(200).json(user);
  });

  app.get('/api/outer/user/:id', async (req, res) => {
    const user = {
      error_code: 0,
      error: null,
      result: { id: '1234', name: 'test', age: 32 },
    };
    res.status(200).json(user);
  });

  app.get('/api/timeout', (req, res) => {
    setTimeout(() => response.json(res, '200 OK'), 5000);
  });

  app.post('/upload/image', upload.single('image'), (req, res) => {
    const file = req.file;
    const fileInfo = {
      id: file.filename,
      path: file.path,
      filename: file.originalname,
      type: file.mimetype,
      size: Math.ceil(file.size / 1024),
    };
    response.json(res, fileInfo);
  });

  app.get('/data/jsonp', (req, res) => {
    res.jsonp('200 ok');
  });

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  // eslint-disable-next-line
  app.use(function(err, req, res, next) {
    response.error(res, err);
  });

  server = app.listen(port, () => {
    console.info(`test server listening on ${port}`);
  });
}

export function closeServer() {
  if (!server) return;
  server.close(() => {
    console.info('test server is shutdown');
  });
}
