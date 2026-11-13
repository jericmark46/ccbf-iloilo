let appPromise;

export default async function handler(req, res) {
  try {
    if (!appPromise) appPromise = import('../src/application.js');
    const { default: app } = await appPromise;
    return app(req, res);
  } catch (error) {
    appPromise = undefined;
    console.error('[api] Failed to start:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
    }
    res.end(JSON.stringify({ error: 'API failed to start', message: error?.message }));
  }
}
