goog.module('os.layer.preset.AbstractPresetService');


const IPresetService = goog.requireType('os.layer.preset.IPresetService');

/**
 * Class to provide stubs and simple implementation of setDefault() and setPublished()
 *
 * @abstract
 * @implements {IPresetService}
 */
class AbstractPresetService {
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
      resolve(null);
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
   * The compiler is wrong; preset, opt_boolean, and the return are exactly as they should be
   * @suppress {checkTypes}
   * @inheritDoc
   */
  setDefault(preset, opt_boolean) {
    return new Promise((resolve, reject) => {
      const isDefault = (opt_boolean !== false);

      if (typeof preset == 'object') {
        this.setDefaultInternal(preset, isDefault, resolve, reject);
      } else {
        this.find(/** @type {osx.layer.PresetSearch} */ ({
          'id': [preset]
        })).then(
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
      }
    });
  }

  /**
   * Handle setDefault
   *
   * @param {!osx.layer.Preset} preset
   * @param {!boolean} isDefault
   * @param {!Function<?>} resolve
   * @param {!Function<?>} reject
   * @protected
   */
  setDefaultInternal(preset, isDefault, resolve, reject) {
    const id = preset['id'];
    const layerFilterKey = preset['layerFilterKey'];

    // loop through all presets in the layer; set the one with ID to isDefault
    this.find(/** @type {osx.layer.PresetSearch} */ ({
      'layerFilterKey': [layerFilterKey]
    })).then(
        (results) => {
          if (results && results.length > 0) {
            const updates = [];
            let update = null;
            results.forEach((result) => {
              const prev = result['default'];
              const target = result['id'] == id;
              if (prev && !target) { // was true and is not the target
                result['default'] = false;
                updates.push(this.update(result));
              } else if (!prev && isDefault && target) { // was false, changing, and is the target
                result['default'] = true;
                const promise = this.update(result);
                updates.push(promise);
                update = promise;
              }
            });

            // don't resolve update.then() by itself; wait for all
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
   * The compiler is wrong; preset, opt_boolean, and the return are exactly as they should be
   * @suppress {checkTypes}
   * @inheritDoc
   */
  setPublished(preset, opt_boolean) {
    return new Promise((resolve, reject) => {
      const isPublished = (opt_boolean !== false);

      if (typeof preset == 'object') {
        this.setPublishedInternal(preset, isPublished, resolve, reject);
      } else {
        this.find(/** @type {osx.layer.PresetSearch} */ ({
          'id': [preset]
        })).then(
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
      }
    });
  }

  /**
   * Handle setPublished
   * @param {!osx.layer.Preset} preset
   * @param {!boolean} isPublished
   * @param {!Function<?>} resolve
   * @param {!Function<?>} reject
   * @protected
   */
  setPublishedInternal(preset, isPublished, resolve, reject) {
    preset['published'] = isPublished;
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

exports = AbstractPresetService;
