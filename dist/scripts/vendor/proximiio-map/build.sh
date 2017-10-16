#!/bin/bash

babel ./src --out-dir ./tmp --copy-files &&
mkdir ./tmp/vendor;
cp -R ./vendor/leaflet/images ./dist/
cp ./vendor/leaflet/leaflet-src.js ./vendor/leaflet/leaflet.css ./tmp/vendor/;
uglifyjs ./tmp/*.js ./tmp/*/*.js -m -c -o ./dist/proximiio-map.js;
cat ./tmp/*.css ./tmp/*/*.css > ./dist/proximiio-map.css;
cp -R ./src/index.html ./dist/
# rm -rf ./tmp/*;
