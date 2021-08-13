goog.module('os.ui.windowSelector');
goog.module.declareLegacyNamespace();

/**
 * Selectors for window compontents
 * @enum {string}
 */
const windowSelector = {
  APP: '#ng-app',
  CONTAINER: '#js-window__container',
  CONTENT: '.js-window__content',
  HEADER: '.js-window__header',
  HEADER_TEXT: '.js-window__header-text',
  MODAL_BG: '.modal-backdrop',
  WINDOW: '.js-window',
  DOCKED: '.docked-window',
  WRAPPER: '.js-window__wrapper'
};

exports = windowSelector;
