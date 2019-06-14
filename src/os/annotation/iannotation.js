goog.provide('os.annotation.IAnnotation');



/**
 * Interface representing an annotation.
 * @interface
 * @template T
 */
os.annotation.IAnnotation = function() {};


/**
 * Get the annotation options.
 * @return {osx.annotation.Options|undefined} The annotation options or undefined.
 */
os.annotation.IAnnotation.prototype.getOptions;


/**
 * Set the annotation options.
 * @param {osx.annotation.Options|undefined} options The annotation options.
 */
os.annotation.IAnnotation.prototype.setOptions;


/**
 * Creates the UI for the annotation.
 */
os.annotation.IAnnotation.prototype.createUI;


/**
 * Dispose the annotation UI.
 */
os.annotation.IAnnotation.prototype.disposeUI;


/**
 * Get if the annotation is visible.
 * @return {boolean} If the annotation is visible.
 */
os.annotation.IAnnotation.prototype.getVisible;


/**
 * Set if the annotation is visible.
 * @param {boolean} value If the annotation is visible.
 */
os.annotation.IAnnotation.prototype.setVisible;
