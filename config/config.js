const path = require('path');

/**
 * Express Sweet basic configuration interface.
 */
module.exports = {
  /**
   * Environment variable file (.env) path, defaults to none (undefined).
   * @type {string}
   */
  env_path: '.env',

  /**
   * CORS permission, defaults to invalid (false).
   * @type {{enabled: boolean}}
   */
  cors_enabled: true,

  /**
   * Maximum body size you can request, defaults to `100kb`.
   * @type {string|number}
   */
  max_body_size: '100mb',

  /**
   * This is a hook for error handling.
   * @type {(err: any): void|Promise<void>}
   */
  error_handler: err => {
    console.error(`An error has occurred. Error message: ${err.message}`);
  }
}