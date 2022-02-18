goog.declareModuleId('plugin.openpage.Page');

import {NAMESPACE} from '../../os/os.js';
import Peer from '../../os/xt/peer.js';
import {TYPE} from './openpage.js';

const safe = goog.require('goog.dom.safe');


var type = TYPE;

var peer = Peer.getInstance();
peer.setId(NAMESPACE + '-' + type);
peer.setTitle('{APP} Add Layer');
peer.init();

var str = window.location.hash;
var status = $('#status');

if (str) {
  status.html('Adding layer(s) ... ');

  str = decodeURIComponent(str.substring(1));

  try {
    var configs = JSON.parse(str);
  } catch (e) {
    status.html('Error: malformed JSON in fragment.');
  }

  if (configs) {
    peer.send(type, configs, NAMESPACE);

    if (!peer.isAppOpen(NAMESPACE)) {
      safe.setLocationHref(window.location,
          window.location.toString().replace(/#.*/g, '').replace('addlayer.html', ''));
    } else {
      status.append('Done! You can close this and switch over to {APP} to see your layer(s).');
    }
  }
} else {
  status.html('Error: No URI-encoded JSON string was found in the location fragment');
}
