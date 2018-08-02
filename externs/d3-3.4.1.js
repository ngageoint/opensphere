/**
 * @fileoverview Externs for D3 3.4.1.
 *
 * @todo Finish documenting the remaining functions in the d3 object.
 *
 * @see http://ssdn-belford.stwan.bits/docs/d3/wiki/github.com/mbostock/d3/wiki/API-Reference.html
 * @externs
 */


/**
 * @type {Object}
 * @const
 */
var d3 = {
  'behavior': {
    'drag': function() {}
  },
  'event': {
    'sourceEvent': {
      'type': ''
    }
  },
  'html': function() {},
  'scaleExtent': function() {},
  'values': function() {},
  'version': {},
  'time': {
    'scale': {}
  }
};


/**
 * @param {Element} container
 * @return {Array.<number>}
 */
d3.mouse = function(container) {};


/**
 * @typedef {{
 *   append: function((string|Function)):!d3.Selection,
 *   attr: function((string|Object), (string|number|Function)=):!d3.Selection,
 *   call: function(Function, ...*):!d3.Selection,
 *   classed: function((string|Object), (boolean|Function)=):!d3.Selection,
 *   data: function(*=, Function=):!d3.Selection,
 *   each: function(Function):!d3.Selection,
 *   enter: function():!d3.Selection,
 *   exit: function():!d3.Selection,
 *   node: function():Element,
 *   on: function(string, ?Function=, boolean=):!d3.Selection,
 *   property: function((string|Object), (string|Function)=):!d3.Selection,
 *   remove: function():!d3.Selection,
 *   select: function((string|Element)):!d3.Selection,
 *   selectAll: function((string|Array.<Element>)):!d3.Selection,
 *   style: function((string|Object), (string|Function)=, ?string=):!d3.Selection,
 *   transition: function(*=):!d3.Selection
 *   }}
 */
d3.Selection;


/**
 * @param {string|Function} name
 * @return {!d3.Selection}
 */
d3.Selection.append = function(name) {};


/**
 * @param {string|Object} name
 * @param {(string|number|Function)=} opt_value
 * @return {!d3.Selection}
 */
d3.Selection.attr = function(name, opt_value) {};


/**
 * @param {Function} func
 * @param {...*} var_args
 * @return {!d3.Selection}
 */
d3.Selection.call = function(func, var_args) {};


/**
 * @param {string|Object} name
 * @param {(string|Function)=} opt_value
 * @return {!d3.Selection}
 */
d3.Selection.classed = function(name, opt_value) {};


/**
 * @param {*=} opt_values
 * @param {Function=} opt_key
 * @return {!d3.Selection}
 */
d3.Selection.data = function(opt_values, opt_key) {};


/**
 * @param {Function} func
 * @return {!d3.Selection}
 */
d3.Selection.each = function(func) {};


/**
 * @return {!d3.Selection}
 */
d3.Selection.enter = function() {};


/**
 * @return {!d3.Selection}
 */
d3.Selection.exit = function() {};


/**
 * @return {!Element}
 */
d3.Selection.node = function() {};


/**
 * @param {string} type
 * @param {?Function=} opt_listener
 * @param {boolean=} opt_capture
 * @return {!d3.Selection}
 */
d3.Selection.on = function(type, opt_listener, opt_capture) {};


/**
 * @param {string|Object} name
 * @param {(string|Function)=} opt_value
 * @return {!d3.Selection}
 */
d3.Selection.property = function(name, opt_value) {};


/**
 * @return {!d3.Selection}
 */
d3.Selection.remove = function() {};


/**
 * @param {string|Element} selector
 * @return {!d3.Selection}
 */
d3.Selection.select = function(selector) {};


/**
 * @param {string|Array.<Element>} selector
 * @return {!d3.Selection}
 */
d3.Selection.selectAll = function(selector) {};


/**
 * @param {string|Object} name
 * @param {(string|Function)=} opt_value
 * @param {string=} opt_priority
 * @return {!d3.Selection}
 */
d3.Selection.style = function(name, opt_value, opt_priority) {};

/**
 * @param {*=} opt_name
 */
d3.Selection.transition = function(opt_name) {};


/**
 * @param {string|Element} selector
 * @return {!d3.Selection}
 */
d3.select = function(selector) {};


/**
 * @param {string|Array.<Element>} nodes
 * @return {!d3.Selection}
 */
d3.selectAll = function(nodes) {};


/**
 * @typedef {{
 *   alpha: function(number=):(number|!d3.ForceLayout),
 *   drag: function():!d3.ForceLayout,
 *   charge: function(number=):(number|!d3.ForceLayout),
 *   chargeDistance: function(number=):(number|!d3.ForceLayout),
 *   friction: function(number=):(number|!d3.ForceLayout),
 *   gravity: function(number=):(number|!d3.ForceLayout),
 *   linkDistance: function(number=):(number|!d3.ForceLayout),
 *   linkStrength: function(number=):(number|!d3.ForceLayout),
 *   links: function(Array=):(Array|!d3.ForceLayout),
 *   nodes: function(Array=):(Array|!d3.ForceLayout),
 *   on: function(string, ?Function):!d3.ForceLayout,
 *   resume: function(),
 *   size: function(Array=):(Array|!d3.ForceLayout),
 *   start: function(),
 *   stop: function(),
 *   tick: function()
 *   }}
 */
d3.ForceLayout;


/**
 * @param {number=} opt_value
 * @return {number|!d3.ForceLayout}
 */
d3.ForceLayout.alpha = function(opt_value) {};


/**
 * @return {!d3.ForceLayout}
 */
d3.ForceLayout.drag = function() {};


/**
 * @param {number=} opt_value
 * @return {number|!d3.ForceLayout}
 */
d3.ForceLayout.charge = function(opt_value) {};


/**
 * @param {number=} opt_value
 * @return {number|!d3.ForceLayout}
 */
d3.ForceLayout.chargeDistance = function(opt_value) {};


/**
 * @param {number=} opt_value
 * @return {number|!d3.ForceLayout}
 */
d3.ForceLayout.friction = function(opt_value) {};


/**
 * @param {number=} opt_value
 * @return {number|!d3.ForceLayout}
 */
d3.ForceLayout.gravity = function(opt_value) {};


/**
 * @param {number=} opt_value
 * @return {number|!d3.ForceLayout}
 */
d3.ForceLayout.linkDistance = function(opt_value) {};


/**
 * @param {number=} opt_value
 * @return {number|!d3.ForceLayout}
 */
d3.ForceLayout.linkStrength = function(opt_value) {};


/**
 * @param {Array=} opt_links
 * @return {Array|!d3.ForceLayout}
 */
d3.ForceLayout.links = function(opt_links) {};


/**
 * @param {Array=} opt_nodes
 * @return {Array|!d3.ForceLayout}
 */
d3.ForceLayout.nodes = function(opt_nodes) {};


/**
 * @param {string} type
 * @param {?Function} listener
 * @return {!d3.Selection}
 */
d3.ForceLayout.on = function(type, listener) {};


/**
 * @return {*}
 */
d3.ForceLayout.resume = function() {};


/**
 * @param {Array=} opt_size
 * @return {Array|!d3.ForceLayout}
 */
d3.ForceLayout.size = function(opt_size) {};


/**
 * @return {*}
 */
d3.ForceLayout.start = function() {};


/**
 * @return {*}
 */
d3.ForceLayout.stop = function() {};


/**
 * @return {*}
 */
d3.ForceLayout.tick = function() {};


/**
 * @type {Object}
 * @const
 */
d3.layout = {};


/**
 * @return {d3.ForceLayout}
 */
d3.layout.force = function() {};


/**
 * @return {Object}
 */
d3.layout.tree = function() {};


/**
 * @typedef {{
 *   axis: function():d3.Axis,
 *   brush: function():d3.brush
 *   }}
 */
d3.svg;


/**
 * @typedef {{
 *   tickFormat: function(string):d3.Axis,
 *   tickPadding: function(number):d3.Axis,
 *   tickSize: function(number, number):d3.Axis,
 *   ticks: function((Array|Object)):d3.Axis,
 *   tickValues: function(Array):d3.Axis,
 *   orient: function(string):d3.Axis,
 *   scale: function(d3.Scale=):(d3.Axis|d3.Scale),
 *   tickSubdivide: function(boolean):d3.Axis
 *   }}
 */
d3.Axis;


/**
 * @param {string} format
 * @return {d3.Axis}
 */
d3.Axis.tickFormat = function(format) {};


/**
 * @param {number} padding
 * @return {d3.Axis}
 */
d3.Axis.tickPadding = function(padding) {};


/**
 * @param {number} inner
 * @param {number} outer
 * @return {d3.Axis}
 */
d3.Axis.tickSize = function(inner, outer) {};


/**
 * @param {(Array|Object)} value
 * @return {d3.Axis}
 */
d3.Axis.ticks = function(value) {};


/**
 * @param {Array} values
 * @return {d3.Axis}
 */
d3.Axis.tickValues = function(values) {};


/**
 * @param {string} side
 * @return {d3.Axis}
 */
d3.Axis.orient = function(side) {};


/**
 * @param {d3.Scale=} opt_scale
 * @return {(d3.Axis|d3.Scale)}
 */
d3.Axis.scale = function(opt_scale) {};


/**
 * @return {d3.Axis}
 */
d3.svg.axis = function() {};


/**
 * d3 defines some things as functions with attributes, which is really annoying for externs. This is
 * an extra typedef to use when calling a scale as a function.
 * @typedef {Function}
 */
d3.AxisFn;


/**
 * @typedef {{
 *   x: function(d3.Scale):d3.brush,
 *   extent: function(Array.<number>=):(d3.brush|Array.<number>),
 *   clear: function(),
 *   on: function(string, ?Function=, boolean=):d3.brush
 * }}
 */
d3.brush;


/**
 * @param {d3.Scale} axis
 * @return {d3.brush}
 */
d3.brush.x = function(axis) {};


/**
 * @param {Array.<number>=} opt_value
 * @return {(d3.brush|Array.<number>)}
 */
d3.brush.extent = function(opt_value) {};


/**
 * @param {string} type
 * @param {?Function=} opt_listener
 * @param {boolean=} opt_capture
 * @return {d3.brush}
 */
d3.brush.on = function(type, opt_listener, opt_capture) {};


/**
 * Clear
 */
d3.brush.clear = function() {};


/**
 * @return {d3.brush}
 */
d3.svg.brush = function() {};


/**
 * @typedef {{
 *   interpolate: function(string):!d3.Line,
 *   x: function(function(Object):number):!d3.Line,
 *   y: function(function(Object):number):!d3.Line
 * }}
 */
d3.Line;


/**
 * @param {string} type
 * @return {d3.Line}
 */
d3.Line.interpolate = function(type) {};


/**
 * @param {function(Object):number} fn
 * @return {d3.Line}
 */
d3.Line.x = function(fn) {};


/**
 * @param {function(Object):number} fn
 * @return {d3.Line}
 */
d3.Line.y = function(fn) {};


/**
 * d3 defines some things as functions with attributes, which is really annoying for externs. This is
 * an extra typedef to use when calling a scale as a function.
 * @typedef {function(Array)}
 */
d3.LineFn;


/**
 * @return {d3.Line}
 */
d3.svg.line = function() {};


/**
 * @typedef {{
 *   invert: function(number):*,
 *   range: function(Array.<number>=):(d3.Scale|Array.<*>),
 *   domain: function(Array.<number>=):(d3.Scale|Array.<*>),
 *   rangeRoundBands: function((number|Array.<number>), ...number):(d3.Scale|Array.<*>),
 *   rangeBands: function((number|Array.<number>)):(d3.Scale|Array.<*>),
 *   rangeBand: function():(number)
 * }}
 */
d3.Scale;


/**
 * @param {number} val
 * @return {*}
 */
d3.Scale.invert = function(val) {};


/**
 * @param {Array.<number>=} opt_value
 * @return {(d3.Scale|Array.<*>)}
 */
d3.Scale.range = function(opt_value) {};


/**
 * @param {Array.<number>=} opt_value
 * @return {(d3.Scale|Array.<*>)}
 */
d3.Scale.domain = function(opt_value) {};


/**
 * @param {Array.<number>=} opt_value
 * @return {(d3.Scale|Array.<*>)}
 */
d3.Scale.ordinal = function(opt_value) {};


/**
 * @param {(number|Array.<number>)} opt_value
 * @param {...number} var_args
 * @return {(d3.Scale|Array.<*>)}
 */
d3.Scale.ordinal.rangeRoundBands = function(opt_value, var_args) {};


/**
 * @param {(number|Array.<number>)} opt_value
 * @return {(d3.Scale|Array.<*>)} [description]
 */
d3.Scale.ordinal.rangeBands = function(opt_value) {};


/**
 * @return {number} [description]
 */
d3.Scale.ordinal.rangeBand = function() {};



/**
 * d3 defines some things as functions with attributes, which is really annoying for externs. This is
 * an extra typedef to use when calling a scale as a function.
 * @typedef {function(number):number}
 */
d3.ScaleFn;


/**
 * @typedef {{
 *   x: function(d3.Scale):d3.zoom
 *   }}
 */
d3.zoom;


/**
 * @param {d3.Scale} scale
 * @return {d3.zoom}
 */
d3.zoom.x = function(scale) {};


/**
 * @return {d3.zoom}
 */
d3.behavior.zoom = function() {};


/**
 * @return {d3.Scale}
 */
d3.time.scale.utc = function() {};


/**
 * @return {d3.Scale}
 */
d3.scale.linear = function() {};


/**
 * @return {d3.Scale}
 */
d3.scale.ordinal = function() {};


/**
 * @typedef {{
 *   brighter: function(number=):!d3.rgb,
 *   darker: function(number=):!d3.rgb,
 *   hsl: function():!d3.rgb,
 *   toString: function():!d3.rgb
 *   }}
 */
d3.rgb;


/**
 * @param {number=} opt_gamma The optional gamma value
 */
d3.rgb.brighter = function(opt_gamma) {};


/**
 * @param {number=} opt_gamma The optional gamma value
 */
d3.rgb.darker = function(opt_gamma) {};


/**
 */
d3.rgb.hsl = function() {};


/**
 */
d3.rgb.toString = function() {};


/**
 * @typedef {function(d3.Selection)}
 */
d3.Tip;


/**
 * @type {!d3.Tip}
 */
var d3Tip;


/**
 * @param {string|Object} attr
 * @param {(string|number|Function)=} opt_value
 * @return {!d3.Tip}
 */
d3Tip.attr = function(attr, opt_value) {};


/**
 *
 */
d3Tip.hide = function() {};


/**
 * @param {(Function|string)=} opt_value
 * @return {!(d3.Tip|string)}
 */
d3Tip.html = function(opt_value) {};


/**
 * @param {Array.<number>=} opt_value
 * @return {!(d3.Tip|Array.<number>)}
 */
d3Tip.offset = function(opt_value) {};


/**
 * @param {...*} var_args
 */
d3Tip.show = function(var_args) {};

/**
 * @param {string} dir The direction to display the tooltip, n, s, e, or w
 */
d3Tip.direction = function(dir) {};


/**
 * @return {!d3.Tip}
 */
d3.tip = function() {};


/**
 * @typedef {{
 *   ease: function((string|Array)):!d3.transition
 *   }}
 */
d3.transition;

/**
 * @param {Function|string} value
 */
d3.transition.ease = function(value) {};

/**
 * Return object that represents the SI prefix
 * @param {string} value
 * @param {number=} opt_precision
 * @return {Object} [SI prefix]
 */
d3.formatPrefix = function(value, opt_precision) {};
