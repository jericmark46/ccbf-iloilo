'use strict';

let appPromise;

module.exports = async function handler(req, res) {
  if (req.headers['x-probe'] === '1') {
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, node: process.version, url: req.url }));
    return;
  }

  try {
    if (!appPromise) appPromise = import('../src/application.js');
    const { default: app } = await appPromise;
    return app(req, res);
  } catch (error) {
    appPromise = undefined;
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
    }
    res.end(
      JSON.stringify({
        error: 'API failed to start',
        message: error?.message,
        code: error?.code,
        stack: String(error?.stack || '')
          .split('\n')
          .slice(0, 6)
          .join('\n'),
      })
    );
  }
};
