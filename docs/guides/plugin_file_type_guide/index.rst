File Type Plugin Guide
======================

(work-in-progress: Will is actively writing this up)

Here we will walk though creating a plugin for a new vector file type, georss-simple_.

.. _georss-simple: http://www.georss.org/simple.html

Plugin Boilerplate
------------------

If you wish for this to be an external, separately released plugin, then fork opensphere-plugin-example_ and follow the instructions in its readme as a starting point.

.. _opensphere-plugin-example: https://github.com/ngageoint/opensphere-plugin-example

If you wish for this to be a core plugin included with OpenSphere then simply begin adding your plugin code to ``src/plugin/yourplugin``. However, if you are serious about getting your plugin included to the core project, please create an issue for it so we can discuss it.

The Plugin
-------------

Add a basic plugin class.

.. literalinclude:: src/plugin/georss/georssplugin.js
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript

* Internal - Ensure that ``mainctrl.js`` ``goog.require``'s your plugin
* External - Ensure that ``package.json`` ``build.gcc.entry_point`` has ``goog:plugin.georss.GeoRSSPlugin`` in its list

Run ``yarn build`` in OpenSphere (not in your plugin if it is external). It should build just fine but it does not do anything yet.

Layer Support
-------------

Parser
^^^^^^

The first thing we need is a parser that can take the file and turn it into usable ``ol.Feature`` instances.

.. literalinclude:: src/plugin/georss/georssparser.js
  :caption: ``src/plugin/georss/georssparser.js``
  :linenos:
  :language: javascript

Whew. That was a lot for one step. We should probably write some tests for it.

.. literalinclude:: test/plugin/georss/georssparser.test.js
  :caption:: ``test/plugin/georss/georssparser.test.js``
  :linenos:
  :language: javascript

Layer Config
^^^^^^^^^^^^

Now that we have a parser, we can hook that up to a layer. OpenSphere automatically configures layers through registered classes dubbed "layer configs". Given a JSON object like:

.. code-block:: json

  {
    "type": "georss",
    ...
  }

OpenSphere looks up the registered layer config class for the type ``georss``, instantiates it, and passes it that JSON object to create the layer.

Let's create that class.

.. literalinclude:: src/plugin/georss/georsslayerconfig.js
  :caption: ``src/plugin/georss/georsslayerconfig.js``
  :linenos:
  :language: javascript

The parent class, ``os.layer.config.AbstractDataSourceLayerConfig`` handles most of the heavy lifting and common key/value pairs like ``title``, ``url``, ``description``, etc. All we have to do is pass it a parser.

And, since we are good developers, here is a test for it.

.. literalinclude:: test/plugin/georss/georsslayerconfig.test.js
  :caption: ``test/plugin/georss/georsslayerconfig.test.js``
  :linenos:
  :language: javascript

Now that we have that tested, we need to modify our plugin and register the layer config:

Add this to your plugin ``init()`` method.

.. code-block:: javascript
  :caption: src/plugin/georss/georssplugin.js:init()
  :linenos:

  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.georss.ID, plugin.georss.GeoRSSLayerConfig);

Also do not forget to ``goog.require`` the layer config class at the top.

Running ``yarn build`` and viewing the debug instance of the application should allow you to drop this in the console and have a GeoRSS layer:

.. code-block:: javascript`

  os.command.CommandProcessor.getInstance().addCommand(
    new os.command.LayerAdd({
      type: plugin.georss.ID,
      title: 'Test GeoRSS Layer',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.atom',
      color: 'FFFF00'
    })
  });

Cool! But unfortunately this layer is not saved across sessions and it does not support the OpenSphere file/URL import flow. We will do that next!

Import Process
--------------

Content Type Detection
^^^^^^^^^^^^^^^^^^^^^^

The first thing we need to do for a file type is to detect the file type given a generic file. This is an XML format, so we can extend a generic XML content type detection class from OpenSphere.

In ``src/plugin/georss/georsstypemethod.js``:

.. code-block:: javascript
  :linenos:

  goog.provide('plugin.georss.GeoRSSTypeMethod');
  goog.require('os.file.type.AbstractXMLTypeMethod');


  /**
   * Type method for GeoRSS content.
   * @extends {os.file.type.AbstractXMLTypeMethod}
   * @constructor
   */
  plugin.georss.GeoRSSTypeMethod = function() {
    plugin.georss.GeoRSSTypeMethod.base(this, 'constructor');
  };
  goog.inherits(plugin.georss.GeoRSSTypeMethod, os.file.type.AbstractXMLTypeMethod);


  /**
   * @inheritDoc
   */
  plugin.georss.GeoRSSTypeMethod.prototype.getLayerType = function() {
    return plugin.georss.ID;
  };


  // The parent class, by default, just checks the root XML namespace and the root
  // tag name. These two functions provide RegExp instances for checking those.

  /**
   * @inheritDoc
   */
  plugin.georss.GeoRSSTypeMethod.prototype.getNSRegExp = function() {

    return /^http://www.w3.org/2005/Atom$/;
  };


  /**
   * @inheritDoc
   */
  plugin.georss.GeoRSSTypeMethod.prototype.getRootRegExp = function() {
    return /^feed$/;
  };

Now we will have our plugin register our content type class.

In ``src/plugin/georss/georssplugin.js``
.. code-block:: javascript

  // import the class we added at the top
  goog.require('plugin.georss.GeoRSSTypeMethod');

  // then add this to init()

  plugin.georss.GeoRSSPlugin.prototype.init = function() {
    // register the georss file type method
    var fm = os.file.FileManager.getInstance();
    fm.registerContentTypeMethod(new plugin.georss.GeoRSSTypeMethod());
  };

Save and run the build. You should now be able to import any atom feed (assuming the remote server has CORS configured; download it and import it as a file otherwise) into OpenSphere! Once it loads, it will complain that it does not have an import UI registered for 'georss', which is fine for now.

Import UI Launcher
^^^^^^^^^^^^^^^^^^

Import UI Launchers are small classes that configure and launch a UI to let the user set options on the layer. Minimally this should let the user set the layer title and adjust the color.


In ``src/plugin/georss/georssimportui.js``: 

.. code-block:: javascript
  :linenos:

  goog.provide('plugin.georss.GeoRSSImportUI');

  goog.require('os.parse.FileParserConfig');
  goog.require('os.ui.im.FileImportUI');


  /**
   * @extends {os.ui.im.FileImportUI}
   * @constructor
   */
  plugin.georss.GeoRSSImportUI = function() {
    plugin.georss.GeoRSSImportUI.base(this, 'constructor');
  };
  goog.inherits(plugin.georss.GeoRSSImportUI, os.ui.im.FileImportUI);


  /**
   * @inheritDoc
   */
  plugin.georss.GeoRSSImportUI.prototype.getTitle = function() {
    return 'GeoRSS';
  };


  /**
   * @inheritDoc
   */
  plugin.georss.GeoRSSImportUI.prototype.launchUI = function(file, opt_config) {
    var config = new os.parse.FileParserConfig();

    // if an existing config was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName();

    // our config is all set up but we have no UI to launch yet!
  };

Now we will register our launcher in the plugin.

In ``src/plugin/georss/georssplugin.js``:

.. code-block:: javascript
  :linenos:

  // import our new class at the top 
  goog.require('plugin.georss.GeoRSSImportUI');

  // now in init() ...
  plugin.georss.GeoRSSPlugin.prototype.init = function() {
    // register the georss file type method
    var fm = os.file.FileManager.getInstance();
    fm.registerContentTypeMethod(new plugin.georss.GeoRSSTypeMethod());

    // register the georss import ui
    var im = os.ui.im.ImportManager.getInstance();
    im.registerImportDetails('GeoRSS', true);
    im.registerImportUI(plugin.georss.ID, new plugin.georss.GeoRSSImportUI());
  };

Run the build. This gets rid of the error, but our launcher does not launch anything! Let's fix that.

Import UI
^^^^^^^^^

We will create an Angular directive that will let the user change the title and color of the the layer.

In ``src/plugin/georss/georssimport.js``:

.. code-block:: javascript
  :linenos:

  goog.provide('plugin.georss.GeoRSSImportCtrl');
  goog.provide('plugin.georss.georssImportDirective');

  goog.require('os.data.DataManager');
  goog.require('os.defines');
  goog.require('os.file.FileStorage');
  goog.require('os.ui.Module');
  goog.require('os.ui.file.ui.AbstractFileImportCtrl');
  goog.require('os.ui.window');


  /**
   * The GeoRSS import directive
   * @return {angular.Directive}
   */
  plugin.georss.georssImportDirective = function() {
    return {
      restrict: 'E',
      replace: true,
      scope: true,
      templateUrl: os.ROOT + 'views/plugin/georss/georssimport.html',
      controller: plugin.georss.GeoRSSImportCtrl,
      controllerAs: 'georssImport'
    };
  };


  /**
   * Add the directive to the module
   */
  os.ui.Module.directive('georssimport', [plugin.georss.georssImportDirective]);


  /**
   * Controller for the GeoRSS import dialog
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @extends {os.ui.file.ui.AbstractFileImportCtrl<!os.parse.FileParserConfig,!plugin.file.kml.KMLDescriptor>}
   * @constructor
   * @ngInject
   */
  plugin.georss.GeoRSSImportCtrl = function($scope, $element) {
    plugin.georss.GeoRSSImportCtrl.base(this, 'constructor', $scope, $element);
    this.formName = 'georssForm';
  };
  goog.inherits(plugin.georss.GeoRSSImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


  /**
   * @inheritDoc
   */
  plugin.georss.GeoRSSImportCtrl.prototype.createDescriptor = function() {
    var descriptor = this.config['descriptor'] || new os.data.ConfigDescriptor();
    descriptor.setBaseConfig({
      // the JSON that corresponds to the layer config in the next step
    });
    return descriptor;
  };


  /**
   * @inheritDoc
   */
  plugin.georss.GeoRSSImportCtrl.prototype.getProvider = function() {
    return plugin.file.kml.KMLProvider.getInstance();
  };
