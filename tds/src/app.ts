import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import errorhandler from 'errorhandler';
import cors from 'cors';
import router from './routes'

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

const whitelist = ['https://stellot.com', 'https://gh.stellot.com', 'http://gh.stellot.com', 'https://stellot.stasbar.com', 'https://voting.stasbar.com', 'http://localhost'];
app.use(cors({ origin: whitelist, allowedHeaders: ['SESSION-TOKEN'] }));
app.set('trust proxy', true)
app.use(logger('dev', { skip: (req) => req.url === '/health' }));
app.use(express.json({ limit: '0.5mb' }));
app.use(express.urlencoded({ limit: '0.5mb', extended: false }));
app.use(cookieParser());
if (!isProduction) {
  app.use(errorhandler());
}
app.get('/health', (req, res) => res.sendStatus(200).end());
app.get('/myIp', (req, res) => {
  const { ip, ips } = req
  const forwarded = req.headers['X-Forwarded-For'];
  const cloudFlareIp = req.headers['cf-connecting-ip'];
  res.send({ ip, ips, remoteAddress: req.connection.remoteAddress, forwarded, cloudFlareIp })
});
app.use(router);

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new HttpError('Not Found', 404);
  next(err);
});

// / error handlers


app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  // development will print stacktrace
  // production error handler no stacktraces leaked to user
  if (!isProduction) {
    console.log(err.stack);
  }
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: !isProduction ? err : {},
    },
  });
});


export default app;
