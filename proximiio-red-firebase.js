/**
 * Copyright 2013, 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var when = require('when');
var nodeFn = require('when/node/function');
var keys = require('when/keys');
var Firebase = require('firebase');
var fspath = require("path");
var fs = require('fs');
var mkdirp = fs.mkdirs;
var promiseDir = nodeFn.lift(mkdirp);
var _ = require('lodash');
var settings;

// firebase custom
var FIREBASE_REF = 'https://proximiio-nodered.firebaseio.com/';
var flowsRef;
var credentialsRef;
var settingsRef;
var sessionsRef;
var librariesRef;

// original
var libDir;

var decodeProperties = function(object) {
    var copy = {};
    for (var attribute in object) {
        var newKey = attribute.replace(/XDOTX/g, "\.");
        if (typeof (object[attribute]) == 'object') {
            if (Array.isArray(object[attribute])) {
                // item is a array
                var arrayItems = [];
                _.each(object[attribute], function(item) {
                    arrayItems.push(encodeProperties(item));
                });
                if (arrayItems.length > 0) {
                    copy[newKey] = arrayItems;
                }
            } else {
                // item is standard object
                if (Object.keys(object[attribute]).length > 0) {
                    copy[newKey] = encodeProperties(object[attribute]);
                }
            }
        } else {
            // is not object
            if (typeof object[attribute] != 'undefined') {
                copy[newKey] = object[attribute];
            }
        }
    }

    return copy;
}
var encodeProperties = function(object) {
    var copy = {};
    for (var attribute in object) {
        var newKey = attribute.replace(/\./g, 'XDOTX');
        if (typeof (object[attribute]) == 'object') {
            if (Array.isArray(object[attribute])) {
                // item is a array
                var arrayItems = [];
                _.each(object[attribute], function(item) {
                    arrayItems.push(encodeProperties(item));
                });
                if (arrayItems.length > 0) {
                    copy[newKey] = arrayItems;
                }
            } else {
                // item is standard object
                if (Object.keys(object[attribute]).length > 0) {
                    copy[newKey] = encodeProperties(object[attribute]);
                }
            }
        } else {
            // is not object
            if (typeof object[attribute] != 'undefined') {
                copy[newKey] = object[attribute];
            }
        }
    }

    return copy;
};

var firebaseRead = function(ref) {
    return when.promise(function(resolve) {
        console.log('firebase wants to read ref: ', ref.key());
        ref.once('value', function(snapshot) {
            var data = snapshot.val();
            console.log('firebase loaded data: ', data, ' for ref:', ref.key());
            if (data == null) {
              data = [];
            }
            resolve(decodeProperties(data));
        });
    });
};

var firebaseWrite = function(ref, data) {
    return when.promise(function(resolve,reject) {
        var encoded = encodeProperties(data);
        console.log('should set data: ', encoded);
        ref.set(encoded, function(error) {
            if (error) {
                console.log('firebase write error', error);
                reject(err);
            } else {
                console.log('firebase write success');
                resolve();
            }
        });
    });
};

var firebaseRedStorage = {
    init: function(_settings) {
        settings = _settings;

        var promises = [];
        flowsRef = new Firebase(FIREBASE_REF + "flows");
        credentialsRef = new Firebase(FIREBASE_REF + "credentials");
        settingsRef = new Firebase(FIREBASE_REF + "settings");
        sessionsRef = new Firebase(FIREBASE_REF + "sessions");
        librariesRef = new Firebase(FIREBASE_REF + "libraries");

        libDir = fspath.join(settings.userDir,"lib");

        return when.all(promises);
    },

    getFlows: function() {
        return firebaseRead(flowsRef);
    },

    saveFlows: function(flows) {
        return firebaseWrite(flowsRef, flows);
    },

    getCredentials: function() {
        return firebaseRead(credentialsRef);
    },

    saveCredentials: function(credentials) {
        return firebaseWrite(credentialsRef, credentials);
    },

    getSettings: function() {
        return firebaseRead(settingsRef);
    },

    saveSettings: function(settings) {
        return firebaseWrite(settingsRef, settings);
    },

    getSessions: function() {
        return firebaseRead(sessionsRef);
    },

    saveSessions: function(sessions) {
        return firebaseWrite(sessionsRef, sessions);
    },

    getLibraryEntry: function(type,path) {
        var libraryTypeRef = librariesRef.child('type');
        return firebaseRead(libraryTypeRef);
    },

    saveLibraryEntry: function(type,path,meta,body) {
        var libraryTypeRef = librariesRef.child('type');

        var fn = fspath.join(libDir, type, path);
        var headers = "";
        for (var i in meta) {
            if (meta.hasOwnProperty(i)) {
                headers += "// "+i+": "+meta[i]+"\n";
            }
        }
        return promiseDir(fspath.dirname(fn)).then(function () {
            writeFile(fn,headers+body);
        });
    }
};

module.exports = firebaseRedStorage;
