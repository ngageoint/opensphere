goog.declareModuleId('os.xt.PeerInfo');

import {getLastPing} from './xt.js';


/**
 * A small structure that represents info about other peers
 */
export default class PeerInfo {
  /**
   * Constructor.
   * @param {string} group The group to which the peer belongs
   * @param {string} id The ID
   * @param {string=} opt_title The title
   * @param {string=} opt_details The details
   * @param {Array<string>=} opt_types The types
   */
  constructor(group, id, opt_title, opt_details, opt_types) {
    /**
     * The group to which this peer belongs
     */
    this.group = group || 'default';

    /**
     * The ID of the peer
     * @type {string}
     */
    this.id = id || '';

    /**
     * The title of the peer
     * @type {string}
     */
    this.title = opt_title || '';

    /**
     * The details of the peer
     * @type {string}
     */
    this.details = opt_details || '';

    /**
     * The types of messages that the peer supports
     * @type {Array<string>}
     */
    this.types = opt_types || [];
  }

  /**
   * Loads the specified peer info from local storage
   *
   * @param {!string} group the peer group
   * @param {!string} id the peer ID
   * @param {!Storage} storage
   * @return {PeerInfo} the loaded peer info
   */
  static load(group, id, storage) {
    if (!group || !id) {
      return null;
    }
    var ping = getLastPing(group, id, storage);
    if (!ping) {
      // peer's not ready
      return null;
    }
    var prefix = 'xt.' + group + '.' + id + '.';
    var types = /** @type {Array<string>} */ (JSON.parse(storage.getItem(prefix + 'types') || '[]'));
    var title = storage.getItem(prefix + 'title') || '';
    var details = storage.getItem(prefix + 'details') || '';
    return new PeerInfo(group, id, title, details, types);
  }
}
