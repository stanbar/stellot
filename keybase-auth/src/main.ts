import { config } from 'dotenv';
import http from 'http';
import * as bot from './bot';

const result = config();
if (result.error) {
  throw result.error;
}

const { PORT } = process.env;

if (!PORT) {
  throw new Error('PORT must be defined');
}

const httpPort = Number(PORT);
/**
 * Module dependencies.
 */


const debug = require('debug')('stellar-voting:server');

/**
 * Get port from environment and store in Express.
 */

// eslint-disable-next-line import/first
import app from './app';

/**
 * Create HTTP server.
 */
const httpServer = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
httpServer.listen(httpPort);
httpServer.on('error', onError(httpPort));
httpServer.on('listening', onListening(httpServer));

/**
 * Event listener for HTTP server "error" event.
 */

function onError(port: number): (error: any) => void {
  return (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    bot.shutdown();

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`Port ${port} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`Port ${port} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(server: http.Server): () => void {
  return () => {
    const addr = server.address();
    if (!addr) throw Error('address is null');
    debug(`Listening on ${JSON.stringify(addr, null)}`);
  };
}
