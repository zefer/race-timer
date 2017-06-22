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

  return self;
})();

var app = (function() {
  return {
  };
});

window.addEventListener("DOMContentLoaded", function() {
  var isPlaying = false;

  $("button").addEventListener("click", function(e) {
    isPlaying = !isPlaying;

    if (isPlaying) {
      player.init();
      start();
      e.target.textContent = "Stop";
    } else {
      stop();
      e.target.textContent = "Start";
    }
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

player.sched.on("start", function() {
  player.masterGain = player.audioContext.createGain();
  player.masterGain.connect(player.audioContext.destination);
});

player.sched.on("stop", function() {
  player.masterGain.disconnect();
  player.masterGain = null;
});

function start() {
  player.sched.start(sequence);
}

function stop() {
  player.sched.stop(true);
}

document.addEventListener("visibilitychange", () => {
  console.log("vischange");
  if (document.visibilityState === "visible") {
    player.sched.aheadTime = 0.1;
  } else {
    player.sched.aheadTime = 1.0;
    player.sched.process();
  }
});
