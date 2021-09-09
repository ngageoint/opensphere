goog.module('os.style.area');

const Circle = goog.require('ol.style.Circle');
const Fill = goog.require('ol.style.Fill');
const Stroke = goog.require('ol.style.Stroke');
const Style = goog.require('ol.style.Style');


/**
 * The style for default areas
 * @type {Style}
 */
const DEFAULT_STYLE = new Style({
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
const INCLUSION_STYLE = new Style({
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
const EXCLUSION_STYLE = new Style({
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
const HOVER_STYLE = new Style({
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
const SEARCH_AREA_STYLE = new Style({
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
const GRID_STYLE = new Style({
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
const HIGHLIGHT_STYLE = {
  'fill': {
    'color': 'rgba(0,255,255,0.15)'
  },
  'stroke': {
    'color': 'rgba(0,255,255,1)',
    'lineCap': 'square',
    'width': 2
  }
};

exports = {
  DEFAULT_STYLE,
  INCLUSION_STYLE,
  EXCLUSION_STYLE,
  HOVER_STYLE,
  SEARCH_AREA_STYLE,
  GRID_STYLE,
  HIGHLIGHT_STYLE
};
