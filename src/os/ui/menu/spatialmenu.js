goog.provide('os.ui.menu.SpatialMenu');
goog.provide('os.ui.menu.spatial');

goog.require('ol.Feature');
goog.require('ol.array');
goog.require('os.action.EventType');
goog.require('os.array');
goog.require('os.command.AreaToggle');
goog.require('os.command.SequenceCommand');
goog.require('os.data.AreaNode');
goog.require('os.defines');
goog.require('os.events.PayloadEvent');
goog.require('os.fn');
goog.require('os.query.BaseAreaManager');
goog.require('os.query.ui.mergeAreasDirective');
goog.require('os.query.ui.modifyAreaDirective');
goog.require('os.ui.ex.AreaExportCtrl');
goog.require('os.ui.feature.featureInfoDirective');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.query');
goog.require('os.ui.query.cmd.AreaAdd');
goog.require('os.ui.query.cmd.AreaRemove');


/**
 * Spatial menu.
 *
 * @param {!os.ui.menu.MenuItem<T>} root The menu item data
 * @extends {os.ui.menu.Menu<T>}
 * @constructor
 * @template T
 */
os.ui.menu.SpatialMenu = function(root) {
  os.ui.menu.SpatialMenu.base(this, 'constructor', root);
};
goog.inherits(os.ui.menu.SpatialMenu, os.ui.menu.Menu);


/**
 * @inheritDoc
 */
os.ui.menu.SpatialMenu.prototype.open = function(context, position, opt_target) {
  if (goog.isArray(context)) {
    var container = os.MapContainer.getInstance();

    context = context.map(function(item) {
      var feature = null;
      if (item instanceof os.data.AreaNode) {
        feature = /** @type {os.data.AreaNode} */ (item).getArea();
      } else if (item instanceof os.data.DrawingFeatureNode) {
        feature = /** @type {os.data.DrawingFeatureNode} */ (item).getFeature();
      }

      if (feature) {
        return {
          feature: feature,
          geometry: feature.getGeometry(),
          layer: container.getLayer(/** @type {string} */ (feature.get(os.data.RecordField.SOURCE_ID))),
          map: container.getMap()
        };
      }

      return item;
    });

    if (!context.length) {
      context = undefined;
    } else if (context.length === 1) {
      context = context[0];
    }
  }

  // don't open the menu unless there is a context
  if (context) {
    os.ui.menu.SpatialMenu.base(this, 'open', context, position, opt_target);
  }
};


/**
 * Default groups in the spatial menu.
 * @enum {string}
 */
os.ui.menu.spatial.Group = {
  QUERY: 'Query',
  EXCLUDE: 'Exclude',
  FEATURES: 'Features',
  TOOLS: 'Tools',
  AREA: 'Area'
};


/**
 * @type {os.ui.menu.SpatialMenu|undefined}
 */
os.ui.menu.SPATIAL = undefined;


/**
 * Set up the menu.
 */
os.ui.menu.spatial.setup = function() {
  var menu = os.ui.menu.SPATIAL;
  if (!menu) {
    menu = os.ui.menu.SPATIAL = new os.ui.menu.SpatialMenu(new os.ui.menu.MenuItem({
      type: os.ui.menu.MenuItemType.ROOT,
      beforeRender: os.ui.menu.spatial.updateTemporaryItems,
      children: [{
        label: os.ui.menu.spatial.Group.QUERY,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 10,
        children: [{
          label: 'Load',
          eventType: os.action.EventType.LOAD,
          tooltip: 'Clear queries, then query for this area for all layers',
          icons: ['<i class="fa fa-fw fa-circle-o"></i>'],
          sort: 0,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }, {
          label: 'Add',
          eventType: os.action.EventType.ADD,
          tooltip: 'Add a query for this area for all layers',
          icons: ['<i class="fa fa-fw fa-plus-circle"></i>'],
          sort: 1,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }]
      }, {
        label: os.ui.menu.spatial.Group.EXCLUDE,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 20,
        children: [{
          label: 'Set',
          eventType: os.action.EventType.EXCLUDE,
          tooltip: 'Clear exclusions, then add an exclusion area for all layers',
          icons: ['<i class="fa fa-fw fa-ban"></i>'],
          sort: 0,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }, {
          label: 'Add',
          eventType: os.action.EventType.ADD_EXCLUDE,
          tooltip: 'Add an exclusion area for all layers',
          icons: ['<i class="fa fa-fw fa-minus-circle"></i>'],
          sort: 1,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }]
      }, {
        label: os.ui.menu.spatial.Group.FEATURES,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 30,
        children: [{
          label: 'Feature Info',
          eventType: os.action.EventType.FEATURE_INFO,
          tooltip: 'Show detailed metadata for the feature',
          icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
          sort: 10,
          beforeRender: os.ui.menu.spatial.visibleIfInLayer
        }, {
          label: 'Select',
          eventType: os.action.EventType.SELECT,
          tooltip: 'Select features in this area',
          icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
          sort: 20,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }, {
          label: 'Select Exclusive',
          eventType: os.action.EventType.SELECT_EXCLUSIVE,
          tooltip: 'Select only features in this area, deselecting features outside of the area',
          icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
          sort: 30,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }, {
          label: 'Deselect',
          eventType: os.action.EventType.DESELECT,
          tooltip: 'Deselect features in this area',
          icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
          sort: 40,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }, {
          label: 'Remove Features in Area',
          eventType: os.action.EventType.REMOVE_FEATURES,
          tooltip: 'Remove features in this area from the map',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          sort: 50,
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal
        }, {
          label: 'Remove',
          tooltip: 'Remove the feature from the layer',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          sort: 60,
          handler: os.ui.menu.spatial.removeItems,
          beforeRender: os.ui.menu.spatial.visibleIfInLayer
        }]
      }, {
        label: os.ui.menu.spatial.Group.TOOLS,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 40,
        children: [{
          label: 'Zoom',
          eventType: os.ui.action.EventType.ZOOM,
          tooltip: 'Zoom the map to the feature(s)',
          icons: ['<i class="fa fa-fw fa-crop"></i>']
        }, {
          label: 'Modify Area...',
          eventType: os.action.EventType.MODIFY_AREA,
          tooltip: 'Modify the area',
          icons: ['<i class="fa fa-fw fa-edit"></i>'],
          beforeRender: os.ui.menu.spatial.visibleIfCanModify
        }]
      }, {
        label: os.ui.menu.spatial.Group.AREA,
        type: os.ui.menu.MenuItemType.GROUP,
        sort: 50,
        children: [{
          label: os.ui.query.SAVE_WIN_LABEL,
          eventType: os.action.EventType.SAVE,
          tooltip: 'Save the area for future use',
          icons: ['<i class="fa fa-fw fa-save"></i>'],
          sort: 10,
          beforeRender: os.ui.menu.spatial.visibleIfCanSave
        }, {
          label: os.ui.query.EDIT_WIN_LABEL,
          eventType: os.action.EventType.EDIT,
          tooltip: 'Edit area information such as title/description',
          icons: ['<i class="fa fa-fw fa-pencil"></i>'],
          sort: 20,
          beforeRender: os.ui.menu.spatial.visibleIfInAreaManager
        }, {
          label: 'Enable Area',
          eventType: os.action.EventType.ENABLE,
          tooltip: 'Enable the area',
          icons: ['<i class="fa fa-fw fa-check-square-o"></i>'],
          sort: 30,
          beforeRender: os.ui.menu.spatial.visibleIfNotShown
        }, {
          label: 'Disable Area',
          eventType: os.action.EventType.DISABLE,
          tooltip: 'Disable the area',
          icons: ['<i class="fa fa-fw fa-square-o"></i>'],
          sort: 40,
          beforeRender: os.ui.menu.spatial.visibleIfShown
        }, {
          label: 'Merge...',
          eventType: os.action.EventType.MERGE_AREAS,
          tooltip: 'Merge selected areas into a new area',
          icons: ['<i class="fa fa-fw fa-link"></i>'],
          sort: 60,
          beforeRender: os.ui.menu.spatial.visibleIfMultiplePolygonal
        }, {
          label: 'Remove Area',
          eventType: os.action.EventType.REMOVE_AREA,
          tooltip: 'Remove the area',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          sort: 70,
          beforeRender: os.ui.menu.spatial.visibleIfInAreaManager
        }, {
          label: 'Export...',
          eventType: os.action.EventType.EXPORT,
          tooltip: 'Export the area',
          icons: ['<i class="fa fa-fw fa-download"></i>'],
          sort: 80,
          beforeRender: os.ui.menu.spatial.visibleIfInAreaManager
        }, {
          eventType: os.action.EventType.SEARCH_AREA,
          label: 'Search Area...',
          tooltip: 'Searches for available data in the area',
          icons: ['<i class="fa fa-fw fa-search"></i>'],
          beforeRender: os.ui.menu.spatial.visibleIfPolygonal,
          handler: os.ui.menu.spatial.searchArea,
          sort: 1000
        }]
      }]
    }));

    menu.listen(os.action.EventType.LOAD, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.ADD, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.EXCLUDE, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.ADD_EXCLUDE, os.ui.menu.spatial.onMenuEvent);

    menu.listen(os.action.EventType.FEATURE_INFO, os.ui.menu.spatial.onMenuEvent);

    menu.listen(os.action.EventType.SAVE, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.EDIT, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.ENABLE, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.DISABLE, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.REMOVE_AREA, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.MODIFY_AREA, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.MERGE_AREAS, os.ui.menu.spatial.onMenuEvent);
    menu.listen(os.action.EventType.EXPORT, os.ui.menu.spatial.onMenuEvent);
  }
};


/**
 * Dispose the menu.
 */
os.ui.menu.spatial.dispose = function() {
  goog.dispose(os.ui.menu.SPATIAL);
  os.ui.menu.SPATIAL = undefined;
};


/**
 * Get geometries from the menu context object(s).
 *
 * @param {Object|undefined} context The menu context.
 * @return {!Array<!ol.geom.Geometry>}
 */
os.ui.menu.spatial.getGeometriesFromContext = function(context) {
  if (context) {
    var list = !goog.isArray(context) ? [context] : context;
    var geometries = list.map(function(item) {
      var geometry = /** @type {ol.geom.Geometry|undefined} */ (item.geometry);
      if (!geometry) {
        var feature = /** @type {ol.Feature} */ (item.feature);
        if (feature) {
          geometry = feature.getGeometry();
        }
      }

      return geometry;
    }).filter(os.fn.filterFalsey);

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
 * @return {!Array<ol.Feature>}
 */
os.ui.menu.spatial.getFeaturesFromContext = function(context) {
  if (context) {
    var list = !goog.isArray(context) ? [context] : context;
    var features = list.map(function(item) {
      return /** @type {ol.Feature} */ (item.feature);
    }).filter(os.fn.filterFalsey);

    if (features.length) {
      return features;
    }
  }

  return [];
};


/**
 * Test if all features are in the area manager.
 *
 * @param {!Array<ol.Feature>} features The features
 * @return {boolean} If all features are in the area manager
 */
os.ui.menu.spatial.featuresInAreaManager = function(features) {
  if (features.length > 0) {
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];
      if (!feature || !os.ui.areaManager.get(feature)) {
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
os.ui.menu.spatial.hasMultiple = function(context) {
  return !!(context && context.length > 1);
};


/**
 * If the context has a single item.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
os.ui.menu.spatial.hasSingle = function(context) {
  return !!(context && (context.length === 1 || !goog.isArray(context)));
};


/**
 * If all items in the context are in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
os.ui.menu.spatial.inAreaManager = function(context) {
  if (!os.ui.menu.spatial.isPolygonal(context)) {
    return false;
  }

  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  return os.ui.menu.spatial.featuresInAreaManager(features);
};


/**
 * Test if all objects in the context have polygonal geometries.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean} If all objects have a polygonal geometry.
 */
os.ui.menu.spatial.isPolygonal = function(context) {
  var geometries = os.ui.menu.spatial.getGeometriesFromContext(context);
  if (geometries.length) {
    for (var i = 0; i < geometries.length; i++) {
      if (!os.geo.isGeometryPolygonal(geometries[i])) {
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
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfHasMultiple = function(context) {
  this.visible = os.ui.menu.spatial.hasMultiple(context);
};


/**
 * Shows a menu item if the context has multiple items.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfMultiplePolygonal = function(context) {
  this.visible = os.ui.menu.spatial.hasMultiple(context) && os.ui.menu.spatial.isPolygonal(context);
};


/**
 * Shows a menu item if the context is polygonal.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfPolygonal = function(context) {
  this.visible = os.ui.menu.spatial.isPolygonal(context);
};


/**
 * Shows a menu item if the context is in a layer.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfInLayer = function(context) {
  this.visible = os.ui.menu.spatial.isInLayer(context);
};


/**
 * @param {Object|undefined} context The menu context
 * @return {boolean}
 */
os.ui.menu.spatial.isInLayer = function(context) {
  if (Array.isArray(context)) {
    for (var i = 0, n = context.length; i < n; i++) {
      if (!os.ui.menu.spatial.isInLayer(context[i])) {
        return false;
      }
    }
    return true;
  } else {
    var am = os.query.AreaManager.getInstance();
    return !!context && !!context.feature && !!context.layer && !am.contains(context.feature);
  }
};


/**
 * @param {os.ui.menu.MenuEvent<Object|undefined>} evt The menu event
 */
os.ui.menu.spatial.removeItems = function(evt) {
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
 * Shows a menu item if the context can be modified.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfCanModify = function(context) {
  if (!os.ui.areaManager || !os.ui.menu.spatial.hasSingle(context) || !os.ui.menu.spatial.isPolygonal(context)) {
    this.visible = false;
    return;
  }

  var target = 2;

  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  if (features.length && !os.ui.areaManager.get(features[0])) {
    target = 1;
  }

  this.visible = os.ui.areaManager.getAll().length >= target;
};


/**
 * Shows a menu item if the context is in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfInAreaManager = function(context) {
  this.visible = os.ui.menu.spatial.inAreaManager(context);
};


/**
 * Shows a menu item if the context is in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.notVisibleIfInAreaManager = function(context) {
  this.visible = !os.ui.menu.spatial.inAreaManager(context);
};


/**
 * Shows a menu item if the context is polygonal and not in the area manager.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfCanSave = function(context) {
  this.visible = os.ui.menu.spatial.isPolygonal(context) && !os.ui.menu.spatial.inAreaManager(context);
};


/**
 * Shows a menu item if the context is a shown area.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfShown = function(context) {
  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  if (!features.length) {
    this.visible = false;
    return;
  }

  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];

    if (!os.ui.areaManager.get(feature) || feature.get('shown') === false) {
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
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.visibleIfNotShown = function(context) {
  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  if (!features.length) {
    this.visible = false;
    return;
  }

  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];

    if (!os.ui.areaManager.get(feature) || feature.get('shown')) {
      this.visible = false;
      return;
    }
  }

  this.visible = true;
};


/**
 * Handle spatial menu event.
 *
 * @param {os.ui.menu.MenuEvent} event The menu event.
 * @param {Array<string>=} opt_layerIds - apply to only these ids
 */
os.ui.menu.spatial.onMenuEvent = function(event, opt_layerIds) {
  var context = event.getContext();
  if (context) {
    if (!goog.isArray(context)) {
      context = [context];
    }

    var cmds = [];
    var features = [];
    for (var i = 0, n = context.length; i < n; i++) {
      var feature = /** @type {ol.Feature} */ (context[i].feature);
      var geom = /** @type {ol.geom.Geometry} */ (context[i].geometry);
      if (geom) {
        var am = os.ui.areaManager;
        var qm = os.ui.queryManager;
        feature = feature || new ol.Feature(geom);

        switch (event.type) {
          case os.action.EventType.LOAD:
          case os.action.EventType.ADD:
            features.push(feature);
            cmds.push(new os.ui.query.cmd.AreaAdd(
                feature, true, false, event.type === os.action.EventType.ADD, opt_layerIds));
            break;
          case os.action.EventType.EXCLUDE:
          case os.action.EventType.ADD_EXCLUDE:
            features.push(feature);
            cmds.push(new os.ui.query.cmd.AreaAdd(feature, false, true,
                event.type === os.action.EventType.ADD_EXCLUDE, opt_layerIds));
            break;
          case os.action.EventType.SAVE:
          case os.action.EventType.EDIT:
            var columns;
            var source = os.feature.getSource(feature);
            if (source) {
              // a feature in a source was clicked - clone it and provide the columns to the save window
              columns = source.getColumns();
              feature = /** @type {!ol.Feature} */ (feature.clone());
              feature.set(os.data.RecordField.SOURCE_NAME, source.getTitle(), true);
            }
            os.query.BaseAreaManager.save(feature, columns);
            break;
          case os.action.EventType.ENABLE:
          case os.action.EventType.DISABLE:
            cmds.push(new os.command.AreaToggle(feature, event.type === os.action.EventType.ENABLE));
            break;
          case os.action.EventType.REMOVE_AREA:
            cmds.push(new os.ui.query.cmd.AreaRemove(feature));
            break;
          case os.action.EventType.MODIFY_AREA:
            var conf = {
              'ui': 'os-modifyarea'
            };

            if (am.get(feature)) {
              // the feature is in area manager, so we will treat it as the area to modify
              conf['area'] = feature;
            } else {
              // the feature was just drawn, so we will treat it as the targetArea
              conf['targetArea'] = feature;
              conf['op'] = os.ui.query.ModifyOp.ADD;
            }

            os.ui.query.launchModifyArea(conf);
            break;
          case os.action.EventType.MERGE_AREAS:
          case os.action.EventType.EXPORT:
          case os.action.EventType.FEATURE_INFO:
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
      case os.action.EventType.LOAD:
      case os.action.EventType.ADD:
      case os.action.EventType.EXCLUDE:
      case os.action.EventType.ADD_EXCLUDE:
        for (i = 0, n = features.length; i < n; i++) {
          var area = am.get(features[i]);
          if (area && !area.get('shown')) {
            cmds.push(new os.command.AreaToggle(area, true));
          }
        }
        break;
      case os.action.EventType.FEATURE_INFO:
        var layer = /** @type {os.layer.ILayer|undefined} */ (context[0].layer);
        var title = layer ? layer.getTitle() : undefined;
        os.ui.feature.launchMultiFeatureInfo(features, title);
        break;
      default:
        break;
    }

    if (event.type === os.action.EventType.MERGE_AREAS) {
      os.query.BaseAreaManager.merge(/** @type {!Array<!ol.Feature>} */ (features), 'mergeareas');
    } else if (event.type === os.action.EventType.EXPORT) {
      // I don't really have any idea why this one type doesn't operate with the menu properly without these
      event.preventDefault();
      event.stopPropagation();
      os.ui.ex.AreaExportCtrl.start(/** @type {Array<ol.Feature>} */ (features));
    } else if (event.type === os.action.EventType.LOAD || event.type === os.action.EventType.EXCLUDE) {
      var areas = am.getAll();

      for (i = 0, n = areas.length; i < n; i++) {
        area = areas[i];

        if (area && area.get('shown')) {
          // Dont hide the feature we are trying to load
          if (event.type === os.action.EventType.LOAD && qm.isInclusion(area) && features.indexOf(area) === -1) {
            cmds.push(new os.command.AreaToggle(area, false));
          }

          if (event.type === os.action.EventType.EXCLUDE && qm.isExclusion(area) && area != feature) {
            cmds.push(new os.command.AreaToggle(area, false));
          }
        }
      }
    }
  }

  if (cmds.length) {
    if (cmds.length === 1) {
      os.command.CommandProcessor.getInstance().addCommand(cmds[0]);
    } else {
      var seq = new os.command.SequenceCommand();
      seq.setCommands(cmds);
      seq.title = cmds[cmds.length - 1].title.replace('Add', 'Set');
      os.command.CommandProcessor.getInstance().addCommand(seq);
    }
  }
};


/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 *
 * @param {?string=} opt_areaId - set the enabled state based on this area
 * @return {Array}
 */
os.ui.menu.spatial.getLayers = function(opt_areaId) {
  var set = os.ui.queryManager.getLayerSet();
  var layers = [];

  // check to see if this area is applied to all layers first
  var enabled = true;
  if (opt_areaId !== undefined) {
    enabled = os.ui.queryManager.getEntries('*', opt_areaId, null).length > 0;
    if (enabled) {
      // dont lookup for individual layers if it applys to all
      opt_areaId = undefined;
    }
  }
  for (var key in set) {
    var l = /** @type {os.filter.IFilterable} */ (os.MapContainer.getInstance().getLayer(key));
    try {
      if (l) {
        if (opt_areaId !== undefined) {
          enabled = os.ui.queryManager.getEntries(key, opt_areaId, null).length > 0;
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
    return goog.string.caseInsensitiveCompare(a['label'], b['label']);
  });
  return layers;
};


/**
 * Update temporary menu items.
 *
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.spatial.updateTemporaryItems = function(context) {
  var queryGroup = this.find(os.ui.menu.spatial.Group.QUERY);
  var excludeGroup = this.find(os.ui.menu.spatial.Group.EXCLUDE);

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

  if (!os.ui.menu.spatial.isPolygonal(context)) {
    return;
  }

  var layers = os.ui.menu.spatial.getLayers();

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
    os.ui.menu.spatial.addLayerSubMenu(queryGroup, os.action.EventType.ADD, types);
    os.ui.menu.spatial.addLayerSubMenu(excludeGroup, os.action.EventType.ADD_EXCLUDE, types);
  }
};


/**
 * Add sub menu to query/exclude area by layer type.
 *
 * @param {!os.ui.menu.MenuItem} group The menu group to add the submenu to.
 * @param {string} eventType The base event type.
 * @param {!Object<string, number>} types Map of layer type to count.
 */
os.ui.menu.spatial.addLayerSubMenu = function(group, eventType, types) {
  var subGroup = group.addChild({
    label: 'Choose Layers',
    type: os.ui.menu.MenuItemType.SUBMENU,
    sort: 10
  });

  var layerGroup = subGroup.addChild({
    type: os.ui.menu.MenuItemType.GROUP,
    label: 'By Layer Type',
    sort: 0
  });

  var idx = 0;
  for (var key in types) {
    var typeTitle = goog.string.toTitleCase(key);
    var count = types[key];

    layerGroup.addChild({
      label: typeTitle + ' (' + count + ')',
      eventType: eventType + ':' + key,
      handler: os.ui.menu.spatial.onLayerPicker_,
      tooltip: group.label + ' area for layes of type (' + typeTitle + ')',
      sort: idx++
    });
  }

  subGroup.addChild({
    label: 'Custom...',
    eventType: eventType + ':' + os.action.EventType.CUSTOM,
    handler: os.ui.menu.spatial.onLayerPicker_,
    sort: idx
  });
};


/**
 * Initiates a geosearch in a selected area.
 *
 * @param {!os.ui.menu.MenuEvent} event The menu event.
 * @private
 */
os.ui.menu.spatial.searchArea = function(event) {
  var context = /** @type {Array<Object>} */ (event.getContext());

  if (context) {
    if (!goog.isArray(context)) {
      context = [context];
    }

    // first check if there are features to add
    var features = os.ui.menu.spatial.getFeaturesFromContext(context);
    var geometry = os.ui.menu.spatial.getSearchGeometry(features);

    if (geometry) {
      // disable every other search
      var searches = os.searchManager.getRegisteredSearches();
      var geosearch = [];
      var some = false;

      searches.forEach(function(search) {
        if (search && os.search.supportsGeoSearch(search)) {
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
      var searchEvent = new os.events.PayloadEvent(os.search.SearchEventType.GEO_SEARCH_CHANGE, geometry);
      os.dispatcher.dispatchEvent(searchEvent);
    }
  }
};


/**
 * Gets a shape query from a set of features.
 * @param {Array<ol.Feature>} features The features to get a shape query from.
 * @return {ol.geom.Geometry|undefined} The shape query.
 */
os.ui.menu.spatial.getSearchGeometry = function(features) {
  var geometry;

  if (features && features.length > 0) {
    var originalGeometry = /** @type {ol.geom.Geometry} */ (features[0].get(os.interpolate.ORIGINAL_GEOM_FIELD));
    geometry = features[0].getGeometry();

    if (geometry instanceof ol.geom.Polygon && originalGeometry instanceof ol.geom.Polygon) {
      var coordinates = geometry.getCoordinates().slice();
      os.geo2.normalizeRings(coordinates);

      if (os.geo.isGeometryRectangular(originalGeometry)) {
        // use the original geometry as it will be simpler and faster
        geometry = originalGeometry;
      }
    }
  }

  return geometry;
};


/**
 * The layerChooser directive
 *
 * @return {angular.Directive}
 */
os.ui.menu.spatial.layerChooser = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/action/layerchooser.html',
    controller: os.ui.menu.spatial.LayerChooserCtrl,
    controllerAs: 'layerchooser'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('layerchooser', [os.ui.menu.spatial.layerChooser]);



/**
 * Controller function for the layerChooser directive
 *
 * @param {!angular.Scope} $scope
 * @param {?angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.menu.spatial.LayerChooserCtrl = function($scope, $element) {
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
};


/**
 * Fire the confirmation callback and close the window.
 *
 * @return {boolean}
 * @export
 */
os.ui.menu.spatial.LayerChooserCtrl.prototype.valid = function() {
  var found = ol.array.find(this.scope_['layers'], function(layer) {
    return layer['enabled'];
  });

  // Switch the type to the correct action
  return !found;
};


/**
 * Fire the confirmation callback and close the window.
 *
 * @export
 */
os.ui.menu.spatial.LayerChooserCtrl.prototype.accept = function() {
  // Switch the type to the correct action
  this.scope_['event']['type'] = this.scope_['action'];

  // Create an array of enabled layerids
  var layerIds = [];
  os.array.forEach(this.scope_['layers'], function(layer) {
    if (layer.enabled) {
      layerIds.push(layer.id);
    }
  });
  os.ui.menu.spatial.onMenuEvent(this.scope_['event'], layerIds);
  this.close();
};


/**
 * Close the window.
 *
 * @export
 */
os.ui.menu.spatial.LayerChooserCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};


/**
 * Launch the layer picker.
 *
 * @param {os.ui.menu.MenuEvent} event The menu event.
 * @private
 */
os.ui.menu.spatial.onLayerPicker_ = function(event) {
  var data = event.type.split(':');
  var action = data[0];
  var type = data[1];
  var layers = null;

  var context = event.getContext();
  if (context && context['feature']) {
    var feature = /** @type {ol.Feature} */ (context['feature']);
    layers = os.ui.menu.spatial.getLayers(/** @type {string} */ (feature.getId()));
  } else {
    layers = os.ui.menu.spatial.getLayers();
  }

  // Gather all the layerIds for this type
  if (type == os.action.EventType.CUSTOM) {
    // What cation should this take?
    var scopeOptions = {
      event: event,
      action: action,
      layers: layers
    };

    var windowOptions = {
      'id': 'spatiallayerchooser',
      'label': 'Choose Layers',
      'icon': 'fa fa-align-justify',
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
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  } else {
    var layerIds = [];
    goog.object.forEach(layers, function(layer) {
      if (layer['type'] == type) {
        layerIds.push(layer['id']);
      }
    });
    // Set the event type
    event.type = action;
    os.ui.menu.spatial.onMenuEvent(event, layerIds);
  }
};
