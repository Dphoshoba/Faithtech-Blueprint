function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Check if the request is for a file that exists
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    // If the URI doesn't have a file extension, append .html
    request.uri = uri + '.html';
  }

  // Handle API requests
  if (uri.startsWith('/api/')) {
    // Forward API requests to the ALB
    request.origin = {
      custom: {
        domainName: '${aws_lb.main.dns_name}',
        port: 443,
        protocol: 'https',
        path: '',
        sslProtocols: ['TLSv1.2'],
        readTimeout: 30,
        keepaliveTimeout: 5,
        customHeaders: {}
      }
    };
  }

  // Handle static assets
  if (uri.startsWith('/assets/')) {
    // Forward static asset requests to S3
    request.origin = {
      s3: {
        domainName: '${aws_s3_bucket.static_assets.bucket_regional_domain_name}',
        region: '${var.aws_region}',
        authMethod: 'origin-access-identity',
        path: ''
      }
    };
  }

  // Add security headers
  var response = {
    statusCode: 200,
    statusDescription: 'OK',
    headers: {
      'strict-transport-security': {
        value: 'max-age=31536000; includeSubDomains; preload'
      },
      'x-content-type-options': {
        value: 'nosniff'
      },
      'x-frame-options': {
        value: 'DENY'
      },
      'x-xss-protection': {
        value: '1; mode=block'
      },
      'referrer-policy': {
        value: 'strict-origin-when-cross-origin'
      },
      'content-security-policy': {
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.amazonaws.com;"
      }
    }
  };

  // Handle CORS
  if (request.headers['origin']) {
    response.headers['access-control-allow-origin'] = {
      value: request.headers['origin'].value
    };
    response.headers['access-control-allow-methods'] = {
      value: 'GET,HEAD,OPTIONS,PUT,POST,DELETE'
    };
    response.headers['access-control-allow-headers'] = {
      value: 'Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key'
    };
    response.headers['access-control-max-age'] = {
      value: '86400'
    };
  }

  // Handle OPTIONS requests
  if (request.method === 'OPTIONS') {
    return response;
  }

  // Continue with the request
  return request;
} 