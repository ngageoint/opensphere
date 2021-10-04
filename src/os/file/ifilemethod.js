goog.declareModuleId('os.file.IFileMethod');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const Listenable = goog.requireType('goog.events.Listenable');
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @extends {IDisposable}
 * @extends {Listenable}
 * @interface
 */
export default class IFileMethod {
  /**
   * Gets the priority of this method. The higher the priority, the earlier the method is tried.
   * @return {number}
   */
  getPriority() {}

  /**
   * Detects whether or not this method is supported and returns the result.
   * @return {boolean}
   */
  isSupported() {}

  /**
   * The resulting file.
   * @return {OSFile}
   */
  getFile() {}

  /**
   * Associate a file with this method.
   * @param {OSFile} file
   */
  setFile(file) {}

  /**
   * Launch whatever is needed to load the file. When finished, fire {@type os.events.EventType.COMPLETE}.
   * If canceled, fire {@type os.events.EventType.CANCEL}.
   * @param {Object=} opt_options Additional options for the import manager
   */
  loadFile(opt_options) {}

  /**
   * Clears the file since we are done with the reference
   */
  clearFile() {}

  /**
   * Clones the method
   * @return {IFileMethod} A copy of the method
   */
  clone() {}
}
