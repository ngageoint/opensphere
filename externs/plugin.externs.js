/**
 * @fileoverview Closure compiler externs for plugins. Use this file to define types that need to be left uncompiled to
 *               avoid bracket notation and enforce type checking.
 *
 * @externs
 */


/**
 * @type {Object}
 */
var pluginx;


/**
 * Namespace.
 * @type {Object}
 */
pluginx.areadata;


/**
 * @typedef {{
 *  id: (!string),
 *  type: (string|undefined),
 *  clazzKey: (string|undefined),
 *  sort: (number|undefined),
 *  enabled: (boolean|undefined),
 *  menuItemOptions: (Object<string, *>|undefined),
 *  listUIOptions: (Object<string, *>|undefined),
 *  ogcSettings: (osx.ogc.OGCSettings|undefined)
 * }}
 */
pluginx.areadata.AreaMenuItemOptions;
