goog.provide('plugin.file.kml.ui.PlacemarkEditCtrl');
goog.provide('plugin.file.kml.ui.placemarkEditDirective');

goog.require('ol.Feature');
goog.require('os.data.ColumnDefinition');
goog.require('os.ui.FeatureEditCtrl');
goog.require('os.ui.Module');
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

  if (!this['name']) {
    // if the name wasn't set in the base class, set it to New Place
    this['name'] = 'New Place';
  }

  // by default, show column choices for the default KML source. remove internal columns because they're not generally
  // useful to a user.
  var defaultColumns = plugin.file.kml.SOURCE_FIELDS.filter(function(field) {
    return !os.feature.isInternalField(field);
  }).map(function(col) {
    return new os.data.ColumnDefinition(col);
  });

  /**
   * @type {!Array<string>}
   */
  this['labelColumns'] = defaultColumns;

  /**
   * @type {!plugin.file.kml.ui.PlacemarkOptions}
   * @protected
   */
  this.options = /** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ($scope['options'] || {});
};
goog.inherits(plugin.file.kml.ui.PlacemarkEditCtrl, os.ui.FeatureEditCtrl);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.disposeInternal = function() {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
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
goog.exportProperty(
    plugin.file.kml.ui.PlacemarkEditCtrl.prototype,
    'accept',
    plugin.file.kml.ui.PlacemarkEditCtrl.prototype.accept);
