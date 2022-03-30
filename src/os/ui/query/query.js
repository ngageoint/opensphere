goog.declareModuleId('os.ui.query');

import RenameMapping from '../../im/mapping/renamemapping.js';
import StaticMapping from '../../im/mapping/staticmapping.js';
import {ORIGINAL_GEOM_FIELD, METHOD_FIELD} from '../../interpolate.js';

const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');


/**
 * Identifier used for all layers.
 * @type {string}
 */
export const ALL_ID = 'all';

/**
 * Label used for the save area dialog. Please update e2e tests if you change this!
 * @type {string}
 */
export const SAVE_WIN_LABEL = 'Save Area...';

/**
 * Label used for the edit area dialog. Please update e2e tests if you change this!
 * @type {string}
 */
export const EDIT_WIN_LABEL = 'Edit Area Details...';

/**
 * @type {!Object<string, string>}
 */
export const AREA_IMPORT_HELP = {
  'merge': 'Combines all imported areas into a single area.',
  'title': 'Custom title given to all imported areas.',
  'titleColumn': 'Column used to apply titles to all imported areas. If an imported item doesn\'t have this field ' +
      'defined, a generic title will be given. You may also choose to apply a custom title to imported areas.',
  'description': 'Description applied to all imported areas.',
  'descColumn': 'Column used to apply descriptions to all imported areas. If an imported item doesn\'t have this ' +
      'field defined, the description will be left blank. You may also choose to apply a custom description to ' +
      'imported areas.',
  'tags': 'Comma-delimited list of tags to apply to all imported areas. Tags can be used to group or search areas ' +
      'in the Areas tab of the Layers window.',
  'tagsColumn': 'Column used to apply tags to all imported areas. Tags can be used to group or search areas ' +
      'in the Areas tab of the Layers window.  If an imported item doesn\'t have this field defined, the tags will ' +
      'be left blank. You may also choose to provide your own custom tags.'
};

/**
 * To prevent import errors, only accept these keys for features on import
 * @type {Array}
 */
export const featureKeys = ['title', 'name', 'description', 'tags', 'geometry', ORIGINAL_GEOM_FIELD, METHOD_FIELD];

/**
 * Apply query mappings to a feature and make sure a title is set.
 *
 * @param {!Feature} feature The feature
 * @param {!Array<!IMapping>} mappings The mappings
 */
export const applyMappings = function(feature, mappings) {
  mappings.forEach(function(m) {
    m.execute(feature);

    // make sure each area has a title!
    if (m instanceof RenameMapping && m.toField == 'title' && !feature.get('title')) {
      feature.set('title', 'No ' + m.field);
    }
  });

  // title is preferred, so if it's defined we should make sure the name field is removed to avoid confusion
  if (feature.get('title')) {
    feature.set('name', undefined);
  }
};

/**
 * Create mappings from an area config.
 *
 * @param {Object} config
 * @return {!Array<!IMapping>}
 */
export const createMappingsFromConfig = function(config) {
  var mappings = [];
  var mapping;

  if (config) {
    if (config['titleColumn'] && config['titleColumn']['field']) {
      // keep the original column in case the same column is used on multiple mappings
      mapping = new RenameMapping();
      mapping.keepOriginal = true;
      mapping.toField = 'title';
      mapping.field = config['titleColumn']['field'];

      mappings.push(mapping);
    } else if (config['title']) {
      mapping = new StaticMapping();
      mapping.field = 'title';
      mapping.value = config['title'] || 'No Title Provided';

      mappings.push(mapping);
    }

    if (config['descColumn'] && config['descColumn']['field']) {
      // keep the original column in case the same column is used on multiple mappings
      mapping = new RenameMapping();
      mapping.keepOriginal = true;
      mapping.toField = 'description';
      mapping.field = config['descColumn']['field'];

      mappings.push(mapping);
    } else if (config['description']) {
      mapping = new StaticMapping();
      mapping.field = 'description';
      mapping.value = config['description'];

      mappings.push(mapping);
    }

    if (config['tagsColumn'] && config['tagsColumn']['field']) {
      // keep the original column in case the same column is used on multiple mappings
      mapping = new RenameMapping();
      mapping.keepOriginal = true;
      mapping.toField = 'tags';
      mapping.field = config['tagsColumn']['field'];

      mappings.push(mapping);
    } else if (config['tags']) {
      mapping = new StaticMapping();
      mapping.field = 'tags';
      mapping.value = config['tags'];

      mappings.push(mapping);
    }
  }

  return mappings;
};
