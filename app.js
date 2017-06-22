var AudioContext = window.AudioContext || window.webkitAudioContext;
var $ = document.getElementById.bind(document);

var player = (function() {
  var self = {};

  self.audioContext = new AudioContext();
  self.sched = new WebAudioScheduler({ context: self.audioContext });
  self.masterGain = null;

  self.sounds = {}

  self.init = function() {
    if (self.init.done) {
      return;
    }
    self.init.done = true;

    var bufSrc = self.audioContext.createBufferSource();
    bufSrc.buffer = self.audioContext.createBuffer(1, 4, self.audioContext.sampleRate);
    bufSrc.start(0);
    bufSrc.stop(bufSrc.buffer.duration);
    bufSrc.connect(self.audioContext.destination);
    bufSrc.disconnect();
  }

  self.loadSound = function(key, url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    // request.onload = attachSound.bind(this, tick, request);
    request.onload = function() {
      self.audioContext.decodeAudioData(request.response, function(buffer) {
        self.sounds[key] = buffer;
      }, function(e) { console.log(e); });
    }
    request.send();
  }

  self.playSound = function(buffer) {
    var source = self.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(self.audioContext.destination);
    source.start(0);
  }

  self.sched.on("start", function() {
    self.masterGain = self.audioContext.createGain();
    self.masterGain.connect(self.audioContext.destination);
  });

  self.sched.on("stop", function() {
    self.masterGain.disconnect();
    self.masterGain = null;
  });

  document.addEventListener("visibilitychange", () => {
    console.log("vischange");
    if (document.visibilityState === "visible") {
      self.sched.aheadTime = 0.1;
    } else {
      self.sched.aheadTime = 1.0;
      self.sched.process();
    }
  });

  return self;
})();

var timer = (function() {
  var self = {};
  self.playing = false;

  // Countdown length in seconds.
  var countdownSecs = 60;
  // Number of warning ticks to play before the countdown.
  var preCountdownSecs = 10;
  // These ticks will be played as mp3 audio files.
  var audioTicks = [60,50,40,30,20,10,9,8,7,6,5,4,3,2,1,0];

  loadSounds = function() {
    for (var i in audioTicks) {
      tick = audioTicks[i];
      var url = 'audio/' + tick + '.mp3';
      player.loadSound(tick, url);
    }
  }();

  start = function() {
    player.init();
    player.sched.start(sequence);
  }

  stop = function() {
    player.sched.stop(true);
  }

  sequence = function(e) {
    var ticks = [];
    for (var i=countdownSecs+preCountdownSecs; i>=0; i--) {
      ticks.push(i);
    }

    var t0 = e.playbackTime;

    for (var i in ticks) {
      tick = ticks[i];
      t = t0 + (ticks[0]-parseInt(tick))

      if(parseInt(tick) > 60) {
        player.sched.insert(t, ticktack, { frequency: 880, duration: 0.2 });
      } else if(player.sounds[tick]) {
        player.sched.insert(t, player.playSound.bind(this, player.sounds[tick]));
      } else {
        player.sched.insert(t, ticktack, { frequency: 440, duration: 0.2 });
      }
    }
  }

  ticktack = function(e) {
    var t0 = e.playbackTime;
    var t1 = t0 + e.args.duration;
    var osc = player.audioContext.createOscillator();
    var amp = player.audioContext.createGain();

    osc.frequency.value = e.args.frequency;
    osc.start(t0);
    osc.stop(t1);
    osc.connect(amp);

    amp.gain.setValueAtTime(0.5, t0);
    amp.gain.exponentialRampToValueAtTime(1e-6, t1);
    amp.connect(player.masterGain);

    player.sched.nextTick(t1, function() {
      osc.disconnect();
      amp.disconnect();
    });
  }

  self.toggle = function() {
    self.playing = !self.playing;
    if (self.playing) {
      start();
      return "Stop";
    } else {
      stop();
      return "Start";
    }
  }

  return self;
})();

window.addEventListener("DOMContentLoaded", function() {
  $("button").addEventListener("click", function(e) {
    e.target.textContent = timer.toggle();
  });
});
