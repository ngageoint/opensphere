Content Type Detection
----------------------

The first thing we need to do for a file type is to detect the file type given a generic file. This is an XML format, so we can extend a generic XML content type detection function from OpenSphere.

.. literalinclude:: src/plugin/georss/mime.js
  :caption: ``src/plugin/georss/mime.js``:
  :linenos:
  :language: javascript

As always, let's test it.

External Plugins
  If you are working with an external plugin, you will need to add the following two lines to the files list in ``karma.conf.js``:

  .. code-block:: javascript

      {pattern: resolver.resolveModulePath('chardetng-wasm/dist/es5/chardetng.es5.min.js'), watched: false, included: true, served: true},
      {pattern: '../opensphere/.build/xml-lexer.min.js', watched: false, included: true, served: true},


.. literalinclude:: test/plugin/georss/mime.test.js
  :caption: ``test/plugin/georss/mime.test.js``
  :linenos:
  :language: javascript

Run ``yarn test`` to try that out.

Now we will have our plugin import our mime package.

.. literalinclude:: src/plugin/georss/georssplugin-content_type.js
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 3

Save and run the build. You should now be able to import any atom feed (assuming the remote server has CORS configured; download it and import it as a file otherwise) into OpenSphere! Once it loads, it will complain that it does not have an import UI registered for 'application/rss+xml+geo', which is fine for now.
