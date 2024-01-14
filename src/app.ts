import { ApolloServer } from '@apollo/server';
import * as express from 'express';
import * as cors from 'cors';
import * as http from 'http';
import * as fileUpload from 'express-fileupload';
import * as passport from 'passport';
import config from './db.config';
import * as mongoose from 'mongoose';
import { expressMiddleware } from '@apollo/server/express4';
import { BaseContext } from '@apollo/server/src/externalTypes';
import { createServer, options } from './graphql/server';
import * as path from 'path';
import { mainRouter } from './routes/mainRouter';

(async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const isDev = process.env.MODE !== 'production';

  await mongoose.connect(isDev ? config.db_dev : config.db);
  Object.assign(mongoose, { Promise: global.Promise });

  app.use(fileUpload());

  const port = parseInt(process.env.PORT) || 4007;

  const { server } = await createServer(httpServer);

  app.use(passport.initialize());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server as unknown as ApolloServer<BaseContext>, options)
  );

  app.use('/api', cors(), express.json(), mainRouter);
  const assets = path.join(process.cwd(), 'assets');
  app.use('/img', express.static(assets));

  const root = path.join(process.cwd(), 'dist');
  app.use(express.static(root));
  app.get('*', (_, res) => res.sendFile('index.html', { root }));

  httpServer.listen(port, () => console.log(`🚀 Server ready at http://localhost:${port}`));
})();
