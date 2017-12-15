goog.provide('os.action.export');

goog.require('os.ui.window');


/**
 * Starts the export process for the provided sources.
 * @param {Array<!os.source.Vector>} sources The sources
 */
os.action.export.startExport = function(sources) {
  if (!sources) {
    sources = [];
  }

  var windowId = 'export';
  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var title = sources.length == 1 ? sources[0].getTitle() : null;
    var scopeOptions = {
      'options': /** @type {os.ex.ExportOptions} */ ({
        exporter: null,
        fields: [],
        items: [],
        persister: null,
        sources: sources,
        title: title
      })
    };

    var windowOptions = {
      'id': windowId,
      'label': 'Export Data',
      'icon': 'fa fa-download',
      'x': 'center',
      'y': 'center',
      'width': '350',
      'min-width': '300',
      'max-width': '800',
      'height': '400',
      'min-height': '250',
      'max-height': '600',
      'show-close': 'true'
    };

    var template = '<export></export>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};


