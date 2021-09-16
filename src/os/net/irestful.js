goog.module('os.net.IRestful');


/**
 * Interface which enables an object to declare its REST URLs.
 *
 * @interface
 */
class IRestful {
  /**
   * Retrieve read REST relative URL.
   * @return {!string}
   */
  getReadUrl() {}

  /**
   * Retrieve create REST relative URL
   * @return {!string}
   */
  getCreateUrl() {}

  /**
   * Retrieve update REST relative URL
   * @return {!string}
   */
  getUpdateUrl() {}

  /**
   * Retrieve delete REST relative URL
   * @return {!string}
   */
  getDeleteUrl() {}
}

exports = IRestful;
