// This module implements all the firebase management that the server has do to.
// It's responsible of keeping the correct model, and of cleaning the undesired data-
// This will return a promise that will resolve with an object that holds an
// authenticated admin connection to the firebase server.

// The data hold on the database (from aRootURL) has the format:
//  {
//    $sessionId: {
//      archives: {
//         $archiveId: ArchiveObject,
//         ....
//      },
//      connections: {
//        // 0-n keys (values are irrelevant, the only important thing is the number)
//      }
//    },
//    ...
//  }
// $sessionId is a sessionId.
// $archiveId is an archiveId.
//  ArchiveObject is the Opentok archive object.

/* What the clients should do, is something like:
 // firebaseURL + '/archives' => will hold the archive history for this room
 // firebaseURL + '/connections' => Will hold the list of connected users.
 firebaseRef = new Firebase(firebaseURL);
 firebaseRef.auth(firebasePW, function() {
   firebaseArchives = firebaseRef.child('archives');
   firebaseArchives.on('value', function updateArchiveHistory(aSnapshot) {
   // Do whatever here...
   });
   firebaseRef.child('connections').push().onDisconnect().remove();
 });
*/

function FirebaseArchives(aRootURL, aSecret, aCleanupTime, aLogLevel) {
  'use strict';

  // Time is in minutes but we need it in ms.
  aCleanupTime = aCleanupTime * 60 * 1000;

  var Utils = require('./utils');
  var Logger = Utils.MultiLevelLogger;
  var promisify = Utils.promisify;

  var logger = new Logger("FirebaseArchives", aLogLevel);

  function _getFbObject() {
    // All done, just return an usable object... this will resolve te promise.
    return {
      get baseURL() {
        return aRootURL;
      },
      createUserToken: function(aSessionId, aUsername) {
        return fbTokenGenerator.createToken({
          uid: aUsername + Math.random(),
          sessionId: aSessionId.sessionId,
          role: 'user',
          name: aUsername
        });
      },
      updateArchive: function(aSessionId, aArchive) {
        // We could do this in the background... it shouldn't be needed to stop answering till this
        // is done.
        var rawArchive = JSON.parse(JSON.stringify(aArchive));
        fbRootRef.child(aSessionId + '/archives/' + aArchive.id).update(rawArchive);
      }
    };
  }

  // This will hold the current timers on empty rooms...
  var _timers = {};

  // We could get the session here by binding this function when setting the handler or from the
  // snapshot. Going with the second option because it should be slightly slower but more memory
  // efficient.
  function _checkConnectionsNumber(aConnectionSnapshot) {
    var connRef = aConnectionSnapshot.ref();
    var sessionId = connRef.parent().key();
    logger.log('_checkConnectionsNumber: Found a change on', sessionId);
    if (!aConnectionSnapshot.exists() || !aConnectionSnapshot.hasChildren()) {
      // Nobody connected... start the destruction timer!
      logger.log('_checkConnectionsNumber: setting the cleanup timer for: ', sessionId, 'to', aCleanupTime, 'ms');
      _timers[sessionId] =
        setTimeout(() => {
          logger.log('_checkConnectionsNumber: cleaning up: ', sessionId);
          // Cleanup handlers before removing.
          connRef.off();
          fbRootRef.child(sessionId).remove();
        }, aCleanupTime);
    } else {
      logger.log('_checkConnectionsNumber: cleaning timer timer for: ', sessionId);
      // Clear the doomsday timer
      _timers[sessionId] !== undefined && clearTimeout(_timers[sessionId]);
      _timers[sessionId] = undefined;
    }
  }

  function _processSession(aDataSnapshot) {
    var sessionId = aDataSnapshot.key();
    logger.log('_processSession: Found sessionId: ', sessionId);
    // We only care about the connections here.
    // Funnily enough this works even if the connections key doesn't exist.
    aDataSnapshot.ref().child('connections').on('value', _checkConnectionsNumber);
  }

  // We'll use Firebase to store the recorded archive information
  var Firebase = require('firebase');
  var FirebaseTokenGenerator = require('firebase-token-generator');

  // Connect and authenticate the firebase session
  var fbRootRef = new Firebase(aRootURL);
  fbRootRef.authWithCustomToken_P = promisify(fbRootRef.authWithCustomToken);

  var fbTokenGenerator = new FirebaseTokenGenerator(aSecret);
  var serverToken = fbTokenGenerator.
    createToken({uid: 'SERVER', role: 'server', name: 'OpenTok RTC Server'},
                {admin: true});
  return fbRootRef.
    authWithCustomToken_P(serverToken).
    then(fbRootRef.on.bind(fbRootRef, 'child_added',_processSession)).
    then(_getFbObject).
    catch(err => {
      logger.error('Error authenticating to Firebase: ', err);
      throw new Error(err);
    });
}

module.exports = FirebaseArchives;
