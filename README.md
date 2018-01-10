# OpenSphere

OpenSphere is a pluggable, single-page, GIS web application that supports both 2D and 3D views. It
supports hooking up to many common servers and formats such as ArcGIS, Geoserver (and other OGC
WMS/WFS services), XYZ, TMS, KML, GeoJSON, Shapefiles, CSVs, and more! Other features include animation of
both raster and vector data, import and export of various formats, saving files and layers between
sessions, and much more!

Check it out!
* [master](https://master-branch-opensphere-ngageoint.surge.sh)

In addition, OpenSphere (and its build system) can serve as a base library for GIS applications. Love
what we've done with Openlayers and Cesium but want your own UI? You can do that!

## Prerequisites

* Java 1.7.0+
* Node/NPM

## Getting Started

The build will not run natively in Windows. Perhaps try Cygwin or Linux via a VM or Docker container. 
It should run great on OS X and typical Linux distributions.

* Clone the project
* `npm install`
* `npm run build`
* Point your browser at `dist/opensphere`

## Installing plugins

Got a cool plugin you want to install? Either

* `cd opensphere; npm install opensphere-plugin-x`
* or clone the plugin project as a sibling to `opensphere`

Then do `npm run build` in `opensphere` and it will pick up the plugin.

## Supported Browsers

The 2D view _should_ be supported by IE10+, FF17+, and Chrome 28+. 3D support depends on proper
graphics card drivers and WebGL support by the browser (and also a specific revision of IE11).

Even though IE should work, if you use it, you are going to have a bad time. Edge is only slightly better.

## Documentation

* Coming soon!

## Bugs

Please use the [issue tracker](https://github.com/ngageoint/opensphere/issues) for all bugs and feature requests. Remember to search first to see if the problem has already been reported.

## Development

Our general [development guide](https://github.com/ngageoint/opensphere/blob/master/DEVELOPING.md) will help with contributions, plugins, and apps. For plugin development, start with our [plugin guide](https://github.com/ngageoint/opensphere/blob/master/PLUGIN_DEVELOPMENT.md).  To use OpenSphere as a library and build your own app on top of it, check out our [application guide](https://github.com/ngageoint/opensphere/blob/master/APP_DEVELOPMENT.md).

## Contributing

To get involved with OpenSphere directly, see our [contributing guide](https://github.com/ngageoint/opensphere/blob/master/CONTRIBUTING.md).

## About

OpenSphere is an application used to visualize temporal/geospatial data. The application represents data using both two and three-dimensional models of the earth, and has the ability to handle large volumes of features and tiles. The core of the application is
based on Open Geospatial Consortium (OGC) standards. 

OpenSphere was developed at the National Geospatial-Intelligence Agency (NGA) in collaboration with BIT Systems. The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the Apache license.

## Pull Requests

If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the Apache license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.

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
