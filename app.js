import express from 'express'
import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';

// TODO: If you import morgan here, "GMT morgan deprecated" will occur, so morgan is used by require.
// import morgan from 'morgan';

import dotenv from 'dotenv';
import fs from 'fs';
import config from './config/config';
import hook from './config/hook';
import Routing from './shared/Routing';
// import Handlebars from 'handlebars';

// Creates and configures an ExpressJS web server.
class App {

  /**
   * Run configuration methods on the Express instance.
   */
  constructor() {
    this.app = express();

    // Load environment variables
    this.loadConfig();

    // Initialize View engine.
    this.initViewEngine();

    // Initialize middleware.
    this.initMiddleware();

    // Set CORS.
    this.setCORS();

    // Set local variables..
    this.setLocalVariables();

    // Set routing.
    this.setRouting();

    // Set global variables.
    this.setGlobalVariables();
  }

  /**
   * Load environment variables
   */
  loadConfig() {
    if (!config.env) return;
    const env = dotenv.parse(fs.readFileSync(config.env))
    for (let key in env) {
      process.env[key] = env[key]
    }
  }

  /**
   * Initialize View engine.
   */
  initViewEngine() {
    if (!config.useView) return;
    const hbs = require('express-hbs');
    const viewPath = `${__dirname}/views`;

    // Added helper function to template engine.
    hbs.registerHelper('json', (object, replacer=null, space=null) => JSON.stringify(object, replacer, space));

    // Apply template engine to your app.
    this.app.engine('hbs', hbs.express4({
      partialsDir: `${viewPath}/partials`,
      layoutsDir: `${viewPath}/layout`,
      defaultLayout: `${viewPath}/layout/default.hbs`,
      // handlebars: Handlebars
      // extname: '.html'
    }));
    this.app.set('view engine', 'hbs');
    this.app.set('views',  viewPath);
  }

  /**
   * Initialize middleware.
   */
  initMiddleware() {
    // Set HTTP request logging
    const morgan = require('morgan')
    this.app.use(morgan('dev'));

    // For parsing application/json
    this.app.use(express.json({
      limit: config.maxRequestBodySize || '100kb'
    }));

    // For parsing application/x-www-form-urlencoded
    this.app.use(express.urlencoded({
      extended: true,
      limit: config.maxRequestBodySize || '100kb'
    }));

    // For parsing Cookie
    this.app.use(cookieParser());

    // Attach static file path
    this.app.use(express.static(path.join(process.cwd(), 'public')));
  }

  /**
   * Set CORS.
   */
  setCORS() {
    if (!config.cors) return;
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
  }

  /**
   * Set routing.
   */
  setRouting() {
    // Automatic routing
    Routing.attach(this.app, `${__dirname}/routes`);

    // catch 404 and forward to error handler
    this.app.use((req, res, next) => {
      next(createError(404));
    });

    // error handler
    this.app.use((err, req, res, next) => {
      // set locals, only providing error in development
      if (req.xhr) {
        res.status(err.status || 500);
        res.json({ error: err.message });
      } else {
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};
        // render the error page
        res.status(err.status || 500);
        res.render('error');
      }
    });
  }

  /**
   * Set global variables.
   * It can be accessed like "global.xxx" in all router and model classes.
   */
  setGlobalVariables() {
    // Application root path.
    global.APP_ROOT = path.resolve(__dirname);
  }

  /**
   * Set local variables.
   * It can be accessed in all views as {{xxx}} or {{{xxx}}}.
   */
  setLocalVariables() {
    this.app.use((req, res, next) => {
      let baseUrl;
      if (req.headers.referer) {
        const url = new URL(req.headers.referer);
        baseUrl = url.origin;
      } else {
        baseUrl = 'x-forwarded-proto' in req.headers ? `${req.headers['x-forwarded-proto']}:` : '';
        baseUrl += `//${req.headers.host}`;
      }
      if (hook.extendBaseUrl) baseUrl = hook.extendBaseUrl(baseUrl);
      this.app.locals.baseUrl = baseUrl;
      next();
    });
  }
}

export default new App().app;