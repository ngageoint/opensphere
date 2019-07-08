/**
 * @fileoverview This file provides the exports necessary to compile XT to a standalone library with
 *  the ADVANCED compilation level.
 */
goog.provide('xt');
goog.require('os.xt.Peer');

(function() {
  goog.exportProperty(os.xt.Peer, 'getInstance', os.xt.Peer.getInstance);
  goog.exportProperty(os.xt.Peer.prototype, 'addHandler', os.xt.Peer.prototype.addHandler);
  goog.exportProperty(os.xt.Peer.prototype, 'getDetails', os.xt.Peer.prototype.getDetails);
  goog.exportProperty(os.xt.Peer.prototype, 'getGroup', os.xt.Peer.prototype.getGroup);
  goog.exportProperty(os.xt.Peer.prototype, 'getId', os.xt.Peer.prototype.getId);
  goog.exportProperty(os.xt.Peer.prototype, 'getTypes', os.xt.Peer.prototype.getTypes);
  goog.exportProperty(os.xt.Peer.prototype, 'init', os.xt.Peer.prototype.init);
  goog.exportProperty(os.xt.Peer.prototype, 'isAppOpen', os.xt.Peer.prototype.isAppOpen);
  goog.exportProperty(os.xt.Peer.prototype, 'isMaster', os.xt.Peer.prototype.isMaster);
  goog.exportProperty(os.xt.Peer.prototype, 'persist', os.xt.Peer.prototype.persist);
  goog.exportProperty(os.xt.Peer.prototype, 'send', os.xt.Peer.prototype.send);
  goog.exportProperty(os.xt.Peer.prototype, 'setDetails', os.xt.Peer.prototype.setDetails);
  goog.exportProperty(os.xt.Peer.prototype, 'setGroup', os.xt.Peer.prototype.setGroup);
  goog.exportProperty(os.xt.Peer.prototype, 'setId', os.xt.Peer.prototype.setId);
  goog.exportProperty(os.xt.Peer.prototype, 'setTitle', os.xt.Peer.prototype.setTitle);

  goog.exportProperty(os.xt.IMessageHandler.prototype, 'getTypes', os.xt.IMessageHandler.prototype.getTypes);
  goog.exportProperty(os.xt.IMessageHandler.prototype, 'process', os.xt.IMessageHandler.prototype.process);

  goog.exportSymbol('os.xt.Peer', os.xt.Peer, window);
})();
