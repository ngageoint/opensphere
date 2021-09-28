goog.declareModuleId('os.net.IRestful');

/**
 * Interface which enables an object to declare its REST URLs.
 *
 * @interface
 */
export default class IRestful {
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
