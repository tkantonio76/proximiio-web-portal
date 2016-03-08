var uuid = require('uuid');
var express = require('express');
var router = express.Router();
var fs = require('fs');

module.exports = function(proximiioPath, instance, app) {
  var _this = this;
  var keyFile = proximiioPath + '/proximiio.json';
  var lastToken = null;

  this.get = function(req, res) {
    var result = {};
    if (instance == null) {
      result.type = 'new';
      result.instance_id = uuid.v4();
    } else {
      result.type = 'registered';
    }
    res.send(JSON.stringify(instance));
  };

  this.post = function(req, res) {
    if (typeof(req.body)!='undefined') {
      fs.writeFile(keyFile, JSON.stringify(req.body), function(err) {
        if (err) {
          console.log(new Date(), 'error:', err);
        } else {
          res.send(JSON.stringify({success: true}));
          app.initInstance(req.body);
        }
      });
    } else {
      console.log('instance body is undefined');
    }
  };

  router.get('/', this.get);
  router.post('/', this.post);
  this.router = router;
  return _this;
};
