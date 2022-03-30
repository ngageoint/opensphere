goog.declareModuleId('plugin.file.kml.KMLExporter');

import {find} from 'ol/src/array.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import Point from 'ol/src/geom/Point.js';
import DataManager from '../../../os/data/datamanager.js';
import RecordField from '../../../os/data/recordfield.js';
import DynamicFeature from '../../../os/feature/dynamicfeature.js';
import * as osFeature from '../../../os/feature/feature.js';
import osImplements from '../../../os/implements.js';
import LayerId from '../../../os/layer/layerid.js';
import * as osSource from '../../../os/source/source.js';
import * as osStyle from '../../../os/style/style.js';
import StyleManager from '../../../os/style/stylemanager_shim.js';
import StyleType from '../../../os/style/styletype.js';
import ITime from '../../../os/time/itime.js';
import AbstractKMLExporter from '../../../os/ui/file/kml/abstractkmlexporter.js';
import * as kml from '../../../os/ui/file/kml/kml.js';
import * as xml from '../../../os/xml.js';
import * as pluginFileKmlExport from './kmlexport.js';
import {directiveTag as kmlExportUi} from './ui/kmlexportui.js';

const log = goog.require('goog.log');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');



/**
 * KML exporter
 *
 * @extends {AbstractKMLExporter<Feature>}
 */
export default class KMLExporter extends AbstractKMLExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

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
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();
    this.folders_ = {};
    this.sourceFields_ = {};
  }

  /**
   * @inheritDoc
   */
  supportsMultiple() {
    return true;
  }

  /**
   * @inheritDoc
   */
  getColor(item) {
    var itemColor = osFeature.getColor(item, this.getSource_(item));
    if (!itemColor || (typeof itemColor != 'string' && !Array.isArray(itemColor))) {
      itemColor = osStyle.DEFAULT_LAYER_COLOR;
    }
    return osStyle.toAbgrString(itemColor);
  }

  /**
   * @inheritDoc
   */
  getFill(item) {
    const style = item.getStyle();
    const styles = Array.isArray(style) ? style : [style];
    return styles.some(osStyle.hasNonZeroFillOpacity);
  }

  /**
   * @inheritDoc
   */
  getFillColor(item) {
    var itemColor = osFeature.getFillColor(item, this.getSource_(item));
    return itemColor ? osStyle.toAbgrString(itemColor) : null;
  }

  /**
   * @inheritDoc
   */
  getStroke(item) {
    const style = item.getStyle();
    const styles = Array.isArray(style) ? style : [style];
    return styles.some(osStyle.hasNonZeroStrokeOpacity);
  }

  /**
   * @inheritDoc
   */
  getStrokeColor(item) {
    var itemColor = osFeature.getStrokeColor(item, this.getSource_(item));
    return itemColor ? osStyle.toAbgrString(itemColor) : null;
  }

  /**
   * @inheritDoc
   */
  getStrokeWidth(item) {
    return osFeature.getStrokeWidth(item);
  }

  /**
   * @inheritDoc
   */
  getField(item, field) {
    return osFeature.getField(item, field);
  }

  /**
   * @inheritDoc
   */
  getItemLabel(item, labelField) {
    if (typeof labelField == 'object' && labelField['column']) {
      var label = this.getField(item, labelField['column']);
      if (label != null) {
        // if the column name is displayed in opensphere, add it in the KML as well
        return (labelField['showColumn'] ? (labelField['column'] + ': ') : '') + String(label);
      }

      return null;
    }

    return super.getItemLabel(item, labelField);
  }

  /**
   * @inheritDoc
   */
  getIcon(item) {
    // TODO update this when we support icons. it should return an object with the href/scale of the feature icon,
    //      defaulting to the base behavior
    return super.getIcon(item);
  }

  /**
   * @inheritDoc
   */
  getId(item) {
    return /** @type {string} */ (item.getId());
  }

  /**
   * @inheritDoc
   */
  getFields(item) {
    var source = this.getSource_(item);
    var fields = null;
    if (source) {
      var sourceId = source.getId();
      if (!(sourceId in this.sourceFields_)) {
        this.sourceFields_[sourceId] = osSource.getExportFields(source) || [];
      }

      fields = this.sourceFields_[sourceId];
    }

    return fields || this.fields;
  }

  /**
   * @inheritDoc
   */
  getParent(item) {
    // initialize the parent to the root kml:Document
    var parent = this.kmlDoc;
    if (parent) {
      // opensphere organizes Placemarks into folders by source
      var source = this.getSource_(item);
      if (source) {
        var sourceId = source.getId();
        if (!(sourceId in this.folders_)) {
          // create a new folder for the source
          var folder = xml.appendElementNS('Folder', this.kmlNS, parent);
          xml.appendElementNS('name', this.kmlNS, folder, source.getTitle());

          // update the parent
          parent = this.folders_[sourceId] = folder;
        } else {
          // already have a folder for the source
          parent = this.folders_[sourceId];
        }
      }
    }

    return parent;
  }

  /**
   * @inheritDoc
   */
  getProperties(item) {
    var properties = item.getProperties();
    var keys = googObject.getKeys(properties);
    for (var i = 0, n = keys.length; i < n; i++) {
      var key = keys[i];
      if (googString.startsWith(key, '_') || osFeature.isInternalField(key)) {
        delete properties[key];
      }
    }

    return properties;
  }

  /**
   * @inheritDoc
   */
  getStyleType(item) {
    var type = kml.StyleType.DEFAULT;
    var geometry = this.getGeometry(item);
    if (geometry && (geometry.getType() == GeometryType.POINT ||
        geometry.getType() == GeometryType.GEOMETRY_COLLECTION)) {
      var source = this.getSource_(item);
      var shape = source ? source.getGeometryShape() : null;
      type = shape == osStyle.ShapeType.ICON ? kml.StyleType.ICON : kml.StyleType.POINT;
    }

    return type;
  }

  /**
   * @inheritDoc
   */
  getTime(item) {
    var time = item.get(RecordField.TIME);
    if (osImplements(time, ITime.ID)) {
      return /** @type {!ITime} */ (time);
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getGeometry(item) {
    var geometry;
    if (item) {
      geometry = /** @type {(ol.geom.Geometry|undefined)} */ (item.get(RecordField.GEOM));
      var geomAltitudeMode;
      var featAltitudeMode = item.get(RecordField.ALTITUDE_MODE);
      if (geometry) {
        geometry = geometry.clone().toLonLat();
        geomAltitudeMode = geometry.get(RecordField.ALTITUDE_MODE);
      }

      if (this.exportEllipses) {
        var ellipse = osFeature.createEllipse(item);
        if (ellipse && !(ellipse instanceof Point)) {
          if (this.useCenterPoint && geometry instanceof Point) {
            geometry = new GeometryCollection([ellipse, geometry]);
          } else {
            geometry = ellipse;
          }
        }
      }

      if (this.exportRangeRings) {
        var rings = osFeature.createRings(item, false);
        if (rings && !(rings instanceof Point)) {
          geometry = rings;
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
    return pluginFileKmlExport.getBalloonOptions(item);
  }

  /**
   * @inheritDoc
   */
  getRotationColumn(item) {
    return pluginFileKmlExport.getRotationColumn(item);
  }

  /**
   * @inheritDoc
   */
  getLineDash(item) {
    return pluginFileKmlExport.getLineDash(item);
  }

  /**
   * Get the feature's source.
   *
   * @param {Feature} feature The feature
   * @return {VectorSource} The source
   * @private
   */
  getSource_(feature) {
    var source = null;
    if (feature) {
      var sourceId = feature.get(RecordField.SOURCE_ID);
      if (typeof sourceId === 'string') {
        source = /** @type {VectorSource} */ (DataManager.getInstance().getSource(sourceId));
      }
    }

    return source;
  }

  /**
   * @inheritDoc
   */
  getUI() {
    return `<${kmlExportUi} exporter="exporter" simple="simple"></${kmlExportUi}>`;
  }

  /**
   * @inheritDoc
   */
  getGroupLabels(item) {
    if (item) {
      var sourceId = /** @type {string|undefined} */ (item.get(RecordField.SOURCE_ID));

      // don't count the drawing layer as a style source
      if (sourceId && sourceId != LayerId.DRAW) {
        if (item instanceof DynamicFeature || !(sourceId in this.labelMap)) {
          var cfg = StyleManager.getInstance().getLayerConfig(sourceId);
          var itemStyle = item.get(StyleType.FEATURE);
          // Check the layer level
          if (cfg && cfg['labels'] && this.checkLabelsNotNull_(cfg['labels'])) {
            this.labelMap[sourceId] = cfg['labels'];
          } else if (itemStyle && Array.isArray(itemStyle)) {
            // Check the feature level
            var labels = find(itemStyle, osStyle.isLabelConfig);
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
  }

  /**
   * Check the label field array for any non-null fields.
   *
   * @param {Array<*>} labelFields Array of label fields
   * @return {boolean} True if there are any non-null label fields
   * @private
   */
  checkLabelsNotNull_(labelFields) {
    if (labelFields) {
      return labelFields.some(function(labelField) {
        return (typeof labelField == 'object' && labelField['column']);
      });
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  supportsLabelExport() {
    return true;
  }
}


/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('plugin.file.kml.KMLExporter');
