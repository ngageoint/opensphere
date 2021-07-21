goog.module('os.filter.default');
goog.module.declareLegacyNamespace();

/**
 * The Font Awesome icon for default filters.
 * @type {string}
 */
const FA_ICON = 'fa-shield';

/**
 * Base settings key for default filters.
 * @type {string}
 */
const ICON = '<i class="fa ' + FA_ICON + '" ' +
    'title="This is an application default filter and cannot be modified"></i>';

exports = {
  FA_ICON,
  ICON
};
