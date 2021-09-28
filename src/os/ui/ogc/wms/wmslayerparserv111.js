goog.declareModuleId('os.ui.ogc.wms.WMSLayerParserV111');

import {COLOR_STYLE_REGEX, DEFAULT_TILE_STYLE} from '../../../ogc/ogc.js';
import AbstractWMSLayerParser from './abstractwmslayerparser.js';

const {clone: cloneArray} = goog.require('goog.array');
const {clone: cloneObject, getValueByKeys} = goog.require('goog.object');


/**
 */
export default class WMSLayerParserV111 extends AbstractWMSLayerParser {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  parseLayer(node, layer) {
    var i;

    if (node && layer) {
      layer.setTitle(/** @type {string} */ (node['Title'] || ''));
      layer.setAbstract(/** @type {string} */ (node['Abstract'] || ''));

      this.addAttribution(node, layer);

      // only do the rest if the layer is not a folder
      var name = /** @type {string} */ (node['Name']);
      if (name) {
        layer.setWmsName(name);

        var opaque = String(node['opaque']).toLowerCase();
        layer.setOpaque(opaque == '1' || opaque == 'true');

        var dimensionSets = ['Extent', 'Dimension'];
        dimensionSets.forEach(function(set) {
          var dimensions = node[set];
          if (dimensions) {
            for (i = 0; i < dimensions.length; i++) {
              layer.addDimension(String(dimensions[i]['name']), String(dimensions[i]['values']));
            }
          }
        });

        layer.setSupportedCRS(/** @type {?Array<!string>} */ (node['CRS']));
        var bboxArray = node['LatLonBoundingBox'];
        if (bboxArray && bboxArray.length > 0) {
          for (i = 0; i < bboxArray.length; i++) {
            if (bboxArray[i]['crs'] == 'EPSG:4326') {
              layer.setBBox(/** @type {ol.Extent} */ (cloneArray(bboxArray[i]['extent'])));
              break;
            }
          }
        }

        var styles = node['Style'];
        if (styles) {
          var styleArr = [];
          var legendArr = [];
          // Since each layer will also need a "default" style that will not send a style to the server,
          // let's add it to the array
          styleArr.push(cloneObject(DEFAULT_TILE_STYLE));

          for (i = 0; i < styles.length; i++) {
            var style = styles[i];
            var styleTitle = String(style['Title']);
            var styleName = String(style['Name']);
            var item = /** @type {!osx.ogc.TileStyle} */ ({
              label: styleTitle ? styleTitle : styleName,
              data: styleName
            });
            styleArr.push(item);

            if (COLOR_STYLE_REGEX.test(styleTitle)) {
              layer.setColor(styleName);

              // clear data on the color style for the default color, since this affects what is sent to the server
              item.data = '';

              // The foreground color/density style typically comes with a legend that we don't want to show
              // legendArr.push(null);
            } else {
              var legend = getValueByKeys(style, ['LegendURL', 0]);
              if (legend) {
                legendArr.push(legend);
              }
            }
          }

          if (styleArr.length) {
            layer.setStyles(styleArr);
          }

          if (legendArr.length) {
            layer.setLegends(legendArr);
          }
        }

        // get keywords
        var kList = getValueByKeys(node, ['KeywordList']);
        if (kList) {
          var keywords = [];
          i = kList.length;
          while (i--) {
            var keyword = String(kList[i]);
            if (!keywords.includes(keyword)) {
              keywords.push(keyword);
            }
          }

          layer.setKeywords(keywords);
        }
      }
    }
  }
}
