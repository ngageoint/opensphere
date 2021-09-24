goog.declareModuleId('plugin.file.kml.KMLTreeExporter');

import * as osFeature from '../../../os/feature/feature.js';
import * as osSource from '../../../os/source/source.js';
import * as osStyle from '../../../os/style/style.js';
import * as pluginFileKmlExport from './kmlexport.js';

const log = goog.require('goog.log');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');
const ol = goog.require('ol');
const GeometryCollection = goog.require('ol.geom.GeometryCollection');
const Point = goog.require('ol.geom.Point');
const RecordField = goog.require('os.data.RecordField');
const DynamicFeature = goog.require('os.feature.DynamicFeature');
const {ORIGINAL_GEOM_FIELD} = goog.require('os.interpolate');
const TriState = goog.require('os.structs.TriState');
const StyleType = goog.require('os.style.StyleType');
const osUiFileKml = goog.require('os.ui.file.kml');
const AbstractKMLExporter = goog.require('os.ui.file.kml.AbstractKMLExporter');
const xml = goog.require('os.xml');

const Geometry = goog.requireType('ol.geom.Geometry');
const {default: KMLNode} = goog.requireType('plugin.file.kml.ui.KMLNode');


/**
 * KML tree exporter
 *
 * @extends {AbstractKMLExporter<!KMLNode>}
 */
export default class KMLTreeExporter extends AbstractKMLExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.setUseItemColor(true);
    this.setUseItemIcon(true);
    this.log = logger;

    /**
     * Map of folders in the KML by id.
     * @type {!Object<string, !Element>}
     * @private
     */
    this.folders_ = {};
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();

    this.folders_ = {};
  }

  /**
   * @inheritDoc
   */
  supportsMultiple() {
    return false;
  }

  /**
   * @inheritDoc
   */
  createLabel(item) {
    return item.getLabel();
  }

  /**
   * @inheritDoc
   */
  getChildren(item) {
    return item.getChildren();
  }

  /**
   * @inheritDoc
   */
  getColor(item) {
    var featureColor = osFeature.getColor(item.getFeature());
    if (!featureColor || (typeof featureColor != 'string' && !Array.isArray(featureColor))) {
      featureColor = osStyle.DEFAULT_LAYER_COLOR;
    }

    return osStyle.toAbgrString(featureColor);
  }

  /**
   * @inheritDoc
   */
  getFill(item) {
    const feature = item.getFeature();
    const style = feature.getStyle();
    const styles = Array.isArray(style) ? style : [style];
    return styles.some(osStyle.hasNonZeroFillOpacity);
  }

  /**
   * @inheritDoc
   */
  getStroke(item) {
    const feature = item.getFeature();
    const style = feature.getStyle();
    const styles = Array.isArray(style) ? style : [style];
    return styles.some(osStyle.hasNonZeroStrokeOpacity);
  }

  /**
   * @inheritDoc
   */
  getFillColor(item) {
    var featureColor = osFeature.getFillColor(item.getFeature());
    return featureColor ? osStyle.toAbgrString(featureColor) : null;
  }

  /**
   * @inheritDoc
   */
  getStrokeColor(item) {
    var featureColor = osFeature.getStrokeColor(item.getFeature());
    return featureColor ? osStyle.toAbgrString(featureColor) : null;
  }

  /**
   * @inheritDoc
   */
  getStrokeWidth(item) {
    return osFeature.getStrokeWidth(item.getFeature());
  }

  /**
   * @inheritDoc
   */
  getElementType(item) {
    return item.isFolder() ? osUiFileKml.ElementType.FOLDER : osUiFileKml.ElementType.PLACEMARK;
  }

  /**
   * @inheritDoc
   */
  getField(item, field) {
    return osFeature.getField(item.getFeature(), field);
  }

  /**
   * @inheritDoc
   */
  getFields(item) {
    if (!this.fields) {
      // if fields aren't defined, try to read them from source columns
      var source = item.getSource();
      if (source) {
        this.fields = osSource.getExportFields(source, true);
      }
    }

    return this.fields;
  }

  /**
   * @inheritDoc
   */
  getIcon(item) {
    var icon = super.getIcon(item);

    var feature = item.getFeature();
    if (feature) {
      icon = /** @type {osUiFileKml.Icon} */ (googObject.clone(icon));

      var config = /** @type {Array<Object>|Object|undefined} */ (feature.get(StyleType.FEATURE));

      // may be an array of configs - use the first one (feature style)
      if (Array.isArray(config)) {
        config = feature instanceof DynamicFeature ? config[1] : config[0];
      }

      if (config && config['image']) {
        var image = config['image'];
        if (image['src']) {
          icon.href = image['src'];
          icon.options = image['options'];
        }

        var size = osStyle.getConfigSize(image);
        if (size) {
          var scale = icon.scale || 1;
          icon.scale = scale * osStyle.sizeToScale(size);
        }
      }
    }

    return icon;
  }

  /**
   * @inheritDoc
   */
  getId(item) {
    return String(ol.getUid(item));
  }

  /**
   * @inheritDoc
   */
  getParent(item) {
    // initialize the parent to the root kml:Document
    var parent = this.kmlDoc;
    if (parent) {
      var parentNode = /** @type {KMLNode} */ (item.getParent());
      if (parentNode) {
        var parentId = parentNode.getId();
        if (this.folders_[parentId]) {
          parent = this.folders_[parentId];
        } else if (!this.isRootItem(item)) {
          // only create a parent folder if the item isn't one of the root items set on the exporter
          var prevParent = this.getParent(parentNode);
          if (prevParent) {
            // create a new folder for the node
            var folder = xml.appendElementNS('Folder', this.kmlNS, prevParent);
            xml.appendElementNS('name', this.kmlNS, folder, this.createLabel(parentNode));

            var open = parentNode.collapsed ? 0 : 1;
            xml.appendElementNS('open', this.kmlNS, folder, open);

            // update the parent
            parent = this.folders_[parentId] = folder;
          }
        }
      }
    }

    return parent;
  }

  /**
   * @inheritDoc
   */
  getProperties(item) {
    var properties;

    var feature = item.getFeature();
    if (feature) {
      properties = feature.getProperties();

      var keys = googObject.getKeys(properties);
      for (var i = 0, n = keys.length; i < n; i++) {
        var key = keys[i];
        if (googString.startsWith(key, '_') || osFeature.isInternalField(key)) {
          delete properties[key];
        }
      }
    }

    return properties || null;
  }

  /**
   * @inheritDoc
   */
  getStyleType(item) {
    return osUiFileKml.StyleType.ICON;
  }

  /**
   * @inheritDoc
   */
  getTime(item) {
    var feature = item.getFeature();
    if (feature) {
      return (
        /** @type {os.time.ITime|undefined} */ (feature.get(RecordField.TIME)) || null
      );
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getUI() {
    return '';
  }

  /**
   * @inheritDoc
   */
  isItemVisible(item) {
    return item.getState() != TriState.OFF;
  }

  /**
   * @inheritDoc
   */
  processFolder(element, item) {
    // add the folder to the map so children won't create a new one
    this.folders_[item.getId()] = element;

    var open = item.collapsed ? 0 : 1;
    xml.appendElementNS('open', this.kmlNS, element, open);

    super.processFolder(element, item);
  }

  /**
   * @inheritDoc
   */
  supportsLabelExport() {
    return false;
  }

  /**
   * @inheritDoc
   */
  getGeometry(item) {
    var geometry;

    var feature = item ? item.getFeature() : null;
    if (feature) {
      var geomAltitudeMode;
      var featAltitudeMode = feature.get(RecordField.ALTITUDE_MODE);

      geometry = /** @type {Geometry} */ (feature.get(ORIGINAL_GEOM_FIELD)) || feature.getGeometry();
      if (geometry) {
        geometry = geometry.clone().toLonLat();
        geomAltitudeMode = geometry.get(RecordField.ALTITUDE_MODE);
      }

      if (this.exportEllipses) {
        var ellipse = osFeature.createEllipse(feature);
        if (ellipse && !(ellipse instanceof Point)) {
          if (this.useCenterPoint && geometry instanceof Point) {
            geometry = new GeometryCollection([ellipse, geometry]);
          } else {
            geometry = ellipse;
          }
        }
      }

      if (geometry) {
        geometry.set(RecordField.ALTITUDE_MODE, geomAltitudeMode || featAltitudeMode);
      }
    }

    return geometry;
  }

  /**
   * @inheritDoc
   */
  getBalloonOptions(item) {
    return pluginFileKmlExport.getBalloonOptions(item ? item.getFeature() : null);
  }

  /**
   * @inheritDoc
   */
  getRotationColumn(item) {
    return pluginFileKmlExport.getRotationColumn(item ? item.getFeature() : null);
  }

  /**
   * @inheritDoc
   */
  getLineDash(item) {
    return pluginFileKmlExport.getLineDash(item ? item.getFeature() : null);
  }
}


/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('plugin.file.kml.KMLTreeExporter');
