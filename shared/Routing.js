import { File } from 'nodejs-shared';
import config from '../config/config';

export default class {

  /**
   * Generate URL routing from controller class metadata
   */
  static attach(app, routerDir) {
    const routerFiles = File.find(`${routerDir}/**/*.js`);
    for (let routerFile of routerFiles) {
      const { default: router } = require(routerFile);
      const matches = routerFile.match(/\/routes(?:(\/..*))?\/(..*)\.js/);
      if (!matches) continue;
      const [ _, dir, file ] = matches;
      const url = dir ? `${dir}/${file.toLowerCase()}` : `/${file.toLowerCase()}`;
      app.use(url === config.defaultController ? '/' : url, router);
    }
  }
}
