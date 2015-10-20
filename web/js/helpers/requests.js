!function(exports) {
  'use strict';

  var server = window.location.origin;

  var debug =
    new Utils.MultiLevelLogger('requests.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  function sendXHR(aType, aURL, aData, aDataType) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(aType, aURL);
      xhr.responseType = 'json';
      xhr.overrideMimeType('application/json');
      if (aDataType) {
        // Note that this requires
        xhr.setRequestHeader('Content-Type', aDataType);
        aData && xhr.setRequestHeader('Content-Length', aData.length);
      }

      xhr.onload = function (aEvt) {
        debug.log('sendXHR. XHR success');
        // Error control is for other people... :P
        resolve(xhr.response);
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

    return sendXHR('GET', server + '/room/' + aRoomParams.roomName + '/info' + userName).
      then(function(roomInfo) {
        if (!(roomInfo && roomInfo.sessionId)) {
          throw new Error('Room\'s data could not be recovered');
        }
        return roomInfo;
      }).catch(function(error) {
        return null;
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
                    composeDate(data), 'application/x-www-form-urlencoded').
      catch(function(error) {
        debug.error('Error starting archived.' + error.message);
      }
    );
  }

  var Request = {
    getRoomInfo: getRoomInfo,
    sendArchivingOperation: sendArchivingOperation
  };

  exports.Request = Request;
}(this);
