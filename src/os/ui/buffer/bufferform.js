goog.provide('os.ui.buffer.BufferFormCtrl');
goog.provide('os.ui.buffer.bufferFormDirective');

goog.require('goog.userAgent');
goog.require('ol.proj');
goog.require('os.defines');
goog.require('os.geo.jsts');
goog.require('os.math.UnitLabels');
goog.require('os.math.Units');
goog.require('os.ui.Module');
goog.require('os.ui.ex.ExportOptionsCtrl');
goog.require('os.ui.im.basicInfoDirective');


/**
 * Buffer region form directive.
 * @return {angular.Directive}
 */
os.ui.buffer.bufferFormDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'config': '=',
      'showSourcePicker': '=',
      'warningMessage': '=?',
      'initSources': '&'
    },
    templateUrl: os.ROOT + 'views/buffer/bufferform.html',
    controller: os.ui.buffer.BufferFormCtrl,
    controllerAs: 'buffer'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('bufferform', [os.ui.buffer.bufferFormDirective]);



/**
 * Controller for the buffer form.
 * @param {!angular.Scope} $scope
 * @extends {os.ui.ex.ExportOptionsCtrl}
 * @constructor
 * @ngInject
 */
os.ui.buffer.BufferFormCtrl = function($scope) {
  os.ui.buffer.BufferFormCtrl.base(this, 'constructor', $scope);

  /**
   * @type {!Object<string, string>}
   */
  this['units'] = goog.object.clone(os.math.UnitLabels);

  /**
   * @type {!Array<!os.data.ColumnDefinition>}
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
  this['liveAllowed'] = os.buffer.allowLivePreview(this.scope['config']);

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
    'titleColumn': 'Column used to apply titles to all new buffer areas. If a selected item doesn\'t have this field ' +
        'defined, a generic title will be given. You may also choose to apply a custom title to new areas.',
    'description': 'Description applied to all new buffer areas.',
    'descColumn': 'Column used to apply descriptions to all new buffer areas. If a selected item doesn\'t have this ' +
        'field defined, the description will be left blank. You may also choose to apply a custom description to new ' +
        'areas.',
    'tags': 'Comma-delimited list of tags to apply to all new buffer areas. Tags can be used to group or search ' +
        'areas in the Areas tab of the Layers window.',
    'tagsColumn': 'Column used to apply tags to all new buffer areas. Tags can be used to group or search areas ' +
        'in the Areas tab of the Layers window.  If an item doesn\'t have this field defined, the tags will be left ' +
        'blank. You may also choose to provide your own custom tags.',
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

  $scope.$on(os.ui.ex.ExportOptionsEvent.CHANGE, this.onOptionsChange_.bind(this));
};
goog.inherits(os.ui.buffer.BufferFormCtrl, os.ui.ex.ExportOptionsCtrl);


/**
 * @inheritDoc
 */
os.ui.buffer.BufferFormCtrl.prototype.disposeInternal = function() {
  os.ui.buffer.BufferFormCtrl.base(this, 'disposeInternal');

  if (this.previewAreas_) {
    os.MapContainer.getInstance().removeFeatures(this.previewAreas_);
    this.previewAreas_ = undefined;
  }
};


/**
 * Handle changes to the selected sources.
 * @param {angular.Scope.Event} event
 * @param {Array<!ol.Feature>} items
 * @param {Array<!os.source.Vector>} sources
 * @private
 */
os.ui.buffer.BufferFormCtrl.prototype.onOptionsChange_ = function(event, items, sources) {
  event.stopPropagation();

  if (this.scope && this.scope['config']) {
    var config = /** @type {!os.buffer.BufferConfig} */ (this.scope['config']);

    if (config['features'] && this.scope['showSourcePicker']) {
      // only update the config features if the source picker is displayed
      config['features'].length = 0;

      // update the export items
      if (items && items.length > 0) {
        config['features'] = config['features'].concat(items);
      }
    }

    this['columns'] = sources && sources.length > 0 ? sources[0].getColumns().slice() : [];
    this['columns'].sort(os.ui.slick.column.nameCompare);

    this.updateLivePreview();
  }
};


/**
 * Updates buffer previews on the map.
 * @param {boolean=} opt_force If a preview update should be forced.
 */
os.ui.buffer.BufferFormCtrl.prototype.updatePreview = function(opt_force) {
  if (this['liveAllowed'] && this['liveEnabled'] || opt_force) {
    this.previewFailed_ = false;

    if (this.previewAreas_) {
      os.MapContainer.getInstance().removeFeatures(this.previewAreas_);
      this.previewAreas_ = undefined;
    }

    if (this.scope && this.scope['config'] && (this.scope['config']['outside'] || this.scope['config']['inside'])) {
      var config = /** @type {!os.buffer.BufferConfig} */ (this.scope['config']);
      var features = os.buffer.createFromConfig(config, true);
      if (features && features.length > 0) {
        this.previewAreas_ = os.MapContainer.getInstance().addFeatures(features, os.buffer.PREVIEW_STYLE);
      }

      this.previewFailed_ = !this.previewAreas_ || !this.previewAreas_.length;
    }
  }

  if (this.scope) {
    this.scope['warningMessage'] = this.getWarningMessage();
  }
};
goog.exportProperty(
    os.ui.buffer.BufferFormCtrl.prototype,
    'updatePreview',
    os.ui.buffer.BufferFormCtrl.prototype.updatePreview);


/**
 * Updates buffer previews on the map.
 * @protected
 */
os.ui.buffer.BufferFormCtrl.prototype.updateLivePreview = function() {
  this['liveAllowed'] = os.buffer.allowLivePreview(this.scope['config']);

  if (this['liveAllowed']) {
    this['livePreviewContent'] = 'Shows a live preview of buffer area(s) on the map for up to ' +
        os.buffer.FEATURE_LIMIT + ' features, or ' + os.buffer.VERTEX_LIMIT + ' vertices.';
    this['livePreviewIcon'] = ''; // use the default icon
  } else {
    this['livePreviewContent'] = 'Live preview disabled for performance reasons. This is only allowed for up to ' +
        os.buffer.FEATURE_LIMIT + ' features, or ' + os.buffer.VERTEX_LIMIT + ' vertices.';
    this['livePreviewIcon'] = 'fa fa-warning orange-icon';
  }

  this.updatePreview();
};


/**
 * Get a warning message to display in the UI.
 * @return {string}
 * @protected
 */
os.ui.buffer.BufferFormCtrl.prototype.getWarningMessage = function() {
  if (this.scope && this.scope['config']) {
    var config = /** @type {!os.buffer.BufferConfig} */ (this.scope['config']);

    if (!config['distance'] || config['distance'] < 0) {
      return 'Distance must be greater than zero.';
    }

    if (!config['outside'] && !config['inside']) {
      return 'Please select at least one of Buffer Outside/Inside.';
    }

    var features = config['features'];
    if (features && features.length) {
      var distanceMeters = os.math.convertUnits(config['distance'], os.math.Units.METERS, config['units']);
      if (config['inside']) {
        var geometry = features[0].getGeometry();
        var extent = geometry ? geometry.getExtent() : undefined;
        if (extent) {
          // transform to EPSG:4326 (assumed by getSplitOffset)
          extent = ol.proj.transformExtent(extent, os.map.PROJECTION, os.proj.EPSG4326);

          var offset = os.geo.jsts.getSplitOffset(extent, -distanceMeters);
          if (offset < 0) {
            return 'The current buffer distance cannot be used to produce an accurate inner buffer. Please reduce ' +
                'the buffer distance.';
          }
        }
      }

      if (config['outside'] && distanceMeters > os.geo.jsts.TMERC_BUFFER_LIMIT) {
        var hasNonPoint = features.some(function(f) {
          var geometry = f.getGeometry();
          return geometry.getType() !== ol.geom.GeometryType.POINT;
        });

        if (hasNonPoint) {
          return 'The current buffer distance cannot be used to produce an accurate outer buffer. Please reduce the ' +
              'buffer distance.';
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
};


/**
 * If the target geometry supports a bidirectional buffer.
 * @return {boolean}
 */
os.ui.buffer.BufferFormCtrl.prototype.supportsBidirectional = function() {
  if (this.scope && this.scope['config']) {
    var config = /** @type {!os.buffer.BufferConfig} */ (this.scope['config']);
    var features = config['features'];
    if (features && features.length === 1) {
      return os.geo.isGeometryPolygonal(features[0].getGeometry());
    }
  }

  return false;
};
goog.exportProperty(
    os.ui.buffer.BufferFormCtrl.prototype,
    'supportsBidirectional',
    os.ui.buffer.BufferFormCtrl.prototype.supportsBidirectional);
