!function(exports) {
  'use strict';

  var server = window.location.origin;

  var debug = Utils.debug;

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

  function getRoomParams(roomName, usrId) {
    var userName = usrId ? '?userName=' + usrId : '';

    return sendXHR('GET', server + '/room/' + roomName + '/info' + userName).
      then(function(roomInfo) {
        if (!(roomInfo && roomInfo.sessionId)) {
          throw new Error('Room\'s data could not be recovered');
        }
        return roomInfo;
      }).catch(function(error) {
        return null;
      });
  }

  function startRecording(sessionId) {
    return sendXHR('GET', server + '/start/ ' + sessionId).
      catch(function(error) {
        debug.error('Error starting archived.' + error.message);
      }
    );
  }

  var Request = {
    getRoomParams: getRoomParams
  };

  exports.Request = Request;
}(this);
