"use strict";

// sign with default (HMAC SHA256)
var app = require("../../app.js"),
	core = app.core,
	cache = app.cache,
	objectUtils = require("../../lib/object-utils.js");

function signinhandler(changes, next) {
	if (changes.auth && changes.auth.signin) {
		if (changes.auth.signin.id) {
			cache.getEntity(changes.auth.signin.id, function(err, entity) {
				if (err) return next(err);
				if(!entity) return next(new Error("INVALID_USERID"));
				changes.app = (changes.app || {}).user = entity.id;
				((changes.response = (changes.response || {})).app || {}).user = entity.id;
				(changes.response.entities = changes.response.entities || {})[entity.id] = entity;
				return next();
			});
		} else if (changes.auth.signin.identities.length) {
			cache.getEntityByIdentity(changes.auth.signin.identities[0], function(err, entity) {
				if (err) return next(err);
				if (entity) {
					changes.app = (changes.app || {}).user = entity.id;
					(changes.response.app = (changes.response = (changes.response || {})).app || {}).user = entity.id;
					(changes.response.entities = changes.response.entities || {})[entity.id] = entity;
				} else {
					if (!changes.auth.signup) changes.auth.signup = changes.auth.signin;
					else {
						changes.auth.signup = objectUtils.merge(changes.auth.signup, changes.auth.signup);
					}
					(changes.response.app = (changes.response = (changes.response || {})).app || {}).user = null;
				}
				return next();
			});
		}
	}
}

module.exports = function() {
	core.on("setstate", signinhandler, "authentication");
};
