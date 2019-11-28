# OpenSphere

OpenSphere is a pluggable, single-page, GIS web application that supports both 2D and 3D views. It
supports hooking up to many common servers and formats such as ArcGIS, Geoserver (and other OGC
WMS/WFS services), XYZ, TMS, KML, GeoJSON, Shapefiles, CSVs, and more! Other features include animation of
both raster and vector data, import and export of various formats, saving files and layers between
sessions, and much more!

[Check it out!](https://master-branch-opensphere-ngageoint.surge.sh)

Things to try:
* Load a KML, GeoJSON, or GPX file (and more!)
* Add and browse servers such as Geoserver, ArcGIS, and more!
* Animate data in the timeline

In addition, OpenSphere (and its build system) can serve as a base library for GIS applications. Love what we've done with Openlayers and Cesium but want your own UI? You can do that!

Questions? Ask them in the [forum](https://groups.google.com/forum/#!forum/opensphere) or [join our Slack!](https://join.slack.com/t/opensphere/shared_invite/enQtMzgyMjk2MjYyOTY0LTFiYmI2N2VlNmRmNTAzYmNjODQ4ZDYwZjQxMjI0NWUzZmYyMDU1M2JiY2E0ZDAxMzAwMWJmNDRjOTFhMmQ2YTg)

## Prerequisites

* Java 1.7.0+
* Node/NPM
* Python

## Getting Started
OpenSphere is natively developed on Linux and should run great on OS X and typical Linux distributions. See [Windows Development](http://opensphere.readthedocs.io/en/latest/windows_development.html) for instructions for building on Windows.

### Yarn

[Yarn](https://yarnpkg.com/en/) is recommended for dependency management over npm, particularly when using plugins and configuration projects. It will automatically link related projects and dependencies in your workspace.

* Clone [opensphere-yarn-workspace](https://github.com/ngageoint/opensphere-yarn-workspace)
* Clone OpenSphere to the `workspace` directory
* `yarn install`
* `npm run build`
* Point your browser at `dist/opensphere`

### NPM

If you prefer to use NPM, that's fine too:

* Clone the project
* `npm install`
* `npm run build`
* Point your browser at `dist/opensphere`

## Hosting

OpenSphere is a web application and needs to be hosted by a http server. Any HTTP server will work fine. To get started quickly, a very simple to use node [http-server](https://github.com/indexzero/http-server) is pre-configured.

To start:

``` npm run start-server ```

This will start http-server rooted at the project workspace on port 8282.

If developing locally, navigating to:
 http://localhost:8282/workspace/opensphere  will open a debug-able build, where as
 http://localhost:8282/workspace/opensphere/dist/opensphere will open the compiled/optimized version.

The debug path can be reloaded in the browser to pick up any changes, generally without re-compiling. This allows for much simpler and rapid development. The compiled/optimized path requires rebuilding to pick up any changes. e.g. ``` npm run build ```

## Installing plugins

Got a cool plugin you want to install? Either:

* `cd opensphere; npm install opensphere-plugin-x`
* or clone the plugin project as a sibling to `opensphere`

Then do `npm run build` in `opensphere` and it will pick up the plugin.

## Supported Browsers

The 2D view _should_ be supported by IE10+, FF17+, and Chrome 28+. 3D support depends on proper graphics card drivers and WebGL support by the browser (and also a specific revision of IE11).

Even though IE should work, if you use it, you are going to have a bad time. Edge is only slightly better.

## Documentation

Check out our guides at [opensphere.readthedocs.io](https://opensphere.readthedocs.io). API documentation can be built locally by running `npm run apidoc`, which outputs to `dist/apidoc`. We will have a hosted version of that soon.

## Bugs

Please use the [issue tracker](https://github.com/ngageoint/opensphere/issues) for all bugs and feature requests. Remember to search first to see if the problem has already been reported.

## Development

Our general [development guide](http://opensphere.readthedocs.io/en/latest/getting_started.html) will help with contributions, plugins, and apps. For plugin development, start with our [plugin guide](http://opensphere.readthedocs.io/en/latest/guides/plugin_guide.html). To use OpenSphere as a library and build your own app on top of it, check out our [application guide](http://opensphere.readthedocs.io/en/latest/guides/app_guide.html)

## Contributing

To get involved with OpenSphere directly, see our [contributing guide](http://opensphere.readthedocs.io/en/latest/contributing.html).

## About

OpenSphere is an application used to visualize temporal/geospatial data. The application represents data using both two and three-dimensional models of the earth, and has the ability to handle large volumes of features and tiles. The core of the application is based on Open Geospatial Consortium (OGC) standards.

OpenSphere was developed at the National Geospatial-Intelligence Agency (NGA) in collaboration with BIT Systems. The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the Apache license.

## Pull Requests

If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the Apache license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.

## End to End Tests
End to end tests for Opensphere are written using [Cypress](https://github.com/cypress-io/cypress).

### Setup
By default the ```baseURL``` is set to the local compiled build: http://localhost:8282/workspace/opensphere/dist/opensphere.  This can be changed in [cypress.json](https://github.com/ngageoint/opensphere/blob/master/cypress.json) to an alternate  target.

### Running Tests
Run all tests via the command line ```yarn test:cypress-all```, individual specs via the command line ```yarn test:cypress-spec folder/test.spec.js```, or run tests interactively with the [Test Runner](https://docs.cypress.io/guides/core-concepts/test-runner.html) via ```yarn test:cypress```.


### Adding and modifying tests

[Optional] For VS Code, clone [opensphere-tests-vscode](https://github.com/justin-bits/opensphere-tests-vscode) for useful snippets and settings created specifically for testing OpenSphere.

## License

Copyright 2017 BIT Systems

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
