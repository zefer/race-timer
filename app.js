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

function metronome(e) {
  var t0 = e.playbackTime;

  sched.insert(t0 + 0.000, ticktack, { frequency: 880, duration: 1.0 });
  sched.insert(t0 + 1.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 2.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 3.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 4.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 5.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 6.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 7.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 8.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 9.000, ticktack, { frequency: 440, duration: 0.2 });
  sched.insert(t0 + 10.000, metronome);
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
