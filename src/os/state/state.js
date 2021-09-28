goog.declareModuleId('os.state');

import CommandProcessor from '../command/commandprocessor.js';
import DataManager from '../data/datamanager.js';
import BaseProvider from '../ui/data/baseprovider.js';
import DescriptorProvider from '../ui/data/descriptorprovider.js';
import Tag from './tag.js';

const {defaultCompare} = goog.require('goog.array');

const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');
const {default: IState} = goog.requireType('os.state.IState');


/**
 * Separator for constructing state id's
 * @type {string}
 */
export const ID_SEPARATOR = '#';

/**
 * Serializes an element.
 *
 * @param {Element} el The element
 * @return {string} Serialized element
 */
export const serializeTag = function(el) {
  var s = el.localName;
  var type = el.getAttribute(Tag.TYPE);
  if (type) {
    s += ID_SEPARATOR + type;
  }

  return s;
};

/**
 * Creates a string identifier for a state. This syncs up with {@link os.state.serializeTag} so do not change this
 * without updating that function as well!
 *
 * @param {IState} state The state
 * @return {string} Serialized element
 */
export const stateToString = function(state) {
  var s = state.getRootName();
  var attrs = state.getRootAttrs();
  if (attrs && attrs[Tag.TYPE]) {
    s += ID_SEPARATOR + attrs[Tag.TYPE];
  }

  return s;
};

/**
 * Compares states by priority.
 *
 * @param {IState} a A state
 * @param {IState} b Another state
 * @return {number} The comparison
 */
export const priorityCompare = function(a, b) {
  // a/b are flipped to sort in descending priority order
  return defaultCompare(b.getPriority(), a.getPriority());
};

/**
 * Compares states by title.
 *
 * @param {IState} a A state
 * @param {IState} b Another state
 * @return {number} The comparison
 */
export const titleCompare = function(a, b) {
  return defaultCompare(a.getTitle(), b.getTitle());
};

/**
 * Compares states by whether or not they are supported
 *
 * @param {IState} a A state
 * @param {IState} b Another state
 * @return {number} The comparison
 */
export const supportCompare = function(a, b) {
  if (a.getSupported() && !b.getSupported()) {
    return -1;
  }
  if (!a.getSupported() && b.getSupported()) {
    return 1;
  }
  return 0;
};

/**
 * @param {?Array<!IDataDescriptor>} list The list of state descriptors
 */
export const deleteStates = function(list) {
  var dataManager = DataManager.getInstance();
  if (list) {
    var i = list.length;
    while (i--) {
      // deactivate and remove the state without putting a command on the stack
      list[i].setActive(false);
      // If its a local state file, remove it.
      if (list[i].getDescriptorType() === 'state') {
        // remove the descriptor from the data manager
        dataManager.removeDescriptor(list[i]);
        var provider = /** @type {DescriptorProvider} */
            (dataManager.getProvider(list[i].getId()));
        if (provider && provider instanceof DescriptorProvider) {
          // remove the descriptor from the provider
          provider.removeDescriptor(list[i], true);
        }

        // since the file has been removed from indexedDB, we can no longer depend on anything in the command
        // history since it may reference a file we can no longer access, so clear it
        setTimeout(function() {
          var cp = CommandProcessor.getInstance();
          cp.clearHistory();
        }, 1);
      }
    }
  }
};

/**
 * Determine if a layer is a state file
 * @param {string} id
 * @return {boolean}
 */
export const isStateFile = function(id) {
  var words = id && id.split(BaseProvider.ID_DELIMITER);
  return words ? words[0] === 'state' || words[0] === 'pubstate' : false;
};
