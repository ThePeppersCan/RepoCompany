/* Runs on the audio thread so sensitivity keeps working when the client is hidden. */
class RepoVoiceGate extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'threshold',defaultValue:-55,minValue:-75,maxValue:-10,automationRate:'k-rate'},
    {name:'enabled',defaultValue:1,minValue:0,maxValue:1,automationRate:'k-rate'},
    {name:'muted',defaultValue:0,minValue:0,maxValue:1,automationRate:'k-rate'}
  ]; }
  constructor(){super();this.gain=0;this.hold=0;this.frames=0;this.peak=0;}
  process(inputs,outputs,p){
    const input=inputs[0]?.[0],output=outputs[0]?.[0];if(!output)return true;
    let sum=0;for(const v of input||[])sum+=v*v;
    const rms=Math.sqrt(sum/(input?.length||1)),threshold=10**(p.threshold[0]/20);
    if(rms>threshold*(this.hold>0?.72:1))this.hold=sampleRate*.18;
    else this.hold=Math.max(0,this.hold-output.length);
    const open=p.muted[0]<.5&&(p.enabled[0]<.5||this.hold>0),target=open?1:0;
    const coefficient=1-Math.exp(-1/(sampleRate*(open?.004:.045)));
    for(let i=0;i<output.length;i++){
      this.gain+=(target-this.gain)*coefficient;
      output[i]=p.muted[0]>.5?0:(input?.[i]||0)*this.gain;
    }
    this.peak=Math.max(this.peak,rms);this.frames+=output.length;
    if(this.frames>=sampleRate/10){this.port.postMessage({db:Math.max(-90,20*Math.log10(this.peak||1e-9)),open:open&&this.peak>.0001});this.frames=0;this.peak=0;}
    return true;
  }
}
registerProcessor('repo-voice-gate',RepoVoiceGate);
