goog.provide('plugin.file.kml.ui.PlacemarkEditCtrl');
goog.provide('plugin.file.kml.ui.placemarkEditDirective');

goog.require('ol.Feature');
goog.require('os.annotation');
goog.require('os.annotation.FeatureAnnotation');
goog.require('os.annotation.annotationOptionsDirective');
goog.require('os.data.ColumnDefinition');
goog.require('os.structs');
goog.require('os.ui.FeatureEditCtrl');
goog.require('os.ui.Module');
goog.require('os.ui.list');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.file.kml.ui');
goog.require('plugin.places.PlacesManager');


/**
 * Directive for editing a KML placemark.
 *
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
 *
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

  this['customFoldersEnabled'] = false;

  // by default, show column choices for the default KML source. remove internal columns because they're not generally
  // useful to a user.
  var defaultColumns = plugin.file.kml.SOURCE_FIELDS.filter(function(field) {
    return !os.feature.isInternalField(field);
  }).map(function(col) {
    return new os.data.ColumnDefinition(col);
  });

  /**
   * The preview annotation.
   * @type {os.annotation.FeatureAnnotation|undefined}
   * @protected
   */
  this.previewAnnotation;

  /**
   * @type {!Array<string>}
   */
  this['labelColumns'] = defaultColumns;

  /**
   * tempHeaderColor
   * @type {string|undefined}
   */
  this['tempHeaderBG'] = this['annotationOptions'].headerBG || undefined;

  /**
   * tempBodyColor
   * @type {string|undefined}
   */
  this['tempBodyBG'] = this['annotationOptions'].bodyBG || undefined;

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

  if (!this.isFeatureDynamic()) {
    var optionsListId = 'optionsList' + this['uid'];

    os.ui.list.add(optionsListId,
        '<annotationoptions options="ctrl.annotationOptions"></annotationoptions>');

    if (this.options['annotation']) {
      // if creating a new annotation, expand the Annotation Options section by default
      this.defaultExpandedOptionsId = 'featureAnnotation' + this['uid'];
    }

    this['customFoldersEnabled'] = true;

    var folders = [];
    var rootFolder = plugin.places.PlacesManager.getInstance().getPlacesRoot();
    os.structs.flattenTree(rootFolder, folders, function(node) {
      return /** @type {plugin.file.kml.ui.KMLNode} */ (node).isFolder();
    });
    this['folderOptions'] = folders;

    var parentFolder = this.options['parent'];
    if (!parentFolder && this.options['node']) {
      parentFolder = this.options['node'].getParent();
    }

    this['folder'] = parentFolder || rootFolder;
  }

  $scope.$on('headerColor.reset', this.resetHeaderBackgroundColor_.bind(this));
  $scope.$on('bodyColor.reset', this.resetBodyBackgroundColor_.bind(this));
  $scope.$on('headerColor.change', this.saveHeaderBackgroundColor_.bind(this));
  $scope.$on('bodyColor.change', this.saveBodyBackgroundColor_.bind(this));
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

  // enable editing the annotation when the feature is saved
  this['annotationOptions'].editable = true;

  this.saveToFeature(feature);

  if (!feature.getId()) {
    feature.setId(ol.getUid(feature));
  }

  plugin.file.kml.ui.updatePlacemark(this.options);

  if (this.callback) {
    this.callback(this.options);
  }

  this.close();
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.createPreviewFeature = function() {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'createPreviewFeature');

  // set the default options for the annotation
  this['annotationOptions'] = os.object.unsafeClone(os.annotation.DEFAULT_OPTIONS);

  // disable annotation edit when creating an annotation
  this['annotationOptions'].editable = false;

  if (this.options['annotation']) {
    this.previewFeature.set(os.annotation.OPTIONS_FIELD, this['annotationOptions']);

    if (!this.originalGeometry) {
      // default to hiding the geometry for points as it tends to visually obscure what you're annotating
      this['shape'] = os.style.ShapeType.NONE;
    }

    // don't display a label, but leave the config present to populate the UI
    this['labels'][0]['column'] = '';
  } else {
    this['annotationOptions'].show = false;
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.loadFromFeature = function(feature) {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'loadFromFeature', feature);

  var currentOptions = feature.get(os.annotation.OPTIONS_FIELD);
  this['annotationOptions'] = os.object.unsafeClone(currentOptions || os.annotation.DEFAULT_OPTIONS);

  if (!currentOptions) {
    this['annotationOptions'].show = false;
  }

  // disable annotation edit when editing an annotation
  this['annotationOptions'].editable = false;
};



/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.saveToFeature = function(feature) {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'saveToFeature', feature);

  feature.set(os.annotation.OPTIONS_FIELD, this['annotationOptions']);
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.updatePreview = function() {
  plugin.file.kml.ui.PlacemarkEditCtrl.base(this, 'updatePreview');
  this.updateAnnotation();
};


/**
 * Updates the option for the placemark's parent folder
 *
 * @export
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.updateFolder = function() {
  if (this['folder']) {
    this.options['parent'] = this['folder'];
  }
};


/**
 * Updates the temporary annotation.
 *
 * @export
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.updateAnnotation = function() {
  if (this.previewFeature) {
    if (this['annotationOptions'].show) {
      // only create the preview annotation if not already present, and the feature isn't already displaying an
      // annotation overlay
      if (!this.previewAnnotation && !os.annotation.hasOverlay(this.previewFeature)) {
        this.previewAnnotation = new os.annotation.FeatureAnnotation(this.previewFeature);
      }
    } else {
      // dispose the preview
      goog.dispose(this.previewAnnotation);
      this.previewAnnotation = null;
    }

    // fire a change event on the feature to trigger an overlay update (if present)
    this.previewFeature.changed();
  }
};


/**
 * Resets the header background to the current default theme color
 *
 * @private
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.resetHeaderBackgroundColor_ = function() {
  this['annotationOptions'].headerBG = undefined;
  this['tempHeaderBG'] = undefined;
};


/**
 * Resets the body background to the current default theme color
 *
 * @private
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.resetBodyBackgroundColor_ = function() {
  this['annotationOptions'].bodyBG = undefined;
  this['tempBodyBG'] = undefined;
};


/**
 * Save color to feature
 *
 * @param {angular.Scope.Event} event
 * @param {string} color The new color
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.saveHeaderBackgroundColor_ = function(event, color) {
  this['annotationOptions'].headerBG = color;
};

/**
 * Save color to feature
 *
 * @param {angular.Scope.Event} event
 * @param {string} color The new color
 */
plugin.file.kml.ui.PlacemarkEditCtrl.prototype.saveBodyBackgroundColor_ = function(event, color) {
  this['annotationOptions'].bodyBG = color;
};
