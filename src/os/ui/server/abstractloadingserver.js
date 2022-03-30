goog.declareModuleId('os.ui.server.AbstractLoadingServer');


import {remove} from 'ol/src/array.js';

import {getAuth} from '../../auth.js';
import DataProviderEvent from '../../data/dataproviderevent.js';
import DataProviderEventType from '../../data/dataprovidereventtype.js';
import IDataProvider from '../../data/idataprovider.js';
import ILoadingProvider from '../../data/iloadingprovider.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import osImplements from '../../implements.js';
import TriState from '../../structs/tristate.js';
import BaseProvider from '../data/baseprovider.js';



/**
 * A base implementation of a server that loads stuff.
 *
 * @implements {ILoadingProvider}
 */
export default class AbstractLoadingServer extends BaseProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The full server URL.
     * @type {string}
     * @protected
     */
    this.url = '';

    /**
     * Alternate URLs that may be used in place of the base URL.
     * @type {Array<string>}
     * @private
     */
    this.alternateUrls_ = null;

    /**
     * Index of the next URL to pick when rotating.
     * @type {number}
     * @private
     */
    this.nextUrl_ = 0;

    /**
     * @type {boolean}
     * @private
     */
    this.error_ = false;

    /**
     * @type {?string}
     * @private
     */
    this.errorMsg_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.inhibitPopups_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.ping_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.isLoading_ = false;
  }

  /**
   * Initialize the server.
   */
  init() {
    this.setState(TriState.OFF);
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setUrl(/** @type {string} */ (config['url']));
    this.init();
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    this.dispatchEvent(new DataProviderEvent(DataProviderEventType.LOADING, this));
    this.setLoading(true);
    this.setPing(opt_ping || false);
    this.setError(false);
  }

  /**
   * If the server has finished loading.
   *
   * @return {boolean}
   */
  isLoaded() {
    return true;
  }

  /**
   * Called when loading is complete.
   *
   * @protected
   */
  finish() {
    this.setLoading(false);
    this.dispatchEvent(new DataProviderEvent(DataProviderEventType.LOADED, this));
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var icons = super.formatIcons();

    if (this.getError()) {
      var message = 'Server failed to load. See the log/alerts window for details.';
      icons += `<i class="fas fa-exclamation-triangle text-warning" title="${message}"></i>`;
    }


    return icons;
  }

  /**
   * Get the server URL.
   *
   * @return {string}
   */
  getUrl() {
    return this.url;
  }

  /**
   * Set the server URL.
   *
   * @param {string} value
   */
  setUrl(value) {
    this.url = value;
  }

  /**
   * Get alternate URLs that may be used to load balance server requests.
   *
   * @return {Array<string>}
   */
  getAlternateUrls() {
    return this.alternateUrls_;
  }

  /**
   * Set alternate URLs that may be used to load balance server requests.
   *
   * @param {Array<string>} value
   */
  setAlternateUrls(value) {
    this.alternateUrls_ = value ? value.slice() : null;
  }

  /**
   * Add an alternate URL to the server.
   *
   * @param {string} value
   */
  addAlternateUrl(value) {
    if (!this.alternateUrls_) {
      this.alternateUrls_ = [value];
    } else if (this.alternateUrls_.indexOf(value) == -1) {
      this.alternateUrls_.push(value);
    }
  }

  /**
   * Remove an alternate URL from the server.
   *
   * @param {string} value
   */
  removeAlternateUrl(value) {
    if (this.alternateUrls_) {
      remove(this.alternateUrls_, value);

      if (this.alternateUrls_.length == 0) {
        this.alternateUrls_ = null;
      }
    }
  }

  /**
   * Gets a rotating URL for the server using the base URL and alternate URLs.
   *
   * @return {string}
   */
  getNextUrl() {
    var urls = [this.url];
    if (this.alternateUrls_) {
      urls = urls.concat(this.alternateUrls_);
    }

    if (this.nextUrl_ >= urls.length) {
      this.nextUrl_ = 0;
    }

    return urls[this.nextUrl_++] || '';
  }

  /**
   * @inheritDoc
   */
  getError() {
    return this.error_;
  }

  /**
   * @param {boolean} value
   */
  setError(value) {
    this.error_ = value;

    if (!this.error_) {
      this.setErrorMessage(null);
    }

    this.dispatchEvent(new PropertyChangeEvent('icons'));
  }

  /**
   * @inheritDoc
   */
  getErrorMessage() {
    return this.errorMsg_;
  }

  /**
   * @param {?string} message
   */
  setErrorMessage(message) {
    this.errorMsg_ = message;

    if (this.errorMsg_) {
      this.setError(true);
    }
  }

  /**
   * @return {boolean}
   */
  getInhibitPopups() {
    return this.inhibitPopups_;
  }

  /**
   * @param {boolean} value
   */
  setInhibitPopups(value) {
    this.inhibitPopups_ = value;
  }

  /**
   * @return {boolean}
   */
  getPing() {
    return this.ping_;
  }

  /**
   * @param {boolean} value
   */
  setPing(value) {
    this.ping_ = value;
  }

  /**
   * @inheritDoc
   * @export
   */
  isLoading() {
    return this.isLoading_;
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    if (this.isLoading_ != value) {
      this.isLoading_ = value;
      this.dispatchEvent(new PropertyChangeEvent('loading', value, !value));
    }
  }

  /**
   * @inheritDoc
   */
  onChildChange(e) {
    if (!this.isLoading()) {
      // don't handle child change events while loading, because there will be a lot of them and it may hang the browser.
      // the server will fire an event when it finishes loading to update the tree.
      super.onChildChange(e);
    }
  }

  /**
   * @inheritDoc
   */
  getAuth() {
    return getAuth(this.getUrl());
  }
}

osImplements(AbstractLoadingServer, ILoadingProvider.ID);
osImplements(AbstractLoadingServer, IDataProvider.ID);
