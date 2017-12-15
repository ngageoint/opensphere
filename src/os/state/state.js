goog.provide('os.state');
goog.provide('os.state.Tag');
goog.require('goog.array');
goog.require('os.state.IState');
goog.require('os.ui.data.DescriptorProvider');


/**
 * XML tags for time state
 * @enum {string}
 */
os.state.Tag = {
  DESCRIPTION: 'description',
  NAME: 'name',
  SOURCE: 'source',
  STATE: 'state',
  TAGS: 'tags',
  TITLE: 'title',
  TYPE: 'type',
  VERSION: 'version'
};


/**
 * Separator for constructing state id's
 * @type {string}
 * @const
 */
os.state.ID_SEPARATOR = '#';


/**
 * Serializes an element.
 * @param {Element} el The element
 * @return {string} Serialized element
 */
os.state.serializeTag = function(el) {
  var s = el.localName;
  var type = el.getAttribute(os.state.Tag.TYPE);
  if (type) {
    s += os.state.ID_SEPARATOR + type;
  }

  return s;
};


/**
 * Creates a string identifier for a state. This syncs up with {@link os.state.serializeTag} so do not change this
 * without updating that function as well!
 *
 * @param {os.state.IState} state The state
 * @return {string} Serialized element
 */
os.state.stateToString = function(state) {
  var s = state.getRootName();
  var attrs = state.getRootAttrs();
  if (attrs && attrs[os.state.Tag.TYPE]) {
    s += os.state.ID_SEPARATOR + attrs[os.state.Tag.TYPE];
  }

  return s;
};


/**
 * Compares states by priority.
 * @param {os.state.IState} a A state
 * @param {os.state.IState} b Another state
 * @return {number} The comparison
 */
os.state.priorityCompare = function(a, b) {
  // a/b are flipped to sort in descending priority order
  return goog.array.defaultCompare(b.getPriority(), a.getPriority());
};


/**
 * Compares states by title.
 * @param {os.state.IState} a A state
 * @param {os.state.IState} b Another state
 * @return {number} The comparison
 */
os.state.titleCompare = function(a, b) {
  return goog.array.defaultCompare(a.getTitle(), b.getTitle());
};


/**
 * @param {?Array<!os.data.IDataDescriptor>} list The list of state descriptors
 */
os.state.deleteStates = function(list) {
  var dataManager = os.dataManager;
  if (list) {
    var i = list.length;
    while (i--) {
      // deactivate and remove the state without putting a command on the stack
      list[i].setActive(false);
      // If its a local state file, remove it.
      if (list[i].descriptorType === 'state') {
        // remove the descriptor from the data manager
        dataManager.removeDescriptor(list[i]);
        var provider = /** @type {os.ui.data.DescriptorProvider} */
            (dataManager.getProvider(list[i].getDescriptorType()));
        if (provider && provider instanceof os.ui.data.DescriptorProvider) {
          // remove the descriptor from the provider
          provider.removeDescriptor(list[i], true);
        }

        // since the file has been removed from indexedDB, we can no longer depend on anything in the command
        // history since it may reference a file we can no longer access, so clear it
        setTimeout(function() {
          var cp = os.command.CommandProcessor.getInstance();
          cp.clearHistory();
        }, 1);
      }
    }
  }
};
