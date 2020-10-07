goog.module('os.layer.preset.AbstractPresetService');


const IPresetService = goog.requireType('os.layer.preset.IPresetService');

/**
 *
 * @implements {IPresetService}
 * @unrestricted
 */
class AbstractPresetService {
  /**
   * @inheritDoc
   */
  setDefault(preset, opt_boolean) {
    return new Promise((resolve, reject) => {
      const isDefault = (opt_boolean !== false);

      if (typeof preset == 'object') {
        this.setDefaultInternal(preset, isDefault, resolve, reject);
      } else {
        this.find(/** @type {osx.layer.PresetSearch} */ ({
          'id': [id]
        })).then(
            (results) => {
              if (results && results.length > 0) {
                this.setDefaultInternal(results[0], isDefault, resolve, reject);
              } else {
                reject(`Could not find the preset using id: ${id}. Did not set to default`);
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
   * @protected
   */
  setDefaultInternal(preset, isDefault, resolve, reject) {
    const id = preset['id'];
    const layerFilter = preset['layerFilter'];

    // loop through all presets in the layer; set the one with ID to isDefault
    this.find(/** @type {osx.layer.PresetSearch} */ ({
      'layerFilter': [layerFilter]
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
            updates.all((presets) => {
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
            reject(`Could not find presets using layer: ${layerFilter}. Did not set default.`);
          }
        },
        (err) => {
          reject(err);
        });
  }

  /**
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
}

exports = AbstractPresetService;
