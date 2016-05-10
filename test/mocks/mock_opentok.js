'use strict';
var sinon = require('sinon');
var RealOpentok = require('opentok');

function Opentok(aApiKey, aApiSecret) {
  var _archives = {};
  function FakeArchive(aSessionId, aOptions, aStatus) {
    var newArchive =  {
      createdAt: Date.now(),
      duration: '100000',
      id: new String(Math.random() + '').replace('.','_'),
      name: aOptions.name || 'unnamed',
      parnerId: '0xdeadcafe',
      reason: 'unknown',
      sessionId: aSessionId,
      size: 1000,
      status: aStatus,
      hasAudio: true,
      hasVideo: true,
      outputMode: aOptions.outputMode || 'composite',
      url: 'http://nothing.to.see/here'
    };
    _archives[newArchive.id] = newArchive;

    return newArchive;
  }

  var opentok = new RealOpentok(aApiKey, aApiSecret);

  Opentok.instances.push(opentok);

  // We must mock/stub some of the Opentok methods before the app is created
  // because they might be renamed/rebinded...
  sinon.stub(opentok, 'startArchive', function(aSessionId, aArchiveOptions, aCallback) {
  setTimeout(() =>
    aCallback(null, new FakeArchive(aSessionId, aArchiveOptions, 'started')));
  });

  sinon.stub(opentok, 'stopArchive', function(aArchiveId, aCallback) {
    setTimeout(() => {
      if (_archives[aArchiveId]) {
        _archives[aArchiveId].status = 'stopped';
      }
      aCallback(!_archives[aArchiveId], _archives[aArchiveId]);
    });
  });

  sinon.stub(opentok, 'getArchive', function(aArchiveId, aCallback) {
    setTimeout(aCallback.bind(undefined, !_archives[aArchiveId], _archives[aArchiveId]));
  });

  sinon.stub(opentok, 'listArchives', function(aOptions, aCallback) {
    var list = Object.keys(_archives).map(key => _archives[key]);
    setTimeout(aCallback.bind(undefined, undefined, list));
  });

  opentok._sinonRestore = function() {
    ['startArchive', 'stopArchive', 'getArchive', 'listArchives'].forEach(method => {
      opentok[method].restore();
    });
  };

  return opentok;
};
// I'm not convinced this is really needed but...
Opentok.instances = [];
Opentok.restoreInstances = function() {
  Opentok.instances.forEach(instance => {
    instance._sinonRestore();
  });
};

module.exports = Opentok;
