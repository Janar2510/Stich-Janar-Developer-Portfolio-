"use client";

// LaserFlow — volumetric light-shaft shader, ported from React Bits.
//
// Upstream ships against three.js. This port runs on ogl, which the site
// already carries for WarpText — adding three would have meant ~150KB gzipped
// and two WebGL libraries doing the same fullscreen-shader job. The port is
// mechanical because the effect samples no textures: only the renderer
// scaffolding and the GLSL version changed, the maths is untouched.
//
// Deviations from upstream, all deliberate:
//   - GLSL ES 1.00 -> 3.00. `fwidth` is core in 3.00, so the
//     GL_OES_standard_derivatives extension and its #ifdef fallback are gone.
//   - The canvas stays opaque, as upstream. This matters: the shader's colour
//     and its alpha both track the same luminance, so compositing it as a
//     transparent layer multiplies the two and renders the effect roughly
//     squared — near-invisible. The surface colour is instead passed in as
//     `backgroundColor` and added in the shader, which keeps the component
//     usable on any solid surface without paying that cost.
//   - prefers-reduced-motion is honoured: upstream has no handling at all, and
//     a requestAnimationFrame loop is untouched by the global CSS collapse in
//     globals.css. Reduced motion paints one static frame and never starts the
//     loop.
//
// Styles live in globals.css alongside the other component classes.

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

const VERT = `#version 300 es
in vec2 position;
void main(){
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
precision mediump int;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform float uWispDensity;
uniform float uTiltScale;
uniform float uFlowTime;
uniform float uFogTime;
uniform float uBeamXFrac;
uniform float uBeamYFrac;
uniform float uFlowSpeed;
uniform float uVLenFactor;
uniform float uHLenFactor;
uniform float uFogIntensity;
uniform float uFogScale;
uniform float uWSpeed;
uniform float uWIntensity;
uniform float uFlowStrength;
uniform float uDecay;
uniform float uFalloffStart;
uniform float uFogFallSpeed;
uniform vec3 uColor;
uniform float uFade;
uniform vec3 uBackground;

out vec4 fragColor;

// Core beam/flare shaping and dynamics
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPS 1e-6
#define EDGE_SOFT (DT_LOCAL*4.0)
#define DT_LOCAL 0.0038
#define TAP_RADIUS 6
#define R_H 150.0
#define R_V 150.0
#define FLARE_HEIGHT 16.0
#define FLARE_AMOUNT 8.0
#define FLARE_EXP 2.0
#define TOP_FADE_START 0.1
#define TOP_FADE_EXP 1.0
#define FLOW_PERIOD 0.5
#define FLOW_SHARPNESS 1.5

// Wisps (animated micro-streaks) that travel along the beam
#define W_BASE_X 1.5
#define W_LAYER_GAP 0.25
#define W_LANES 10
#define W_SIDE_DECAY 0.5
#define W_HALF 0.01
#define W_AA 0.15
#define W_CELL 20.0
#define W_SEG_MIN 0.01
#define W_SEG_MAX 0.55
#define W_CURVE_AMOUNT 15.0
#define W_CURVE_RANGE (FLARE_HEIGHT - 3.0)
#define W_BOTTOM_EXP 10.0

// Volumetric fog controls
#define FOG_ON 1
#define FOG_CONTRAST 1.2
#define FOG_SPEED_U 0.1
#define FOG_SPEED_V -0.1
#define FOG_OCTAVES 5
#define FOG_BOTTOM_BIAS 0.8
#define FOG_TILT_TO_MOUSE 0.05
#define FOG_TILT_DEADZONE 0.01
#define FOG_TILT_MAX_X 0.35
#define FOG_TILT_SHAPE 1.5
#define FOG_BEAM_MIN 0.0
#define FOG_BEAM_MAX 0.75
#define FOG_MASK_GAMMA 0.5
#define FOG_EXPAND_SHAPE 12.2
#define FOG_EDGE_MIX 0.5

// Horizontal vignette for the fog volume
#define HFOG_EDGE_START 0.20
#define HFOG_EDGE_END 0.98
#define HFOG_EDGE_GAMMA 1.4
#define HFOG_Y_RADIUS 25.0
#define HFOG_Y_SOFT 60.0

// Beam extents and edge masking
#define EDGE_X0 0.22
#define EDGE_X1 0.995
#define EDGE_X_GAMMA 1.25
#define EDGE_LUMA_T0 0.0
#define EDGE_LUMA_T1 2.0
#define DITHER_STRENGTH 1.0

float g(float x){return x<=0.00031308?12.92*x:1.055*pow(x,1.0/2.4)-0.055;}
float bs(vec2 p,vec2 q,float powr){
    float d=distance(p,q),f=powr*uFalloffStart,r=(f*f)/(d*d+EPS);
    return powr*min(1.0,r);
}
float bsa(vec2 p,vec2 q,float powr,vec2 s){
    vec2 d=p-q; float dd=(d.x*d.x)/(s.x*s.x)+(d.y*d.y)/(s.y*s.y),f=powr*uFalloffStart,r=(f*f)/(dd+EPS);
    return powr*min(1.0,r);
}
float tri01(float x){float f=fract(x);return 1.0-abs(f*2.0-1.0);}
float tauWf(float t,float tmin,float tmax){float a=smoothstep(tmin,tmin+EDGE_SOFT,t),b=1.0-smoothstep(tmax-EDGE_SOFT,tmax,t);return max(0.0,a*b);}
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+34.123);return fract(p.x*p.y);}
float vnoise(vec2 p){
    vec2 i=floor(p),f=fract(p);
    float a=h21(i),b=h21(i+vec2(1,0)),c=h21(i+vec2(0,1)),d=h21(i+vec2(1,1));
    vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm2(vec2 p){
    float v=0.0,amp=0.6; mat2 m=mat2(0.86,0.5,-0.5,0.86);
    for(int i=0;i<FOG_OCTAVES;++i){v+=amp*vnoise(p); p=m*p*2.03+17.1; amp*=0.52;}
    return v;
}
float rGate(float x,float l){float a=smoothstep(0.0,W_AA,x),b=1.0-smoothstep(l,l+W_AA,x);return max(0.0,a*b);}
float flareY(float y){float t=clamp(1.0-(clamp(y,0.0,FLARE_HEIGHT)/max(FLARE_HEIGHT,EPS)),0.0,1.0);return pow(t,FLARE_EXP);}

float vWisps(vec2 uv,float topF){
    float y=uv.y,yf=(y+uFlowTime*uWSpeed)/W_CELL;
    float dRaw=clamp(uWispDensity,0.0,2.0),d=dRaw<=0.0?1.0:dRaw;
    float lanesF=floor(float(W_LANES)*min(d,1.0)+0.5);
    int lanes=int(max(1.0,lanesF));
    float sp=min(d,1.0),ep=max(d-1.0,0.0);
    float fm=flareY(max(y,0.0)),rm=clamp(1.0-(y/max(W_CURVE_RANGE,EPS)),0.0,1.0),cm=fm*rm;
    const float G=0.05; float xS=1.0+(FLARE_AMOUNT*W_CURVE_AMOUNT*G)*cm;
    float sPix=clamp(y/R_V,0.0,1.0),bGain=pow(1.0-sPix,W_BOTTOM_EXP),sum=0.0;
    for(int s=0;s<2;++s){
        float sgn=s==0?-1.0:1.0;
        for(int i=0;i<W_LANES;++i){
            if(i>=lanes) break;
            float off=W_BASE_X+float(i)*W_LAYER_GAP,xc=sgn*(off*xS);
            float dx=abs(uv.x-xc),lat=1.0-smoothstep(W_HALF,W_HALF+W_AA,dx),amp=exp(-off*W_SIDE_DECAY);
            float seed=h21(vec2(off,sgn*17.0)),yf2=yf+seed*7.0,ci=floor(yf2),fy=fract(yf2);
            float seg=mix(W_SEG_MIN,W_SEG_MAX,h21(vec2(ci,off*2.3)));
            float spR=h21(vec2(ci,off+sgn*31.0)),seg1=rGate(fy,seg)*step(spR,sp);
            if(ep>0.0){float spR2=h21(vec2(ci*3.1+7.0,off*5.3+sgn*13.0)); float f2=fract(fy+0.5); seg1+=rGate(f2,seg*0.9)*step(spR2,ep);}
            sum+=amp*lat*seg1;
        }
    }
    float span=smoothstep(-3.0,0.0,y)*(1.0-smoothstep(R_V-6.0,R_V,y));
    return uWIntensity*sum*topF*bGain*span;
}

void mainImage(out vec4 fc,in vec2 frag){
    vec2 C=iResolution.xy*.5; float invW=1.0/max(C.x,1.0);
    vec2 sc=(512.0/iResolution.xy)*.4;
    vec2 uv=(frag-C)*sc,off=vec2(uBeamXFrac*iResolution.x*sc.x,uBeamYFrac*iResolution.y*sc.y);
    vec2 uvc = uv - off;
    float a=0.0,b=0.0;
    float basePhase=1.5*PI+uDecay*.5; float tauMin=basePhase-uDecay; float tauMax=basePhase;
    float cx=clamp(uvc.x/(R_H*uHLenFactor),-1.0,1.0),tH=clamp(TWO_PI-acos(cx),tauMin,tauMax);
    for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
        float tu=tH+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;
        float spd=max(abs(sin(tu)),0.02),u=clamp((basePhase-tu)/max(uDecay,EPS),0.0,1.0),env=pow(1.0-abs(u*2.0-1.0),0.8);
        vec2 p=vec2((R_H*uHLenFactor)*cos(tu),0.0);
        a+=wt*bs(uvc,p,env*spd);
    }
    float yPix=uvc.y,cy=clamp(-yPix/(R_V*uVLenFactor),-1.0,1.0),tV=clamp(TWO_PI-acos(cy),tauMin,tauMax);
    for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
        float tu=tV+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;
        float yb=(-R_V)*cos(tu),s=clamp(yb/R_V,0.0,1.0),spd=max(abs(sin(tu)),0.02);
        float env=pow(1.0-s,0.6)*spd;
        float cap=1.0-smoothstep(TOP_FADE_START,1.0,s); cap=pow(cap,TOP_FADE_EXP); env*=cap;
        float ph=s/max(FLOW_PERIOD,EPS)+uFlowTime*uFlowSpeed;
        float fl=pow(tri01(ph),FLOW_SHARPNESS);
        env*=mix(1.0-uFlowStrength,1.0,fl);
        float yp=(-R_V*uVLenFactor)*cos(tu),m=pow(smoothstep(FLARE_HEIGHT,0.0,yp),FLARE_EXP),wx=1.0+FLARE_AMOUNT*m;
        vec2 sig=vec2(wx,1.0),p=vec2(0.0,yp);
        float mask=step(0.0,yp);
        b+=wt*bsa(uvc,p,mask*env,sig);
    }
    float sPix=clamp(yPix/R_V,0.0,1.0),topA=pow(1.0-smoothstep(TOP_FADE_START,1.0,sPix),TOP_FADE_EXP);
    float L=a+b*topA;
    float w=vWisps(vec2(uvc.x,yPix),topA);
    float fog=0.0;
#if FOG_ON
    vec2 fuv=uvc*uFogScale;
    float mAct=step(1.0,length(iMouse.xy)),nx=((iMouse.x-C.x)*invW)*mAct;
    float ax = abs(nx);
    float stMag = mix(ax, pow(ax, FOG_TILT_SHAPE), 0.35);
    float st = sign(nx) * stMag * uTiltScale;
    st = clamp(st, -FOG_TILT_MAX_X, FOG_TILT_MAX_X);
    vec2 dir=normalize(vec2(st,1.0));
    fuv+=uFogTime*uFogFallSpeed*dir;
    vec2 prp=vec2(-dir.y,dir.x);
    fuv+=prp*(0.08*sin(dot(uvc,prp)*0.08+uFogTime*0.9));
    float n=fbm2(fuv+vec2(fbm2(fuv+vec2(7.3,2.1)),fbm2(fuv+vec2(-3.7,5.9)))*0.6);
    n=pow(clamp(n,0.0,1.0),FOG_CONTRAST);
    float pixW = 1.0 / max(iResolution.y, 1.0);
    // fwidth is core in GLSL ES 3.00 — upstream's derivatives-extension guard
    // and its constant fallback are unnecessary here.
    float wL = max(fwidth(L), pixW);
    float m0=pow(smoothstep(FOG_BEAM_MIN - wL, FOG_BEAM_MAX + wL, L),FOG_MASK_GAMMA);
    float bm=1.0-pow(1.0-m0,FOG_EXPAND_SHAPE); bm=mix(bm*m0,bm,FOG_EDGE_MIX);
    float yP=1.0-smoothstep(HFOG_Y_RADIUS,HFOG_Y_RADIUS+HFOG_Y_SOFT,abs(yPix));
    float nxF=abs((frag.x-C.x)*invW),hE=1.0-smoothstep(HFOG_EDGE_START,HFOG_EDGE_END,nxF); hE=pow(clamp(hE,0.0,1.0),HFOG_EDGE_GAMMA);
    float hW=mix(1.0,hE,clamp(yP,0.0,1.0));
    float bBias=mix(1.0,1.0-sPix,FOG_BOTTOM_BIAS);
    float browserFogIntensity = uFogIntensity;
    browserFogIntensity *= 1.8;
    float radialFade = 1.0 - smoothstep(0.0, 0.7, length(uvc) / 120.0);
    float safariFog = n * browserFogIntensity * bBias * bm * hW * radialFade;
    fog = safariFog;
#endif
    float LF=L+fog;
    float dith=(h21(frag)-0.5)*(DITHER_STRENGTH/255.0);
    float tone=g(LF+w);
    vec3 col=tone*uColor+dith;
    float nxE=abs((frag.x-C.x)*invW),xF=pow(clamp(1.0-smoothstep(EDGE_X0,EDGE_X1,nxE),0.0,1.0),EDGE_X_GAMMA);
    float scene=LF+max(0.0,w)*0.5,hi=smoothstep(EDGE_LUMA_T0,EDGE_LUMA_T1,scene);
    float eM=mix(xF,1.0,hi);
    col*=eM;
    col*=uFade;
    // Opaque output. The effect is emitted light, so it sums onto the surface
    // colour rather than being blended against it — see the note at the top of
    // this file for why alpha compositing squares the result and kills it.
    fc=vec4(col+uBackground,1.0);
}

void main(){
  vec4 fc;
  mainImage(fc, gl_FragCoord.xy);
  fragColor = fc;
}
`;

type LaserProgram = Program & {
  uniforms: Record<string, { value: number | Float32Array }>;
};

export interface LaserFlowProps {
  /** Horizontal offset of the beam (0–1 of canvas width). */
  horizontalBeamOffset?: number;
  /** Vertical offset of the beam (0–1 of canvas height). */
  verticalBeamOffset?: number;
  /** Horizontal sizing factor of the beam footprint. */
  horizontalSizing?: number;
  /** Vertical sizing factor of the beam footprint. */
  verticalSizing?: number;
  /** Density of micro-streak wisps. 0 disables them. */
  wispDensity?: number;
  /** Speed of wisp motion. */
  wispSpeed?: number;
  /** Brightness of wisps. */
  wispIntensity?: number;
  /** Speed of the beam's flow modulation. */
  flowSpeed?: number;
  /** Strength of the beam's flow modulation. */
  flowStrength?: number;
  /** Overall volumetric fog intensity. */
  fogIntensity?: number;
  /** Spatial scale for the fog noise. */
  fogScale?: number;
  /** Drift speed for the fog field. */
  fogFallSpeed?: number;
  /** How much pointer x tilts the fog volume. */
  mouseTiltStrength?: number;
  /** Pointer smoothing time (seconds). */
  mouseSmoothTime?: number;
  /** Beam decay shaping for the sampling envelope. */
  decay?: number;
  /** Falloff start radius used in inverse-square blending. */
  falloffStart?: number;
  /** Device pixel ratio override. Defaults to the device value, capped at 2. */
  dpr?: number;
  /** Beam colour (hex). Defaults to the site accent. */
  color?: string;
  /**
   * Colour of the surface this sits on (hex). The canvas is opaque, so this has
   * to match the section behind it or the panel will read as a visible block.
   */
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const hexToRGB = (hex: string) => {
  let c = hex.trim();
  if (c[0] === "#") c = c.slice(1);
  if (c.length === 3) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }
  // Upstream falls back with `parseInt(...) || 0xffffff`, which turns pure black
  // into white because 0 is falsy. That is harmless for a beam colour but not
  // for `backgroundColor`, where #000000 is the common case.
  const parsed = parseInt(c.slice(0, 6), 16);
  const n = Number.isNaN(parsed) ? 0xffffff : parsed;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

export default function LaserFlow({
  horizontalBeamOffset = 0.1,
  verticalBeamOffset = 0.0,
  horizontalSizing = 0.5,
  verticalSizing = 2.0,
  wispDensity = 1,
  wispSpeed = 15.0,
  wispIntensity = 5.0,
  flowSpeed = 0.35,
  flowStrength = 0.25,
  fogIntensity = 0.45,
  fogScale = 0.3,
  fogFallSpeed = 0.6,
  mouseTiltStrength = 0.01,
  mouseSmoothTime = 0.0,
  decay = 1.1,
  falloffStart = 1.2,
  dpr,
  color = "#FF4800",
  backgroundColor = "#000000",
  className = "",
  style,
}: LaserFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<LaserProgram | null>(null);

  // Props are read through a ref inside the render loop so changing one does
  // not tear down and rebuild the WebGL context.
  const propsRef = useRef({
    horizontalBeamOffset,
    verticalBeamOffset,
    horizontalSizing,
    verticalSizing,
    wispDensity,
    wispSpeed,
    wispIntensity,
    flowSpeed,
    flowStrength,
    fogIntensity,
    fogScale,
    fogFallSpeed,
    mouseTiltStrength,
    mouseSmoothTime,
    decay,
    falloffStart,
    color,
    backgroundColor,
  });

  useEffect(() => {
    propsRef.current = {
      horizontalBeamOffset,
      verticalBeamOffset,
      horizontalSizing,
      verticalSizing,
      wispDensity,
      wispSpeed,
      wispIntensity,
      flowSpeed,
      flowStrength,
      fogIntensity,
      fogScale,
      fogFallSpeed,
      mouseTiltStrength,
      mouseSmoothTime,
      decay,
      falloffStart,
      color,
      backgroundColor,
    };

    const program = programRef.current;
    if (!program) return;
    const u = program.uniforms;
    u.uBeamXFrac.value = horizontalBeamOffset;
    u.uBeamYFrac.value = verticalBeamOffset;
    u.uHLenFactor.value = horizontalSizing;
    u.uVLenFactor.value = verticalSizing;
    u.uWispDensity.value = wispDensity;
    u.uWSpeed.value = wispSpeed;
    u.uWIntensity.value = wispIntensity;
    u.uFlowSpeed.value = flowSpeed;
    u.uFlowStrength.value = flowStrength;
    u.uFogIntensity.value = fogIntensity;
    u.uFogScale.value = fogScale;
    u.uFogFallSpeed.value = fogFallSpeed;
    u.uTiltScale.value = mouseTiltStrength;
    u.uDecay.value = decay;
    u.uFalloffStart.value = falloffStart;
    (u.uColor.value as Float32Array).set(hexToRGB(color));
    (u.uBackground.value as Float32Array).set(hexToRGB(backgroundColor));
  }, [
    horizontalBeamOffset,
    verticalBeamOffset,
    horizontalSizing,
    verticalSizing,
    wispDensity,
    wispSpeed,
    wispIntensity,
    flowSpeed,
    flowStrength,
    fogIntensity,
    fogScale,
    fogFallSpeed,
    mouseTiltStrength,
    mouseSmoothTime,
    decay,
    falloffStart,
    color,
    backgroundColor,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return undefined;

    let renderer: Renderer;
    let gl: Renderer["gl"];
    let raf = 0;
    let disposed = false;
    let contextLost = false;
    let visible = true;
    let pageVisible = !document.hidden;
    let reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const p = propsRef.current;
    const baseDpr = Math.min(dpr ?? (window.devicePixelRatio || 1), 2);
    let currentDpr = baseDpr;

    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        dpr: currentDpr,
      });
      gl = renderer.gl;
    } catch (error) {
      console.warn("LaserFlow: WebGL could not be initialized.", error);
      return undefined;
    }

    gl.clearColor(0, 0, 0, 1);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1, 1]) },
        iMouse: { value: new Float32Array([0, 0, 0, 0]) },
        uWispDensity: { value: p.wispDensity },
        uTiltScale: { value: p.mouseTiltStrength },
        uFlowTime: { value: 0 },
        uFogTime: { value: 0 },
        uBeamXFrac: { value: p.horizontalBeamOffset },
        uBeamYFrac: { value: p.verticalBeamOffset },
        uFlowSpeed: { value: p.flowSpeed },
        uVLenFactor: { value: p.verticalSizing },
        uHLenFactor: { value: p.horizontalSizing },
        uFogIntensity: { value: p.fogIntensity },
        uFogScale: { value: p.fogScale },
        uWSpeed: { value: p.wispSpeed },
        uWIntensity: { value: p.wispIntensity },
        uFlowStrength: { value: p.flowStrength },
        uDecay: { value: p.decay },
        uFalloffStart: { value: p.falloffStart },
        uFogFallSpeed: { value: p.fogFallSpeed },
        uColor: { value: new Float32Array(hexToRGB(p.color)) },
        uBackground: { value: new Float32Array(hexToRGB(p.backgroundColor)) },
        // Reduced motion skips the fade-in entirely and paints at full opacity.
        uFade: { value: reduceMotion ? 1 : 0 },
      },
    }) as LaserProgram;
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });

    const renderOnce = () => {
      if (disposed || contextLost) return;
      renderer.render({ scene: mesh });
    };

    const resize = () => {
      if (disposed || contextLost) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      renderer.dpr = currentDpr;
      renderer.setSize(rect.width, rect.height);
      const res = program.uniforms.iResolution.value as Float32Array;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
      res[2] = currentDpr;
      renderOnce();
    };

    let resizeRaf = 0;
    const scheduleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    };

    // Pointer only tilts the fog volume. Listeners sit on window rather than on
    // the canvas: the container is pointer-events:none so clicks reach the CTA
    // above it, which means canvas-level events would never fire. Outside the
    // canvas bounds the target resets to the origin, which the shader reads as
    // "no pointer" via its step(1.0, length(iMouse.xy)) gate.
    // Under reduced motion no listener is attached at all.
    const mouseTarget = { x: 0, y: 0 };
    const mouseSmooth = { x: 0, y: 0 };
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouseTarget.x = 0;
        mouseTarget.y = 0;
        return;
      }
      mouseTarget.x = x * currentDpr;
      mouseTarget.y = (rect.height - y) * currentDpr;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onContextRestored = () => {
      contextLost = false;
      scheduleResize();
      startLoop();
    };

    // Adaptive resolution: the shader is fill-rate bound, so a weak GPU is
    // rescued by dropping DPR rather than by dropping frames.
    let fpsSamples: number[] = [];
    let lastFpsCheck = performance.now();
    let lastDprChange = 0;
    let emaDt = 16.7;
    const adjustDpr = (now: number) => {
      if (now - lastFpsCheck < 750) return;
      if (fpsSamples.length === 0) {
        lastFpsCheck = now;
        return;
      }
      const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
      let next = currentDpr;
      if (avgFps < 50) next = Math.max(0.6, currentDpr * 0.85);
      else if (avgFps > 58 && currentDpr < baseDpr) next = Math.min(baseDpr, currentDpr * 1.1);

      if (Math.abs(next - currentDpr) > 0.01 && now - lastDprChange > 2000) {
        currentDpr = next;
        lastDprChange = now;
        resize();
      }
      fpsSamples = [];
      lastFpsCheck = now;
    };

    const start = performance.now();
    let prev = 0;
    let fade = reduceMotion ? 1 : 0;

    const loop = (now: number) => {
      if (disposed || contextLost) return;

      const t = (now - start) * 0.001;
      const dt = Math.max(0, t - prev);
      prev = t;

      const dtMs = dt * 1000;
      emaDt = emaDt * 0.9 + dtMs * 0.1;
      fpsSamples.push(1000 / Math.max(1, emaDt));

      const cdt = Math.min(0.033, Math.max(0.001, dt));
      program.uniforms.iTime.value = t;
      program.uniforms.uFlowTime.value = (program.uniforms.uFlowTime.value as number) + cdt;
      program.uniforms.uFogTime.value = (program.uniforms.uFogTime.value as number) + cdt;

      if (fade < 1) {
        fade = Math.min(1, fade + cdt / 1.0);
        program.uniforms.uFade.value = fade;
      }

      const tau = Math.max(1e-3, propsRef.current.mouseSmoothTime);
      const alpha = 1 - Math.exp(-cdt / tau);
      mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * alpha;
      mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * alpha;
      const mouse = program.uniforms.iMouse.value as Float32Array;
      mouse[0] = mouseSmooth.x;
      mouse[1] = mouseSmooth.y;

      renderOnce();
      adjustDpr(performance.now());
      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      // Reduced motion never animates: resize() has already painted the static
      // frame, and starting the loop is exactly what the preference forbids.
      if (reduceMotion) return;
      if (!raf && !disposed && !contextLost && visible && pageVisible) {
        raf = requestAnimationFrame(loop);
      }
    };
    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) startLoop();
      else stopLoop();
    };

    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onReducedMotion = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        stopLoop();
        program.uniforms.uFade.value = 1;
        renderOnce();
      } else {
        startLoop();
      }
    };

    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(container);

    // The loop only runs while the section is on screen and the tab is focused,
    // so a home page parked above this section costs nothing.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    if (!reduceMotion) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);
    document.addEventListener("visibilitychange", onVisibility);
    mediaQuery?.addEventListener("change", onReducedMotion);

    resize();
    startLoop();

    return () => {
      disposed = true;
      programRef.current = null;
      stopLoop();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      document.removeEventListener("visibilitychange", onVisibility);
      mediaQuery?.removeEventListener("change", onReducedMotion);

      if (!contextLost) {
        try {
          geometry.remove?.();
          program.remove?.();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {}
      }
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
    // The context is built once; prop changes flow through the ref-sync effect
    // above rather than rebuilding it.
  }, [dpr]);

  return <div ref={containerRef} className={`laser-flow ${className}`.trim()} style={style} aria-hidden="true" />;
}
