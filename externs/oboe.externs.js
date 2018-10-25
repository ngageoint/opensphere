/**
 * See http://oboejs.com/api for better docs than this
 *
 * @externs
 * @return {oboe.Parser}
 */
var oboe = function() {};

/**
 * @typedef {Array|Object|string|boolean|number|null}
 */
oboe.Node;

/**
 * @constructor
 */
oboe.Forgetable;

/**
 * When in a callback registered with oboe, you can call `this.forget()` to
 * remove the currently-running listener.
 *
 * That only works if you haven't already bound `this` to something else on
 * that specific handler.
 */
oboe.Forgetable.prototype.forget = function() {};


/**
 * @typedef {function(this:oboe.Forgetable, oboe.Node, string, Array)}
 */
oboe.NodeHandler;

/**
 * @constructor
 */
oboe.Parser;

/**
 * This can either be called with `addListener('node', pattern, callback)` or
 * `addListener('node:{pattern}', callback)`
 * @param {string} typeAndPattern,
 * @param {string|oboe.NodeHandler} handlerOrPattern
 * @param {oboe.NodeHandler=} opt_handler
 */
oboe.Parser.prototype.addListener = function(typeAndPattern, handlerOrPattern, opt_handler) {};

/**
 * This isn't obvious from the docs, but this is how you write a chunk to the parser:
 * `emit('data', str)`
 *
 * @param {string} type
 * @param {*} thing
 */
oboe.Parser.prototype.emit = function(type, thing) {};

/**
 * @param {function({thrown: Error})} errback
 */
oboe.Parser.prototype.fail = function(errback) {};

/**
 * This can be called with `node({pattern1: callback1, pattern2: callback2})` or
 * `node(pattern, callback)`
 *
 * @param {string|Object<string, oboe.NodeHandler>} setOrPattern
 * @param {oboe.NodeHandler=} opt_handler
 */
oboe.Parser.prototype.node = function(setOrPattern, opt_handler) {};

oboe.Parser.prototype.on = oboe.Parser.prototype.addListener;

/**
 * This can either be called with `removeListener('node', pattern, callback)` or
 * `removeListener('node:{pattern}', callback)`
 * @param {string} typeAndPattern,
 * @param {string|oboe.NodeHandler} handlerOrPattern
 * @param {oboe.NodeHandler=} opt_handler
 */
oboe.Parser.prototype.removeListener = function(typeAndPattern, handlerOrPattern, opt_handler) {};


/**
 * @return {oboe.Node} The full parsed JSON so far
 */
oboe.Parser.prototype.root = function() {};
