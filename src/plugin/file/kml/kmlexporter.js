goog.provide('plugin.file.kml.KMLExporter');

goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.array');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('ol.xml');
goog.require('os.data.OSDataManager');
goog.require('os.data.RecordField');
goog.require('os.feature');
goog.require('os.implements');
goog.require('os.source');
goog.require('os.style');
goog.require('os.style.StyleField');
goog.require('os.time.ITime');
goog.require('os.ui.file.kml');
goog.require('os.ui.file.kml.AbstractKMLExporter');
goog.require('os.xml');
goog.require('plugin.file.kml');
goog.require('plugin.file.kml.export');
goog.require('plugin.file.kml.ui.kmlExportDirective');



/**
 * KML exporter
 *
 * @extends {os.ui.file.kml.AbstractKMLExporter<ol.Feature>}
 * @constructor
 */
plugin.file.kml.KMLExporter = function() {
  plugin.file.kml.KMLExporter.base(this, 'constructor');
  this.log = plugin.file.kml.KMLExporter.LOGGER_;

  /**
   * Folders for sources being exported.
   * @type {!Object<string, !Element>}
   * @private
   */
  this.folders_ = {};

  /**
   * Source color cache.
   * @type {!Object<string, !Array<string>>}
   * @private
   */
  this.sourceFields_ = {};
};
goog.inherits(plugin.file.kml.KMLExporter, os.ui.file.kml.AbstractKMLExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.kml.KMLExporter.LOGGER_ = goog.log.getLogger('plugin.file.kml.KMLExporter');


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.reset = function() {
  plugin.file.kml.KMLExporter.base(this, 'reset');
  this.folders_ = {};
  this.sourceFields_ = {};
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.supportsMultiple = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getColor = function(item) {
  var itemColor = os.feature.getColor(item, this.getSource_(item));
  if (!itemColor || (typeof itemColor != 'string' && !goog.isArray(itemColor))) {
    itemColor = os.style.DEFAULT_LAYER_COLOR;
  }
  return os.style.toAbgrString(itemColor);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getFill = function(item) {
  const style = item.getStyle();
  const styles = Array.isArray(style) ? style : [style];
  return styles.some(os.style.hasNonZeroFillOpacity);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getFillColor = function(item) {
  var itemColor = os.feature.getFillColor(item, this.getSource_(item));
  return itemColor ? os.style.toAbgrString(itemColor) : null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getStroke = function(item) {
  const style = item.getStyle();
  const styles = Array.isArray(style) ? style : [style];
  return styles.some(os.style.hasNonZeroStrokeOpacity);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getStrokeColor = function(item) {
  var itemColor = os.feature.getStrokeColor(item, this.getSource_(item));
  return itemColor ? os.style.toAbgrString(itemColor) : null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getField = function(item, field) {
  return os.feature.getField(item, field);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getItemLabel = function(item, labelField) {
  if (typeof labelField == 'object' && labelField['column']) {
    var label = this.getField(item, labelField['column']);
    if (label != null) {
      // if the column name is displayed in opensphere, add it in the KML as well
      return (labelField['showColumn'] ? (labelField['column'] + ': ') : '') + String(label);
    }

    return null;
  }

  return plugin.file.kml.KMLExporter.base(this, 'getItemLabel', item, labelField);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getIcon = function(item) {
  // TODO update this when we support icons. it should return an object with the href/scale of the feature icon,
  //      defaulting to the base behavior
  return plugin.file.kml.KMLExporter.base(this, 'getIcon', item);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getId = function(item) {
  return /** @type {string} */ (item.getId());
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getFields = function(item) {
  var source = this.getSource_(item);
  var fields = null;
  if (source) {
    var sourceId = source.getId();
    if (!(sourceId in this.sourceFields_)) {
      this.sourceFields_[sourceId] = os.source.getExportFields(source) || [];
    }

    fields = this.sourceFields_[sourceId];
  }

  return fields || this.fields;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getParent = function(item) {
  // initialize the parent to the root kml:Document
  var parent = this.kmlDoc;
  if (parent) {
    // opensphere organizes Placemarks into folders by source
    var source = this.getSource_(item);
    if (source) {
      var sourceId = source.getId();
      if (!(sourceId in this.folders_)) {
        // create a new folder for the source
        var folder = os.xml.appendElementNS('Folder', this.kmlNS, parent);
        os.xml.appendElementNS('name', this.kmlNS, folder, source.getTitle());

        // update the parent
        parent = this.folders_[sourceId] = folder;
      } else {
        // already have a folder for the source
        parent = this.folders_[sourceId];
      }
    }
  }

  return parent;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getProperties = function(item) {
  var properties = item.getProperties();
  var keys = goog.object.getKeys(properties);
  for (var i = 0, n = keys.length; i < n; i++) {
    var key = keys[i];
    if (goog.string.startsWith(key, '_') || os.feature.isInternalField(key)) {
      delete properties[key];
    }
  }

  return properties;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getStyleType = function(item) {
  var type = os.ui.file.kml.StyleType.DEFAULT;
  var geometry = this.getGeometry(item);
  if (geometry && (geometry.getType() == ol.geom.GeometryType.POINT ||
      geometry.getType() == ol.geom.GeometryType.GEOMETRY_COLLECTION)) {
    var source = this.getSource_(item);
    var shape = source ? source.getGeometryShape() : null;
    type = shape == os.style.ShapeType.ICON ? os.ui.file.kml.StyleType.ICON : os.ui.file.kml.StyleType.POINT;
  }

  return type;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getTime = function(item) {
  var time = item.get(os.data.RecordField.TIME);
  if (os.implements(time, os.time.ITime.ID)) {
    return /** @type {!os.time.ITime} */ (time);
  }

  return null;
};



/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getGeometry = function(item) {
  var geometry;
  if (item) {
    geometry = /** @type {(ol.geom.Geometry|undefined)} */ (item.get(os.data.RecordField.GEOM));
    var geomAltitudeMode;
    var featAltitudeMode = item.get(os.data.RecordField.ALTITUDE_MODE);
    if (geometry) {
      geometry = geometry.clone().toLonLat();
      geomAltitudeMode = geometry.get(os.data.RecordField.ALTITUDE_MODE);
    }

    if (this.exportEllipses) {
      var ellipse = os.feature.createEllipse(item);
      if (ellipse && !(ellipse instanceof ol.geom.Point)) {
        if (this.useCenterPoint && geometry instanceof ol.geom.Point) {
          geometry = new ol.geom.GeometryCollection([ellipse, geometry]);
        } else {
          geometry = ellipse;
        }
      }
    }

    if (geometry) {
      geometry.set(os.data.RecordField.ALTITUDE_MODE, geomAltitudeMode || featAltitudeMode);
    }
  }

  return geometry;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getBalloonOptions = function(item) {
  return plugin.file.kml.export.getBalloonOptions(item);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getRotationColumn = function(item) {
  return plugin.file.kml.export.getRotationColumn(item);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getLineDash = function(item) {
  return plugin.file.kml.export.getLineDash(item);
};


/**
 * Get the feature's source.
 *
 * @param {ol.Feature} feature The feature
 * @return {os.source.Vector} The source
 * @private
 */
plugin.file.kml.KMLExporter.prototype.getSource_ = function(feature) {
  var source = null;
  if (feature) {
    var sourceId = feature.get(os.data.RecordField.SOURCE_ID);
    if (typeof sourceId === 'string') {
      source = /** @type {os.source.Vector} */ (os.osDataManager.getSource(sourceId));
    }
  }

  return source;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getUI = function() {
  return '<kmlexport exporter="exporter" simple="simple"></kmlexport>';
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.getGroupLabels = function(item) {
  if (item) {
    var sourceId = /** @type {string|undefined} */ (item.get(os.data.RecordField.SOURCE_ID));

    // don't count the drawing layer as a style source
    if (sourceId && sourceId != os.MapContainer.DRAW_ID) {
      if (item instanceof os.feature.DynamicFeature || !(sourceId in this.labelMap)) {
        var cfg = os.style.StyleManager.getInstance().getLayerConfig(sourceId);
        var itemStyle = item.get(os.style.StyleType.FEATURE);
        // Check the layer level
        if (cfg && cfg['labels'] && this.checkLabelsNotNull_(cfg['labels'])) {
          this.labelMap[sourceId] = cfg['labels'];
        } else if (itemStyle && goog.isArray(itemStyle)) {
          // Check the feature level
          var labels = ol.array.find(itemStyle, os.style.isLabelConfig);
          if (labels) {
            this.labelMap[sourceId] = labels['labels'];
          }
        } else {
          this.labelMap[sourceId] = null;
        }
      }

      return this.labelMap[sourceId];
    }
  }

  return null;
};


/**
 * Check the label field array for any non-null fields.
 *
 * @param {Array<*>} labelFields Array of label fields
 * @return {boolean} True if there are any non-null label fields
 * @private
 */
plugin.file.kml.KMLExporter.prototype.checkLabelsNotNull_ = function(labelFields) {
  if (labelFields) {
    return labelFields.some(function(labelField) {
      return (typeof labelField == 'object' && labelField['column']);
    });
  }
  return false;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLExporter.prototype.supportsLabelExport = function() {
  return true;
};
