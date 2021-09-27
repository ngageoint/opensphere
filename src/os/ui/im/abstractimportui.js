goog.declareModuleId('os.ui.im.AbstractImportUI');

import IImportUI from './iimportui.js';// eslint-disable-line


/**
 * @abstract
 * @implements {IImportUI<T>}
 * @template T
 */
export default class AbstractImportUI {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * If local storage is required by the import process.
     * @type {boolean}
     */
    this.requiresStorage = false;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return '';
  }

  /**
   * @inheritDoc
   */
  mergeConfig(from, to) {
    to['color'] = from['color'];
    to['icon'] = from['icon'];
    to['shapeName'] = from['shapeName'];
    to['description'] = from['description'];
    to['mappings'] = from['mappings'];
    to['tags'] = from['tags'];
    to['title'] = from['title'];
  }

  /**
   * @inheritDoc
   */
  getDefaultConfig(file, config) {
    // implement a good default config for the individual import types
    return config;
  }

  /**
   * @inheritDoc
   */
  handleDefaultImport(file, config) {
    // implemented by extending classes to support importing files with a known structure
  }
}
