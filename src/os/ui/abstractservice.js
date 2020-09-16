goog.provide('os.ui.AbstractService');

goog.require('goog.json');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertManager');
goog.require('os.xt.Peer');



/**
 * Provides functions available to all services.
 *
 * @constructor
 * @ngInject
 */
os.ui.AbstractService = function() {
  /**
   * @type {os.xt.Peer}
   */
  this.peer = os.xt.Peer.getInstance();

  /**
   * The logger
   * @type {goog.log.Logger}
   */
  this.log = os.ui.AbstractService.LOGGER_;

  /**
   * in milliseconds: maximum allowed time between requests before responses will be considered stale
   * Recommended that child classes set their own
   */
  this.maxTimeBeforeStale = 5 * 60 * 1000;
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.AbstractService.LOGGER_ = goog.log.getLogger('os.ui.AbstractService');


/**
 * Map the request time to the request key so it can be reused if appropriate and deleted when appropriate
 * @type {Object<number, string>}
 * @protected
 */
os.ui.AbstractService.mapTimeToKey = {};


/**
 * Map the uri to the response event so it can be reused if appropriate
 * @type {Object<string, goog.events.Event>}
 * @protected
 */
os.ui.AbstractService.mapUriToResponseEvent = {};


/**
 * Don't allow invalidation while invalidation is in progress
 * @type {boolean}
 * @protected
 */
os.ui.AbstractService.isInvalidatingCache = false;


/**
 * Request callback on success
 *
 * @param {goog.events.Event} event The request event
 * @param {function(*): ?} resolve The goog.Promise resolve function
 * @protected
 */
os.ui.AbstractService.prototype.onSuccess = function(event, resolve) {
  const request = /** @type {os.net.Request} */ (event.target);
  const response = /** @type {string} */ (request.getResponse());

  if (response && typeof response === 'string' && goog.json.isValid(response)) {
    const data = /** @type {Object} */ (JSON.parse(response));
    resolve(data);
  } else {
    resolve('');
  }
};


/**
 * A default error handler to display messages
 *
 * @param {goog.events.Event} event The request event
 * @param {string} message The base error message to display
 * @param {boolean} silent If error popups should be suppressed. Errors will still be logged.
 * @param {function(?):?=} opt_reject The goog.Promise reject function
 * @protected
 */
os.ui.AbstractService.prototype.onError = function(event, message, silent, opt_reject) {
  const request = /** @type {os.net.Request} */ (event.target);
  let rejectMessage = message;
  const errors = request.getErrors();
  request.dispose();

  if (errors && errors.length > 0) {
    const errorStr = errors.join('\n');
    if (rejectMessage && rejectMessage.length > 0) {
      rejectMessage += '\n' + errorStr;
    } else {
      rejectMessage = errorStr;
    }
  }

  this.reportError(rejectMessage, silent, opt_reject);
};


/**
 * Fires an error alert with support information attached.
 *
 * @param {string} message The base error message.
 * @param {boolean} silent If error popups should be suppressed. Errors will still be logged.
 * @param {function(?):?=} opt_reject The goog.Promise reject function
 * @protected
 */
os.ui.AbstractService.prototype.reportError = function(message, silent, opt_reject) {
  let support = '';
  const supportContact = /** @type {string} */ (os.settings.get(['supportContact']));
  if (supportContact && !silent) {
    support = '\nContact <strong>' + supportContact + '</strong> for support.';
  }

  let errorMsg = '';
  if (!silent) {
    errorMsg = goog.string.newLineToBr(message + support);
  } else {
    errorMsg = message;
  }

  if (silent) {
    goog.log.error(this.log, errorMsg);
  } else {
    os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR, this.log);
  }

  if (opt_reject !== undefined) {
    opt_reject(message);
  }
};


/**
 * Load request but check against the cache first
 * @param {os.net.Request} request
 * @protected
 */
os.ui.AbstractService.prototype.loadRequest = function(request) {
  const uriKey = os.ui.AbstractService.getRequestKey(request);
  const event = os.ui.AbstractService.checkCache(uriKey);
  if (event) {
    goog.log.info(os.ui.AbstractService.LOGGER_, 'Providing response from service cache for ' + uriKey);
    request.dispatchEvent(event);
  } else {
    // don't bother if less than a second
    if (this.maxTimeBeforeStale >= 1000) {
      request.listenOnce(goog.net.EventType.SUCCESS, (event) => {
        os.ui.AbstractService.addToCache_(event, (new Date().valueOf() + this.maxTimeBeforeStale));
      }, false, this);
    }
    request.load();
  }
};


/**
 * Check the cache in case something in there will satisfy the request
 * Return the event object
 * Return undefined if not found
 * @param {string} uriKey
 * @return {goog.events.Event|undefined}
 * @protected
 */
os.ui.AbstractService.checkCache = function(uriKey) {
  // trigger delete for anything that might be stale
  os.ui.AbstractService.invalidateCache();

  return os.ui.AbstractService.mapUriToResponseEvent[uriKey];
};


/**
 * Invalidate the cache based on the expiration timestamp in the mapTimeToKey
 * Delete items as necessary and dispose requests if we were the last ones listening for success
 * @protected
 */
os.ui.AbstractService.invalidateCache = function() {
  const service = os.ui.AbstractService;
  // don't mess with it while deleting stuff, just to be safe
  if (!service.isInvalidatingCache) {
    service.isInvalidatingCache = true;
    // find the keys to remove
    const keysToRemove = [];
    const currentTimeStamp = new Date().valueOf();
    // check for things where the current time is larger than the expiration time
    for (let expirationTime in service.mapTimeToKey) {
      expirationTime = Number(expirationTime);
      if (expirationTime < currentTimeStamp) {
        keysToRemove.push(service.mapTimeToKey[expirationTime]);
        delete service.mapTimeToKey[expirationTime];
      }
    }

    // remove them
    keysToRemove.forEach((uriKey) => {
      service.disposeRequest(
          /** @type {os.net.Request} */ (service.mapUriToResponseEvent[uriKey].target),
          goog.net.EventType.SUCCESS
      );
      delete service.mapUriToResponseEvent[uriKey];
    });
    service.isInvalidatingCache = false;
  }
};


/**
 * Add the request response to the cache
 * @param {goog.events.Event} event The request event
 * @param {number} expirationTime The response expiration time
 * @private
 */
os.ui.AbstractService.addToCache_ = function(event, expirationTime) {
  const request = /** @type {os.net.Request} */ (event.target);
  // get a pseudo-uri for uniquely identifying requests
  const uriKey = os.ui.AbstractService.getRequestKey(request);

  // add to the maps
  os.ui.AbstractService.mapTimeToKey[expirationTime] = uriKey;
  os.ui.AbstractService.mapUriToResponseEvent[uriKey] = event;
};


/**
 * Get the key we'll use for uniquely accessing the cached response
 * @param {os.net.Request} request
 * @return {string}
 * @protected
 */
os.ui.AbstractService.getRequestKey = function(request) {
  const uri = request.getUri();
  const path = uri.getPath();
  const query = uri.getQuery();
  const content = request.getDataFormatter() && request.getDataFormatter().getContent() ?
       request.getDataFormatter().getContent() : '';
  return `${ path }${ query ? '?' + query : ''}${ content ? ':' + content : ''}`;
};


/**
 * Dispose request if there are no more listeners of a given type
 * @param {os.net.Request} request
 * @param {goog.net.EventType} eventType
 * @protected
 */
os.ui.AbstractService.disposeRequest = function(request, eventType) {
  if (request && !request.isDisposed()) {
    // collect all of the listeners of this type
    const lengthTrue = request.getListeners(eventType, true).length;
    const lengthFalse = request.getListeners(eventType, false).length;
    if (lengthTrue + lengthFalse == 0) {
      // dispose if no listeners
      request.dispose();
    }
  }
};
