goog.provide('os.state.StateDescriptor');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.state.StateType');
goog.require('os.state.XMLStateOptions');
goog.require('os.style');
goog.require('os.ui.Icons');
goog.require('os.ui.state.AbstractStateDescriptor');



/**
 * Descriptor for state files.
 * @extends {os.ui.state.AbstractStateDescriptor}
 * @constructor
 */
os.state.StateDescriptor = function() {
  os.state.StateDescriptor.base(this, 'constructor');
  this.log = os.state.StateDescriptor.LOGGER_;
  this.stateType = os.state.StateType.OPENSPHERE;
};
goog.inherits(os.state.StateDescriptor, os.ui.state.AbstractStateDescriptor);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.StateDescriptor.LOGGER_ = goog.log.getLogger('os.state.StateDescriptor');


/**
 * @inheritDoc
 */
os.state.StateDescriptor.prototype.getIcons = function() {
  return os.ui.Icons.STATE;
};


/**
 * Creates a state descriptor from a file.
 * @param {!os.file.File} file The file
 * @return {!os.state.StateDescriptor} The descriptor
 */
os.state.StateDescriptor.createFromFile = function(file) {
  var descriptor = new os.state.StateDescriptor();
  descriptor.setColor(os.style.DEFAULT_LAYER_COLOR);
  descriptor.setUrl(file.getUrl());

  return descriptor;
};


/**
 * Updates an existing descriptor from a parser configuration.
 * @param {!os.state.StateDescriptor} descriptor
 * @param {!os.state.XMLStateOptions} options The save options
 */
os.state.StateDescriptor.updateFromOptions = function(descriptor, options) {
  descriptor.setTitle(options.title);
  descriptor.setDescription(options.description);
  descriptor.setTags(options.tags ? options.tags.split(/\s*,\s*/) : null);

  if (options.states) {
    var loadItems = [];
    for (var i = 0, n = options.states.length; i < n; i++) {
      var state = options.states[i];
      if (state.getEnabled()) {
        loadItems.push(state.toString());
      }
    }

    if (loadItems.length > 0) {
      descriptor.setLoadItems(loadItems);
    }
  }
};
