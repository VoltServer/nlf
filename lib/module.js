
/**
 *
 * @description Represents a module
 *
 * @author Ian Kelly
 * @copyright Copyright (C) Ian Kelly 2013
 *
 * @license http://opensource.org/licenses/MIT The MIT License
 *
 */

'use strict';

var LicenseCollection = require('./license-collection');

/**
 * Constructor for Module object - represents one module in the dependency chain
 *
 * @param {String} name       The name of the module
 * @param {String} directory  The directory of the module
 * @param {String} repository The repository of the module
 * @param {String} type       The type of the module
 *                            (e.g. production, development)
 */
function Module(id, name, version, directory, repository, type) {

	if (!id) {
		throw new Error('id must be defined');
	}

	if (!directory) {
		throw new Error('directory must be defined');
	}

	this.id = id;
	this.name = name;
	this.version = version;
	if (typeof repository === 'object') {
		repository = repository.url;
  }
  // ref: https://docs.npmjs.com/files/package.json#repository
  this.repository = (repository || '(none)')
    // this appears to be a common incorrect repo spec (missing git+ssh:// protocol)
    .replace(/^git@github.com:/,'https://github.com/')
    .replace(/^git(\+ssh|\+https)?:\/\/(\w+@)?/, 'https://')
    .replace(/\.git$/, '')
    // shortcuts for well-known repo hosters that npm knows about:
    .replace(/^github:/, 'https://github.com/')
    .replace(/^gitlab:/, 'https://gitlab.com/')
    .replace(/^bitbucket:/, 'https://bitbucket.org/');

  // special case: tj/co is short for https://github.com/tj/co
  if ( this.repository.match(/^[\w]+\/[\w-]+$/))
    this.repository = 'https://github.com/' + this.repository;

	this.directory = directory;
	this.type = type || '(none)';

	this.licenseSources = {
		'package': new LicenseCollection(),
		'license': new LicenseCollection(),
		'readme': new LicenseCollection()
	};
}

/**
 * Return a de-duplicated list of all licenses
 *
 * @return {Array} An array of license strings
 */
Module.prototype.summary = function () {

	var dedupe = {},
		licenseSourceName,
		index,
		output = [],
		licenseName,
		all = [];

	// concatenate all the different license source collections
	for (licenseSourceName in this.licenseSources) {
		if (this.licenseSources.hasOwnProperty(licenseSourceName)) {
			all = all.concat(this.licenseSources[licenseSourceName].summary());
		}
	}

	// deduplicate this list
	for (index = all.length - 1; index >= 0; index--) {
		licenseName = all[index];
		if (!dedupe.hasOwnProperty(licenseName)) {
			dedupe[licenseName] = null;
		}
	}

	// convert back to an array
	for (licenseName in dedupe) {
		if (dedupe.hasOwnProperty(licenseName)) {
			output.push(licenseName);
		}
	}

	// add unknown, if there are none
	if (output.length === 0) {
		output.push('Unknown');
	}

	return output.sort();
};

module.exports = Module;
