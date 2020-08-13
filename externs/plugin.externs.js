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
 *  label: (string|undefined),
 *  text: (string|undefined),
 *  icon: (string|undefined)
 * }}
 */
pluginx.areadata.ListUIOptions;


/**
 * @typedef {{
 *  id: (!string),
 *  type: (plugin.areadata.AreaImportType|undefined),
 *  clazz: (string|undefined),
 *  menuItemOptions: (os.ui.menu.MenuItemOptions|undefined),
 *  listUIOptions: (pluginx.areadata.ListUIOptions|undefined),
 *  ogcSettings: (osx.ogc.OGCSettings|undefined)
 * }}
 */
pluginx.areadata.AreaMenuItemOptions;
