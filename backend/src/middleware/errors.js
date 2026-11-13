export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let message = error.message || 'Something went wrong.';

  if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'That record could not be found.';
  } else if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    message = `That ${field} is already in use.`;
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'That file is too large. Videos can be up to 150 MB.';
  } else if (error.message?.includes('Only JPG')) {
    status = 400;
  }

  if (status >= 500) console.error('[error]', error);
  res.status(status).json({ error: message });
}
