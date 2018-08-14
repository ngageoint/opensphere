goog.provide('os.xt.Peer');
goog.provide('os.xt.PeerInfo');

goog.require('goog.Timer');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.Delay');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string');
goog.require('os.alert.AlertManager');
goog.require('os.xt.IMessageHandler');
goog.require('os.xt.events');



/**
 * A peer for local storage communication. Peers are intended to be singletons so there will only be one peer per
 * application. Use the {@code os.xt.Peer.getInstance} function to get a reference to the singleton.
 *
 * @example <caption>Implement a message handler</caption>
 *  com.app.Handler = function() {
 *    // ...
 *  };
 *
 *  com.app.Handler.prototype.getTypes = function() {
 *    return ['alert'];
 *  };
 *
 *  com.app.Handler.prototype.process = function(data, type, sender, time) {
 *    alert(data);
 *  };
 *
 * @example <caption>In your main application, connect a peer</caption>
 *  this.peer = os.xt.Peer.getInstance();
 *  this.peer.setTitle('Test Page');
 *  this.peer.addHandler(new com.app.Handler());
 *  this.peer.init();
 *
 * @example <caption>Send a message</caption>
 *  // send a message on the public channel to be processed by whatever
 *  // can handle the message type 'alert'
 *  this.peer.send('alert', 'Behold!');
 *
 *  // or, use this to get a list of all peers which support the alert type
 *  var list = this.peer.getPeerInfo('alert');
 *
 *  // pick from the list and send to that peer specifically
 *  this.peer.send('alert', 'Only you.', list[i].id);
 *
 *  These examples only send strings but you can send any value that serializes to JSON.
 *
 * @constructor
 * @param {Storage=} opt_storage the Storage instance to use for communication; defaults to window.localStorage
 * @throws {Error} If the browser does not support localStorage
 */
os.xt.Peer = function(opt_storage) {
  if (!opt_storage) {
    if (!('localStorage' in window) || !window.localStorage) {
      throw new Error('This browser does not support localStorage!');
    }
    opt_storage = window.localStorage;
  }

  /**
   * @type {!Storage}
   * @private
   */
  this.storage_ = opt_storage;

  /**
   * Maintains if this peer has been initialized yet.  Persist won't run until initialization has occurred.
   * @type {boolean}
   * @private
   */
  this.isInit_ = false;

  /**
   * The peer ID
   * @type {string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * The group to which this peer belongs.
   * @type {string}
   * @private
   */
  this.group_ = 'default';

  /**
   * The title of this peer. Defaults to <code>document.title</code>.
   * @type {string}
   * @private
   */
  this.title_ = document.title;

  /**
   * The details for this peer
   * @type {string}
   * @private
   */
  this.details_ = '';

  /**
   * Message handler list
   * @type {Array<os.xt.IMessageHandler>}
   * @private
   */
  this.handlers_ = [];

  /**
   * Ping timer
   * @type {goog.Timer}
   * @private
   */
  this.pingTimer_ = null;


  /**
   * The time of this peer's last ping
   * @type {number}
   * @private
   */
  this.lastPing_ = 0;

  /**
   * Delay which starts the logic to establish master.
   * @type {goog.async.Delay}
   * @private
   */
  this.establishMasterDelay_ = null;

  /**
   * An array of records that track clients waiting for peers to become available in this peer's group
   * @type {Array<os.xt.Peer.WaitRecord_>}
   * @private
   */
  this.waitList_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.crossOriginEnabled_ = false;

  /**
   * @type {?Array<!string>}
   * @private
   */
  this.allowedOrigins_ = null;

  /**
   * Delay for processing the wait list
   * @type {goog.async.Delay}
   * @private
   */
  this.waitListDelay_ = new goog.async.Delay(this.processWaitList_.bind(this));

  /**
   * Flag to prevent showing the localStorage is broken event more than once.
   * @type {boolean}
   * @private
   */
  this.errorShown_ = false;

  this.boundStorage_ = this.onStorage_.bind(this);
  this.boundCleanup_ = this.cleanup_.bind(this);

  // set up cross-origin messaging
  // the security checks are in the handler
  goog.events.listen(window, goog.events.EventType.MESSAGE, this.onWebMessage_, false, this);
};
goog.addSingletonGetter(os.xt.Peer);


/**
 * @typedef {{
 *   peerId: !string,
 *   messageType: (?string|undefined),
 *   deferred: !goog.async.Deferred,
 *   expiration: !number
 * }}
 * @private
 */
os.xt.Peer.WaitRecord_;


/**
 * The interval in ms between pings
 * @type {number}
 * @const
 */
os.xt.Peer.PING_INTERVAL = 10000;


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.xt.Peer.LOGGER_ = goog.log.getLogger('os.xt.Peer');


/**
 * Enables cross origin messages. You can optionally specify a list of allowed origins for security
 * @return {boolean}
 */
os.xt.Peer.prototype.isCrossOrigin = function() {
  return this.crossOriginEnabled_;
};


/**
 * @param {boolean} value
 */
os.xt.Peer.prototype.setCrossOrigin = function(value) {
  this.crossOriginEnabled_ = value;
};


/**
 * @return {?Array<!string>} the list of allowed origins for cross-origin messaging
 */
os.xt.Peer.prototype.getAllowedOrigins = function() {
  return this.allowedOrigins_;
};


/**
 * Set the list of allowed origins for cross-origin messaging
 * @param {?Array<!string>} value
 */
os.xt.Peer.prototype.setAllowedOrigins = function(value) {
  this.allowedOrigins_ = value;
};


/**
 * Handles HTML5 web messages for cross-origin messaging
 * @param {MessageEvent} evt
 * @private
 */
os.xt.Peer.prototype.onWebMessage_ = function(evt) {
  if (!this.isCrossOrigin()) {
    return;
  }

  var origins = this.getAllowedOrigins();
  if (!origins || origins.indexOf(evt.origin) > -1) {
    if (goog.isString(evt.data)) {
      os.xt.Peer.getInstance().handleMessage(evt.data, evt.origin);
    } else {
      goog.log.error(os.xt.Peer.LOGGER_,
          'Only stringified JSON is allowed as message payload content');
    }
  }
};


/**
 * Disables cross origin messages. You can optionally specify a list of allowed origins for security
 */
os.xt.Peer.prototype.disableCrossOriginMessages = function() {
};


/**
 * Check whether the given peer is master.
 * @param {!string} peerId the peer ID of interest
 * @param {!string} group optional group, if peer is not a Peer instance
 * @param {!Storage} storage the storage to examine
 * @return {boolean} True if this peer is the master, false otherwise
 */
os.xt.Peer.isMaster = function(peerId, group, storage) {
  return storage.getItem(os.xt.Peer.getMasterKey_(group)) === peerId;
};


/**
 * @param {string=} opt_group the peer group of interest; defaults to 'default'
 * @return {!string} the local storage key of the master peer ID for the given group
 * @private
 */
os.xt.Peer.getMasterKey_ = function(opt_group) {
  var group = opt_group || 'default';
  return 'xt.' + group + '.master';
};


/**
 * @param {!string} group the peer group
 * @param {!string} peerId the peer ID
 * @return {!string} the storage key for the ping value of the given group and peer ID
 * @private
 */
os.xt.Peer.getPingKey_ = function(group, peerId) {
  return 'xt.' + group + '.' + peerId + '.ping';
};


/**
 * @param {!string} group the peer group
 * @param {!string} peerId the peer ID
 * @param {!Storage} storage the peer communication storage
 * @return {?number} the millisecond timestamp of the last ping for the given peer, or null if there is no ping value
 * @private
 */
os.xt.Peer.getLastPing_ = function(group, peerId, storage) {
  var pingItem = storage.getItem(os.xt.Peer.getPingKey_(group, peerId));
  if (!pingItem) {
    return null;
  }
  return parseInt(pingItem, 10);
};


/**
 * Cleans up a given group/peer by removing all that peer's information and messages.  If the given peer is master,
 * this method resets the master state as well.
 * @param {!string} group The group
 * @param {!string} id The peer ID
 * @param {!Storage} storage
 * @private
 */
os.xt.Peer.cleanupPeer_ = function(group, id, storage) {
  /** @type {string} */ var needle = ['xt', group, id].join('.');
  /** @type {number} */ var keyCount = storage.length;
  for (var cursor = keyCount - 1; cursor >= 0; cursor--) {
    /** @type {?string} */
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
 * Gets the peer ID
 * @return {string}
 */
os.xt.Peer.prototype.getId = function() {
  return this.id_;
};


/**
 * Sets the peer ID
 * @param {string} value The new ID
 */
os.xt.Peer.prototype.setId = function(value) {
  this.id_ = value;
  this.persist();
};


/**
 * Gets the group to which this peer belongs
 * @return {string}
 */
os.xt.Peer.prototype.getGroup = function() {
  return this.group_;
};


/**
 * Sets the group to which this peer belongs
 * @param {string} value The new group
 */
os.xt.Peer.prototype.setGroup = function(value) {
  this.group_ = value;
  this.persist();
};


/**
 * Gets the title
 * @return {string}
 */
os.xt.Peer.prototype.getTitle = function() {
  return this.title_;
};


/**
 * Sets the title
 * @param {string} value The new title
 */
os.xt.Peer.prototype.setTitle = function(value) {
  this.title_ = value;
  this.persist();
};


/**
 * Gets the details
 * @return {string}
 */
os.xt.Peer.prototype.getDetails = function() {
  return this.details_;
};


/**
 * Sets the details
 * @param {string} value The new details
 */
os.xt.Peer.prototype.setDetails = function(value) {
  this.details_ = value;
  this.persist();
};


/**
 * Adds a message handler to the peer
 * @param {os.xt.IMessageHandler} handler The message handler
 */
os.xt.Peer.prototype.addHandler = function(handler) {
  if (this.handlers_.indexOf(handler) == -1) {
    this.handlers_.push(handler);
  }
  this.persist();
};


/**
 * Gets all supported message types
 * @return {!Array<string>}
 */
os.xt.Peer.prototype.getTypes = function() {
  var set = [];

  for (var i = 0, n = this.handlers_.length; i < n; i++) {
    var types = this.handlers_[i].getTypes ? this.handlers_[i].getTypes() : this.handlers_[i]['getTypes']();

    for (var j = 0, m = types.length; j < m; j++) {
      goog.array.insert(set, types[j]);
    }
  }

  return set;
};


/**
 * Saves the peer info to local storage
 */
os.xt.Peer.prototype.persist = function() {
  if (this.isInit_ && this.id_ && this.title_ && this.group_) {
    this.storage_.setItem(['xt', this.group_, this.id_, 'title'].join('.'), this.title_);
    this.storage_.setItem(['xt', this.group_, this.id_, 'details'].join('.'), this.details_);
    this.storage_.setItem(['xt', this.group_, this.id_, 'types'].join('.'), JSON.stringify(this.getTypes()));
  }
};


/**
 * Starts the peer
 */
os.xt.Peer.prototype.init = function() {
  if (!this.isInit_) {
    this.isInit_ = true;
    this.persist();

    // set up the listener for the storage event
    window.addEventListener('storage', this.boundStorage_);

    // set up the listener for application close
    window.addEventListener('unload', this.boundCleanup_);

    // set up the ping
    this.pingTimer_ = new goog.Timer(os.xt.Peer.PING_INTERVAL);
    this.pingTimer_.listen(goog.Timer.TICK, this.onPing_, false, this);
    this.onPing_();
    this.pingTimer_.start();

    goog.log.fine(os.xt.Peer.LOGGER_, 'Initialized peer ' + this.group_ + '.' + this.id_ + ' "' + this.title_ + '"');
    this.processInitialMessages();
  }
};


/**
 * Processes messages already available on startup
 * @protected
 */
os.xt.Peer.prototype.processInitialMessages = function() {
  var priv = ['xt', this.group_, this.id_, ''].join('.');
  var pub = ['xt', this.group_, 'public', ''].join('.');

  var notThese = os.xt.Peer.notThese_.map(function(end) {
    return priv + end;
  });

  var storage = this.storage_;
  var i = storage.length;
  while (i--) {
    var key = storage.key(i);
    if (key && (key.startsWith(pub) || (key.startsWith(priv) && notThese.indexOf(key) === -1))) {
      this.onStorage_(/** @type {Event} */ ({'key': key, 'newValue': storage.getItem(key)}));
    }
  }
};


/**
 * Create send data
 * @param {string} type
 * @param {*} data
 * @return {!string}
 */
os.xt.Peer.prepareSendData = function(type, data) {
  return JSON.stringify({'type': type, 'data': data, 'time': Date.now()});
};


/**
 * Sends a message
 * @param {string} type The message type
 * @param {*} data The data to send
 * @param {string=} opt_to A specific peer ID to which to send the message
 */
os.xt.Peer.prototype.send = function(type, data, opt_to) {
  if (!this.isInit_) {
    goog.log.warning(os.xt.Peer.LOGGER_, 'Peer.send() was called but the peer has not been initialized');
    return;
  }

  if (!opt_to) {
    opt_to = 'public';
  }

  try {
    // do this in a try/catch in case localStorage is full so that we can let the user know
    this.storage_.setItem(
        ['xt', this.group_, opt_to, this.id_, Date.now()].join('.'),
        os.xt.Peer.prepareSendData(type, data));
  } catch (e) {
    var logMsg = 'A cross-app communication event was unable to be sent. This usually happens because the data was ' +
        'too large or because the storage is corrupted.';
    goog.log.error(os.xt.Peer.LOGGER_, logMsg, e);

    if (!this.errorShown_) {
      // only show this error once because if it starts to happen, it will spam the user pointlessly
      this.errorShown_ = true;
      var msg = logMsg + ' View the log for more details.';
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
    }
  }
};


/**
 * Check whether an XT peer exists for the given application peer ID.
 * @param {string} appId The application ID to check
 * @param {string=} opt_messageType An optional message type to further restrict the search for a supporting peer
 * @return {boolean} True if the given app ID exists in the peer list, false otherwise
 */
os.xt.Peer.prototype.isAppOpen = function(appId, opt_messageType) {
  return goog.array.contains(this.getPeers(opt_messageType), appId);
};


/**
 * @param {string=} opt_peerId defaults to this peer ID
 * @return {!string} the local storage key of this peer's ping time value
 * @private
 */
os.xt.Peer.prototype.getPingKey_ = function(opt_peerId) {
  return os.xt.Peer.getPingKey_(this.group_, opt_peerId || this.id_);
};


/**
 * @param {string=} opt_peerId optional peer ID; defaults to this peer's ID
 * @return {?number} the time of the last ping or null
 * @private
 */
os.xt.Peer.prototype.getLastPing_ = function(opt_peerId) {
  var id = opt_peerId || this.id_;
  if (id === this.id_) {
    return this.pingTimer_ ? this.lastPing_ : null;
  }
  return os.xt.Peer.getLastPing_(this.group_, id, this.storage_);
};


/**
 * @return {!string} the local storage key of this peer group's master peer ID
 * @private
 */
os.xt.Peer.prototype.getMasterKey_ = function() {
  return os.xt.Peer.getMasterKey_(this.group_);
};


/**
 * @return {?string} the ID of the master peer for this peer's group
 * @private
 */
os.xt.Peer.prototype.getMasterId_ = function() {
  return this.storage_.getItem(this.getMasterKey_());
};


/**
 * Compare the last ping time of the given peer ID in this peer's group to the PING_INTERVAL.
 * @param {!string} peerId the ID of another peer
 * @return {!boolean} true if the given peer's last ping is within PING_INTERVAL, false otherwise.
 * @private
 */
os.xt.Peer.prototype.isPeerAlive_ = function(peerId) {
  var theirPing = this.getLastPing_(peerId);
  var myPing = this.getLastPing_();
  return goog.isDefAndNotNull(theirPing) && (myPing - theirPing < 1.5 * os.xt.Peer.PING_INTERVAL);
};


/**
 * Performs the "ping" or "keep-alive" as the ping timer ticks.
 * @param {goog.events.Event=} opt_e The optional event
 * @private
 */
os.xt.Peer.prototype.onPing_ = function(opt_e) {
  goog.log.fine(os.xt.Peer.LOGGER_, 'Updating ping for peer ' + this.group_ + '.' + this.id_);

  this.lastPing_ = Date.now();
  this.storage_.setItem(this.getPingKey_(), String(this.lastPing_));

  if (this.isMaster()) {
    this.buryDeadPeers_();
    this.ageOffPublicMessages_();
  } else {
    // check to see if the master designated and not dead
    var master = this.getMasterId_();
    if (!(master && this.isPeerAlive_(master))) {
      if (master) {
        // he's dead Jim!
        os.xt.Peer.cleanupPeer_(this.group_, master, this.storage_);
      }
      this.establishMaster_();
    }
  }
};


/**
 * Clean up peers in this peer's group that are no longer alive.
 * @private
 */
os.xt.Peer.prototype.buryDeadPeers_ = function() {
  var peers = this.getPeers(undefined, true);

  for (var i = 0, n = peers.length; i < n; i++) {
    if (!this.isPeerAlive_(peers[i])) {
      // he's dead, Jim!
      os.xt.Peer.cleanupPeer_(this.group_, peers[i], this.storage_);
    }
  }
};


/**
 * Remove messages from this group's public channel that have expired.
 * @private
 */
os.xt.Peer.prototype.ageOffPublicMessages_ = function() {
  var needle = 'xt.' + this.group_ + '.public.';
  var keyCount = this.storage_.length;
  for (var cursor = keyCount - 1; cursor >= 0; cursor--) {
    /** @type {?string} */
    var key = this.storage_.key(cursor);
    if (key.indexOf(needle) === 0) {
      var msg = JSON.parse(this.storage_.getItem(key) || '');

      if (this.lastPing_ - msg.time > 10000) {
        this.storage_.removeItem(key);
      }
    }
  }
};


/**
 * Called when the former master is lost.  Starts a delay to run the routine which will identify a new master.
 * @private
 */
os.xt.Peer.prototype.establishMaster_ = function() {
  if (this.establishMasterDelay_) {
    return;
  }
  this.establishMasterDelay_ = new goog.async.Delay(this.doEstablishMaster_, 25, this);
  this.establishMasterDelay_.start();
};


/**
 * Handler for the delay to establish master.  Inspects all remaining peers and identify the next master,
 * deterministically.  If this peer is it, take on the role of master.
 * @private
 */
os.xt.Peer.prototype.doEstablishMaster_ = function() {
  if (this.isPeerAlive_(this.getId())) {
    // get others
    var peerIds = this.getPeers();
    // add self
    peerIds.push(this.getId());
    // sort, "smallest" peer ID becomes master
    goog.array.sort(peerIds);
    if (peerIds[0] === this.getId()) {
      // it's me!
      this.becomeMaster_();
    }
  }
  this.establishMasterDelay_.stop();
  this.establishMasterDelay_.dispose();
  this.establishMasterDelay_ = null;
};


/**
 * @return {boolean} true if this Peer is master, false otherwise
 */
os.xt.Peer.prototype.isMaster = function() {
  return os.xt.Peer.isMaster(this.getId(), this.getGroup(), this.storage_);
};


/**
 * Become the master peer if the position is still available.
 * @private
 */
os.xt.Peer.prototype.becomeMaster_ = function() {
  var key = this.getMasterKey_();
  if (!this.storage_.getItem(key)) {
    this.storage_.setItem(key, this.id_);
    os.xt.events.DISPATCHER.dispatchEvent(new goog.events.Event(
        os.xt.events.EventType.forGroup(os.xt.events.EventType.MASTER_APPOINTED, this.group_)));
  }
};


/**
 * Get all the peers in the current group. If the optional type parameter is included, only peers which
 * support that message type are returned.
 * @param {string=} opt_type The optional message type
 * @param {boolean=} opt_includeDead Whether or not to include dead peers in the list.  Defaults to false.
 * @return {!Array<!string>} The list of peer IDs
 */
os.xt.Peer.prototype.getPeers = function(opt_type, opt_includeDead) {
  var includeDeadPeers = opt_includeDead || false;

  /** @type {string} */ var needle = 'xt.' + this.group_ + '.';
  /** @type {!Array<!string>} */ var list = [];
  /** @type {number} */ var keyCount = this.storage_.length;

  for (var cursor = keyCount - 1; cursor >= 0; cursor--) {
    /** @type {?string} */
    var key = this.storage_.key(cursor);
    if (key.indexOf(needle) === 0) {
      var parts = key.split('.');

      if (parts.length > 2 && parts[2] !== 'master' && parts[2] !== 'public' && parts[2] !== this.id_ &&
          list.indexOf(parts[2]) === -1) {
        if (includeDeadPeers || this.isPeerAlive_(parts[2])) {
          if (opt_type) {
            var types = /** @type {Array<string>} */ (JSON.parse(
                this.storage_.getItem(parts.slice(0, 3).join('.') + '.types') || '[]'));
            if (types.indexOf(opt_type) > -1) {
              list.push(parts[2]);
            }
          } else {
            list.push(parts[2]);
          }
        }
      }
    }
  }

  return list;
};


/**
 * Wait for a peer matching the specified peer ID to become available, optionally waiting for that peer to support the
 * given message type.
 * @param {!string} peerId the ID of the peer of interest
 * @param {?string=} opt_messageType the message type the peer of interest needs to support
 * @param {!number=} opt_timeout the number of milliseconds to wait for the peer
 * @return {goog.async.Deferred}
 */
os.xt.Peer.prototype.waitForPeer = function(peerId, opt_messageType, opt_timeout) {
  var deferred = new goog.async.Deferred();
  this.waitList_.push({
    peerId: peerId,
    messageType: opt_messageType,
    expiration: Date.now() + (opt_timeout || 30000),
    deferred: deferred
  });
  this.processWaitList_();
  return deferred;
};


/**
 * Mapping function to map a list of IDs to info objects
 * @param {string} id The peer ID
 * @param {number} i The index
 * @param {Array} arr The array
 * @return {os.xt.PeerInfo} The peer info
 * @private
 */
os.xt.Peer.prototype.mapIdToInfo_ = function(id, i, arr) {
  return os.xt.PeerInfo.load(this.group_, id, this.storage_);
};


/**
 * This is the exact same thing as getPeers(), but returns full peer info objects.
 * @param {string=} opt_type The optional message type.
 * @return {Array<os.xt.PeerInfo>} The peer info list
 */
os.xt.Peer.prototype.getPeerInfo = function(opt_type) {
  return this.getPeers(opt_type).map(this.mapIdToInfo_, this);
};


/**
 * An array of items to exclue from processing
 * @type {Array<string>}
 * @private
 */
os.xt.Peer.notThese_ = ['ping', 'title', 'details', 'types'];


/**
 * Handles storage events
 * @param {Event} event The storage event
 * @private
 */
os.xt.Peer.prototype.onStorage_ = function(event) {
  var parts = [];
  if (event.key) {
    parts = event.key.split('.');
  }

  // ensure that the key starts with xt<group><id> or xt<group>.public
  if (parts.length >= 4 && parts[0] === 'xt' && parts[1] === this.group_ &&
      (parts[2] === this.id_ || parts[2] == 'public') && event.newValue) {
    // ignore info changes and messages from ourselves
    if (os.xt.Peer.notThese_.indexOf(parts[3]) === -1 && parts[3] !== this.id_) {
      if (this.handleMessage(event.newValue, parts[3]) && parts[2] !== 'public') {
        // we handled the message, so clear the key
        this.storage_.removeItem(event.key);
      }
    }
  } else if (parts.length >= 4 && parts[0] === 'xt' && parts[1] === this.group_ &&
      os.xt.Peer.notThese_.indexOf(parts[3]) > 0) {
    // could be a new peer, or a dead one
    this.processWaitList_();
  }

  if (event.key === this.getMasterKey_() && !event.newValue) {
    // attempt to become master
    this.establishMaster_();
  }
};


/**
 * Removes all entries for this peer from local storage
 * @param {*=} opt_e An optional event
 * @private
 */
os.xt.Peer.prototype.cleanup_ = function(opt_e) {
  os.xt.Peer.cleanupPeer_(this.group_, this.id_, this.storage_);
  if (this.pingTimer_) {
    this.pingTimer_.stop();
    this.pingTimer_.unlisten(goog.Timer.TICK, this.onPing_, false, this);
    this.pingTimer_.dispose();
    this.pingTimer_ = null;
  }
  if (this.waitListDelay_) {
    this.waitListDelay_.stop();
    this.waitListDelay_.dispose();
    this.waitListDelay_ = null;
  }

  window.removeEventListener('storage', this.boundStorage_);
  window.removeEventListener('unload', this.boundCleanup_);
};


/**
 * Destroy, clean up, the peer.
 */
os.xt.Peer.prototype.destroy = function() {
  this.cleanup_();
};


/**
 * Handles messages sent from other peers or off of the public channel
 * @param {string} value The JSON of the message
 * @param {string} sender The sender ID
 * @return {boolean}
 */
os.xt.Peer.prototype.handleMessage = function(value, sender) {
  var msg = JSON.parse(value);

  for (var i = 0, n = this.handlers_.length; i < n; i++) {
    var types = this.handlers_[i].getTypes ? this.handlers_[i].getTypes() : this.handlers_[i]['getTypes']();

    if (types.indexOf(msg.type) > -1) {
      goog.log.fine(os.xt.Peer.LOGGER_, 'Found handler for message with type ' + msg.type);

      try {
        if (this.handlers_[i].process) {
          this.handlers_[i].process(msg.data, msg.type, sender, msg.time);
        } else {
          this.handlers_[i]['process'](msg.data, msg.type, sender, msg.time);
        }
        return true;
      } catch (e) {
        goog.log.error(os.xt.Peer.LOGGER_, 'Error while handling message!', e);
      }
    } else {
      goog.log.fine(os.xt.Peer.LOGGER_,
          'Could not find handler for message with type ' + msg.type + ' in ' + this.getTypes());
    }
  }

  return false;
};


/**
 * Iterate over the wait list to determine what peers have become available.  For peers that have become available,
 * callback the deferred objects.  For wait records that have timed out, errback the deferred objects.
 * @private
 */
os.xt.Peer.prototype.processWaitList_ = function() {
  var waitList = this.waitList_;
  var now = Date.now();
  this.waitList_ = []; // re-initialize in case waiters add another wait record in the callback
  while (waitList.length > 0) {
    var wait = waitList.shift();
    var messageType = wait.messageType;
    var peerInfo = os.xt.PeerInfo.load(this.group_, wait.peerId, this.storage_);
    if (peerInfo && messageType) {
      if (!goog.array.contains(peerInfo.types, messageType)) {
        peerInfo = null;
      }
    }
    if (peerInfo) {
      wait.deferred.callback(peerInfo);
    } else if (now > wait.expiration) {
      wait.deferred.errback();
    } else {
      this.waitList_.push(wait);
    }
  }
  if (this.waitList_.length) {
    now = Date.now();
    var nextExpiration = now + os.xt.Peer.PING_INTERVAL;
    nextExpiration = goog.array.reduce(this.waitList_, function(minExpiration, wait, i, a) {
      return Math.min(minExpiration, wait.expiration);
    }, nextExpiration);
    this.waitListDelay_.start(nextExpiration - now);
  }
};



/**
 * A small structure that represents info about other peers
 * @param {string} group The group to which the peer belongs
 * @param {string} id The ID
 * @param {string=} opt_title The title
 * @param {string=} opt_details The details
 * @param {Array<string>=} opt_types The types
 * @constructor
 */
os.xt.PeerInfo = function(group, id, opt_title, opt_details, opt_types) {
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
};


/**
 * Loads the specified peer info from local storage
 * @param {!string} group the peer group
 * @param {!string} id the peer ID
 * @param {!Storage} storage
 * @return {os.xt.PeerInfo} the loaded peer info
 */
os.xt.PeerInfo.load = function(group, id, storage) {
  if (!group || !id) {
    return null;
  }
  var ping = os.xt.Peer.getLastPing_(group, id, storage);
  if (!ping) {
    // peer's not ready
    return null;
  }
  var prefix = 'xt.' + group + '.' + id + '.';
  var types = /** @type {Array<string>} */ (JSON.parse(storage.getItem(prefix + 'types') || '[]'));
  var title = storage.getItem(prefix + 'title') || '';
  var details = storage.getItem(prefix + 'details') || '';
  return new os.xt.PeerInfo(group, id, title, details, types);
};
