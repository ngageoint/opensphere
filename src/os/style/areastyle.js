goog.provide('os.style.area');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


/**
 * The style for default areas
 * @type {ol.style.Style}
 * @const
 */
os.style.area.DEFAULT_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#888',
    lineCap: 'square',
    width: 3
  }),
  image: new ol.style.Circle({
    radius: 3,
    fill: new ol.style.Fill({
      color: '#888'
    })
  })
});


/**
 * The style for inclusion areas
 * @type {ol.style.Style}
 * @const
 */
os.style.area.INCLUSION_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#ff0',
    lineCap: 'square',
    width: 3
  }),
  image: new ol.style.Circle({
    radius: 3,
    fill: new ol.style.Fill({
      color: '#ff0'
    })
  })
});


/**
 * The style for exclusion areas
 * @type {ol.style.Style}
 * @const
 */
os.style.area.EXCLUSION_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#f00',
    lineCap: 'square',
    width: 3
  }),
  image: new ol.style.Circle({
    radius: 3,
    fill: new ol.style.Fill({
      color: '#f00'
    })
  })
});


/**
 * The style for exclusion areas
 * @type {ol.style.Style}
 * @const
 */
os.style.area.HOVER_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#fff',
    lineCap: 'square',
    width: 3
  }),
  image: new ol.style.Circle({
    radius: 3,
    fill: new ol.style.Fill({
      color: '#fff'
    })
  })
});


/**
 * Style for the search area.
 *
 * @type {ol.style.Style}
 * @const
 */
os.style.area.SEARCH_AREA_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#fff',
    lineCap: 'square',
    width: 3
  }),
  image: new ol.style.Circle({
    radius: 3,
    fill: new ol.style.Fill({
      color: '#fff'
    })
  })
});


/**
 * Style for the default grid.
 *
 * @type {ol.style.Style}
 * @const
 */
os.style.area.GRID_STYLE = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(245,245,245,1.0)',
    lineCap: 'square',
    width: 2
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,255,255,0.15)'
  })
});


/**
 * @type {Object}
 * @const
 */
os.style.area.HIGHLIGHT_STYLE = {
  'fill': {
    'color': 'rgba(0,255,255,0.15)'
  },
  'stroke': {
    'color': 'rgba(0,255,255,1)',
    'lineCap': 'square',
    'width': 2
  }
};
