# Cross Talk

The XT (Cross-Talk) package contains a mechanism to allow applications from
the same scheme (http/https) and origin (www.example.com) to communicate
across tabs and windows without having explicit references to each other.

## Building

Run `npm run build:xt` and then pull up `dist/opensphere/xt-example.html` in your browser.

## Usage

Implement a message handler

    var Handler = function() {
      // ...
    };

    Handler.prototype.getTypes = function() {
      return ['alert'];
    };

    Handler.prototype.process = function(data, type, sender, time) {
      alert(data);
    };

In your main application, connect the peer

    var peer = os.xt.Peer.getInstance();
    peer.setTitle('Test Page');
    peer.addHandler(new Handler());
    peer.init();

Send a message

    // send a message on the public channel to be processed by whatever
    // can handle the message type 'alert'
    peer.send('alert', 'Behold!');

    // or, use this to get a list of all peers which support the alert type
    var list = peer.getPeerInfo('alert');

    // pick from the list and send to that peer specifically
    peer.send('alert', 'Only you.', list[i].id);

This particular example only sends strings but you can send any value that serializes to JSON.

## Original Specification

This article outlines a method for web pages in different browser tabs to communicate with one another. Note that it does not support cross-scheme (http/https), cross-origin (test.domain.com/test2.domain.com), or cross browser (Chrome/Firefox) communication.

HTML5 defines a storage specification that has been implemented in IE8, FF4, and some old version of Chrome that no one still uses. It is a simple key-value store that persists across sessions. In addition, all processes (tabs or windows) get an event when the storage for that particular scheme/origin changes. This can be used to send messages between tabs without having explicit references to them.

### Terms

* Peer - A tab or page that is participating in the messaging system
* Master - The peer that is currently acting as the master and thus has some extra duties

### Classes

* Peer
  * group - The group to join. Defaults to "default".
  * id - A GUID that uniquely identifies the peer
  * ping - A timestamp that is periodically updated to indicate that this peer is still alive
  * isMaster - Whether or not this peer is currently the master peer
  * types - An array of strings indicating the type of messages that this peer can handle.
  * title - A human readable title for the peer
  * details - A more detailed description. Not required.
* Message
  * timestamp - When the message was sent
  * type - The message type
  * data - The contents of the message

### LocalStorage caveats

There is no standard way of discovering the local storage limit. Good browsers generally ask the user if they would like to increase the storage space for the site (similar to Flash). IE also does not properly implement the storage event, which occurs on every instance rather than every instance but the one that caused the change (hence the inclusion of the sender ID in the message). Also, everything inserted into localStorage is coerced to a string and will be returned as a string.

### LocalStorage serialization

Our prefix for all local storage serialization shall be "xt" (short for Cross-Talk) to avoid potential collisions with other settings.

The master peer organizes the following two entries. Only the master peer is allowed to modify these entries:

    xt.<group>.master = "<id>"
    xt.<group>.peers = "[<id1>, <id2>, <id3>, ... ]"

Each peer should be serialized as the following:

    xt.<group>.<id>.ping = "123456789123"
    xt.<group>.<id>.types = "[<string>, <string>, ...]"
    xt.<group>.<id>.title = "Sparticus"
    xt.<group>.<id>.details = "Goes ding when there's stuff"

Messaging is accomplished by the sender serializing the following:

    # to a specific peer
    xt.<group>.<toPeerId>.<fromPeerId> = "<msg>"

    # to the public channel to be processed by the first peer that can properly handle the message
    xt.<group>.public.<fromPeerId> = "<msg>"

These could also be implemented as arrays if it becomes useful to queue them up

### Ping

Each peer periodically sets a "ping" value that lets the master know that it is still alive. If any peer becomes dead (did not clean up or shutdown properly), this value will age and the master can clean it up. If the master shuts down or becomes dead, the first peer to discover this should become the master.

### Finally

There are some potential race/blocking/locking conditions with this implementation, but there's no way to get a lock on local storage from Javascript

