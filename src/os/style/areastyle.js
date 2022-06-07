goog.declareModuleId('os.style.area');

import Circle from 'ol/src/style/Circle.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';


/**
 * The style for default areas
 * @type {Style}
 */
export const DEFAULT_STYLE = new Style({
  stroke: new Stroke({
    color: '#888',
    lineCap: 'square',
    width: 3
  }),
  image: new Circle({
    radius: 3,
    fill: new Fill({
      color: '#888'
    })
  })
});

/**
 * The style for inclusion areas
 * @type {Style}
 */
export const INCLUSION_STYLE = new Style({
  stroke: new Stroke({
    color: '#ff0',
    lineCap: 'square',
    width: 3
  }),
  image: new Circle({
    radius: 3,
    fill: new Fill({
      color: '#ff0'
    })
  })
});

/**
 * The style for exclusion areas
 * @type {Style}
 */
export const EXCLUSION_STYLE = new Style({
  stroke: new Stroke({
    color: '#f00',
    lineCap: 'square',
    width: 3
  }),
  image: new Circle({
    radius: 3,
    fill: new Fill({
      color: '#f00'
    })
  })
});

/**
 * The style for exclusion areas
 * @type {Style}
 */
export const HOVER_STYLE = new Style({
  stroke: new Stroke({
    color: '#fff',
    lineCap: 'square',
    width: 3
  }),
  image: new Circle({
    radius: 3,
    fill: new Fill({
      color: '#fff'
    })
  })
});

/**
 * Style for the search area.
 *
 * @type {Style}
 */
export const SEARCH_AREA_STYLE = new Style({
  stroke: new Stroke({
    color: '#fff',
    lineCap: 'square',
    width: 3
  }),
  image: new Circle({
    radius: 3,
    fill: new Fill({
      color: '#fff'
    })
  })
});

/**
 * Style for the default grid.
 *
 * @type {Style}
 */
export const GRID_STYLE = new Style({
  stroke: new Stroke({
    color: 'rgba(245,245,245,1.0)',
    lineCap: 'square',
    width: 2
  }),
  fill: new Fill({
    color: 'rgba(255,255,255,0.15)'
  })
});

/**
 * @type {Object}
 */
export const HIGHLIGHT_STYLE = {
  'fill': {
    'color': 'rgba(0,255,255,0.15)'
  },
  'stroke': {
    'color': 'rgba(0,255,255,1)',
    'lineCap': 'square',
    'width': 2
  }
};
