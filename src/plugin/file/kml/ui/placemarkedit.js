goog.declareModuleId('plugin.file.kml.ui.PlacemarkEditUI');

import Feature from 'ol/src/Feature.js';
import {getUid} from 'ol/src/util.js';
import '../../../../os/annotation/annotationoptions.js';
import * as annotation from '../../../../os/annotation/annotation.js';
import FeatureAnnotation from '../../../../os/annotation/featureannotation.js';
import ColumnDefinition from '../../../../os/data/columndefinition.js';
import * as osFeature from '../../../../os/feature/feature.js';
import * as osObject from '../../../../os/object/object.js';
import * as structs from '../../../../os/structs/structs.js';
import * as osStyle from '../../../../os/style/style.js';
import AnyDateType from '../../../../os/ui/datetime/anydatetype.js';
import {Controller as FeatureEditCtrl, directive as featureEditDirective} from '../../../../os/ui/featureedit.js';
import * as list from '../../../../os/ui/list.js';
import Module from '../../../../os/ui/module.js';
import PlacesManager from '../../../places/placesmanager.js';
import * as kml from '../kml.js';
import * as kmlUI from './kmlui.js';

const dispose = goog.require('goog.dispose');

/**
 * Directive for editing a KML placemark.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = featureEditDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'placemarkedit';


/**
 * Add the directive to the module.
 */
Module.directive('placemarkedit', [directive]);



/**
 * Controller function for the placemarkedit directive
 * @unrestricted
 */
export class Controller extends FeatureEditCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    // if the name wasn't set in the base class, set it to New Place
    this['name'] = this['name'] || 'New Place';

    this['customFoldersEnabled'] = false;

    // by default, show column choices for the default KML source. remove internal columns because they're not generally
    // useful to a user.
    var defaultColumns = kml.SOURCE_FIELDS.filter(function(field) {
      return !osFeature.isInternalField(field);
    }).map(function(col) {
      return new ColumnDefinition(col);
    });

    /**
     * The preview annotation.
     * @type {FeatureAnnotation|undefined}
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
        this['dateType'] = AnyDateType.RANGE;
      } else {
        this['dateType'] = AnyDateType.INSTANT;
      }
    }

    if (!this.isFeatureDynamic()) {
      var optionsListId = 'optionsList' + this['uid'];

      list.add(optionsListId,
          '<annotationoptions options="ctrl.annotationOptions"></annotationoptions>');

      if (this.options['annotation']) {
        // if creating a new annotation, expand the Annotation Options section by default
        this.defaultExpandedOptionsId = 'featureAnnotation' + this['uid'];
      }

      this['customFoldersEnabled'] = true;

      var folders = [];
      var rootFolder = PlacesManager.getInstance().getPlacesRoot();
      structs.flattenTree(rootFolder, folders, (node) => /** @type {KMLNode} */ (node).isFolder());
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
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.previewAnnotation) {
      dispose(this.previewAnnotation);
      this.previewAnnotation = null;
    }

    if (this.options['feature']) {
      this.options['feature'].changed();
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  accept() {
    // create a new feature if necessary
    var feature = this.options['feature'] = this.options['feature'] || new Feature();

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
      feature.setId(getUid(feature));
    }

    kmlUI.updatePlacemark(this.options);

    if (this.callback) {
      this.callback(this.options);
    }

    this.close();
  }

  /**
   * @inheritDoc
   */
  createPreviewFeature() {
    super.createPreviewFeature();

    // set the default options for the annotation
    this['annotationOptions'] = osObject.unsafeClone(annotation.DEFAULT_OPTIONS);

    // disable annotation edit when creating an annotation
    this['annotationOptions'].editable = false;

    if (this.options['annotation']) {
      this.previewFeature.set(annotation.OPTIONS_FIELD, this['annotationOptions']);

      if (!this.originalGeometry) {
        // default to hiding the geometry for points as it tends to visually obscure what you're annotating
        this['shape'] = osStyle.ShapeType.NONE;
      }

      // don't display a label, but leave the config present to populate the UI
      this['labels'][0]['column'] = '';
    } else {
      this['annotationOptions'].show = false;
    }
  }

  /**
   * @inheritDoc
   */
  loadFromFeature(feature) {
    super.loadFromFeature(feature);

    var currentOptions = feature.get(annotation.OPTIONS_FIELD);
    this['annotationOptions'] = osObject.unsafeClone(currentOptions || annotation.DEFAULT_OPTIONS);

    if (!currentOptions) {
      this['annotationOptions'].show = false;
    }

    // disable annotation edit when editing an annotation
    this['annotationOptions'].editable = false;
  }

  /**
   * @inheritDoc
   */
  saveToFeature(feature) {
    super.saveToFeature(feature);

    feature.set(annotation.OPTIONS_FIELD, this['annotationOptions']);
  }

  /**
   * @inheritDoc
   * @export
   */
  updatePreview() {
    super.updatePreview();
    this.updateAnnotation();
  }

  /**
   * Updates the option for the placemark's parent folder
   *
   * @export
   */
  updateFolder() {
    if (this['folder']) {
      this.options['parent'] = this['folder'];
    }
  }

  /**
   * Updates the temporary annotation.
   *
   * @export
   */
  updateAnnotation() {
    if (this.previewFeature) {
      if (this['annotationOptions'].show) {
        // only create the preview annotation if not already present, and the feature isn't already displaying an
        // annotation overlay
        if (!this.previewAnnotation && !annotation.hasOverlay(this.previewFeature)) {
          this.previewAnnotation = new FeatureAnnotation(this.previewFeature);
        }
      } else {
        // dispose the preview
        dispose(this.previewAnnotation);
        this.previewAnnotation = null;
      }

      // fire a change event on the feature to trigger an overlay update (if present)
      this.previewFeature.changed();
    }
  }

  /**
   * Resets the header background to the current default theme color
   *
   * @private
   */
  resetHeaderBackgroundColor_() {
    this['annotationOptions'].headerBG = undefined;
    this['tempHeaderBG'] = undefined;
  }

  /**
   * Resets the body background to the current default theme color
   *
   * @private
   */
  resetBodyBackgroundColor_() {
    this['annotationOptions'].bodyBG = undefined;
    this['tempBodyBG'] = undefined;
  }

  /**
   * Save color to feature
   *
   * @param {angular.Scope.Event} event
   * @param {string} color The new color
   */
  saveHeaderBackgroundColor_(event, color) {
    this['annotationOptions'].headerBG = color;
  }

  /**
   * Save color to feature
   *
   * @param {angular.Scope.Event} event
   * @param {string} color The new color
   */
  saveBodyBackgroundColor_(event, color) {
    this['annotationOptions'].bodyBG = color;
  }
}
