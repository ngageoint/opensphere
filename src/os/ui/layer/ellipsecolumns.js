goog.module('os.ui.layer.EllipseColumnsUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.layer.ColumnSuggestionSelect');

const {getValues} = goog.require('goog.object');
const {ROOT, implements: implementationOf} = goog.require('os');
const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const DataManager = goog.require('os.data.DataManager');
const IMappingDescriptor = goog.require('os.data.IMappingDescriptor');
const Units = goog.require('os.math.Units');
const Module = goog.require('os.ui.Module');
const {close: closeWindow} = goog.require('os.ui.window');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const ILayer = goog.require('os.layer.ILayer');
const Fields = goog.require('os.Fields');
const {
  isDerived: isDerived,
  DEFAULT_RADIUS_COL_NAME: RADIUS,
  DEFAULT_SEMI_MAJ_COL_NAME: SEMI_MAJOR,
  DEFAULT_SEMI_MIN_COL_NAME: SEMI_MINOR
} = goog.require('os.fields');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const AbstractMapping = goog.requireType('os.im.mapping.AbstractMapping');
const IMapping = goog.requireType('os.im.mapping.IMapping');
const SourceRequest = goog.requireType('os.source.Request');


/**
 * Convolve form directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',

  scope: {
    'layer': '='
  },

  templateUrl: ROOT + 'views/layer/ellipsecolumns.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * Add the directive to the mist module
 */
Module.directive('ellipsecolumns', [directive]);


/**
 * Settings key for radius column regex, outside of the normal RadiusMapping config.
 * @type {string}
 * @const
 */
const ELLIPSE_RADIUS_REGEX = 'os.mapping.ellipse.radiusRegex';


/**
 * Controller for the Ellipse Column Form.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {?angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Source
     * @type {?SourceRequest}
     * @private
     */
    this.source_ =
      implementationOf(this.scope_['layer'], ILayer.ID) ? this.scope_['layer'].getSource() : undefined;

    /**
     * Whether the user selected Circle or Ellipse
     * @type {boolean}
     */
    this['inputType'] = EllipseInputType.ELLIPSE;

    const columns = (this.source_ ? this.source_.getColumns() || [] : this.scope_['layer']['columns'] || [])
        .filter((col) => !isDerived(col)).map((col) => col['name']);

    /**
     * Column Options for the source
     * @type {Array<string>}
     */
    this['columnOptions'] = columns.sort((a, b) => a.localeCompare(b));

    /**
     * Array of the units available
     * @type {Array<string>}
     */
    this['unitOptions'] = getValues(Units);

    /**
     * The name of the circle Column
     * @type {string}
     */
    this['radiusColumn'] = columns.find((col) => col === RADIUS);

    // get suggestions regex from settings, or use RadiusMapping
    const radiusRegex = new RegExp(
        /** @type {!(string|RegExp)} */ (os.settings.get(ELLIPSE_RADIUS_REGEX, RadiusMapping.REGEX)), 'i');

    /**
     * Suggested columns for radius
     * @type {Array<string>}
     */
    this['radiusSuggestions'] = columns.filter((col) => radiusRegex.test(col));

    /**
     * Units selected for circle
     * @type {string}
     */
    this['radiusUnits'] = this['radiusColumn'] ? 'nmi' : undefined;

    /**
     * The name of the semi major Column
     * @type {string}
     */
    this['semiMajorColumn'] = columns.find((col) => col === SEMI_MAJOR);

    /**
     * Units selected for semi major
     * @type {string}
     */
    this['semiMajorUnits'] = this['semiMajorColumn'] ? 'nmi' : undefined;

    /**
     * The name of the semi minor Column
     * @type {string}
     */
    this['semiMinorColumn'] = columns.find((col) => col === SEMI_MINOR);

    /**
     * Units selected for semi minor
     * @type {string}
     */
    this['semiMinorUnits'] = this['semiMinorColumn'] ? 'nmi' : undefined;

    /**
     * Suggested columns for semi major / minor
     * @type {Array<string>}
     */
    this['ellipseSuggestions'] = columns.filter((col) => /s(e(m(i)?)?)?[\W_]*(maj|min)(o(r)?)?/i.test(col));

    /**
     * The name of the orientation Column
     * @type {string}
     */
    this['orientation'] = columns.find((col) => col === Fields.ORIENTATION);

    /**
     * Suggested columns for orientation
     * @type {Array<string>}
     */
    this['orientationSuggestions'] = columns.filter((col) => OrientationMapping.REGEX.test(col));

    /**
     * Popover Text
     * @type {Object<string, string>}
     */
    this['help'] = {
      'circle': `Select a column that will be used as the Radius for this layer. This mapping will be applied to all new
        features loaded into or queried from this layer. Also select the units for the column, this will be converted to
        nmi or m for the resulting column.`,
      'ellipse': `Select a column for Semi Minor, Semi Major, and Orientation that will be used for this layer. This
        mapping will be applied to all new features loaded into or queried from this layer. Also select the units for
        the column, this will be converted to nmi or m for the resulting column.`
    };

    this.scope_.$watchGroup(['ctrl.radiusColumn', 'ctrl.radiusUnits', 'ctrl.inputType', 'ctrl.semiMajorColumn',
      'ctrl.semiMajorUnits', 'ctrl.semiMinorColumn', 'ctrl.semiMinorUnits', 'ctrl.orientation'],
    this.updateMappings.bind(this));

    this.init();
  }

  /**
   * Initialize the form
   */
  init() {
    const layer = this.scope_['layer'];
    const layerId = implementationOf(layer, ILayer.ID) ? layer.getId() : undefined;
    const desc = layerId ? DataManager.getInstance().getDescriptor(layerId) : undefined;
    const Mappings = implementationOf(desc, IMappingDescriptor.ID) ?
      (/** @type {IMappingDescriptor} */ (desc).getMappings() || []) :
      /** @type {Array<IMapping>} */ (layer['mappings']);

    Mappings.forEach((mapping) => {
      const id = mapping.getId();
      const field = mapping.field;

      const column = this['columnOptions'].find((col) => col === field);

      if (id == RadiusMapping.ID) {
        this['inputType'] = EllipseInputType.CIRCLE;
        this['radiusColumn'] = column;
        this['radiusUnits'] = mapping.units;
      } else if (id == SemiMajorMapping.ID) {
        this['inputType'] = EllipseInputType.ELLIPSE;
        this['semiMajorColumn'] = column;
        this['semiMajorUnits'] = mapping.units;
      } else if (id == SemiMinorMapping.ID) {
        this['semiMinorColumn'] = column;
        this['semiMinorUnits'] = mapping.units;
      } else if (id == OrientationMapping.ID) {
        this['orientation'] = column;
      }
    });
  }


  /**
   * Update the Mappings
   * @return {Array<AbstractMapping>}
   */
  updateMappings() {
    const layer = this.scope_['layer'];
    const layerId = implementationOf(layer, ILayer.ID) ? layer.getId() : undefined;
    const descMappings = this.getDescMappings();
    const mappings = this.createMappings();

    let result = [];

    if (descMappings.length > 0 && mappings.length > 0) {
      result = result.concat(this.removeEllipseMappings_(descMappings));
    }

    // Only combine the mappings if passed a layer, don't if passed anything else (used by geometrystep)
    if (layerId && mappings.length != 0 && descMappings.length != 0) {
      mappings.forEach((mapping) => {
        const im = result.findIndex((res) => res['toField'] === mapping.toField);
        if (im >= 0) {
          result[im] = mapping;
        } else {
          result.push(mapping);
        }
      });
    } else if (descMappings.length == 0) {
      result = mappings;
    }

    this.scope_.$parent['confirmValue'] = layerId ? result : mappings;
    return layerId ? result : mappings;
  }

  /**
   * Create Mappings for Ellipse Data
   * @return {Array<AbstractMapping>}
   */
  createMappings() {
    const mappings = [];
    const type = this['inputType'];

    if (type == EllipseInputType.CIRCLE && this.validType(type)) {
      const rm = new RadiusMapping();
      rm.field = this['radiusColumn'];
      rm.setUnits(this['radiusUnits']);
      mappings.push(rm);
    } else if (type == EllipseInputType.ELLIPSE && this.validType(type)) {
      const smaj = new SemiMajorMapping();
      smaj.field = this['semiMajorColumn'];
      smaj.setUnits(this['semiMajorUnits']);
      mappings.push(smaj);

      const smin = new SemiMinorMapping();
      smin.field = this['semiMinorColumn'];
      smin.setUnits(this['semiMinorUnits']);
      mappings.push(smin);

      const om = new OrientationMapping();
      om.field = this['orientation'];
      mappings.push(om);
    }

    return mappings;
  }

  /**
   * Returns if any of the required columns are non or undefined
   * @param {string} inputType
   * @return {boolean}
   */
  validType(inputType) {
    let isValid = false;
    if (inputType == EllipseInputType.CIRCLE) {
      isValid = this['radiusColumn'] && this['radiusUnits'];
    } else if (inputType == EllipseInputType.ELLIPSE) {
      isValid = this['semiMajorColumn'] && this['semiMajorUnits'] &&
        this['semiMinorColumn'] && this['semiMinorUnits'] &&
        this['orientation'];
    }
    return isValid;
  }

  /**
   * Remove the Mappings
   * @export
   */
  removeMappings() {
    const descMappings = this.getDescMappings();
    const mappings = this.removeEllipseMappings_(descMappings);

    callback_(this.scope_['layer'], mappings);
    closeWindow(this.element);
  }

  /**
   * Allow the remove button only in the module (not csv import)
   * @return {boolean}
   * @export
   */
  allowRemove() {
    return this.source_ != undefined;
  }

  /**
   * Remove Ellipse mappings from the Descriptor Mappings
   * @param {Array<AbstractMapping>} mappings
   * @return {Array<AbstractMapping>}
   * @private
   */
  removeEllipseMappings_(mappings) {
    const result = [];
    mappings.forEach((mapping) => {
      const id = mapping.getId();
      if (id != RadiusMapping.ID && id != SemiMajorMapping.ID &&
            id != SemiMinorMapping.ID && id != OrientationMapping.ID) {
        result.push(mapping);
      }
    });

    return result;
  }

  /**
   * Returns the mappings from the layer or layer Descriptor
   * @return {Array<AbstractMapping>}
   */
  getDescMappings() {
    const layer = this.scope_['layer'];
    const layerId = implementationOf(layer, ILayer.ID) ? layer.getId() : undefined;
    const descriptor = layerId ? DataManager.getInstance().getDescriptor(layerId) : undefined;
    const descMappings = implementationOf(descriptor, IMappingDescriptor.ID) ?
      (/** @type {IMappingDescriptor} */ (descriptor).getMappings() || []) :
      /** @type {Array<IMapping>} */ (layer['mappings']);

    return descMappings;
  }
}


/**
 * Settings key for if this capability is enabled in configs
 * @type {string}
 */
const ALLOW_ELLIPSE_CONFIG = 'os.mapping.ellipse.allowConfiguration';


/**
 * Types of Mappings available
 * @enum {string}
 */
const EllipseInputType = {
  CIRCLE: 'circle',
  ELLIPSE: 'ellipse'
};


/**
 * Launches the window to configure ellipse columns
 * @param {ILayer} layer
 * @param {function(Array<AbstractMapping>)=} opt_confirmCallback
 */
const launchConfigureWindow = function(layer, opt_confirmCallback) {
  const confirm = opt_confirmCallback || callback_.bind(this, layer);
  const scopeOptions = {
    'layer': layer
  };

  const options = /** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    prompt: '<ellipsecolumns layer="layer"></ellipsecolumns>',
    yesText: 'Apply and Reload',
    windowOptions: {
      'label': 'Map Ellipse Columns for ' + layer.getTitle(),
      'x': 'center',
      'y': 'center',
      'width': '330',
      'height': 'auto',
      'modal': 'true',
      'show-close': 'true'
    }
  });

  os.ui.window.ConfirmUI.launchConfirm(options, scopeOptions);
};


/**
 * The default callback that sets the mappings and re-imports data
 * @param {ILayer} layer
 * @param {Array<AbstractMapping>} value
 * @private
 */
const callback_ = function(layer, value) {
  // Update the Descriptor for reload
  const desc = DataManager.getInstance().getDescriptor(layer.getId());
  if (implementationOf(desc, IMappingDescriptor.ID)) {
    const mappingDescriptor = /** @type {IMappingDescriptor} */ (desc);
    mappingDescriptor.setMappings(value);
    mappingDescriptor.updateMappings(layer);
    updateColumns_(desc, value);
  }
};


/**
 * Update the columns so they show up in the analyze tool/feature info
 * @param {IDataDescriptor} desc
 * @param {Array<AbstractMapping>} mappings
 * @private
 */
const updateColumns_ = function(desc, mappings) {
  const descColumns = desc.getColumns();

  mappings.forEach((mapping) => {
    const label = mapping.getLabel();
    const exists = descColumns.findIndex((col) => col['name'] === label) > 0;

    if (!exists) {
      if (RadiusMapping.REGEX.test(label)) {
        const col = new ColumnDefinition(RADIUS);
        col['derivedFrom'] = mapping.field;
        descColumns.push(col);
      } else if (SemiMajorMapping.REGEX.test(label)) {
        const col = new ColumnDefinition(SEMI_MAJOR);
        col['derivedFrom'] = mapping.field;
        descColumns.push(col);
      } else if (SemiMinorMapping.REGEX.test(label)) {
        const col = new ColumnDefinition(SEMI_MINOR);
        col['derivedFrom'] = mapping.field;
        descColumns.push(col);
      } else if (OrientationMapping.REGEX.test(label)) {
        const col = new ColumnDefinition(Fields.ORIENTATION);
        col['derivedFrom'] = mapping.field;
        descColumns.push(col);
      }
    }
  });

  desc.setColumns(descColumns);
};


exports = {
  Controller,
  directive,
  ALLOW_ELLIPSE_CONFIG,
  launchConfigureWindow
};
