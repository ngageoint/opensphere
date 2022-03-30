goog.declareModuleId('os.query.ui.MergeAreasUI');

import Feature from 'ol/src/Feature.js';

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import CommandProcessor from '../../command/commandprocessor.js';
import SequenceCommand from '../../command/sequencecommand.js';
import {filterFalsey, mapFeatureToGeometry} from '../../fn/fn.js';
import {merge} from '../../geo/jsts.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {ROOT} from '../../os.js';
import {PREVIEW_CONFIG} from '../../style/style.js';
import Module from '../../ui/module.js';
import AreaAdd from '../../ui/query/cmd/areaaddcmd.js';
import AreaRemove from '../../ui/query/cmd/arearemovecmd.js';
import {Controller as EditAreaCtrl} from '../../ui/query/editarea.js';
import {applyMappings, createMappingsFromConfig} from '../../ui/query/query.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * The mergeareas directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/query/mergeareas.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'mergeareas';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * @unrestricted
 */
export class Controller extends EditAreaCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
    this.log = logger;

    /**
     * @type {!Object<string, string>}
     */
    this['help'] = {
      'title': 'Title given to the merged area.',
      'description': 'Description applied to the merged area.',
      'tags': 'Comma-delimited list of tags to apply to the merged area. Tags can be used to group or search areas ' +
          'in the Areas tab of the Layers window.',
      'replace': 'If checked, selected areas will be removed from Areas and replaced with the merged area.'
    };

    /**
     * @type {boolean}
     */
    this['replace'] = false;

    /**
     * @type {Feature|undefined}
     * @protected
     */
    this.preview = null;

    var features = /** @type {Array<!Feature>|undefined} */ ($scope['features']);
    if (features) {
      try {
        var geometries = features.map(mapFeatureToGeometry).filter(filterFalsey);

        var merged = merge(geometries);
        if (merged) {
          this.preview = getMapContainer().addFeature(new Feature(merged), PREVIEW_CONFIG);
        }
      } catch (e) {
        log.error(this.log, 'Failed merging features:', e);
      }
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.preview) {
      getMapContainer().removeFeature(this.preview);
      this.preview = null;
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  accept() {
    var areas = this.scope['features'];
    if (areas && areas.length > 0) {
      var geometries = areas.map(function(feature) {
        return feature.getGeometry();
      }).filter(filterFalsey);

      var merged = merge(geometries);
      if (merged) {
        var commands = [];
        if (this['replace']) {
          // add commands to remove the source areas
          for (var i = 0; i < areas.length; i++) {
            commands.push(new AreaRemove(areas[i]));
          }
        }

        // create a feature for the merged area and apply the form config
        var feature = this.scope['feature'] = new Feature(merged);
        var mappings = createMappingsFromConfig(this.config);
        applyMappings(feature, mappings);
        commands.push(new AreaAdd(feature));

        if (commands.length > 1) {
          // wrap commands and push to the stack
          var cmd = new SequenceCommand();
          cmd.setCommands(commands);
          cmd.title = 'Merge Areas into ' + this.config['title'];
          CommandProcessor.getInstance().addCommand(cmd);
        } else {
          // not replacing, just add the merged area
          CommandProcessor.getInstance().addCommand(commands[0]);
        }
      } else {
        AlertManager.getInstance().sendAlert('Merging areas failed! Please see the log for more details.',
            AlertEventSeverity.ERROR);
      }
    } else {
      AlertManager.getInstance().sendAlert('Merging areas failed! List of areas to merge is empty.',
          AlertEventSeverity.ERROR);
    }

    this.close();
  }
}

/**
 * Logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.query.ui.MergeAreasUI');
