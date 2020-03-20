!function(exports) {
  'use strict';

  var server = window.location.origin;

  var debug =
    new Utils.MultiLevelLogger('requests.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  function sendXHR(aType, aURL, aData, aDataType, aResponseType) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(aType, aURL);
      xhr.responseType = aResponseType || 'json';
      xhr.overrideMimeType && xhr.overrideMimeType('application/json');
      if (aDataType) {
        // Note that this requires
        xhr.setRequestHeader('Content-Type', aDataType);
        aData && xhr.setRequestHeader('Content-Length', aData.length);
      }

      xhr.onload = function (aEvt) {
        if (xhr.status === 200) {
          var response = xhr.responseType === 'json' && xhr.response || xhr.responseText;
          if ((xhr.responseType === 'json' || !xhr.responseType) &&
            typeof xhr.response === 'string') {
            response = JSON.parse(response);
          }
          resolve(response);
        } else {
          reject({ status: xhr.status, reason: xhr.response });
        }
      };

      xhr.onerror = function (aEvt) {
        debug.error('sendXHR. XHR failed ' + JSON.stringify(aEvt) + 'url: '+
                    aURL + ' Data: ' + aData + ' RC: ' + xhr.responseCode);
        reject(aEvt);
      };

      xhr.send(aData);
    });
  }

  function getRoomInfo(aRoomParams) {

    var userName = aRoomParams.username ? '?userName=' + aRoomParams.username : '';

    return sendXHR('GET', server + '/room/' + aRoomParams.roomURI + '/info' + userName).
      then(function(roomInfo) {
        if (!(roomInfo && roomInfo.sessionId)) {
          throw new Error('Room\'s data could not be recovered');
        }
        return roomInfo;
      }).catch(function(error) {
        return null;
      });
  }

  function roomExists(roomName) {
    return sendXHR('GET', server + '/room/' + roomName + '/exists').
      then(function(resp) {
        return resp.exists;
      }).catch(function(error) {
        return false;
      });
  }

  function composeDate(data) {
    var composed = [];

    Object.keys(data).forEach(function(key) {
      composed.push(key);
      composed.push('=');
      composed.push(data[key]);
      composed.push('&');
    });

    composed.length && composed.pop();

    return composed.join('');
  }

  function sendArchivingOperation(data) {
    return sendXHR('POST', server + '/room/' + data.roomName + '/archive',
                    composeDate(data), 'application/x-www-form-urlencoded');
  }

  function dialOut(roomURI, data) {
    return sendXHR('POST', server + '/room/' + roomURI + '/dial',
                    JSON.stringify(data), 'application/json');
  }

  function hangUp(phoneNumber, token) {
    return sendXHR('POST', server + '/hang-up/', JSON.stringify({
        phoneNumber:phoneNumber,
        googleIdToken: token
      }), 'application/json');
  }

  function deleteArchive(id) {
    return sendXHR('DELETE', server + '/archive/' + id);
  }

  function saveConnection(connection, sessionId) {
    return sendXHR('POST', server + '/saveConnection/', JSON.stringify({
      connection: connection,
      sessionId: sessionId
    }), 'application/json');
  }

  function deleteConnection(connection, sessionId) {
    return sendXHR('POST', server + '/deleteConnection/', JSON.stringify({
      connection: connection,
      sessionId: sessionId
    }), 'application/json');
  }

  var Request = {
    getRoomInfo,
    roomExists,
    sendArchivingOperation,
    dialOut,
    hangUp,
    deleteArchive,
    sendXHR,
    saveConnection,
    deleteConnection
  };

  exports.Request = Request;
}(this);
