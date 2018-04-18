goog.provide('os.query.ui.MergeAreasCtrl');
goog.provide('os.query.ui.mergeAreasDirective');

goog.require('goog.log');
goog.require('ol.Feature');
goog.require('os.command.SequenceCommand');
goog.require('os.fn');
goog.require('os.geo.jsts');
goog.require('os.ui.Module');
goog.require('os.ui.query.cmd.AreaAdd');
goog.require('os.ui.query.cmd.AreaRemove');
goog.require('os.ui.query.ui.EditAreaCtrl');


/**
 * The mergeareas directive
 * @return {angular.Directive}
 */
os.query.ui.mergeAreasDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/query/mergeareas.html',
    controller: os.query.ui.MergeAreasCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('mergeareas', [os.query.ui.mergeAreasDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.query.ui.EditAreaCtrl}
 * @constructor
 * @ngInject
 */
os.query.ui.MergeAreasCtrl = function($scope, $element) {
  os.query.ui.MergeAreasCtrl.base(this, 'constructor', $scope, $element);
  this.log = os.query.ui.MergeAreasCtrl.LOGGER_;

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
   * @type {ol.Feature|undefined}
   * @protected
   */
  this.preview = null;

  var features = /** @type {Array<!ol.Feature>|undefined} */ ($scope['features']);
  if (features) {
    try {
      var geometries = features.map(os.fn.mapFeatureToGeometry).filter(os.fn.filterFalsey);

      var merged = os.geo.jsts.merge(geometries);
      if (merged) {
        this.preview = os.MapContainer.getInstance().addFeature(new ol.Feature(merged), os.style.PREVIEW_CONFIG);
      }
    } catch (e) {
      goog.log.error(this.log, 'Failed merging features:', e);
    }
  }

  $scope.$emit(os.ui.WindowEventType.READY);
};
goog.inherits(os.query.ui.MergeAreasCtrl, os.ui.query.ui.EditAreaCtrl);


/**
 * Logger for os.query.ui.MergeAreasCtrl
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.query.ui.MergeAreasCtrl.LOGGER_ = goog.log.getLogger('os.query.ui.MergeAreasCtrl');


/**
 * @inheritDoc
 */
os.query.ui.MergeAreasCtrl.prototype.disposeInternal = function() {
  os.query.ui.MergeAreasCtrl.base(this, 'disposeInternal');

  if (this.preview) {
    os.MapContainer.getInstance().removeFeature(this.preview);
    this.preview = null;
  }
};


/**
 * @inheritDoc
 */
os.query.ui.MergeAreasCtrl.prototype.accept = function() {
  var areas = this.scope['features'];
  if (areas && areas.length > 0) {
    var geometries = areas.map(function(feature) {
      return feature.getGeometry();
    }).filter(os.fn.filterFalsey);

    var merged = os.geo.jsts.merge(geometries);
    if (merged) {
      var commands = [];
      if (this['replace']) {
        // add commands to remove the source areas
        for (var i = 0; i < areas.length; i++) {
          commands.push(new os.ui.query.cmd.AreaRemove(areas[i]));
        }
      }

      // create a feature for the merged area and apply the form config
      var feature = this.scope['feature'] = new ol.Feature(merged);
      var mappings = os.ui.query.createMappingsFromConfig(this.config);
      os.ui.query.applyMappings(feature, mappings);
      commands.push(new os.ui.query.cmd.AreaAdd(feature));

      if (commands.length > 1) {
        // wrap commands and push to the stack
        var cmd = new os.command.SequenceCommand();
        cmd.setCommands(commands);
        cmd.title = 'Merge Areas into ' + this.config['title'];
        os.command.CommandProcessor.getInstance().addCommand(cmd);
      } else {
        // not replacing, just add the merged area
        os.command.CommandProcessor.getInstance().addCommand(commands[0]);
      }
    } else {
      os.alertManager.sendAlert('Merging areas failed! Please see the log for more details.',
          os.alert.AlertEventSeverity.ERROR);
    }
  } else {
    os.alertManager.sendAlert('Merging areas failed! List of areas to merge is empty.',
        os.alert.AlertEventSeverity.ERROR);
  }

  this.close();
};
goog.exportProperty(
    os.query.ui.MergeAreasCtrl.prototype,
    'accept',
    os.query.ui.MergeAreasCtrl.prototype.accept);
