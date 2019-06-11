goog.provide('os.annotation.FeatureAnnotation');

goog.require('goog.Disposable');
goog.require('ol.OverlayPositioning');
goog.require('os.annotation');
goog.require('os.annotation.annotationDirective');
goog.require('os.webgl.WebGLOverlay');
goog.require('os.xml');


/**
 * An annotation tied to an OpenLayers feature.
 * @param {!ol.Feature} feature The OpenLayers feature.
 * @extends {goog.Disposable}
 * @constructor
 */
os.annotation.FeatureAnnotation = function(feature) {
  os.annotation.FeatureAnnotation.base(this, 'constructor');

  /**
   * The OpenLayers feature.
   * @type {!ol.Feature}
   * @protected
   */
  this.feature = feature;

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
   * The overlay.
   * @type {os.webgl.WebGLOverlay}
   * @protected
   */
  this.overlay = null;

  /**
   * If the annotation is visible.
   * @type {boolean}
   * @protected
   */
  this.visible = true;

  this.createUI();
  ol.events.listen(this.feature, ol.events.EventType.CHANGE, this.handleFeatureChange, this);
};
goog.inherits(os.annotation.FeatureAnnotation, goog.Disposable);


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotation.prototype.disposeInternal = function() {
  os.annotation.FeatureAnnotation.base(this, 'disposeInternal');

  ol.events.unlisten(this.feature, ol.events.EventType.CHANGE, this.handleFeatureChange, this);
  this.disposeUI();
};


/**
 * Update the annotation when the feature changes.
 * @protected
 */
os.annotation.FeatureAnnotation.prototype.handleFeatureChange = function() {
  this.setVisibleInternal();
};


/**
 * Set if the annotation is visible.
 * @param {boolean} value If the annotation is visible.
 */
os.annotation.FeatureAnnotation.prototype.setVisible = function(value) {
  if (this.visible !== value) {
    this.visible = value;
    this.setVisibleInternal();
  }
};


/**
 * Set if the annotation is visible.
 * @protected
 */
os.annotation.FeatureAnnotation.prototype.setVisibleInternal = function() {
  if (this.overlay && this.feature) {
    var options = /** @type {osx.annotation.Options|undefined} */ (this.feature.get(os.annotation.OPTIONS_FIELD));
    // show the overlay when internal flag is set and configured to be displayed. this allows for separate states
    // between config and the feature.
    if (options) {
      var showOverlay = this.visible && options.show;
      os.annotation.setPosition(this.overlay, showOverlay ? this.feature : null);
    }
  }
};


/**
 * Create the annotation UI.
 * @protected
 */
os.annotation.FeatureAnnotation.prototype.createUI = function() {
  var options = this.feature ?
      /** @type {osx.annotation.Options|undefined} */ (this.feature.get(os.annotation.OPTIONS_FIELD)) : undefined;

  if (this.overlay || !options) {
    // don't create the overlay if it already exists or options are missing
    return;
  }

  this.overlay = new os.webgl.WebGLOverlay({
    id: ol.getUid(this.feature),
    offset: options.offset,
    positioning: ol.OverlayPositioning.CENTER_CENTER
  });

  this.setVisibleInternal();

  // create an Angular scope for the annotation UI
  var compile = /** @type {!angular.$compile} */ (os.ui.injector.get('$compile'));
  this.scope = /** @type {!angular.Scope} */ (os.ui.injector.get('$rootScope').$new());

  ol.obj.assign(this.scope, {
    'feature': this.feature,
    'overlay': this.overlay
  });

  // compile the template and assign the element to the overlay
  var template = '<annotation feature="feature" overlay="overlay"></annotation>';
  this.element = /** @type {Element} */ (compile(template)(this.scope)[0]);
  this.overlay.setElement(this.element);

  // add the overlay to the map
  var map = os.MapContainer.getInstance().getMap();
  if (map) {
    map.addOverlay(this.overlay);
  }
};


/**
 * Dispose the annotation UI.
 * @protected
 */
os.annotation.FeatureAnnotation.prototype.disposeUI = function() {
  if (this.overlay) {
    // remove the overlay from the map
    var map = os.MapContainer.getInstance().getMap();
    if (map) {
      map.removeOverlay(this.overlay);
    }

    // dispose of the overlay
    this.overlay.dispose();
    this.overlay = null;
  }

  // destroy the scope
  if (this.scope) {
    this.scope.$destroy();
    this.scope = null;
  }

  this.element = null;
};
