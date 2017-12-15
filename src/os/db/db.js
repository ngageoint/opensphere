goog.provide('os.db');
goog.require('goog.db.Error');
goog.require('goog.db.Error.ErrorName');
goog.require('goog.db.IndexedDb');


/**
 * Constructs an goog.db.Error instance from an IDBRequest. This abstraction is
 * necessary to provide backwards compatibility with Chrome21.
 *
 * This fixes use of the deprecated IDBRequest.errorCode property.
 *
 * @param {!IDBRequest} request The request that failed.
 * @param {string} message The error message to add to err if it's wrapped.
 * @return {!goog.db.Error} The error that caused the failure.
 *
 * @suppress {duplicate|deprecated}
 */
goog.db.Error.fromRequest = function(request, message) {
  if ('error' in request) {
    // Chrome 21 and before.
    return new goog.db.Error(request.error, message);
  } else if ('errorCode' in request) {
    // Chrome 22+.
    var errorName = goog.db.Error.getName(request.errorCode);
    return new goog.db.Error(
        /** @type {!DOMError} */ ({name: errorName}), message);
  } else {
    return new goog.db.Error(/** @type {!DOMError} */ (
        {name: goog.db.Error.ErrorName.UNKNOWN_ERR}), message);
  }
};


/**
 * Dispatches a wrapped error event based on the given event.
 *
 * This fixes use of the deprecated IDBRequest.errorCode property.
 *
 * @param {Event} ev The error event given to the underlying IDBDatabase.
 * @private
 *
 * @suppress {duplicate|deprecated|unusedPrivateMembers}
 */
goog.db.IndexedDb.prototype.dispatchError_ = function(ev) {
  var request = /** @type {IDBRequest} */ (ev.target);
  var errorCode = goog.db.Error.ErrorName.UNKNOWN_ERR;
  if ('error' in request) {
    errorCode = request.error.name;
  } else if ('errorCode' in request) {
    errorCode = request.errorCode;
  }

  this.dispatchEvent({
    type: goog.db.IndexedDb.EventType.ERROR,
    errorCode: errorCode
  });
};
