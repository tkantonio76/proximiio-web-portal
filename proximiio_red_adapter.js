var when = require('when');
var nodeFn = require('when/node/function');
var keys = require('when/keys');
var requestPromise = require('request-promise');
var fspath = require("path");
var fs = require('fs');
var mkdirp = fs.mkdirs;
var promiseDir = nodeFn.lift(mkdirp);
var _ = require('lodash');

var settings = {};
var API_ROOT = 'https://api.proximi.fi/core/';
var flowsUrl = API_ROOT + 'red_flows';
var credentialsUrl = API_ROOT + 'red_credentials';
var settingsUrl = API_ROOT + 'red_settings';
var sessionsUrl = API_ROOT + 'red_sessions';
var librariesUrl = API_ROOT + 'red_libraries';

// original
var libDir;

var promiseRequest = function(url, method, data) {
    var request = {
        uri: url,
        method: method,
        headers: {
            'Authorization': "Bearer " + settings.proximiio.token
        },
        json: true
    };
    if (typeof data !== "undefined") {
        request.body = data;
    }
    return requestPromise(request);
};

var getData = function(url) {
    return when.promise(function(resolve, reject) {
        return promiseRequest(url, 'GET')
            .then(function(response) {
                var results = [];
                if (Array.isArray(response)) {
                    _.each(response, function(item) {
                        results.push(item.data);
                    });
                } else {
                    results = response.data;
                }
                resolve(results);
            }).error(function(error) {
                reject(error);
            })
    });
};

var setData = function(url, data) {
    if (Array.isArray(data)) {
        var items = [];
        var promises = [];

        _.each(data, function(item) {
            var itemUrl = url;
            var method = 'POST';

            if (item.hasOwnProperty('id')) {
                itemUrl += "?red=true";
                method = 'PUT';
            }

            var bundle = {data: item, id: item.id};
            promises.push(promiseRequest(itemUrl, method, bundle));
        });
        return when.all(promises);
    } else {
        var itemUrl = url;
        var method = 'POST';
        var bundle = {data: data};
        if (data.hasOwnProperty('id')) {
            itemUrl += '/' + data.id;
            method = 'PUT';
            bundle.id = data.id;
        }
        return promiseRequest(itemUrl, method, bundle);
    }
};

var ProximiioRedAdapter = {
    init: function(_settings) {
        settings = _settings;
        var promises = [];
        libDir = fspath.join(settings.userDir,"lib");
        return when.all(promises);
    },

    getFlows: function() {
        return getData(flowsUrl);
    },

    saveFlows: function(flows) {
        return setData(flowsUrl, flows);
    },

    getCredentials: function() {
        return getData(credentialsUrl);
    },

    saveCredentials: function(credentials) {
        return setData(credentialsUrl, credentials);
    },

    getSettings: function() {
        return getData(settingsUrl);
    },

    saveSettings: function(settings) {
        return setData(settingsUrl, settings);
    },

    getSessions: function() {
        return getData(sessionsUrl);
    },

    saveSessions: function(sessions) {
        return setData(sessionsUrl, sessions);
    },

    getLibraryEntry: function(type,path) {
        var libraryTypeUrl = librariesUrl + '_' + type;
        return getData(libraryTypeUrl);
    },

    saveLibraryEntry: function(type,path,meta,body) {
        var libraryTypeUrl = librariesUrl + '_' + type;
        var bundle = {
            type: type,
            path: path,
            meta: meta,
            body: body
        };
        return setData(libraryTypeUrl, bundle);
    }
};

module.exports = ProximiioRedAdapter;
