const ParcelProxyServer = require('parcel-proxy-server');
const Path = require('path');

const entryFiles = Path.join(__dirname, 'src', 'index.html');
// configure the proxy server
const server = new ParcelProxyServer({
  entryPoint: entryFiles,
  parcelOptions: {
    // provide parcel options here
    // these are directly passed into the
    // parcel bundler
    //
    // More info on supported options are documented at
    // https://parceljs.org/api
    // https: false,
    // publicUrl: '.',
    outDir: '../docs',
    outFile: 'index.html',
    watch: true,
    open: true,
  },
  proxies: {
    // add proxies here
    '/api': {
      target: 'http://localhost:8082/',
    },
  },
});

// the underlying parcel bundler is exposed on the server
// and can be used if needed
server.bundler.on('buildEnd', () => {
  console.log('Build completed!');
});

// start up the server
server.listen(8888, () => {
  console.log('Parcel proxy server has started');
});
