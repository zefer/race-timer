var AudioContext = window.AudioContext || window.webkitAudioContext;
var $ = document.getElementById.bind(document);

var player = (function() {
  var self = {};

  self.audioContext = new AudioContext();
  self.sched = new WebAudioScheduler({ context: self.audioContext });
  self.masterGain = null;

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

  start = function() {
    player.init();
    player.sched.start(sequence);
  }

  stop = function() {
    player.sched.stop(true);
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







var ticks = [];
for (var i=70; i>=0; i--) {
  ticks.push(i);
}
var audioTicks = [60,50,40,30,20,10,9,8,7,6,5,4,3,2,1,0];
var sounds = {}
for(var tick in audioTicks) {
  sounds[audioTicks[tick.toString()]] = null;
}
loadSounds();



function attachSound(key, request) {
  player.audioContext.decodeAudioData(request.response, function(buffer) {
    sounds[key] = buffer;
  }.bind(this), function(e) { console.log(e); });
}

function loadSounds() {
  for (var key in sounds) {
    var url = 'audio/' + key + '.mp3';
    var request = new XMLHttpRequest();

    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = attachSound.bind(this, key, request);
    // request.onload = function() {
    //   player.audioContext.decodeAudioData(request.response, function(buffer) {
    //     sounds[key] = buffer;
    //   }, function(e) { console.log(e); });
    // }
    request.send();
  }
}

function sequence(e) {
  var t0 = e.playbackTime;

  for (var i in ticks) {
    tick = ticks[i];
    t = t0 + (ticks[0]-parseInt(tick))

    if(parseInt(tick) > 60) {
      player.sched.insert(t, ticktack, { frequency: 880, duration: 0.2 });
    } else if(sounds[tick]) {
      player.sched.insert(t, player.playSound.bind(this, sounds[tick]));
    } else {
      player.sched.insert(t, ticktack, { frequency: 440, duration: 0.2 });
    }
  }
}

function ticktack(e) {
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
