'use strict';

var sinon = require('sinon');
var Vonage = require('@vonage/video');

var _archives = {};

function FakeArchive(aSessionId, aOptions, aStatus) {
  var newArchive = {
    createdAt: Date.now(),
    duration: '100000',
    id: aOptions.archiveId || String(Math.random() + '').replace('.', '_'),
    name: aOptions.name || 'unnamed',
    parnerId: '0xdeadcafe',
    reason: 'unknown',
    sessionId: aSessionId,
    size: 1000,
    status: aStatus,
    hasAudio: true,
    hasVideo: true,
    outputMode: aOptions.outputMode || 'composite',
    url: 'http://nothing.to.see/here',
  };
  _archives[newArchive.id] = newArchive;

  return newArchive;
}

var Video = function (applicationId, privateKey) {
  return {
    createSession: (aOptions) => {
      var sessionInfo = {
        sessionId: 'mock-session-id',
      };
      return Promise.resolve(sessionInfo);
    },

    generateClientToken: (aOptions) => 'tokentoken',

    getArchive: (aArchiveId) => {
      if (_archives[aArchiveId]) {
        return Promise.resolve(_archives[aArchiveId]);
      }
      return Promise.reject(new Error('test getArchive error'));
    },

    searchArchives: (aArchiveId) => Promise.resolve([
      {
        archiveId: 'mock-archive-id-1',
        sessionId: 'mock-session-id',
        url: 'mock-url',
        createdAt: 1,
      },
    ]),

    deleteArchive: (aArchiveId) => {
      var archive = _archives[aArchiveId];
      if (archive) {
        archive.status = 'deleted';
        return Promise.resolve(_archives[aArchiveId]);
      }
      return Promise.reject(new Error('test deleteArchive error'));
    },

    startArchive: (aSessionId, aArchiveOptions) => new Promise((resolve) => {
      var archive = new FakeArchive(aSessionId, aArchiveOptions, 'started');
      setTimeout(resolve(archive), 100);
    }),

    stopArchive: (aArchiveId) => new Promise((resolve) => {
      var archive = new FakeArchive('testSessionId', {}, 'stopped');
      setTimeout(resolve(archive), 100);
    }),
  };
};

module.exports = { Video };
