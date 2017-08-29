'use strict';

var util = require('util'),
    Base = require('./base'),
    errors = require('../Errors');
var Promise = require("bluebird");
var _ = require("lodash");

var Swag = function(args) {
  Swag.super_.call(this, args);
};

util.inherits(Swag, Base);

Swag.prototype.action = 'swag';
Swag.prototype.method = 'get';
Swag.prototype.plurality = 'swag';

Swag.prototype.getSwag = function(context) {
  var model = this.model,
      endpoint = this.endpoint,
      options = context.options || {},
      criteria = context.criteria || {},
      include = this.include,
      includeAttributes = this.includeAttributes || [];
      let openapi = {
        "openapi": "3.0.0",
        "info": {
          "title": [model.name, "API"].join(" "),
          "description": "Access Endpoints for "+model.name,
          "version": "0.1"
        },
        "servers": [],
        "paths": {

        },
        "components": {
          "schemas": {

          }
        }
      };
      _.each(this.resource.controllers, function(c) {
        console.log(c.endpoint);
        let pcfg = {};
        _.set(pcfg, c.method, {
          "summary": "",
          "description": "",
          "parameters": []
        });
        if(c.endpoint.attributes && c.endpoint.attributes.length) {
          _.each(c.endpoint.attributes, function(a){
            pcfg[c.method].parameters.push({
              "name": a,
              "in": "path",
              "description": a+" of Model to fetch",
              "required": true,
              "schema": {
                "type": "integer",
                "format": "int64"
              }
            });
          });
        }
        _.set(openapi.paths, c.endpoint.string, pcfg);
      });
  return Promise.resolve(openapi);
}

Swag.prototype.fetch = function(req, res, context) {
  var model = this.model,
      endpoint = this.endpoint,
      options = context.options || {},
      criteria = context.criteria || {},
      include = this.include,
      includeAttributes = this.includeAttributes || [];

  console.log(this.resource);

  return this.getSwag(context).then(function(instance){
    context.instance = instance;
    return context.continue;
  });
}

module.exports = Swag;
