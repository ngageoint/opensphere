goog.provide('plugin.openpage.Page');

goog.require('goog.dom.safe');
goog.require('os.defines');
goog.require('os.xt.Peer');
goog.require('plugin.openpage');

(function() {
  var type = plugin.openpage.TYPE;

  var peer = os.xt.Peer.getInstance();
  peer.setId(os.NAMESPACE + '-' + type);
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
      peer.send(type, configs, os.NAMESPACE);

      if (!peer.isAppOpen(os.NAMESPACE)) {
        goog.dom.safe.setLocationHref(window.location,
            window.location.toString().replace(/#.*/g, '').replace('addlayer.html', ''));
      } else {
        status.append('Done! You can close this and switch over to {APP} to see your layer(s).');
      }
    }
  } else {
    status.html('Error: No URI-encoded JSON string was found in the location fragment');
  }
})();
