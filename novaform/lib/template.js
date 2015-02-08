var Resource = require('./resource')
    , util = require('util')
    , _ = require('underscore');

function Template() {
    if (!(this instanceof Template)) {
        return new Template();
    }

    this._resources = {};
}

Template.prototype._addResource = function(resource) {
    if (!(resource instanceof Resource)) {
        throw new Error('Not a Resource: ' + resource);
    }

    if (resource.name in this._resources) {
        throw new Error(util.format('Internal error: duplicate resource name detected: "%s"', resource.name));
    }
    this._resources[resource.name] = resource;
    return resource;
};

Template.prototype.resources = function() {
    return _.values(this._resources);
};

module.exports = Template;
