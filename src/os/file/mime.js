goog.provide('os.file.mime');

goog.require('goog.Promise');
goog.require('goog.log');
goog.require('goog.log.Logger');

/**
 * @typedef {{
 *  type: !string,
 *  detect: !function(ArrayBuffer, os.file.File, *=):!goog.Promise<*|undefined>,
 *  priority: number,
 *  children: (os.file.mime.Node|undefined)
 * }}
 */
os.file.mime.Node;


/**
 * The logger.
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.file.mime.LOGGER_ = goog.log.getLogger('os.file.mime');


/**
 * @type {os.file.mime.Node}
 * @private
 */
os.file.mime.root_ = {
  type: 'application/octet-stream',
  detect: function() {
    return goog.Promise.resolve(true);
  },
  priority: 0
};


/**
 * @param {!string} mimeType The mime type to register
 * @param {function(ArrayBuffer, os.file.File, *=):*} detectFunc The detection function
 * @param {number=} opt_priority The priority (run in ascending order). Defaults to zero.
 * @param {string=} opt_parentType The parent mime type (e.g. "text/xml" has a parent of "text/plain")
 * @return {boolean} True if successful, false otherwise
 */
os.file.mime.register = function(mimeType, detectFunc, opt_priority, opt_parentType) {
  var parent = opt_parentType ? os.file.mime.find_(opt_parentType) : os.file.mime.root_;

  if (!parent) {
    goog.log.error(os.file.mime.LOGGER_, 'The parent type "' + opt_parentType + '" could not be found.');
    return false;
  }

  if (!parent.children) {
    parent.children = [];
  }

  var index = parent.children.length;

  for (var i = 0, ii = parent.children.length; i < ii; i++) {
    if (parent.children[i].type === mimeType) {
      index = i;
      goog.log.warning(os.file.mime.LOGGER_, 'The mime type "' + mimeType +
          '" was previously registered and will be replaced');
      break;
    }
  }

  parent.children[index] = /** @type {os.file.mime.Node} */ ({
    type: mimeType,
    detect: detectFunc,
    priority: opt_priority || 0
  });

  parent.children.sort(os.file.mime.sort_);
  return true;
};


/**
 * Sort ascending
 * @param {os.file.mime.Node} a
 * @param {os.file.mime.Node} b
 * @return {number} per typical compare functions
 * @private
 */
os.file.mime.sort_ = function(a, b) {
  return a.priority - b.priority;
};


/**
 * @param {!string} type
 * @param {os.file.mime.Node=} opt_node
 * @return {os.file.mime.Node|undefined}
 */
os.file.mime.find_ = function(type, opt_node) {
  opt_node = opt_node || os.file.mime.root_;
  if (opt_node.type === type) {
    return opt_node;
  }

  if (opt_node.children) {
    for (var i = 0, ii = opt_node.children.length; i < ii; i++) {
      var val = os.file.mime.find_(type, opt_node.children[i]);
      if (val) {
        return val;
      }
    }
  }
};


/**
 * @param {!ArrayBuffer} buffer The peek bytes into the file
 * @param {!os.file.File} file The file wrapper
 * @param {os.file.mime.Node=} opt_node The current mime node
 * @param {*=} opt_context The current context from the parent node
 * @return {!goog.Promise<string|undefined>} A promise resolving to the mime type detected from the buffer/file
 */
os.file.mime.detect = function(buffer, file, opt_node, opt_context) {
  opt_node = opt_node || os.file.mime.root_;
  var promise = opt_node.detect(buffer, file, opt_context);
  if (!(promise instanceof goog.Promise)) {
    console.warn(opt_node.type, 'is not using a promise');
  }
  return promise.then(function(val) {
    if (val) {
      opt_context = val;

      if (opt_node.children) {
        return opt_node.children.reduce(
            /**
             * @param {goog.Promise<string|undefined>|string|undefined} c
             * @param {os.file.mime.Node} n
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
                return val ? val : os.file.mime.detect(buffer, file, n, opt_context);
              });
            }, goog.Promise.resolve()).then(function(val) {
              return val ? val : opt_node.type;
            });
      }

      return opt_node.type;
    }
  });
};


/**
 * @param {string} type The type whose chain to locate
 * @param {os.file.mime.Node=} opt_node
 * @param {Array<!string>=} opt_chain
 * @return {Array<!string>|undefined} The chain
 */
os.file.mime.getTypeChain = function(type, opt_node, opt_chain) {
  opt_node = opt_node || os.file.mime.root_;
  opt_chain = opt_chain || [];

  opt_chain.push(opt_node.type);

  if (type === opt_node.type) {
    return opt_chain;
  } else if (opt_node.children) {
    for (var i = 0, n = opt_node.children.length; i < n; i++) {
      var retVal = os.file.mime.getTypeChain(type, opt_node.children[i], opt_chain);
      if (retVal) {
        return retVal;
      }
    }
  }

  opt_chain.pop();
};
