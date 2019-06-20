goog.provide('os.annotation.AbstractAnnotation');

goog.require('goog.Disposable');
goog.require('os.annotation');
goog.require('os.annotation.IAnnotation');


/**
 * Abstract annotation implementation.
 * @abstract
 * @implements {os.annotation.IAnnotation}
 * @extends {goog.Disposable}
 * @constructor
 */
os.annotation.AbstractAnnotation = function() {
  os.annotation.AbstractAnnotation.base(this, 'constructor');

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
};
goog.inherits(os.annotation.AbstractAnnotation, goog.Disposable);


/**
 * @inheritDoc
 */
os.annotation.AbstractAnnotation.prototype.disposeInternal = function() {
  os.annotation.AbstractAnnotation.base(this, 'disposeInternal');

  this.disposeUI();
};


/**
 * @inheritDoc
 */
os.annotation.AbstractAnnotation.prototype.getVisible = function() {
  return this.visible;
};


/**
 * @inheritDoc
 */
os.annotation.AbstractAnnotation.prototype.setVisible = function(value) {
  if (this.visible !== value) {
    this.visible = value;
    this.setVisibleInternal();
  }
};


/**
 * Set if the annotation is visible.
 * @abstract
 * @protected
 */
os.annotation.AbstractAnnotation.prototype.setVisibleInternal = function() {};


/**
 * @abstract
 * @inheritDoc
 */
os.annotation.AbstractAnnotation.prototype.getOptions = function() {};


/**
 * @abstract
 * @inheritDoc
 */
os.annotation.AbstractAnnotation.prototype.setOptions = function(options) {};


/**
 * @abstract
 * @inheritDoc
 */
os.annotation.AbstractAnnotation.prototype.createUI = function() {};


/**
 * @abstract
 * @inheritDoc
 */
os.annotation.AbstractAnnotation.prototype.disposeUI = function() {};
