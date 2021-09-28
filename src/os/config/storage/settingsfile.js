goog.declareModuleId('os.config.storage.SettingsFile');

import osImplements from '../../implements.js';
import Request from '../../net/request.js';
import ConfigType from '../configtype.js';
import {addNamespaces} from '../namespace.js';
import ISettingsReadableStorage from './isettingsreadablestorage.js';
import ISettingsStorage from './isettingsstorage.js';

const Deferred = goog.require('goog.async.Deferred');
const NetEventType = goog.require('goog.net.EventType');

const GoogEvent = goog.requireType('goog.events.Event');


/**
 * Settings which are read in from a file (like an overrides).
 *
 * @implements {ISettingsStorage}
 * @implements {ISettingsReadableStorage}
 */
export default class SettingsFile {
  /**
   * Constructor.
   * @param {!string} uri
   * @param {boolean=} opt_suppressErrors Whether failure to connect should be ignored - useful for overrides files which
   *     may or may not be available
   */
  constructor(uri, opt_suppressErrors) {
    /**
     * @inheritDoc
     * @see {ISettingsStorage}
     */
    this.canAccess = true;

    /**
     * @type {!string}
     * @private
     */
    this.uri_ = uri;

    /**
     * @inheritDoc
     */
    this.name = 'file: ' + uri;

    /**
     * @type {boolean}
     * @private
     */
    this.suppressErrors_ = !!opt_suppressErrors;
  }

  /**
   * @inheritDoc
   * @see {ISettingsStorage}
   */
  init() {
    return Deferred.succeed();
  }

  /**
   * @inheritDoc
   * @see {ISettingsStorage}
   */
  getSettings() {
    var deferred = new Deferred();

    var request = new Request();
    request.listen(NetEventType.SUCCESS, goog.partial(this.onGetSuccess_, deferred), false, this);
    request.listen(NetEventType.ERROR, goog.partial(this.onGetFail_, deferred), false, this);
    request.setUri(this.uri_);
    request.load();

    return deferred;
  }

  /**
   * Handle get settings success
   *
   * @param {!Deferred} deferred
   * @param {!GoogEvent} event
   * @private
   */
  onGetSuccess_(deferred, event) {
    var request = /** @type {Request} */ (event.target);
    var response = /** @type {string} */ (request.getResponse());
    request.dispose();

    // strip out comments
    response = response.replace(/\/\*[\s\S]*\*\//mg, '');

    var settings;

    try {
      settings = /** @type {!Object} */ (JSON.parse(response));

      // namespace user settings
      settings[ConfigType.PREFERENCE] = addNamespaces(settings[ConfigType.PREFERENCE] || {});

      deferred.callback(settings);
    } catch (e) {
      this.onGetFail_(deferred, `Failed parsing settings file: ${this.uri_}`);
    }
  }

  /**
   * Handle get settings fail
   *
   * @param {!Deferred} deferred
   * @param {string=} opt_msg
   * @private
   */
  onGetFail_(deferred, opt_msg) {
    if (!this.suppressErrors_) {
      deferred.errback(opt_msg);
    } else {
      deferred.callback({});
    }
  }
}

osImplements(SettingsFile, ISettingsStorage.ID);
osImplements(SettingsFile, ISettingsReadableStorage.ID);
