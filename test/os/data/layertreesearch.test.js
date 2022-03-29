goog.require('os.data.LayerTreeSearch');
goog.require('os.data.groupby.LayerZOrderGroupBy');
goog.require('os.layer.Tile');
goog.require('os.layer.Vector');
goog.require('os.map.instance');
goog.require('os.mock');

import TileWMS from 'ol/src/source/TileWMS';
import OLVectorSource from 'ol/src/source/Vector';

import LayerZOrderGroupBy from '../../../src/os/data/groupby/layerzordergroupby';
import LayerTreeSearch from '../../../src/os/data/layertreesearch';
import FolderManager from '../../../src/os/layer/foldermanager';
import Tile from '../../../src/os/layer/tile';
import Vector from '../../../src/os/layer/vector';
import {getMapContainer} from '../../../src/os/map/mapinstance';

describe('os.data.LayerTreeSearch', function() {
  beforeEach(function() {
    // add a tile layer
    var layer = new Tile({
      source: new TileWMS({
        url: '/bogus'
      })
    });

    layer.setId('test#layer1');
    layer.setTitle('Alpha');

    getMapContainer().addLayer(layer);

    // add a vector layer
    layer = new Vector({
      source: new OLVectorSource()
    });

    layer.setId('test#layer2');
    layer.setTitle('Beta');

    getMapContainer().addLayer(layer);

    // add a second tile layer
    layer = new Tile({
      source: new TileWMS({
        url: '/bogus'
      })
    });

    layer.setId('test#layer3');
    layer.setTitle('Gamma');

    getMapContainer().addLayer(layer);
  });

  afterEach(function() {
    getMapContainer().removeLayer('test#layer1');
    getMapContainer().removeLayer('test#layer2');
    getMapContainer().removeLayer('test#layer3');
  });

  it('should search map layers', function() {
    FolderManager.getInstance().clear();
    var o = {};
    var s = new LayerTreeSearch('data', o);

    s.beginSearch('', null);

    expect(o.data[0].getId()).toBe('test#layer1');
    expect(o.data[1].getId()).toBe('test#layer2');
    expect(o.data[2].getId()).toBe('draw');
    expect(o.data[3].getId()).toBe('test#layer3');
  });

  it('should always sort by Z-Order when grouping', function() {
    var o = {};
    var s = new LayerTreeSearch('data', o);
    var gb = new LayerZOrderGroupBy();

    s.beginSearch('', gb);

    expect(o.data[0].getLabel()).toBe('Feature Layers (2)');
    expect(o.data[1].getLabel()).toBe('Tile Layers (2)');
    expect(o.data[1].getChildren()[0].getId()).toBe('test#layer3');
    expect(o.data[1].getChildren()[1].getId()).toBe('test#layer1');
  });
});
