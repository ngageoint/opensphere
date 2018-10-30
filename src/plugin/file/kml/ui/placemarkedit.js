goog.provide('plugin.file.kml.ui.PlacemarkEditCtrl');
goog.provide('plugin.file.kml.ui.placemarkEditDirective');

goog.require('ol.Feature');
goog.require('os.annotation.Annotation');
goog.require('os.annotation.annotationOptionsDirective');
goog.require('os.data.ColumnDefinition');
goog.require('os.ui.FeatureEditCtrl');
goog.require('os.ui.Module');
goog.require('os.ui.list');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.file.kml.ui');


/**
 * Directive for editing a KML placemark.
 * @return {angular.Directive}
 */
plugin.file.kml.ui.placemarkEditDirective = function() {
  var dir = os.ui.featureEditDirective();
  dir.controller = plugin.file.kml.ui.PlacemarkEditCtrl;
  return dir;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('placemarkedit', [plugin.file.kml.ui.placemarkEditDirective]);



/**
 * Controller function for the placemarkedit directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {os.ui.FeatureEditCtrl}
 * @constructor
 * @ngInject
 */
plugin.file.kml.ui.PlacemarkEditCtrl = function($scope, $element, $timeout) {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'constructor', $scope, $element, $timeout);

  // if the name wasn't set in the base class, set it to New Place
  this['name'] = this['name'] || 'New Place';

  // by default, show column choices for the default KML source. remove internal columns because they're not generally
  // useful to a user.
  var defaultColumns = plugin.file.kml.SOURCE_FIELDS.filter(function(field) {
    return !os.feature.isInternalField(field);
  }).map(function(col) {
    return new os.data.ColumnDefinition(col);
  });

  /**
   * The preview annotation.
   * @type {os.annotation.Annotation|undefined}
   * @protected
   */
  this.previewAnnotation;

  /**
   * @type {!Array<string>}
   */
  this['labelColumns'] = defaultColumns;

  /**
   * If an annotation balloon should be shown for the feature.
   * @type {boolean}
   */
  this['showAnnotation'] = !!this.previewFeature.get(plugin.file.kml.KMLField.SHOW_BALLOON);

  /**
   * @type {string}
   */
  this.scope['featureAnnotationID'] = 'featureAnnotation' + this.uid;

  /**
   * @type {string}
   */
  this.scope['showAnnotationID'] = 'showAnnotation' + this.uid;

  /**
   * @type {!plugin.file.kml.ui.PlacemarkOptions}
   * @protected
   */
  this.options = /** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ($scope['options'] || {});

  var time = this.options['time'];

  if (time) {
    this['startTime'] = time.getStart();
    this['startTimeISO'] = this['startTime'] ? new Date(this['startTime']).toISOString() : undefined;
    this['endTime'] = time.getEnd() === this['startTime'] ? undefined : time.getEnd();
    this['endTimeISO'] = this['endTime'] ? new Date(this['endTime']).toISOString() : undefined;
    if (this['endTime'] > this['startTime']) {
      this['dateType'] = os.ui.datetime.AnyDateType.RANGE;
    } else {
      this['dateType'] = os.ui.datetime.AnyDateType.INSTANT;
    }
  }

  os.ui.list.add(this.scope['optionsListID'], 'annotationoptions');
};
goog.inherits(plugin.file.kml.ui.PlacemarkEditCtrl, os.ui.FeatureEditCtrl);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.disposeInternal = function() {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'disposeInternal');

  if (this.previewAnnotation) {
    goog.dispose(this.previewAnnotation);
    this.previewAnnotation = null;
  }

  if (this.options['feature']) {
    this.options['feature'].changed();
  }
};


/**
 * @inheritDoc
 * @export
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.accept = function() {
  // create a new feature if necessary
  var feature = this.options['feature'] = this.options['feature'] || new ol.Feature();

  // filter out empty labels when the placemark is saved
  if (this['labels']) {
    this['labels'] = this['labels'].filter(function(label) {
      return label['column'] != null;
    });
  }

  this.saveToFeature(feature);

  if (!feature.getId()) {
    feature.setId(ol.getUid(feature));
  }

  plugin.file.kml.ui.updatePlacemark(this.options);

  this.close();
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.createPreviewFeature = function() {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'createPreviewFeature');

  if (this.options['annotation']) {
    // turn on the balloon
    this.previewFeature.set(plugin.file.kml.KMLField.SHOW_BALLOON, true);

    // default to hiding the center shape
    this['shape'] = os.style.ShapeType.NONE;

    // don't display a label, but leave the config present to populate the UI
    this['labels'][0]['column'] = '';
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.loadFromFeature = function(feature) {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'loadFromFeature', feature);

  this['showAnnotation'] = !!feature.get(plugin.file.kml.KMLField.SHOW_BALLOON);
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.saveToFeature = function(feature) {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'saveToFeature', feature);

  if (feature) {
    feature.set(plugin.file.kml.KMLField.SHOW_BALLOON, this['showAnnotation']);

    // fire a change event on the feature so the annotation updates its content
    feature.changed();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.updatePreview = function() {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'updatePreview');
  this.updateAnnotation();
};


/**
 * Updates the temporary annotation.
 * @export
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.updateAnnotation = function() {
  if (this.previewFeature && !this.options['feature']) {
    if (this['showAnnotation']) {
      if (!this.previewAnnotation) {
        this.previewAnnotation = new os.annotation.Annotation(this.previewFeature);
      }
    } else {
      goog.dispose(this.previewAnnotation);
      this.previewAnnotation = null;
    }
  }
};
