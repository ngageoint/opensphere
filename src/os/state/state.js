goog.declareModuleId('os.state');

import {defaultSort} from '../array/array.js';
import CommandProcessor from '../command/commandprocessor.js';
import DataManager from '../data/datamanager.js';
import BaseProvider from '../ui/data/baseprovider.js';
import DescriptorProvider from '../ui/data/descriptorprovider.js';
import {hasUrlScheme} from '../url/url.js';
import Tag from './tag.js';

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
  return defaultSort(b.getPriority(), a.getPriority());
};

/**
 * Compares states by title.
 *
 * @param {IState} a A state
 * @param {IState} b Another state
 * @return {number} The comparison
 */
export const titleCompare = function(a, b) {
  return defaultSort(a.getTitle(), b.getTitle());
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

/**
 * Properties in layer options that may contain a URL used to load the layer.
 * @type {!Array<string>}
 */
const urlProperties = ['url', 'url2', 'urls'];

/**
 * Registers a property that will be tested from the layer's options to determine if it should be included in a state
 * file. The property value should be a URL or list of URL's, and the layer will be included if all defined URL's are
 * to a remote resource.
 * @param {string} prop The property.
 */
export const registerLayerStateUrlProperty = (prop) => {
  if (!urlProperties.includes(prop)) {
    urlProperties.push(prop);
  }
};

/**
 * Checks if a layer was loaded using only remote resources.
 *
 * @param {Object<string, *>} layerOptions The layer options.
 * @return {boolean} If the layer was loaded from the file system.
 * @protected
 */
export const isLayerRemote = (layerOptions) => {
  // Get all values, flatten in case any contain an array, and filter out falsey values.
  const definedUrls = urlProperties.map((prop) => layerOptions[prop]).flat().filter((url) => !!url);

  // Considered remote if at least one URL exists, and every defined URL has a remote scheme. Scheme-relative URL's
  // are generally discouraged and not considered.
  return definedUrls.length > 0 && definedUrls.every(hasUrlScheme);
};
