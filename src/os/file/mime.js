goog.declareModuleId('os.file.mime');

const Promise = goog.require('goog.Promise');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @typedef {{
 *  type: !string,
 *  detect: !function(ArrayBuffer, OSFile, *=):!Promise<*|undefined>,
 *  priority: number,
 *  children: (Array<Node>|undefined)
 * }}
 */
export let Node;

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.file.mime');

/**
 * @type {string}
 */
export const BASE_TYPE = 'application/octet-stream';

/**
 * @type {Node}
 */
const rootNode = {
  type: BASE_TYPE,
  detect: function() {
    return Promise.resolve(true);
  },
  priority: 0
};

/**
 * @param {!string} mimeType The mime type to register
 * @param {function(ArrayBuffer, OSFile, *=):*} detectFunc The detection function
 * @param {number=} opt_priority The priority (run in ascending order). Defaults to zero.
 * @param {string=} opt_parentType The parent mime type (e.g. "text/xml" has a parent of "text/plain")
 * @return {boolean} True if successful, false otherwise
 */
export const register = function(mimeType, detectFunc, opt_priority, opt_parentType) {
  var msg;
  if (!mimeType) {
    msg = 'Cannot register an undefined type!';
    log.error(logger, msg);
    console.error(msg);
    return false;
  }

  if (!detectFunc) {
    msg = 'Cannot register an undefined detect function!';
    log.error(logger, msg);
    console.error(msg);
    return false;
  }

  var parent = opt_parentType ? findNode(opt_parentType) : rootNode;

  if (!parent) {
    msg = 'The parent type "' + opt_parentType + '" could not be found.';
    log.error(logger, msg);
    console.error(msg);
    return false;
  }

  if (!parent.children) {
    parent.children = [];
  }

  var index = parent.children.length;

  for (var i = 0, ii = parent.children.length; i < ii; i++) {
    if (parent.children[i].type === mimeType) {
      index = i;
      log.warning(logger, 'The mime type "' + mimeType +
          '" was previously registered and will be replaced');
      break;
    }
  }

  parent.children[index] = /** @type {Node} */ ({
    type: mimeType,
    detect: detectFunc,
    priority: opt_priority || 0
  });

  parent.children.sort(sortNodes);
  return true;
};

/**
 * Sort ascending
 *
 * @param {Node} a
 * @param {Node} b
 * @return {number} per typical compare functions
 */
const sortNodes = function(a, b) {
  return a.priority - b.priority;
};

/**
 * @param {!string} type
 * @param {Node=} opt_node
 * @return {Node|undefined}
 */
export const findNode = function(type, opt_node) {
  opt_node = opt_node || rootNode;
  if (opt_node.type === type) {
    return opt_node;
  }

  if (opt_node.children) {
    for (var i = 0, ii = opt_node.children.length; i < ii; i++) {
      var val = findNode(type, opt_node.children[i]);
      if (val) {
        return val;
      }
    }
  }
};

/**
 * @param {!ArrayBuffer} buffer The peek bytes into the file
 * @param {!OSFile} file The file wrapper
 * @param {Node=} opt_node The current mime node
 * @param {*=} opt_context The current context from the parent node
 * @return {!Promise<string|undefined>} A promise resolving to the mime type detected from the buffer/file
 */
export const detect = function(buffer, file, opt_node, opt_context) {
  opt_node = opt_node || rootNode;
  var promise = opt_node.detect(buffer, file, opt_context);
  if (!(promise instanceof Promise)) {
    console.warn(opt_node.type, 'is not using a promise');
  }
  return promise.then(function(val) {
    if (val) {
      opt_context = val;

      if (opt_node.children) {
        return opt_node.children.reduce(
            /**
             * @param {Promise<string|undefined>|string|undefined} c
             * @param {Node} n
             * @return {goog.Promise<string|undefined>|string|undefined}
             */
            function(c, n) {
              // This is setting up a sequential promise chain: e.g.
              //  promise1
              //    .then(x => promise2)
              //    .then(x => promise3)
              //    ...
              //
              // Except that we actually want the promise chain to stop executing once
              // the first one returns a value.
              return c.then(function(val) {
                return val ? val : detect(buffer, file, n, opt_context);
              });
            }, Promise.resolve()).then(function(val) {
          return val ? val : opt_node.type;
        });
      }

      return opt_node.type;
    }
  });
};

/**
 * @param {string} type The type whose chain to locate
 * @param {Node=} opt_node
 * @param {Array<!string>=} opt_chain
 * @return {Array<!string>|undefined} The chain
 */
export const getTypeChain = function(type, opt_node, opt_chain) {
  opt_node = opt_node || rootNode;
  opt_chain = opt_chain || [];

  opt_chain.push(opt_node.type);

  if (type === opt_node.type) {
    return opt_chain;
  } else if (opt_node.children) {
    for (var i = 0, n = opt_node.children.length; i < n; i++) {
      var retVal = getTypeChain(type, opt_node.children[i], opt_chain);
      if (retVal) {
        return retVal;
      }
    }
  }

  opt_chain.pop();
};
