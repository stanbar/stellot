import { config } from 'dotenv';
import http from 'http';
import mongoose from 'mongoose';

const result = config();
if (result.error) {
  throw result.error;
}
const { PORT, NODE_ENV, MONGODB_URI } = process.env;

/**
 * Module dependencies.
 */
if (!PORT) {
  throw new Error('PORT must be defined');
}

const httpPort = Number(PORT);


/**
 * Get port from environment and store in Express.
 */

const isProduction = NODE_ENV === 'production';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be set');
}
if (isProduction) {
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('connected to db'))
    .catch(err => console.error(err));
} else {
  mongoose.set('debug', true);
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('connected to db'))
    .catch(err => console.error(err));
}

// eslint-disable-next-line import/first
import './database/models';
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
    console.log(`Listening on ${JSON.stringify(addr, null)}`);
  };
}
