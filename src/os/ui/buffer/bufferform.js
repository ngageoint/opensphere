goog.declareModuleId('os.ui.buffer.BufferFormUI');

import GeometryType from 'ol/src/geom/GeometryType.js';
import {transformExtent} from 'ol/src/proj.js';

import '../im/basicinfo.js';
import * as buffer from '../../buffer/buffer.js';
import {isGeometryPolygonal} from '../../geo/geo.js';
import * as osJsts from '../../geo/jsts.js';
import * as osMap from '../../map/map.js';
import MapContainer from '../../mapcontainer.js';
import {convertUnits} from '../../math/math.js';
import UnitLabels from '../../math/unitlabels.js';
import Units from '../../math/units.js';
import {ROOT} from '../../os.js';
import {EPSG4326} from '../../proj/proj.js';
import {Controller as ExportOptionsCtrl} from '../ex/exportoptions.js';
import ExportOptionsEvent from '../ex/exportoptionsevent.js';
import Module from '../module.js';
import {nameCompare} from '../slick/column.js';
import WindowEventType from '../windoweventtype.js';

const {clone} = goog.require('goog.object');

const {BufferConfig} = goog.requireType('os.buffer');
const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * Buffer region form directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'config': '=',
    'showSourcePicker': '=',
    'warningMessage': '=?',
    'initSources': '&'
  },
  templateUrl: ROOT + 'views/buffer/bufferform.html',
  controller: Controller,
  controllerAs: 'buffer'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'bufferform';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the buffer form.
 * @unrestricted
 */
export class Controller extends ExportOptionsCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $timeout) {
    super($scope);

    /**
     * @type {!Object<string, string>}
     */
    this['units'] = clone(UnitLabels);

    /**
     * @type {!Array<!ColumnDefinition>}
     */
    this['columns'] = [];

    /**
     * @type {string}
     */
    this['titleSample'] = '';

    /**
     * @type {string}
     */
    this['descSample'] = '';

    /**
     * If the geometry is simple enough to allow live preview updates.
     * @type {boolean}
     */
    this['liveAllowed'] = buffer.allowLivePreview(this.scope['config']);

    /**
     * @type {boolean}
     */
    this['liveEnabled'] = false;

    // turn on the preview if only one feature is being buffered
    if (this['liveAllowed'] && this.scope['config'] && this.scope['config']['features'] &&
        this.scope['config']['features'].length == 1) {
      this['liveEnabled'] = true;
    }

    /**
     * @type {!Object<string, string>}
     */
    this['help'] = {
      'distance': 'Distance around selected features to create the buffer region.',
      'outside': 'Create a buffer region outside the original area.',
      'inside': 'Create a buffer region inside the original area.',
      'title': 'Custom title given to all new buffer areas.',
      'titleColumn': 'Column used to apply titles to all new buffer areas. If a selected item doesn\'t have this ' +
          'field defined, a generic title will be given. You may also choose to apply a custom title to new areas.',
      'description': 'Description applied to all new buffer areas.',
      'descColumn': 'Column used to apply descriptions to all new buffer areas. If a selected item doesn\'t have ' +
          'this field defined, the description will be left blank. You may also choose to apply a custom description ' +
          'to new areas.',
      'tags': 'Comma-delimited list of tags to apply to all new buffer areas. Tags can be used to group or search ' +
          'areas in the Areas tab of the Layers window.',
      'tagsColumn': 'Column used to apply tags to all new buffer areas. Tags can be used to group or search areas ' +
          'in the Areas tab of the Layers window.  If an item doesn\'t have this field defined, the tags will be ' +
          'left blank. You may also choose to provide your own custom tags.',
      'units': 'Unit of measure for the buffer distance.'
    };

    /**
     * Array of buffer preview features.
     * @type {Array<!ol.Feature>|undefined}
     * @private
     */
    this.previewAreas_ = undefined;

    /**
     * If the last preview update failed to produce a buffer.
     * @type {boolean}
     * @private
     */
    this.previewFailed_ = false;

    $scope.$on(ExportOptionsEvent.CHANGE, this.onOptionsChange_.bind(this));

    // trigger window auto height after the DOM is rendered
    $timeout(function() {
      $scope.$emit(WindowEventType.READY);
    });
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.previewAreas_) {
      MapContainer.getInstance().removeFeatures(this.previewAreas_);
      this.previewAreas_ = undefined;
    }
  }

  /**
   * Handle changes to the selected sources.
   *
   * @param {angular.Scope.Event} event
   * @param {Array<!ol.Feature>} items
   * @param {Array<!VectorSource>} sources
   * @private
   */
  onOptionsChange_(event, items, sources) {
    event.stopPropagation();

    if (this.scope && this.scope['config']) {
      var config = /** @type {!BufferConfig} */ (this.scope['config']);

      if (config['features'] && this.scope['showSourcePicker']) {
        // only update the config features if the source picker is displayed
        config['features'].length = 0;

        // update the export items
        if (items && items.length > 0) {
          config['features'] = config['features'].concat(items);
        }
      }

      this['columns'] = sources && sources.length > 0 ? sources[0].getColumns() : [];
      this['columns'].sort(nameCompare);

      this.updateLivePreview();
    }
  }

  /**
   * Updates buffer previews on the map.
   *
   * @param {boolean=} opt_force If a preview update should be forced.
   * @export
   */
  updatePreview(opt_force) {
    if (this['liveAllowed'] && this['liveEnabled'] || opt_force) {
      this.previewFailed_ = false;

      if (this.previewAreas_) {
        MapContainer.getInstance().removeFeatures(this.previewAreas_);
        this.previewAreas_ = undefined;
      }

      if (this.scope && this.scope['config'] && (this.scope['config']['outside'] || this.scope['config']['inside'])) {
        var config = /** @type {!BufferConfig} */ (this.scope['config']);
        var features = buffer.createFromConfig(config, true);
        if (features && features.length > 0) {
          this.previewAreas_ = MapContainer.getInstance().addFeatures(features, buffer.PREVIEW_STYLE);
        }

        this.previewFailed_ = !this.previewAreas_ || !this.previewAreas_.length;
      }
    }

    if (this.scope) {
      this.scope['warningMessage'] = this.getWarningMessage();
    }
  }

  /**
   * Updates buffer previews on the map.
   *
   * @protected
   */
  updateLivePreview() {
    this['liveAllowed'] = buffer.allowLivePreview(this.scope['config']);

    if (this['liveAllowed']) {
      this['livePreviewContent'] = 'Shows a live preview of buffer area(s) on the map for up to ' +
          buffer.FEATURE_LIMIT + ' features, or ' + buffer.VERTEX_LIMIT + ' vertices.';
      this['livePreviewIcon'] = ''; // use the default icon
    } else {
      this['livePreviewContent'] = 'Live preview disabled for performance reasons. This is only allowed for up to ' +
          buffer.FEATURE_LIMIT + ' features, or ' + buffer.VERTEX_LIMIT + ' vertices.';
      this['livePreviewIcon'] = 'fa fa-warning text-warning';
    }

    this.updatePreview();
  }

  /**
   * Get a warning message to display in the UI.
   *
   * @return {string}
   * @protected
   */
  getWarningMessage() {
    if (this.scope && this.scope['config']) {
      var config = /** @type {!BufferConfig} */ (this.scope['config']);

      if (!config['distance'] || config['distance'] < 0) {
        return 'Distance must be greater than zero.';
      }

      if (!config['outside'] && !config['inside']) {
        return 'Please select at least one of Buffer Outside/Inside.';
      }

      var features = config['features'];
      if (features && features.length) {
        var distanceMeters = convertUnits(config['distance'], Units.METERS, config['units']);
        if (config['inside']) {
          var geometry = features[0].getGeometry();
          var extent = geometry ? geometry.getExtent() : undefined;
          if (extent) {
            // transform to EPSG:4326 (assumed by getSplitOffset)
            extent = transformExtent(extent, osMap.PROJECTION, EPSG4326);

            var offset = osJsts.getSplitOffset(extent, -distanceMeters);
            if (offset < 0) {
              return 'The current buffer distance cannot be used to produce an accurate inner buffer. Please reduce ' +
                  'the buffer distance.';
            }
          }
        }

        if (config['outside'] && distanceMeters > osJsts.TMERC_BUFFER_LIMIT) {
          var hasNonPoint = features.some(function(f) {
            var geometry = f.getGeometry();
            return geometry.getType() !== GeometryType.POINT;
          });

          if (hasNonPoint) {
            return 'The current buffer distance cannot be used to produce an accurate outer buffer. Please reduce ' +
                'the buffer distance.';
          }
        }
      }

      if (this.previewFailed_) {
        var msg = 'Buffer creation failed. Please try reducing the buffer distance';
        if (config['inside']) {
          msg += ' or disable the inner buffer';
        }

        msg += '.';

        return msg;
      }
    }

    return '';
  }

  /**
   * If the target geometry supports a bidirectional buffer.
   *
   * @return {boolean}
   * @export
   */
  supportsBidirectional() {
    if (this.scope && this.scope['config']) {
      var config = /** @type {!BufferConfig} */ (this.scope['config']);
      var features = config['features'];
      if (features && features.length === 1) {
        return isGeometryPolygonal(features[0].getGeometry());
      }
    }

    return false;
  }
}
