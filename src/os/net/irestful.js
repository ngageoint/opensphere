goog.provide('os.net.IRestful');



/**
 * Interface which enables an object to declare its REST URLs.
 * @interface
 */
os.net.IRestful = function() {};


/**
 * Retrieve read REST relative URL.
 * @return {!string}
 */
os.net.IRestful.prototype.getReadUrl;


/**
 * Retrieve create REST relative URL
 * @return {!string}
 */
os.net.IRestful.prototype.getCreateUrl;


/**
 * Retrieve update REST relative URL
 * @return {!string}
 */
os.net.IRestful.prototype.getUpdateUrl;


/**
 * Retrieve delete REST relative URL
 * @return {!string}
 */
os.net.IRestful.prototype.getDeleteUrl;
