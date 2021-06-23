goog.module('os.xt');
goog.module.declareLegacyNamespace();


/**
 * Check whether the given peer is master.
 *
 * @param {!string} peerId the peer ID of interest
 * @param {!string} group optional group, if peer is not a Peer instance
 * @param {!Storage} storage the storage to examine
 * @return {boolean} True if this peer is the master, false otherwise
 */
const isMaster = (peerId, group, storage) => {
  return storage.getItem(getMasterKey(group)) === peerId;
};

/**
 * @param {string=} opt_group the peer group of interest; defaults to 'default'
 * @return {!string} the local storage key of the master peer ID for the given group
 */
const getMasterKey = (opt_group) => {
  var group = opt_group || 'default';
  return 'xt.' + group + '.master';
};

/**
 * @param {!string} group the peer group
 * @param {!string} peerId the peer ID
 * @return {!string} the storage key for the ping value of the given group and peer ID
 */
const getPingKey = (group, peerId) => {
  return 'xt.' + group + '.' + peerId + '.ping';
};

/**
 * @param {!string} group the peer group
 * @param {!string} peerId the peer ID
 * @param {!Storage} storage the peer communication storage
 * @return {?number} the millisecond timestamp of the last ping for the given peer, or null if there is no ping value
 */
const getLastPing = (group, peerId, storage) => {
  var pingItem = storage.getItem(getPingKey(group, peerId));
  if (!pingItem) {
    return null;
  }
  return parseInt(pingItem, 10);
};

/**
 * Cleans up a given group/peer by removing all that peer's information and messages.  If the given peer is master,
 * this method resets the master state as well.
 *
 * @param {!string} group The group
 * @param {!string} id The peer ID
 * @param {!Storage} storage
 */
const cleanupPeer = (group, id, storage) => {
  var needle = ['xt', group, id].join('.');
  var keyCount = storage.length;
  for (var cursor = keyCount - 1; cursor >= 0; cursor--) {
    var key = storage.key(cursor);
    if (key.indexOf(needle) === 0) {
      storage.removeItem(key);
    }
  }

  if (storage.getItem('xt.' + group + '.master') === id) {
    storage.removeItem('xt.' + group + '.master');
  }
};

/**
 * Create send data
 *
 * @param {string} type
 * @param {*} data
 * @return {!string}
 */
const prepareSendData = (type, data) => {
  return JSON.stringify({'type': type, 'data': data, 'time': Date.now()});
};

exports = {
  isMaster,
  getMasterKey,
  getPingKey,
  getLastPing,
  cleanupPeer,
  prepareSendData
};
