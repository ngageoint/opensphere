goog.declareModuleId('os.ui.menu.spatial');

import Feature from 'ol/src/Feature.js';
import Polygon from 'ol/src/geom/Polygon.js';

import EventType from '../../action/eventtype.js';
import AreaToggle from '../../command/areatogglecmd.js';
import CommandProcessor from '../../command/commandprocessor.js';
import SequenceCommand from '../../command/sequencecommand.js';
import RecordField from '../../data/recordfield.js';
import * as dispatcher from '../../dispatcher.js';
import PayloadEvent from '../../events/payloadevent.js';
import {getSource} from '../../feature/feature.js';
import {filterFalsey} from '../../fn/fn.js';
import {isGeometryPolygonal, isGeometryRectangular} from '../../geo/geo.js';
import {normalizeRings} from '../../geo/geo2.js';
import osImplements from '../../implements.js';
import {ORIGINAL_GEOM_FIELD} from '../../interpolate.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {ROOT} from '../../os.js';
import BaseAreaManager from '../../query/baseareamanager.js';
import {getAreaManager, getQueryManager} from '../../query/queryinstance.js';
import * as MergeAreasUI from '../../query/ui/mergeareas.js';
import {supportsGeoSearch} from '../../search/search.js';
import SearchEventType from '../../search/searcheventtype.js';
import SearchManager from '../../search/searchmanager.js';
import IModifiableSource from '../../source/imodifiablesource.js';
import ActionEventType from '../action/actioneventtype.js';
import * as AreaExportUI from '../ex/areaexportdialog.js';
import launchMultiFeatureInfo from '../feature/launchmultifeatureinfo.js';
import Module from '../module.js';
import AreaAdd from '../query/cmd/areaaddcmd.js';
import AreaRemove from '../query/cmd/arearemovecmd.js';
import * as ModifyAreaUI from '../query/modifyarea.js';
import {EDIT_WIN_LABEL, SAVE_WIN_LABEL} from '../query/query.js';
import * as osWindow from '../window.js';
import MenuItem from './menuitem.js';
import MenuItemType from './menuitemtype.js';
import SpatialMenu from './spatialmenu.js';

const googDispose = goog.require('goog.dispose');
const {caseInsensitiveCompare, toTitleCase} = goog.require('goog.string');

const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');


/**
 * Default groups in the spatial menu.
 * @enum {string}
 */
export const Group = {
  QUERY: 'Query',
  EXCLUDE: 'Exclude',
  FEATURES: 'Features',
  TOOLS: 'Tools',
  AREA: 'Area'
};

/**
 * @type {SpatialMenu|undefined}
 */
let MENU = undefined;

/**
 * Get the menu.
 * @return {SpatialMenu|undefined}
 */
export const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {SpatialMenu|undefined} menu The menu.
 */
export const setMenu = (menu) => {
  MENU = menu;
};

/**
 * Set up the menu.
 */
export const setup = function() {
  var menu = MENU;
  if (!menu) {
    menu = MENU = new SpatialMenu(new MenuItem({
      type: MenuItemType.ROOT,
      beforeRender: updateTemporaryItems,
      children: [{
        label: Group.QUERY,
        type: MenuItemType.GROUP,
        sort: 10,
        children: [{
          label: 'Load',
          eventType: EventType.LOAD,
          tooltip: 'Clear queries, then query for this area for all layers',
          icons: ['<i class="fa fa-fw fa-circle-o"></i>'],
          sort: 0,
          beforeRender: visibleIfPolygonal
        }, {
          label: 'Add',
          eventType: EventType.ADD,
          tooltip: 'Add a query for this area for all layers',
          icons: ['<i class="fa fa-fw fa-plus-circle"></i>'],
          sort: 1,
          beforeRender: visibleIfPolygonal
        }]
      }, {
        label: Group.EXCLUDE,
        type: MenuItemType.GROUP,
        sort: 20,
        children: [{
          label: 'Set',
          eventType: EventType.EXCLUDE,
          tooltip: 'Clear exclusions, then add an exclusion area for all layers',
          icons: ['<i class="fa fa-fw fa-ban"></i>'],
          sort: 0,
          beforeRender: visibleIfPolygonal
        }, {
          label: 'Add',
          eventType: EventType.ADD_EXCLUDE,
          tooltip: 'Add an exclusion area for all layers',
          icons: ['<i class="fa fa-fw fa-minus-circle"></i>'],
          sort: 1,
          beforeRender: visibleIfPolygonal
        }]
      }, {
        label: Group.FEATURES,
        type: MenuItemType.GROUP,
        sort: 30,
        children: [{
          label: 'Feature Info',
          eventType: EventType.FEATURE_INFO,
          tooltip: 'Show detailed metadata for the feature',
          icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
          sort: 10,
          beforeRender: visibleIfInLayer
        }, {
          label: 'Select',
          eventType: EventType.SELECT,
          tooltip: 'Select features in this area',
          icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
          sort: 20,
          beforeRender: visibleIfPolygonal
        }, {
          label: 'Select Exclusive',
          eventType: EventType.SELECT_EXCLUSIVE,
          tooltip: 'Select only features in this area, deselecting features outside of the area',
          icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
          sort: 30,
          beforeRender: visibleIfPolygonal
        }, {
          label: 'Deselect',
          eventType: EventType.DESELECT,
          tooltip: 'Deselect features in this area',
          icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
          sort: 40,
          beforeRender: visibleIfPolygonal
        }, {
          label: 'Remove Features in Area',
          eventType: EventType.REMOVE_FEATURES,
          tooltip: 'Remove features in this area from the map',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          sort: 50,
          beforeRender: visibleIfPolygonal
        }, {
          label: 'Remove',
          tooltip: 'Remove the feature from the layer',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          sort: 60,
          handler: removeItems,
          beforeRender: visibleIfInLayer
        }]
      }, {
        label: Group.TOOLS,
        type: MenuItemType.GROUP,
        sort: 40,
        children: [{
          label: 'Zoom',
          eventType: ActionEventType.ZOOM,
          tooltip: 'Zoom the map to the feature(s)',
          icons: ['<i class="fa fa-fw fa-crop"></i>']
        }, {
          label: 'Modify Geometry...',
          eventType: EventType.MODIFY_AREA,
          tooltip: 'Modify the area',
          icons: ['<i class="fa fa-fw fa-edit"></i>'],
          beforeRender: visibleIfCanModifyGeometry
        }]
      }, {
        label: Group.AREA,
        type: MenuItemType.GROUP,
        sort: 50,
        children: [{
          label: SAVE_WIN_LABEL,
          eventType: EventType.SAVE,
          tooltip: 'Save the area for future use',
          icons: ['<i class="fa fa-fw fa-save"></i>'],
          sort: 10,
          beforeRender: visibleIfCanSave
        }, {
          label: EDIT_WIN_LABEL,
          eventType: EventType.EDIT,
          tooltip: 'Edit area information such as title/description',
          icons: ['<i class="fa fa-fw fa-pencil"></i>'],
          sort: 20,
          beforeRender: visibleIfInAreaManager
        }, {
          label: 'Enable Area',
          eventType: EventType.ENABLE,
          tooltip: 'Enable the area',
          icons: ['<i class="fa fa-fw fa-check-square-o"></i>'],
          sort: 30,
          beforeRender: visibleIfNotShown
        }, {
          label: 'Disable Area',
          eventType: EventType.DISABLE,
          tooltip: 'Disable the area',
          icons: ['<i class="fa fa-fw fa-square-o"></i>'],
          sort: 40,
          beforeRender: visibleIfShown
        }, {
          label: 'Merge...',
          eventType: EventType.MERGE_AREAS,
          tooltip: 'Merge selected areas into a new area',
          icons: ['<i class="fa fa-fw fa-link"></i>'],
          sort: 60,
          beforeRender: visibleIfMultiplePolygonal
        }, {
          label: 'Remove Area',
          eventType: EventType.REMOVE_AREA,
          tooltip: 'Remove the area',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          sort: 70,
          beforeRender: visibleIfInAreaManager
        }, {
          label: 'Export...',
          eventType: EventType.EXPORT,
          tooltip: 'Export the area',
          icons: ['<i class="fa fa-fw fa-download"></i>'],
          sort: 80,
          beforeRender: visibleIfInAreaManager
        }, {
          eventType: EventType.SEARCH_AREA,
          label: 'Search Area...',
          tooltip: 'Searches for available data in the area',
          icons: ['<i class="fa fa-fw fa-search"></i>'],
          beforeRender: visibleIfSearchable,
          handler: searchArea,
          sort: 1000
        }]
      }]
    }));

    menu.listen(EventType.LOAD, onMenuEvent);
    menu.listen(EventType.ADD, onMenuEvent);
    menu.listen(EventType.EXCLUDE, onMenuEvent);
    menu.listen(EventType.ADD_EXCLUDE, onMenuEvent);

    menu.listen(EventType.FEATURE_INFO, onMenuEvent);

    menu.listen(EventType.SAVE, onMenuEvent);
    menu.listen(EventType.EDIT, onMenuEvent);
    menu.listen(EventType.ENABLE, onMenuEvent);
    menu.listen(EventType.DISABLE, onMenuEvent);
    menu.listen(EventType.REMOVE_AREA, onMenuEvent);
    menu.listen(EventType.MODIFY_AREA, onMenuEvent);
    menu.listen(EventType.MERGE_AREAS, onMenuEvent);
    menu.listen(EventType.EXPORT, onMenuEvent);
  }
};

/**
 * Dispose the menu.
 */
export const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Get geometries from the menu context object(s).
 *
 * @param {Object|undefined} context The menu context.
 * @return {!Array<!Geometry>}
 */
export const getGeometriesFromContext = function(context) {
  if (context) {
    var list = !Array.isArray(context) ? [context] : context;
    var geometries = list.map(function(item) {
      var geometry = /** @type {Geometry|undefined} */ (item.geometry);
      if (!geometry) {
        var feature = /** @type {Feature} */ (item.feature);
        if (feature) {
          geometry = feature.getGeometry();
        }
      }

      return geometry;
    }).filter(filterFalsey);

    if (geometries.length) {
      return geometries;
    }
  }

  return [];
};

/**
 * Get features from the menu context object(s).
 *
 * @param {Object|undefined} context The menu context.
 * @return {!Array<Feature>}
 */
export const getFeaturesFromContext = function(context) {
  if (context) {
    var list = !Array.isArray(context) ? [context] : context;
    var features = list.map(function(item) {
      return /** @type {Feature} */ (item.feature);
    }).filter(filterFalsey);

    if (features.length) {
      return features;
    }
  }

  return [];
};

/**
 * Test if all features are in the area manager.
 *
 * @param {!Array<Feature>} features The features
 * @return {boolean} If all features are in the area manager
 */
export const featuresInAreaManager = function(features) {
  if (features.length > 0) {
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];
      if (!feature || !getAreaManager().get(feature)) {
        // if at least one feature is not in the area manager, return false
        return false;
      }
    }

    // all features are in the area manager
    return true;
  }

  // no features, so not in the area manager
  return false;
};

/**
 * If the context has multiple items.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
export const hasMultiple = function(context) {
  return !!(context && context.length > 1);
};

/**
 * If the context has a single item.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
export const hasSingle = function(context) {
  return !!(context && (context.length === 1 || !Array.isArray(context)));
};

/**
 * If all items in the context are in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
export const inAreaManager = function(context) {
  if (!isPolygonal(context)) {
    return false;
  }

  var features = getFeaturesFromContext(context);
  return featuresInAreaManager(features);
};

/**
 * Test if all objects in the context have polygonal geometries.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean} If all objects have a polygonal geometry.
 */
export const isPolygonal = function(context) {
  var geometries = getGeometriesFromContext(context);
  if (geometries.length) {
    for (var i = 0; i < geometries.length; i++) {
      if (!isGeometryPolygonal(geometries[i])) {
        return false;
      }
    }

    return true;
  }

  return false;
};

/**
 * Shows a menu item if the context has multiple items.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfMultiplePolygonal = function(context) {
  this.visible = hasMultiple(context) && isPolygonal(context);
};

/**
 * Shows a menu item if the context is polygonal.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfPolygonal = function(context) {
  this.visible = isPolygonal(context);
};

/**
 * Shows a menu item if the context is in a layer.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfInLayer = function(context) {
  this.visible = isInLayer(context);
};

/**
 * @param {Object|undefined} context The menu context
 * @return {boolean}
 */
export const isInLayer = function(context) {
  if (Array.isArray(context)) {
    for (var i = 0, n = context.length; i < n; i++) {
      if (!isInLayer(context[i])) {
        return false;
      }
    }
    return true;
  } else {
    var am = getAreaManager();
    return !!context && !!context.feature && !!context.layer && !am.contains(context.feature);
  }
};

/**
 * @param {MenuEvent<Object|undefined>} evt The menu event
 */
export const removeItems = function(evt) {
  var context = evt.getContext();
  if (!Array.isArray(context)) {
    context = [context];
  }

  context.forEach(function(c) {
    if (c.layer) {
      var source = c.layer.getSource();
      if (source) {
        source.removeFeature(c.feature);
      }
    }
  });
};

/**
 * Shows a menu item if the context is in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfInAreaManager = function(context) {
  this.visible = inAreaManager(context);
};

/**
 * Shows a menu item if the context is in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanModifyGeometry = function(context) {
  let supportsModify = false;
  const features = getFeaturesFromContext(context);
  const am = getAreaManager();

  if (features.length == 1) {
    const feature = features[0];
    if (feature) {
      const source = getSource(feature);
      const geometry = /** @type {!Geometry} */ (feature.get(ORIGINAL_GEOM_FIELD) ||
          feature.getGeometry());

      if (geometry && osImplements(source, IModifiableSource.ID)) {
        supportsModify = /** @type {IModifiableSource} */ (source).supportsModify();
      } else if (!hasSingle(context) || !isPolygonal(context)) {
        supportsModify = false;
      } else {
        const inAreaManager = am.contains(features[0]);
        let target = 2;

        if (features.length && !inAreaManager) {
          target = 1;
        }

        supportsModify = am.getAll().length >= target || inAreaManager;
      }
    }
  }

  this.visible = supportsModify;
};

/**
 * Shows a menu item if the context is polygonal and not in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanSave = function(context) {
  this.visible = isPolygonal(context) && !inAreaManager(context);
};

/**
 * Shows a menu item if the context is a shown area.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfShown = function(context) {
  var features = getFeaturesFromContext(context);
  if (!features.length) {
    this.visible = false;
    return;
  }

  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];

    if (!getAreaManager().get(feature) || feature.get('shown') === false) {
      this.visible = false;
      return;
    }
  }

  this.visible = true;
};

/**
 * Shows a menu item if the context is a hidden area.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfNotShown = function(context) {
  var features = getFeaturesFromContext(context);
  if (!features.length) {
    this.visible = false;
    return;
  }

  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];

    if (!getAreaManager().get(feature) || feature.get('shown')) {
      this.visible = false;
      return;
    }
  }

  this.visible = true;
};

/**
 * Handle spatial menu event.
 *
 * @param {MenuEvent} event The menu event.
 * @param {Array<string>=} opt_layerIds - apply to only these ids
 */
export const onMenuEvent = function(event, opt_layerIds) {
  var context = event.getContext();
  if (context) {
    if (!Array.isArray(context)) {
      context = [context];
    }

    var cmds = [];
    var features = [];
    for (var i = 0, n = context.length; i < n; i++) {
      var feature = /** @type {Feature} */ (context[i].feature);
      var geom = /** @type {Geometry} */ (context[i].geometry);
      if (geom) {
        var am = getAreaManager();
        var qm = getQueryManager();
        feature = feature || new Feature(geom);

        switch (event.type) {
          case EventType.LOAD:
          case EventType.ADD:
            features.push(feature);
            cmds.push(new AreaAdd(
                feature, true, false, event.type === EventType.ADD, opt_layerIds));
            break;
          case EventType.EXCLUDE:
          case EventType.ADD_EXCLUDE:
            features.push(feature);
            cmds.push(new AreaAdd(feature, false, true,
                event.type === EventType.ADD_EXCLUDE, opt_layerIds));
            break;
          case EventType.SAVE:
          case EventType.EDIT:
            var columns;
            var source = getSource(feature);
            if (source) {
              // a feature in a source was clicked - clone it and provide the columns to the save window
              columns = source.getColumns();
              feature = /** @type {!Feature} */ (feature.clone());
              feature.set(RecordField.SOURCE_NAME, source.getTitle(), true);
            }
            BaseAreaManager.save(feature, columns);
            break;
          case EventType.ENABLE:
          case EventType.DISABLE:
            cmds.push(new AreaToggle(feature, event.type === EventType.ENABLE));
            break;
          case EventType.REMOVE_AREA:
            cmds.push(new AreaRemove(feature));
            break;
          case EventType.MODIFY_AREA:
            var conf = {};
            var source = getSource(feature);

            if (source) {
              // the feature is in a source, so treat it as the feature to modify
              conf['feature'] = feature;
            } else if (am.get(feature)) {
              // the feature is in area manager, so we will treat it as the area to modify
              conf['feature'] = feature;
            } else {
              // the feature was just drawn, so we will treat it as the targetArea
              conf['targetArea'] = feature;
              conf['op'] = ModifyAreaUI.ModifyOp.ADD;
            }

            ModifyAreaUI.launchModifyArea(conf);
            break;
          case EventType.MERGE_AREAS:
          case EventType.EXPORT:
          case EventType.FEATURE_INFO:
            features.push(feature);
            break;
          default:
            break;
        }
      }
    }
  }

  if (features.length) {
    switch (event.type) {
      case EventType.LOAD:
      case EventType.ADD:
      case EventType.EXCLUDE:
      case EventType.ADD_EXCLUDE:
        for (i = 0, n = features.length; i < n; i++) {
          var area = am.get(features[i]);
          if (area && !area.get('shown')) {
            cmds.push(new AreaToggle(area, true));
          }
        }
        break;
      case EventType.FEATURE_INFO:
        var layer = /** @type {ILayer|undefined} */ (context[0].layer);
        var title = layer ? layer.getTitle() : undefined;
        launchMultiFeatureInfo(features, title);
        break;
      default:
        break;
    }

    if (event.type === EventType.MERGE_AREAS) {
      BaseAreaManager.merge(/** @type {!Array<!Feature>} */ (features),
          MergeAreasUI.directiveTag);
    } else if (event.type === EventType.EXPORT) {
      // I don't really have any idea why this one type doesn't operate with the menu properly without these
      event.preventDefault();
      event.stopPropagation();
      AreaExportUI.Controller.start(/** @type {Array<Feature>} */ (features));
    } else if (event.type === EventType.LOAD || event.type === EventType.EXCLUDE) {
      var areas = am.getAll();

      for (i = 0, n = areas.length; i < n; i++) {
        area = areas[i];

        if (area && area.get('shown')) {
          // Dont hide the feature we are trying to load
          if (event.type === EventType.LOAD && qm.isInclusion(area) && features.indexOf(area) === -1) {
            cmds.push(new AreaToggle(area, false));
          }

          if (event.type === EventType.EXCLUDE && qm.isExclusion(area) && area != feature) {
            cmds.push(new AreaToggle(area, false));
          }
        }
      }
    }
  }

  if (cmds.length) {
    if (cmds.length === 1) {
      CommandProcessor.getInstance().addCommand(cmds[0]);
    } else {
      var seq = new SequenceCommand();
      seq.setCommands(cmds);
      seq.title = cmds[cmds.length - 1].title.replace('Add', 'Set');
      CommandProcessor.getInstance().addCommand(seq);
    }
  }
};

/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 *
 * @param {?string=} opt_areaId - set the enabled state based on this area
 * @return {Array}
 */
export const getLayers = function(opt_areaId) {
  var set = getQueryManager().getLayerSet();
  var layers = [];

  // check to see if this area is applied to all layers first
  var enabled = true;
  if (opt_areaId !== undefined) {
    enabled = getQueryManager().getEntries('*', opt_areaId, null).length > 0;
    if (enabled) {
      // dont lookup for individual layers if it applys to all
      opt_areaId = undefined;
    }
  }
  for (var key in set) {
    var l = /** @type {ILayer} */ (getMapContainer().getLayer(key));
    try {
      if (l) {
        if (opt_areaId !== undefined) {
          enabled = getQueryManager().getEntries(key, opt_areaId, null).length > 0;
        }
        layers.push({
          'id': key,
          'label': set[key],
          'type': l.getExplicitType() ? l.getExplicitType() : 'other',
          'enabled': enabled
        });
      }
    } catch (e) {
    }
  }

  layers.sort(function(a, b) {
    return caseInsensitiveCompare(a['label'], b['label']);
  });
  return layers;
};

/**
 * Update temporary menu items.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
export const updateTemporaryItems = function(context) {
  var queryGroup = this.find(Group.QUERY);
  var excludeGroup = this.find(Group.EXCLUDE);

  // don't do anything if the groups aren't present
  if (!queryGroup || !excludeGroup) {
    return;
  }

  // remove existing menu items
  while (queryGroup.removeChild('Choose Layers')) {
    continue;
  }

  while (excludeGroup.removeChild('Choose Layers')) {
    continue;
  }

  if (!isPolygonal(context)) {
    return;
  }

  var layers = getLayers();

  var types = {};
  var numTypes = 0;
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    var type = layer['type'];

    if (!types[type]) {
      types[type] = 0;
      numTypes++;
    }
    types[type]++;
  }

  if (numTypes > 0 && queryGroup && excludeGroup) {
    addLayerSubMenu(queryGroup, EventType.ADD, types);
    addLayerSubMenu(excludeGroup, EventType.ADD_EXCLUDE, types);
  }
};

/**
 * Add sub menu to query/exclude area by layer type.
 *
 * @param {!MenuItem} group The menu group to add the submenu to.
 * @param {string} eventType The base event type.
 * @param {!Object<string, number>} types Map of layer type to count.
 */
export const addLayerSubMenu = function(group, eventType, types) {
  var subGroup = group.addChild({
    label: 'Choose Layers',
    type: MenuItemType.SUBMENU,
    sort: 10
  });

  var layerGroup = subGroup.addChild({
    type: MenuItemType.GROUP,
    label: 'By Layer Type',
    sort: 0
  });

  var idx = 0;
  for (var key in types) {
    var typeTitle = toTitleCase(key);
    var count = types[key];

    layerGroup.addChild({
      label: typeTitle + ' (' + count + ')',
      eventType: eventType + ':' + key,
      handler: onLayerPicker,
      tooltip: group.label + ' area for layes of type (' + typeTitle + ')',
      sort: idx++
    });
  }

  subGroup.addChild({
    label: 'Custom...',
    eventType: eventType + ':' + EventType.CUSTOM,
    handler: onLayerPicker,
    sort: idx
  });
};

/**
 * Shows the Search Area option if there available geosearches and the area is polygonal.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfSearchable = function(context) {
  // check if there are any registered geosearches
  var searches = SearchManager.getInstance().getRegisteredSearches();
  var some = searches.some((s) => s && supportsGeoSearch(s));

  this.visible = some && isPolygonal(context);
};

/**
 * Initiates a geosearch in a selected area.
 *
 * @param {!MenuEvent} event The menu event.
 */
const searchArea = function(event) {
  var context = /** @type {Array<Object>} */ (event.getContext());

  if (context) {
    if (!Array.isArray(context)) {
      context = [context];
    }

    // first check if there are features to add
    var features = getFeaturesFromContext(context);
    var geometry = getSearchGeometry(features);

    if (geometry) {
      // disable every other search
      var searches = SearchManager.getInstance().getRegisteredSearches();
      var geosearch = [];
      var some = false;

      searches.forEach(function(search) {
        if (search && supportsGeoSearch(search)) {
          geosearch.push(search);
          some = search.isEnabled() || some;
        } else {
          // disable non-geosearch searches
          search.setEnabled(false);
        }
      });

      if (!some) {
        // if no geosearches were enabled, enable them all (otherwise do nothing)
        geosearch.forEach(function(search) {
          search.setEnabled(true);
        });
      }

      // fire an event to kick off the filtered layer lookup
      var searchEvent = new PayloadEvent(SearchEventType.GEO_SEARCH_CHANGE, geometry);
      dispatcher.getInstance().dispatchEvent(searchEvent);
    }
  }
};

/**
 * Gets a shape query from a set of features.
 * @param {Array<Feature>} features The features to get a shape query from.
 * @return {Geometry|undefined} The shape query.
 */
export const getSearchGeometry = function(features) {
  var geometry;

  if (features && features.length > 0) {
    var originalGeometry = /** @type {Geometry} */ (features[0].get(ORIGINAL_GEOM_FIELD));
    geometry = features[0].getGeometry();

    if (geometry instanceof Polygon && originalGeometry instanceof Polygon) {
      var coordinates = geometry.getCoordinates().slice();
      normalizeRings(coordinates);

      if (isGeometryRectangular(originalGeometry)) {
        // use the original geometry as it will be simpler and faster
        geometry = originalGeometry;
      }
    }
  }

  return geometry;
};


/**
 * Launch the layer picker.
 *
 * @param {MenuEvent} event The menu event.
 */
const onLayerPicker = function(event) {
  var data = event.type.split(':');
  var action = data[0];
  var type = data[1];
  var layers = null;

  var context = event.getContext();
  if (context && context['feature']) {
    var feature = /** @type {Feature} */ (context['feature']);
    layers = getLayers(/** @type {string} */ (feature.getId()));
  } else {
    layers = getLayers();
  }

  // Gather all the layerIds for this type
  if (type == EventType.CUSTOM) {
    // What cation should this take?
    var scopeOptions = {
      event: event,
      action: action,
      layers: layers
    };

    var windowOptions = {
      'id': 'spatiallayerchooser',
      'label': 'Choose Layers',
      'icon': 'fa fa-layer-group',
      'x': 'center',
      'y': 'center',
      'width': '350',
      'height': '500',
      'min-width': '300',
      'max-width': '1000',
      'min-height': '250',
      'max-height': '1000',
      'modal': 'true',
      'show-close': 'true'
    };

    var template = '<layerchooser class="flex-fill d-flex"></layerchooser>';
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  } else {
    var layerIds = [];
    layers.forEach(function(layer) {
      if (layer['type'] == type) {
        layerIds.push(layer['id']);
      }
    });
    // Set the event type
    event.type = action;
    onMenuEvent(event, layerIds);
  }
};

/**
 * The layerChooser directive
 *
 * @return {angular.Directive}
 */
const layerChooserDirective = function() {
  return {
    restrict: 'E',
    templateUrl: ROOT + 'views/action/layerchooser.html',
    controller: LayerChooserCtrl,
    controllerAs: 'layerchooser'
  };
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const layerChooserDirectiveTag = 'layerchooser';

/**
 * Add the directive to the module.
 */
Module.directive(layerChooserDirectiveTag, [layerChooserDirective]);

/**
 * LayerChooserCtrl function for the layerChooser directive
 */
class LayerChooserCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {?angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @return {boolean}
   * @export
   */
  valid() {
    var found = this.scope_['layers'].find((layer) => layer['enabled']);

    // Switch the type to the correct action
    return !found;
  }

  /**
   * Fire the confirmation callback and close the window.
   *
   * @export
   */
  accept() {
    // Switch the type to the correct action
    this.scope_['event']['type'] = this.scope_['action'];

    // Create an array of enabled layerids
    var layerIds = [];
    this.scope_['layers'].forEach(function(layer) {
      if (layer.enabled) {
        layerIds.push(layer.id);
      }
    });
    onMenuEvent(this.scope_['event'], layerIds);
    this.close();
  }

  /**
   * Close the window.
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }
}
