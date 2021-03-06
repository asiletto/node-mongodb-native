var mongodb = process.env['TEST_NATIVE'] != null ? require('../lib/mongodb').native() : require('../lib/mongodb').pure();
if(process.env['TEST_COVERAGE']) var mongodb = process.env['TEST_NATIVE'] != null ? require('../lib-cov/mongodb').native() : require('../lib-cov/mongodb').pure();
var useSSL = process.env['USE_SSL'] != null ? true : false;

var testCase = require('nodeunit').testCase,
  debug = require('util').debug,
  inspect = require('util').inspect,
  nodeunit = require('nodeunit'),
  gleak = require('../dev/tools/gleak'),
  Db = mongodb.Db,
  Cursor = mongodb.Cursor,
  Collection = mongodb.Collection,
  MongoReply = mongodb.MongoReply,
  Server = mongodb.Server,  
  Long = mongodb.Long,
  ObjectID = mongodb.ObjectID,
  Binary = mongodb.Binary,
  Code = mongodb.Code,  
  DBRef = mongodb.DBRef,  
  Symbol = mongodb.Symbol,  
  Double = mongodb.Double,  
  MaxKey = mongodb.MaxKey,  
  MinKey = mongodb.MinKey,  
  Timestamp = mongodb.Timestamp;   

var MONGODB = 'integration_tests';
var client = null;

/**
 * Retrieve the server information for the current
 * instance of the db client
 * 
 * @ignore
 */
exports.setUp = function(callback) {
  var self = exports;  
  client = new Db(MONGODB, new Server("127.0.0.1", 27017, {auto_reconnect: true, poolSize: 4, ssl:useSSL}), {native_parser: (process.env['TEST_NATIVE'] != null)});
  client.open(function(err, db_p) {
    if(numberOfTestsRun == (Object.keys(self).length)) {
      // If first test drop the db
      client.dropDatabase(function(err, done) {
        callback();
      });
    } else {
      return callback();
    }
  });
}

/**
 * Retrieve the server information for the current
 * instance of the db client
 * 
 * @ignore
 */
exports.tearDown = function(callback) {
  var self = this;
  numberOfTestsRun = numberOfTestsRun - 1;
  // Close connection
  client.close();
  callback();
}

exports.shouldCorrectlyGetErrorOnIllegalBSON = function(test) {
  if(process.env['TEST_NATIVE'] == null) {
    var mongoReply = new MongoReply()
    var bytes = [0, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 2, 5, 8, 1, 0, 2, 6, 32, 11, 0, 5
      ,0, 200, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 5, 40, 2, 5, 8, 1, 0, 2, 6, 32, 11, 0, 5
      ,0, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 2, 5, 8, 1, 0, 2, 6, 32, 11, 0, 5
      ,0, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 2, 5, 8, 1, 0, 2, 6, 32, 11, 0, 5
      ,0, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 2, 5, 8, 1, 0, 2, 6, 32, 11, 0, 5];
    var buffer = new Buffer(bytes.length);

    for(var i = 0; i < bytes.length; i++) {
      buffer[i] = bytes[i];
    }

    // Bson instance
    var bson = new mongodb.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]);
    // Set up mongo reply
    mongoReply.parseHeader(buffer, bson);
    // Fire up parseBody
    mongoReply.parseBody(buffer, bson, false, function(err, result) {
      test.equal("corrupt bson message", err.message);
      test.done();
    });      
  } else {
    test.done();
  }
}

/**
 * Retrieve the server information for the current
 * instance of the db client
 * 
 * @ignore
 */
exports.noGlobalsLeaked = function(test) {
  var leaks = gleak.detectNew();
  test.equal(0, leaks.length, "global var leak detected: " + leaks.join(', '));
  test.done();
}

/**
 * Retrieve the server information for the current
 * instance of the db client
 * 
 * @ignore
 */
var numberOfTestsRun = Object.keys(this).length - 2;