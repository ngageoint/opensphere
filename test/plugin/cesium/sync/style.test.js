goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.style');
goog.require('plugin.cesium');
goog.require('plugin.cesium.sync.style');

describe('plugin.cesium.sync.style', () => {
  const {getColor, getLineWidthFromStyle} = goog.module.get('plugin.cesium.sync.style');

  describe('getColor', () => {
    const compareColor = (color, expectedColor, alpha) => {
      expect(color.red).toBeCloseTo(expectedColor.red, 12);
      expect(color.blue).toBeCloseTo(expectedColor.blue, 12);
      expect(color.green).toBeCloseTo(expectedColor.green, 12);
      expect(color.alpha).toBeCloseTo(alpha != null ? alpha : expectedColor.alpha, 12);
    };

    const getStyle = () => {
      const stroke = new ol.style.Stroke();
      stroke.setColor('rgba(255,0,0,1)');

      const fill = new ol.style.Fill();
      fill.setColor('rgba(0,0,255,1)');

      const style = new ol.style.Style();
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
        layerOpacity = opacity;

        const blue = Cesium.Color.fromAlpha(Cesium.Color.BLUE, opacity);
        const red = Cesium.Color.fromAlpha(Cesium.Color.RED, opacity);
        const black = Cesium.Color.fromAlpha(Cesium.Color.BLACK, opacity);

        it('should default to black', () => {
          const style = new ol.style.Style();
          const color = getColor(style, context, plugin.cesium.GeometryInstanceId.GEOM);
          compareColor(color, black);
        });

        it('should prefer the fill color for geometries', () => {
          const style = getStyle();
          let color = getColor(style, context, plugin.cesium.GeometryInstanceId.GEOM);
          compareColor(color, blue);
          color = getColor(style, context, plugin.cesium.GeometryInstanceId.ELLIPSOID);
          compareColor(color, blue);
        });

        it('should prefer the stroke color for outline geometries', () => {
          const style = getStyle();
          let color = getColor(style, context, plugin.cesium.GeometryInstanceId.GEOM_OUTLINE);
          compareColor(color, red);
          color = getColor(style, context, plugin.cesium.GeometryInstanceId.ELLIPSOID_OUTLINE);
          compareColor(color, red);
        });

        it('should use 0 alpha for non-highlight styles if the stroke is missing', () => {
          const style = getStyle();
          style.setStroke(null);
          let color = getColor(style, context, plugin.cesium.GeometryInstanceId.GEOM_OUTLINE);
          compareColor(color, blue, 0);
          color = getColor(style, context, plugin.cesium.GeometryInstanceId.ELLIPSOID_OUTLINE);
          compareColor(color, blue, 0);
        });
      });
    });
  });

  describe('getLineWidthFromStyle', () => {
    it('should default to the default to the feature size', () => {
      const style = new ol.style.Style();
      expect(getLineWidthFromStyle(style)).toBe(os.style.DEFAULT_FEATURE_SIZE);
    });

    it('should return the stroke width', () => {
      const style = new ol.style.Style();
      const stroke = new ol.style.Stroke();
      stroke.setWidth(3);
      style.setStroke(stroke);

      expect(getLineWidthFromStyle(style)).toBe(3);
    });
  });
});
