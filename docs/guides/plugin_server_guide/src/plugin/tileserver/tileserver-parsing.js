goog.declareModuleId('plugin.tileserver.Tileserver');

import ConfigDescriptor from 'opensphere/src/os/data/configdescriptor.js';
import DataManager from 'opensphere/src/os/data/datamanager.js';
import {filterFalsey} from 'opensphere/src/os/fn/fn.js';
import {MAX_ZOOM, MIN_ZOOM} from 'opensphere/src/os/map/map.js';
import Request from 'opensphere/src/os/net/request.js';
import {EPSG3857, EPSG4326} from 'opensphere/src/os/proj/proj.js';
import BaseProvider from 'opensphere/src/os/ui/data/baseprovider.js';
import DescriptorNode from 'opensphere/src/os/ui/data/descriptornode.js';
import {createIconSet} from 'opensphere/src/os/ui/icons/index.js';
import IconsSVG from 'opensphere/src/os/ui/iconssvg.js';
import AbstractLoadingServer from 'opensphere/src/os/ui/server/abstractloadingserver.js';
import * as basemap from 'opensphere/src/plugin/basemap/basemap.js';

import {ID} from './index.js';

const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');


/**
 * The Tileserver provider
 * @implements {IDataProvider}
 */
export default class Tileserver extends AbstractLoadingServer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.providerType = ID;
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    super.load(opt_ping);

    // clear out any children we already have
    this.setChildren(null);

    // load the JSON
    new Request(this.getUrl()).getPromise().
        then(this.onLoad, this.onError, this).
        thenCatch(this.onError, this);
  }

  /**
   * @param {string} response
   * @protected
   */
  onLoad(response) {
    let layers;

    try {
      layers = JSON.parse(response);
    } catch (e) {
      this.onError('Malformed JSON');
      return;
    }

    if (!Array.isArray(layers)) {
      // not sure what we got but it isn't an array of layers
      this.onError('Expected an array of layers but got something else');
      return;
    }

    var children = /** @type {Array<!os.structs.ITreeNode>} */ (
      layers.map(this.toChildNode, this).filter(filterFalsey));
    this.setChildren(children);
    this.finish();
  }

  /**
   * @param {Object<string, *>} layer The layer JSON
   * @return {?DescriptorNode} The child node for the provider
   * @protected
   */
  toChildNode(layer) {
    if (!layer['tilejson']) {
      return null;
    }

    if (!/^(png|jpe?g|gif)$/i.test(layer['format'])) {
      // not our format
      return null;
    }

    var id = this.getId() + BaseProvider.ID_DELIMITER + layer['name'];

    var config = {
      'type': 'XYZ',
      'id': id,
      'title': layer['name'],
      'urls': layer['tiles'],
      'extent': layer['bounds'],
      'extentProjection': EPSG4326,
      'icons': createIconSet(id, [IconsSVG.TILES], [], [255, 255, 255, 1]),
      'projection': EPSG3857,
      'minZoom': Math.max(MIN_ZOOM, layer['minzoom']),
      'maxZoom': Math.min(MAX_ZOOM, layer['maxzoom']),
      'attributions': [layer['attribution']],
      'provider': this.getLabel(),
      // this delays enabling the descriptor on startup until this provider marks it as ready
      'delayUpdateActive': true
    };

    if (layer['type'] === 'baselayer') {
      config['baseType'] = config['type'];
      config['type'] = basemap.ID;
      config['layerType'] = basemap.LAYER_TYPE;
      config['noClear'] = true;
    }

    var descriptor = /** @type {ConfigDescriptor} */ (DataManager.getInstance().getDescriptor(id));
    if (!descriptor) {
      descriptor = new ConfigDescriptor();
    }

    descriptor.setBaseConfig(config);

    // add the descriptor to the data manager
    DataManager.getInstance().addDescriptor(descriptor);

    // mark the descriptor as ready if the user had it enabled previously
    descriptor.updateActiveFromTemp();

    var node = new DescriptorNode();
    node.setDescriptor(descriptor);

    return node;
  }

  /**
   * @param {*} e
   * @protected
   */
  onError(e) {
    var msg = Array.isArray(e) ? e.join(' ') : e.toString();
    this.setErrorMessage(msg);
  }
}
