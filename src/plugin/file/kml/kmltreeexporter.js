goog.provide('plugin.file.kml.KMLTreeExporter');

goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.xml');
goog.require('os.data.RecordField');
goog.require('os.feature');
goog.require('os.source');
goog.require('os.style');
goog.require('os.ui.file.kml');
goog.require('os.ui.file.kml.AbstractKMLExporter');
goog.require('os.xml');
goog.require('plugin.file.kml');
goog.require('plugin.file.kml.export');



/**
 * KML tree exporter
 *
 * @extends {os.ui.file.kml.AbstractKMLExporter<!plugin.file.kml.ui.KMLNode>}
 * @constructor
 */
plugin.file.kml.KMLTreeExporter = function() {
  plugin.file.kml.KMLTreeExporter.base(this, 'constructor');
  this.setUseItemColor(true);
  this.setUseItemIcon(true);
  this.log = plugin.file.kml.KMLTreeExporter.LOGGER_;

  /**
   * Map of folders in the KML by id.
   * @type {!Object<string, !Element>}
   * @private
   */
  this.folders_ = {};
};
goog.inherits(plugin.file.kml.KMLTreeExporter, os.ui.file.kml.AbstractKMLExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.kml.KMLTreeExporter.LOGGER_ = goog.log.getLogger('plugin.file.kml.KMLTreeExporter');


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.reset = function() {
  plugin.file.kml.KMLTreeExporter.base(this, 'reset');

  this.folders_ = {};
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.supportsMultiple = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.createLabel = function(item) {
  return item.getLabel();
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getChildren = function(item) {
  return item.getChildren();
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getColor = function(item) {
  var featureColor = os.feature.getColor(item.getFeature());
  if (!featureColor || (typeof featureColor != 'string' && !goog.isArray(featureColor))) {
    featureColor = os.style.DEFAULT_LAYER_COLOR;
  }

  return os.style.toAbgrString(featureColor);
};

/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getFill = function(item) {
  const feature = item.getFeature();
  const style = feature.getStyle();
  const styles = Array.isArray(style) ? style : [style];
  return styles.some(os.style.hasNonZeroFillOpacity);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getStroke = function(item) {
  const feature = item.getFeature();
  const style = feature.getStyle();
  const styles = Array.isArray(style) ? style : [style];
  return styles.some(os.style.hasNonZeroStrokeOpacity);
};



/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getFillColor = function(item) {
  var featureColor = os.feature.getFillColor(item.getFeature());
  return featureColor ? os.style.toAbgrString(featureColor) : null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getStrokeColor = function(item) {
  var featureColor = os.feature.getStrokeColor(item.getFeature());
  return featureColor ? os.style.toAbgrString(featureColor) : null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getElementType = function(item) {
  return item.isFolder() ? os.ui.file.kml.ElementType.FOLDER : os.ui.file.kml.ElementType.PLACEMARK;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getField = function(item, field) {
  return os.feature.getField(item.getFeature(), field);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getFields = function(item) {
  if (!this.fields) {
    // if fields aren't defined, try to read them from source columns
    var source = item.getSource();
    if (source) {
      this.fields = os.source.getExportFields(source, true);
    }
  }

  return this.fields;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getIcon = function(item) {
  var icon = plugin.file.kml.KMLTreeExporter.base(this, 'getIcon', item);

  var feature = item.getFeature();
  if (feature) {
    icon = /** @type {os.ui.file.kml.Icon} */ (goog.object.clone(icon));

    var config = /** @type {Array<Object>|Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

    // may be an array of configs - use the first one (feature style)
    if (goog.isArray(config)) {
      config = feature instanceof os.feature.DynamicFeature ? config[1] : config[0];
    }

    if (config && config['image']) {
      var image = config['image'];
      if (image['src']) {
        icon.href = image['src'];
        icon.options = image['options'];
      }

      var size = os.style.getConfigSize(image);
      if (size) {
        var scale = icon.scale || 1;
        icon.scale = scale * os.style.sizeToScale(size);
      }
    }
  }

  return icon;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getId = function(item) {
  return String(ol.getUid(item));
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getParent = function(item) {
  // initialize the parent to the root kml:Document
  var parent = this.kmlDoc;
  if (parent) {
    var parentNode = /** @type {plugin.file.kml.ui.KMLNode} */ (item.getParent());
    if (parentNode) {
      var parentId = parentNode.getId();
      if (this.folders_[parentId]) {
        parent = this.folders_[parentId];
      } else if (!this.isRootItem(item)) {
        // only create a parent folder if the item isn't one of the root items set on the exporter
        var prevParent = this.getParent(parentNode);
        if (prevParent) {
          // create a new folder for the node
          var folder = os.xml.appendElementNS('Folder', this.kmlNS, prevParent);
          os.xml.appendElementNS('name', this.kmlNS, folder, this.createLabel(parentNode));

          var open = parentNode.collapsed ? 0 : 1;
          os.xml.appendElementNS('open', this.kmlNS, folder, open);

          // update the parent
          parent = this.folders_[parentId] = folder;
        }
      }
    }
  }

  return parent;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getProperties = function(item) {
  var properties;

  var feature = item.getFeature();
  if (feature) {
    properties = feature.getProperties();

    var keys = goog.object.getKeys(properties);
    for (var i = 0, n = keys.length; i < n; i++) {
      var key = keys[i];
      if (goog.string.startsWith(key, '_') || os.feature.isInternalField(key)) {
        delete properties[key];
      }
    }
  }

  return properties || null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getStyleType = function(item) {
  return os.ui.file.kml.StyleType.ICON;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getTime = function(item) {
  var feature = item.getFeature();
  if (feature) {
    return /** @type {os.time.ITime|undefined} */ (feature.get(os.data.RecordField.TIME)) || null;
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getUI = function() {
  return '';
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.isItemVisible = function(item) {
  return item.getState() != os.structs.TriState.OFF;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.processFolder = function(element, item) {
  // add the folder to the map so children won't create a new one
  this.folders_[item.getId()] = element;

  var open = item.collapsed ? 0 : 1;
  os.xml.appendElementNS('open', this.kmlNS, element, open);

  plugin.file.kml.KMLTreeExporter.base(this, 'processFolder', element, item);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.supportsLabelExport = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getGeometry = function(item) {
  var geometry;

  var feature = item ? item.getFeature() : null;
  if (feature) {
    var geomAltitudeMode;
    var featAltitudeMode = feature.get(os.data.RecordField.ALTITUDE_MODE);

    geometry = feature.getGeometry();
    if (geometry) {
      geometry = geometry.clone().toLonLat();
      geomAltitudeMode = geometry.get(os.data.RecordField.ALTITUDE_MODE);
    }

    if (this.exportEllipses) {
      var ellipse = os.feature.createEllipse(feature);
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
plugin.file.kml.KMLTreeExporter.prototype.getBalloonOptions = function(item) {
  return plugin.file.kml.export.getBalloonOptions(item ? item.getFeature() : null);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getRotationColumn = function(item) {
  return plugin.file.kml.export.getRotationColumn(item ? item.getFeature() : null);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLTreeExporter.prototype.getLineDash = function(item) {
  return plugin.file.kml.export.getLineDash(item ? item.getFeature() : null);
};
