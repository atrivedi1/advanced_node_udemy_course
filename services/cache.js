const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys')


const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget)
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = async function(options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || '');
	return this;
}

//returns mongo document
mongoose.Query.prototype.exec = async function() {
	if(!this.useCache){
		return exec.apply(this, arguments);
	}

	//create a redis hashing key based off of query options + collection name
	//NOTE: redis only accepts JSON strings, so much JSON.stringify the key
	const key = JSON.stringify(Object.assign({}, this.getQuery(), {
		collection: this.mongooseCollection.name
	}));

	//see if we have a value for key in redis
	const cacheValue = await client.hget(this.hashKey, key);

	//if so, return reults (converted to Mongo doc)
	if(cacheValue) {
		const doc = JSON.parse(cacheValue);
		
		return Array.isArray(doc) 
			? doc.map(d => new this.model(d))
			: new this.model(doc);
	}
	
	//otherwise issue the result after storing it in redis
	const result = await exec.apply(this, arguments);
	client.hset(this.hashKey, key, JSON.stringify(result));
	return result;
}

module.exports = {
	clearHash(hashKey) {
		console.log("clearing hash")
		client.del(JSON.stringify(hashKey));
	}
}