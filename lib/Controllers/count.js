'use strict';

var util = require('util'),
    Base = require('./base'),
    _ = require('lodash'),
    errors = require('../Errors');

var Count = function(args) {
  Count.super_.call(this, args);
};

util.inherits(Count, Base);

Count.prototype.action = 'count';
Count.prototype.method = 'get';
Count.prototype.plurality = 'count';

Count.prototype._safeishParse = function(value, type, sequelize) {

  if (sequelize) {
    if (type instanceof sequelize.STRING || type instanceof sequelize.CHAR || type instanceof sequelize.TEXT) {
      if (!isNaN(value)) {
        return value;
      }
    } else if (type instanceof sequelize.INTEGER || type instanceof sequelize.BIGINT) {

    }
  }

  try {
    return JSON.parse(value);
  } catch(err) {
    return value;
  }
};

var stringOperators = /like|iLike|notLike|notILike/;
Count.prototype.fetch = function(req, res, context) {
  var self = this,
      model = this.model,
      options = context.options || {},
      criteria = context.criteria || {},
      // include = this.include,
      // includeAttributes = this.includeAttributes,
      Sequelize = this.resource.sequelize;
      // defaultCount = 100,
      // count = +context.count || +req.query.count || defaultCount,
      // offset = +context.offset || +req.query.offset || 0,
      // pagination = context.pagination || req.query.pagination || +req.query.count || this.resource.pagination
      // ;

  // only look up attributes we care about
  // options.attributes = options.attributes || this.resource.attributes;


  var searchParams = this.resource.search.length ? this.resource.search : [this.resource.search];
  searchParams.forEach(function(searchData) {
    var searchParam = searchData.param;
    if (_.has(req.query, searchParam)) {
      var search = [];
      var searchOperator = searchData.operator || '$like';
      var searchAttributes =
        searchData.attributes || Object.keys(model.rawAttributes);
      searchAttributes.forEach(function(attr) {
        if(stringOperators.test(searchOperator)){
          var attrType = model.rawAttributes[attr].type;
          if (!(attrType instanceof Sequelize.STRING) &&
              !(attrType instanceof Sequelize.TEXT)) {
            // NOTE: Sequelize has added basic validation on types, so we can't get
            //       away with blind comparisons anymore. The feature is up for
            //       debate so this may be changed in the future
            return;
          }
        }

        var item = {};
        var query = {};
        var searchString;
        if (!~searchOperator.toLowerCase().indexOf('like')) {
          searchString = req.query[searchParam];
        } else {
          searchString = '%' + req.query[searchParam] + '%';
        }
        query[searchOperator] = searchString;
        item[attr] = query;
        search.push(item);
      });

      if (Object.keys(criteria).length)
        criteria = Sequelize.and(criteria, Sequelize.or.apply(null, search));
      else
        criteria = Sequelize.or.apply(null, search);
    }
  });

  // all other query parameters are passed to search
  var extraSearchCriteria = _.reduce(req.query, function(result, value, key) {
    if (_.has(model.rawAttributes, key)) result[key] = self._safeishParse(value, model.rawAttributes[key].type, Sequelize);
    return result;
  }, {});

  if (Object.keys(extraSearchCriteria).length)
    criteria = _.assign(criteria, extraSearchCriteria);

  // do the actual lookup
  if (Object.keys(criteria).length)
    options.where = criteria;

  if (req.query.scope) {
    model = model.scope(req.query.scope);
  }
  // options.logging = console.log;
  // delete options.offest;
  // console.log(options);
  return model
    .count(options)
    .then(function(result) {
      let resp = {};
      let totalName = _.get(options, 'countProperty', 'numRecords');
      _.set(resp, totalName, result);
      context.instance = resp;

      return context.continue;
    });
};

module.exports = Count;
