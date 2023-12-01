'use strict';

var sinon = require('sinon');
var RealVideo = require('@vonage/video').Video;

function Video(credentials, options) {
  var _archives = {};
  function FakeArchive(aSessionId, aOptions, aStatus) {
    var newArchive = {
      createdAt: Date.now(),
      duration: '100000',
      id: String(Math.random() + '').replace('.', '_'),
      name: aOptions.name || 'unnamed',
      parnerId: '0xdeadcafe26',
      reason: 'unknown',
      sessionId: aSessionId,
      size: 1000,
      status: aStatus,
      hasAudio: true,
      hasVideo: true,
      outputMode: aOptions.outputMode || 'composite',
      url: 'http://nothing.to.see/here5959559',
    };
    _archives[newArchive.id] = newArchive;

    return newArchive;
  }

  var video = new RealVideo(credentials, options);

  Video.instances.push(video);

  // We must mock/stub some of the Video methods before the app is created
  // because they might be renamed/rebinded...
  sinon.stub(video, 'startArchive').callsFake((aSessionId, aArchiveOptions) => {
    console.log('fake startArchive');
    // setTimeout(() => new FakeArchive(aSessionId, aArchiveOptions, 'started'));
    return new Promise((reslove) => {
      reslove(new FakeArchive(aSessionId, aArchiveOptions, 'started'));
    });
  });

  sinon.stub(video, 'stopArchive').callsFake((aArchiveId) => new Promise((resolve) => {
    if (_archives[aArchiveId]) {
      _archives[aArchiveId].status = 'stopped';
    }
    return resolve(_archives[aArchiveId]);
  }));

  sinon.stub(video, 'getArchive').callsFake((aArchiveId) => new Promise((resolve) => resolve(_archives[aArchiveId])));

  sinon.stub(video, 'deleteArchive').callsFake((aArchiveId) => {
    delete _archives[newArchive.id];
    return new Promise((resolve) => resolve());
  });

  sinon.stub(video, 'searchArchives').callsFake((aOptions) => {
    var list = Object.keys(_archives).map((key) => _archives[key]);
    return new Promise((resolve) => resolve(list));
  });

  sinon.stub(video, 'createSession').callsFake((aOptions) => {
    var sessionInfo = {
      sessionId: '1' + Math.random(),
    };
    return new Promise((resolve) => resolve(sessionInfo));
  });

  sinon.stub(video, 'generateClientToken').callsFake((aOptions) => 'tokentoken');

  video._sinonRestore = function () {
    ['startArchive', 'stopArchive', 'getArchive', 'searchArchives', 'generateClientToken', 'createSession', 'deleteArchive'].forEach((method) => {
      video[method].restore();
    });
  };

  return video;
}

Video.instances = [];
Video.restoreInstances = function () {
  Video.instances.forEach((instance) => {
    instance._sinonRestore();
  });
};

module.exports = Video;
