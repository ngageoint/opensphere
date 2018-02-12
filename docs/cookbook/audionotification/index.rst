Audio Notification
==================

Problem
-------

Your plugin needs to provide some form of audio notification or audible alert.


Solution
--------

Use the OpenSphere AudioManager. This is a singleton, and the `play()` function takes a label for the sound file to play:

.. literalinclude:: src/audioalertplugin.js
  :caption: AudioManager usage
  :linenos:
  :lines: 30-31
  :language: javascript

There are three ways to provide the sound files - config settings, programmatically, or by user upload.

A config setting entry is shown below:

.. literalinclude:: src/settings.json
  :caption: AudioManager sound file configuration
  :linenos:
  :language: json

A programmatic approach is shown below:

.. code-block:: javascript

  var audioManager = os.audio.AudioManager.getInstance();
  audioManager.addSound(os.ROOT + 'sounds/cowbell.wav', 'label');
  audioManager.play('label');

User upload uses the normal Import Data dialog. Note that it only works if the target is a HTTP or HTTPS URL.


Discussion
----------

Level of audio support, including file formats that are supported, depends on browser capabilities. 

In addition to the API shown earlier, AudioManager also supports muting the notifications. If your plugin makes use of audio notifications, we strongly suggest supporting global muting, as well as selective enable / disable of alerts.

.. code-block:: javascript

  audioManager.setMute(true);
  var mute = audioManager.getMute(); // true - muted
  audioManager.setMute(false); // now unmuted


Full code
---------

.. literalinclude:: src/audioalertplugin.js
  :caption: Audio Notification Cookbook example - Full code
  :linenos: 
  :language: javascript
