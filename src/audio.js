export function createGameAudio() {
 let context;
 let enabled = true;
 const active = new Set();
 function setEnabled(value) {
  enabled = value;
  if (!value) for (const oscillator of active) oscillator.stop();
 }
 async function play(frequency = 440) {
  if (!enabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('This browser does not support game sound.');
  context ??= new AudioContextClass();
  // Browsers suspend audio until a user gesture. Schedule only after resume.
  if (context.state !== 'running') await context.resume();
  if (!enabled) return;
  const start = context.currentTime;
  const notes = frequency === 180 ? [180,240,180,280,200,300] : frequency === 660 ? [523,659,784] : [frequency];
  notes.forEach((note,index) => {
   const oscillator = context.createOscillator();
   const gain = context.createGain();
   const time = start + index * .14;
   oscillator.type = 'triangle';
   oscillator.frequency.value = note;
   gain.gain.setValueAtTime(0,time);
   gain.gain.linearRampToValueAtTime(.3,time+.015);
   gain.gain.exponentialRampToValueAtTime(.001,time+.28);
   oscillator.connect(gain);gain.connect(context.destination);
   active.add(oscillator);
   oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();gain.disconnect()};
   oscillator.start(time);oscillator.stop(time+.3);
  });
 }
 return {play,setEnabled};
}
