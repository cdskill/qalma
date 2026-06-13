// CloudFront Function (viewer-request): map "clean" URLs to the prerendered
// index.html that Analog SSG emits for each route.
//
//   /            -> /index.html
//   /docs/       -> /docs/index.html
//   /docs/intro  -> /docs/intro/index.html
//
// Requests that already target a file (contain a ".") are left untouched so
// hashed assets, the sitemap, the favicon, etc. are served directly.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }

  return request;
}
