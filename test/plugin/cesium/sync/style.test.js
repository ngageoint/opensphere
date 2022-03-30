goog.require('os.style');
goog.require('plugin.cesium');
goog.require('plugin.cesium.sync.style');

import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.style', () => {
  const osStyle = goog.module.get('os.style');
  const {GeometryInstanceId} = goog.module.get('plugin.cesium');
  const {getColor, getLineWidthFromStyle} = goog.module.get('plugin.cesium.sync.style');

  describe('getColor', () => {
    const compareColor = (color, expectedColor, alpha) => {
      expect(color.red).toBeCloseTo(expectedColor.red, 12);
      expect(color.blue).toBeCloseTo(expectedColor.blue, 12);
      expect(color.green).toBeCloseTo(expectedColor.green, 12);
      expect(color.alpha).toBeCloseTo(alpha != null ? alpha : expectedColor.alpha, 12);
    };

    const getStyle = () => {
      const stroke = new Stroke();
      stroke.setColor('rgba(255,0,0,1)');

      const fill = new Fill();
      fill.setColor('rgba(0,0,255,1)');

      const style = new Style();
      style.setStroke(stroke);
      style.setFill(fill);

      return style;
    };


    [1, .75, .5, .25, 0].forEach((opacity) => {
      const context = {
        layer: {
          getOpacity() {
            return opacity;
          }
        }
      };

      describe('for layer opacity ' + opacity, () => {
        const blue = Cesium.Color.fromAlpha(Cesium.Color.BLUE, opacity);
        const red = Cesium.Color.fromAlpha(Cesium.Color.RED, opacity);
        const black = Cesium.Color.fromAlpha(Cesium.Color.BLACK, opacity);

        it('should default to black', () => {
          const style = new Style();
          const color = getColor(style, context, GeometryInstanceId.GEOM);
          compareColor(color, black);
        });

        it('should prefer the fill color for geometries', () => {
          const style = getStyle();
          let color = getColor(style, context, GeometryInstanceId.GEOM);
          compareColor(color, blue);
          color = getColor(style, context, GeometryInstanceId.ELLIPSOID);
          compareColor(color, blue);
        });

        it('should prefer the stroke color for outline geometries', () => {
          const style = getStyle();
          let color = getColor(style, context, GeometryInstanceId.GEOM_OUTLINE);
          compareColor(color, red);
          color = getColor(style, context, GeometryInstanceId.ELLIPSOID_OUTLINE);
          compareColor(color, red);
        });

        it('should use 0 alpha for non-highlight styles if the stroke is missing', () => {
          const style = getStyle();
          style.setStroke(null);
          let color = getColor(style, context, GeometryInstanceId.GEOM_OUTLINE);
          compareColor(color, blue, 0);
          color = getColor(style, context, GeometryInstanceId.ELLIPSOID_OUTLINE);
          compareColor(color, blue, 0);
        });
      });
    });
  });

  describe('getLineWidthFromStyle', () => {
    it('should default to the default to the feature size', () => {
      const style = new Style();
      expect(getLineWidthFromStyle(style)).toBe(osStyle.DEFAULT_FEATURE_SIZE);
    });

    it('should return the stroke width', () => {
      const style = new Style();
      const stroke = new Stroke();
      stroke.setWidth(3);
      style.setStroke(stroke);

      expect(getLineWidthFromStyle(style)).toBe(3);
    });
  });
});
