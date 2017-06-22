var AudioContext = window.AudioContext || window.webkitAudioContext;
var $ = document.getElementById.bind(document);

function chore() {
  if (chore.done) {
    return;
  }
  chore.done = true;

  var bufSrc = audioContext.createBufferSource();

  bufSrc.buffer = audioContext.createBuffer(1, 4, audioContext.sampleRate);
  bufSrc.start(0);
  bufSrc.stop(bufSrc.buffer.duration);
  bufSrc.connect(audioContext.destination);
  bufSrc.disconnect();
}

window.addEventListener("DOMContentLoaded", function() {
  var isPlaying = false;

  $("button").addEventListener("click", function(e) {
    isPlaying = !isPlaying;

    if (isPlaying) {
      chore();
      start();
      e.target.textContent = "Stop";
    } else {
      stop();
      e.target.textContent = "Start";
    }
  });
});








var audioContext = new AudioContext();
var sched = new WebAudioScheduler({ context: audioContext });
var masterGain = null;


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



// Fix up prefixing
window.AudioContext = window.AudioContext || window.webkitAudioContext;
// var context = new AudioContext();

function attachSound(key, request) {
  audioContext.decodeAudioData(request.response, function(buffer) {
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
    //   audioContext.decodeAudioData(request.response, function(buffer) {
    //     sounds[key] = buffer;
    //   }, function(e) { console.log(e); });
    // }
    request.send();
  }
}

function playSound(buffer) {
  var source = audioContext.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(audioContext.destination);       // connect the source to the context's destination (the speakers)
  source.start(0);                           // play the source now
                                             // note: on older systems, may have to use deprecated noteOn(time);
}




function metronome(e) {
  var t0 = e.playbackTime;

  for (var i in ticks) {
    tick = ticks[i];
    t = t0 + (ticks[0]-parseInt(tick))

    if(parseInt(tick) > 60) {
      sched.insert(t, ticktack, { frequency: 880, duration: 0.2 });
    } else if(sounds[tick]) {
      sched.insert(t, playSound.bind(this, sounds[tick]));
    } else {
      sched.insert(t, ticktack, { frequency: 440, duration: 0.2 });
    }
  }
}

function ticktack(e) {
  var t0 = e.playbackTime;
  var t1 = t0 + e.args.duration;
  var osc = audioContext.createOscillator();
  var amp = audioContext.createGain();

  osc.frequency.value = e.args.frequency;
  osc.start(t0);
  osc.stop(t1);
  osc.connect(amp);

  amp.gain.setValueAtTime(0.5, t0);
  amp.gain.exponentialRampToValueAtTime(1e-6, t1);
  amp.connect(masterGain);

  sched.nextTick(t1, function() {
    osc.disconnect();
    amp.disconnect();
  });
}

sched.on("start", function() {
  masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
});

sched.on("stop", function() {
  masterGain.disconnect();
  masterGain = null;
});

function start() {
  sched.start(metronome);
}

function stop() {
  sched.stop(true);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    sched.aheadTime = 0.1;
  } else {
    sched.aheadTime = 1.0;
    sched.process();
  }
});
