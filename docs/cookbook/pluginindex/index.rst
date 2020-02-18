External Javascript Libraries
=============================

Problem
-------

You have a plugin that needs to load some external javascript libraries.

Solution
--------

Add an ``index.js`` configuration file to your plugin, and reference that in ``package.json``.
This will be merged into the main OpenSphere index page by opensphere-build-index_.

.. _opensphere-build-index: https://github.com/ngageoint/opensphere-build-index/blob/master/README.md

Discussion
----------

``index.json`` might look something like this, where a couple of video.js_ dependencies are loaded.

.. _video.js: https://videojs.com/

.. code-block:: javascript

  'use strict';

  const fs = require('fs');
  const path = require('path');
  const resolver = require('opensphere-build-resolver/utils');

  // if opensphere isn't linked in node_modules, assume it's a sibling directory
  const appPath = resolver.resolveModulePath('opensphere') || path.join(__dirname, '..', 'opensphere');
  const versionFile = path.join(appPath, '.build', 'version');
  const version = fs.readFileSync(versionFile, 'utf8').trim().replace(/.*\//, '');

  module.exports = {
    basePath: __dirname,
    appPath: appPath,
    appVersion: version,
    distPath: path.join(appPath, 'dist', 'opensphere'),
    templates: [{
      // add video libraries to main index page
      id: 'index',
      // don't generate index files here, only resolve the resources
      skip: true,
      resources: [{
        source: resolver.resolveModulePath('video.js/dist', __dirname),
        target: 'vendor/video.js',
        scripts: ['video.min.js'],
        css: ['video-js.min.css']
      },
      {
        source: resolver.resolveModulePath('@videojs/http-streaming/dist', __dirname),
        target: 'vendor/video.js',
        scripts: ['videojs-http-streaming.min.js']
      }]
    }]
  };


The ``resources`` array part of the templates can contain several entries (two shown here).

The resolver ``resolveModulePath()`` call will find the specified directory, and the specified
``scripts`` and ``css`` entries will be linked into OpenSphere.

You can also use ``files`` (instead of, or as well as, ``scripts`` and ``css``) to support
as-needed ('lazy') loading of scripts, or make additional files available. An example might
look like:

.. code-block:: javascript

    {
      source: resolver.resolveModulePath('...', __dirname),
      target: '....',
      files: ['data.json', '*.+(gif|png)', 'extrafiles']
    }


Those three entries in the ``files`` array select:
  - the specified file (i.e. ``data.json``)
  - all files with either of the specified extensions (.gif and .png)
  - the ``extrafiles`` directory including contents 

The ``package.json`` part simply needs to provide the file name as part of the ``build``
properties:

.. code-block:: javascript

  {
    "name": "....",
    ....
    "build": {
      ...
      "index": "index.js",
      ...
    },
   ...
  }
