goog.module('os.annotation.AbstractAnnotation');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');

const IAnnotation = goog.requireType('os.annotation.IAnnotation');


/**
 * Abstract annotation implementation.
 *
 * @abstract
 * @implements {IAnnotation}
 */
class AbstractAnnotation extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The annotation element.
     * @type {?Element}
     * @protected
     */
    this.element = null;

    /**
     * The annotation Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = null;

    /**
     * The annotation options.
     * @type {osx.annotation.Options|undefined}
     */
    this.options = this.getOptions();

    /**
     * If the annotation is visible.
     * @type {boolean}
     * @protected
     */
    this.visible = true;

    this.createUI();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.disposeUI();
  }

  /**
   * @inheritDoc
   */
  getVisible() {
    return this.visible;
  }

  /**
   * @inheritDoc
   */
  setVisible(value) {
    if (this.visible !== value) {
      this.visible = value;
      this.setVisibleInternal();
    }
  }

  /**
   * Set if the annotation is visible.
   *
   * @abstract
   * @protected
   */
  setVisibleInternal() {}
}

exports = AbstractAnnotation;
