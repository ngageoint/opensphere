goog.provide('os.annotation.Annotation');

goog.require('goog.Disposable');
goog.require('ol.OverlayPositioning');
goog.require('ol.geom.GeometryType');
goog.require('os.annotation.annotationDirective');
goog.require('os.webgl.WebGLOverlay');
goog.require('os.xml');


/**
 * A map annotation.
 * @param {!ol.Feature} feature The OpenLayers feature.
 * @extends {goog.Disposable}
 * @constructor
 */
os.annotation.Annotation = function(feature) {
  os.annotation.Annotation.base(this, 'constructor');

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

  this.createUI();
};
goog.inherits(os.annotation.Annotation, goog.Disposable);


/**
 * @inheritDoc
 */
os.annotation.Annotation.prototype.disposeInternal = function() {
  os.annotation.Annotation.base(this, 'disposeInternal');

  this.disposeUI();
};


/**
 * Get the OpenLayers overlay.
 * @return {os.webgl.WebGLOverlay}
 */
os.annotation.Annotation.prototype.getOverlay = function() {
  return this.overlay;
};


/**
 * Create the annotation UI.
 * @protected
 */
os.annotation.Annotation.prototype.createUI = function() {
  if (this.scope) {
    return;
  }

  this.overlay = new os.webgl.WebGLOverlay({
    id: ol.getUid(this.feature),
    positioning: ol.OverlayPositioning.CENTER_CENTER
  });

  os.annotation.setPosition(this.overlay, this.feature);

  var compile = /** @type {!angular.$compile} */ (os.ui.injector.get('$compile'));
  this.scope = /** @type {!angular.Scope} */ (os.ui.injector.get('$rootScope').$new());

  ol.obj.assign(this.scope, {
    'feature': this.feature,
    'overlay': this.overlay
  });

  var template = '<annotation feature="feature" overlay="overlay"></annotation>';
  this.element = /** @type {Element} */ (compile(template)(this.scope)[0]);

  this.overlay.setElement(this.element);

  var map = os.MapContainer.getInstance().getMap();
  if (map) {
    map.addOverlay(this.overlay);
  }
};


/**
 * Dispose the annotation UI.
 * @protected
 */
os.annotation.Annotation.prototype.disposeUI = function() {
  if (this.overlay) {
    var map = os.MapContainer.getInstance().getMap();
    if (map) {
      map.removeOverlay(this.overlay);
    }

    this.overlay.dispose();
    this.overlay = null;
  }

  if (this.scope) {
    this.scope.$destroy();
    this.scope = null;
  }

  this.element = null;
};


/**
 * Set the target map position for an overlay.
 * @param {!ol.Overlay} overlay The overlay.
 * @param {ol.Feature} feature The feature. Use null to hide the overlay.
 */
os.annotation.setPosition = function(overlay, feature) {
  var position;

  if (feature) {
    var geometry = feature.getGeometry();
    if (geometry && geometry.getType() === ol.geom.GeometryType.POINT) {
      position = /** @type {ol.geom.Point} */ (geometry).getFirstCoordinate();
    }
  }

  overlay.setPosition(position);
};
