import express from 'express'
import * as sweet from 'express-sweet';

// Creates and configures an ExpressJS web server.
const app = express();

// Mount the extension.
sweet.mount(app);

export default app;