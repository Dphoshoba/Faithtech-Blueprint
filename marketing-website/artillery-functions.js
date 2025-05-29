module.exports = {
  checkResponseTime: function(requestParams, response, context, ee, next) {
    if (response.timings.duration > 500) {
      console.warn(`Slow response time: ${response.timings.duration}ms for ${requestParams.url}`);
    }
    return next();
  },

  checkContentType: function(requestParams, response, context, ee, next) {
    if (!response.headers['content-type'].includes('text/html')) {
      console.warn(`Unexpected content type: ${response.headers['content-type']} for ${requestParams.url}`);
    }
    return next();
  },

  checkCacheHeaders: function(requestParams, response, context, ee, next) {
    if (!response.headers['cache-control']) {
      console.warn(`Missing cache-control header for ${requestParams.url}`);
    }
    return next();
  },

  checkSecurityHeaders: function(requestParams, response, context, ee, next) {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];

    for (const header of requiredHeaders) {
      if (!response.headers[header]) {
        console.warn(`Missing security header: ${header} for ${requestParams.url}`);
      }
    }
    return next();
  },

  checkCompression: function(requestParams, response, context, ee, next) {
    if (!response.headers['content-encoding']) {
      console.warn(`Missing content compression for ${requestParams.url}`);
    }
    return next();
  }
}; 