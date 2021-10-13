goog.declareModuleId('plugin.tileserver.Tileserver');

import Request from 'opensphere/src/os/net/request.js';
import AbstractLoadingServer from 'opensphere/src/os/ui/server/abstractloadingserver.js';

import {ID} from './index.js';

const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');


/**
 * The Tileserver provider
 * @implements {IDataProvider}
 */
export default class Tileserver extends AbstractLoadingServer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.providerType = ID;
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    super.load(opt_pint);

    // load the JSON
    new Request(this.getUrl()).getPromise().
        then(this.onLoad, this.onError, this).
        thenCatch(this.onError, this);
  }

  /**
   * @param {string} response
   * @protected
   */
  onLoad(response) {
    let layers;

    try {
      layers = JSON.parse(response);
    } catch (e) {
      this.onError('Malformed JSON');
      return;
    }

    console.log('parsed json', layers);
  }

  /**
   * @param {*} e
   * @protected
   */
  onError(e) {
    const msg = Array.isArray(e) ? e.join(' ') : e.toString();
    this.setErrorMessage(msg);
  }
}
