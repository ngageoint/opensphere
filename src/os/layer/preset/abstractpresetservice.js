goog.declareModuleId('os.layer.preset.AbstractPresetService');


const {default: IPresetService} = goog.requireType('os.layer.preset.IPresetService');


/**
 * Class to provide stubs and simple implementation of setDefault() and setPublished()
 *
 * @abstract
 * @implements {IPresetService}
 */
export default class AbstractPresetService {
  /**
   * @inheritDoc
   */
  insert(preset) {
    return new Promise((resolve) => {
      resolve(null);
    });
  }

  /**
   * @inheritDoc
   */
  update(preset) {
    return new Promise((resolve) => {
      resolve(null);
    });
  }

  /**
   * @inheritDoc
   */
  remove(preset) {
    return new Promise((resolve) => {
      resolve(false);
    });
  }

  /**
   * @inheritDoc
   */
  find(search) {
    return new Promise((resolve) => {
      resolve(null);
    });
  }

  /**
   * Re-set the params and return instead of inheritDoc.
   * The compiler is wrong; preset, opt_boolean, and the return are exactly as they should be.
   *
   * @param {osx.layer.Preset|string} preset
   * @param {boolean=} opt_boolean
   * @return {!Promise<osx.layer.Preset>}
   * @override
   */
  setDefault(preset, opt_boolean) {
    return new Promise((resolve, reject) => {
      const isDefault = (opt_boolean !== false);

      if (typeof preset == 'string') {
        // If the developer gave us an ID instead of a preset, load the Preset first and then modify it
        this.find(/** @type {osx.layer.PresetSearch} */ ({
          'id': [preset]
        })).then(
            /**
             * @param {Array<osx.layer.Preset>} results - Array containing the Preset we're looking to update
             */
            (results) => {
              if (results && results.length > 0) {
                this.setDefaultInternal(results[0], isDefault, resolve, reject);
              } else {
                reject(`Could not find the preset using id: ${preset}. Did not set to default`);
              }
            },
            (err) => {
              reject(err);
            });
      } else {
        this.setDefaultInternal(preset, isDefault, resolve, reject);
      }
    });
  }

  /**
   * Handle setDefault
   *
   * @param {!osx.layer.Preset} preset
   * @param {!boolean} isDefault
   * @param {!Function<osx.layer.Preset>} resolve
   * @param {!Function<*>} reject
   * @protected
   */
  setDefaultInternal(preset, isDefault, resolve, reject) {
    const id = preset.id;
    const layerFilterKey = preset.layerFilterKey;

    // loop through all presets in the layer; set the one with ID to isDefault
    this.find(/** @type {osx.layer.PresetSearch} */ ({
      'layerFilterKey': [layerFilterKey]
    })).then(
        /**
         * @param {Array<osx.layer.Preset>} results
         */
        (results) => {
          if (results && results.length > 0) {
            const updates = [];
            let update = null;

            // update presets individually
            results.forEach((result) => {
              const prev = result.default;
              const target = result.id == id;
              if (prev && !target) { // was true and is not the target
                result.default = false;
                updates.push(this.update(result));
              } else if (!prev && isDefault && target) { // was false, changing, and is the target
                result.default = true;
                const promise = this.update(result);
                updates.push(promise);
                update = promise;
              }
            });

            // don't resolve update.then() by itself; wait for all to complete
            Promise.all(updates).then(() => {
              if (update) {
                update.then(
                    (updated) => {
                      resolve(updated);
                    },
                    (err) => {
                      reject(err);
                    });
              } else {
                reject('Could not update preset(s). Did not set default.');
              }
            });
          } else {
            reject(`Could not find presets using layer: ${layerFilterKey}. Did not set default.`);
          }
        },
        (err) => {
          reject(err);
        });
  }

  /**
   * Re-set the params and return instead of inheritDoc.
   * The compiler is wrong; preset, opt_boolean, and the return are exactly as they should be.
   *
   * @param {osx.layer.Preset|string} preset
   * @param {boolean=} opt_boolean
   * @return {!Promise<osx.layer.Preset>}
   * @override
   */
  setPublished(preset, opt_boolean) {
    return new Promise((resolve, reject) => {
      const isPublished = (opt_boolean !== false);

      if (typeof preset == 'string') {
        // If the developer gave us an ID instead of a preset, load the Preset first and then modify it
        this.find(/** @type {osx.layer.PresetSearch} */ ({
          'id': [preset]
        })).then(
            /**
             * @param {Array<osx.layer.Preset>} results
             */
            (results) => {
              if (results && results.length > 0) {
                this.setPublishedInternal(results[0], isPublished, resolve, reject);
              } else {
                reject(`Could not find the preset using id: ${preset}. Did not set published`);
              }
            },
            (err) => {
              reject(err);
            });
      } else {
        this.setPublishedInternal(preset, isPublished, resolve, reject);
      }
    });
  }

  /**
   * Handle setPublished
   * @param {!osx.layer.Preset} preset
   * @param {!boolean} isPublished
   * @param {!Function<osx.layer.Preset>} resolve
   * @param {!Function<*>} reject
   * @protected
   */
  setPublishedInternal(preset, isPublished, resolve, reject) {
    preset.published = isPublished;
    this.update(preset).then(
        (updated) => {
          resolve(updated);
        },
        (err) => {
          reject(err);
        });
  }

  /**
   * @inheritDoc
   */
  supports(action) {
    return false;
  }
}
