goog.module('os.ui.layer.EllipseColumnsUI');
goog.module.declareLegacyNamespace();

const {getValues} = goog.require('goog.object');
const {ROOT, implements: implementationOf} = goog.require('os');
const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const DataManager = goog.require('os.data.DataManager');
const IMappingDescriptor = goog.require('os.data.IMappingDescriptor');
const Units = goog.require('os.math.Units');
const Module = goog.require('os.ui.Module');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const ILayer = goog.require('os.layer.ILayer');
const {ORIENTATION} = goog.require('os.Fields');
const {
  DEFAULT_RADIUS_COL_NAME: RADIUS,
  DEFAULT_SEMI_MAJ_COL_NAME: SEMI_MAJOR,
  DEFAULT_SEMI_MIN_COL_NAME: SEMI_MINOR
} = goog.require('os.fields');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const AbstractMapping = goog.requireType('os.im.mapping.AbstractMapping');
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
     * Model object representing the None option.
     * @type {!ColumnDefinition}
     */
    this.noneColumn = new ColumnDefinition('-- None --');

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

    /**
     * Column Options for the source
     * @type {Array<ColumnDefinition>}
     */
    this['columnOptions'] = this.source_ ? this.source_.getColumns() || [] : this.scope_['layer']['columns'] || [];
    this['columnOptions'].unshift(this.noneColumn);

    /**
     * Array of the units available
     * @type {Array<string>}
     */
    this['unitOptions'] = getValues(Units);

    /**
     * The name of the circle Column
     * @type {string}
     */
    this['radiusColumn'] = this['columnOptions'].find(({name}) => name === RADIUS);

    /**
     * Units selected for circle
     * @type {string}
     */
    this['radiusUnits'] = this['radiusColumn'] ? 'nmi' : undefined;

    /**
     * The name of the semi major Column
     * @type {string}
     */
    this['semiMajorColumn'] = this['columnOptions'].find(({name}) => name === SEMI_MAJOR);

    /**
     * Units selected for semi major
     * @type {string}
     */
    this['semiMajorUnits'] = this['semiMajorColumn'] ? 'nmi' : undefined;

    /**
     * The name of the semi minor Column
     * @type {string}
     */
    this['semiMinorColumn'] = this['columnOptions'].find(({name}) => name === SEMI_MINOR);

    /**
     * Units selected for semi minor
     * @type {string}
     */
    this['semiMinorUnits'] = this['semiMinorColumn'] ? 'nmi' : undefined;

    /**
     * The name of the orientation Column
     * @type {string}
     */
    this['orientation'] = this['columnOptions'].find(({name}) => name === ORIENTATION);

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
    const Mappings = implementationOf(desc, IMappingDescriptor.ID) ? (desc.getMappings() || []) : layer['mappings'];


    Mappings.forEach((mapping) => {
      const id = mapping.getId();
      const field = mapping.field;

      const column = this['columnOptions'].find(({name}) => name === field);

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
   */
  updateMappings() {
    const layer = this.scope_['layer'];
    const layerId = implementationOf(layer, ILayer.ID) ? layer.getId() : undefined;
    const descriptor = layerId ? DataManager.getInstance().getDescriptor(layerId) : undefined;
    const descMappings = implementationOf(descriptor, IMappingDescriptor.ID) ?
      (descriptor.getMappings() || []) : layer['mappings'];
    const mappings = this.createMappings();

    let result = [];

    // Pull out the other ellipse mappings from the descriptor mappings, but only if the user has generated valid mappings
    if (descMappings.length > 0 && mappings.length > 0) {
      descMappings.forEach((mapping) => {
        const id = mapping.getId();
        if (id != RadiusMapping.ID && id != SemiMajorMapping.ID &&
            id != SemiMajorMapping.ID && id != OrientationMapping.ID) {
          result.push(mapping);
        }
      });
    }

    // Only combine the mappings if passed a layer, don't if passed anything else (used by geometrystep)
    if (layerId && mappings.length != 0 && descMappings.length != 0) {
      mappings.forEach((mapping) => {
        const im = result.findIndex(({toField}) => toField === mapping.toField);
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
      rm.field = this['radiusColumn'].name;
      rm.setUnits(this['radiusUnits']);
      mappings.push(rm);
    } else if (type == EllipseInputType.ELLIPSE && this.validType(type)) {
      const smaj = new SemiMajorMapping();
      smaj.field = this['semiMajorColumn'].name;
      smaj.setUnits(this['semiMajorUnits']);
      mappings.push(smaj);

      const smin = new SemiMinorMapping();
      smin.field = this['semiMinorColumn'].name;
      smin.setUnits(this['semiMinorUnits']);
      mappings.push(smin);

      const om = new OrientationMapping();
      om.field = this['orientation'].name;
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
      isValid = this['radiusColumn'] && this['radiusUnits'] &&
        this['radiusColumn'] != this.noneColumn && this['radiusUnits'] != this.noneColumn;
    } else if (inputType == EllipseInputType.ELLIPSE) {
      isValid = this['semiMajorColumn'] && this['semiMajorUnits'] &&
        this['semiMajorColumn'] != this.noneColumn && this['semiMajorUnits'] != this.noneColumn &&
        this['semiMinorColumn'] && this['semiMinorUnits'] &&
        this['semiMinorColumn'] != this.noneColumn && this['semiMinorUnits'] != this.noneColumn &&
        this['orientation'] && this['orientation'] != this.noneColumn;
    }
    return isValid;
  }
}


/**
 * Settings key for if this capability is enabled in configs
 * @type {string}
 */
const ALLOW_ELLIPSE_CONFIG = 'allowEllipseConfiguration';


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
  desc.setMappings(value);
  desc.updateMappings(layer);
  updateColumns_(desc, value);
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
    const exists = descColumns.findIndex(({name}) => name === label) > 0;

    if (!exists) {
      if (RadiusMapping.REGEX.test(label)) {
        descColumns.push(new ColumnDefinition(RADIUS));
      } else if (SemiMajorMapping.REGEX.test(label)) {
        descColumns.push(new ColumnDefinition(SEMI_MAJOR));
      } else if (SemiMinorMapping.REGEX.test(label)) {
        descColumns.push(new ColumnDefinition(SEMI_MINOR));
      } else if (OrientationMapping.REGEX.test(label)) {
        descColumns.push(new ColumnDefinition(ORIENTATION));
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
