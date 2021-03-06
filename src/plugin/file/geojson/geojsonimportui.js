goog.module('plugin.file.geojson.GeoJSONImportUI');
goog.module.declareLegacyNamespace();

const DataManager = goog.require('os.data.DataManager');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const MappingManager = goog.require('os.im.mapping.MappingManager');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');
const OptionsStep = goog.require('os.ui.wiz.OptionsStep');
const TimeStep = goog.require('os.ui.wiz.step.TimeStep');
const GeoJSONDescriptor = goog.require('plugin.file.geojson.GeoJSONDescriptor');
const {directiveTag: geoJsonImportUi} = goog.require('plugin.file.geojson.GeoJSONImport');


const GeoJSONParserConfig = goog.require('plugin.file.geojson.GeoJSONParserConfig');
const GeoJSONProvider = goog.require('plugin.file.geojson.GeoJSONProvider');


/**
 * @extends {FileImportUI.<GeoJSONParserConfig>}
 */
class GeoJSONImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'GeoJSON';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    const config = new GeoJSONParserConfig();

    // if a configuration was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName();

    try {
      config.updatePreview();

      var features = config['preview'].slice(0, 24);
      if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
        // no mappings have been set yet, so try to auto detect them
        var mm = MappingManager.getInstance();
        var mappings = mm.autoDetect(features);
        if (mappings && mappings.length > 0) {
          config['mappings'] = mappings;
        }
      }
    } catch (e) {
    }

    if (opt_config && opt_config['defaultImport']) {
      this.handleDefaultImport(file, config);
      return;
    }

    const steps = [
      new TimeStep(),
      new OptionsStep()
    ];

    const scopeOptions = {
      'config': config,
      'steps': steps
    };
    const windowOptions = {
      'label': 'Import GeoJSON',
      'icon': 'fa fa-sign-in',
      'x': 'center',
      'y': 'center',
      'width': '850',
      'min-width': '500',
      'max-width': '1200',
      'height': '650',
      'min-height': '300',
      'max-height': '1000',
      'modal': 'true',
      'show-close': 'true'
    };
    var template = `<${geoJsonImportUi} resize-with="${windowSelector.WINDOW}"></${geoJsonImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * @inheritDoc
   */
  handleDefaultImport(file, config) {
    config = this.getDefaultConfig(file, config);

    // create the descriptor and add it
    if (config) {
      const provider = GeoJSONProvider.getInstance();
      const descriptor = new GeoJSONDescriptor(config);
      FileDescriptor.createFromConfig(descriptor, provider, config);

      provider.addDescriptor(descriptor);
      DataManager.getInstance().addDescriptor(descriptor);
      descriptor.setActive(true);
    }
  }
}

exports = GeoJSONImportUI;
