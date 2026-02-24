import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { supabase } from "./supabase.js";


const ABCJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/abcjs/6.4.1/abcjs-basic-min.js";
const INST_LIST = ["All","Alto Sax","Tenor Sax","Trumpet","Piano","Guitar","Trombone","Flute","Clarinet"];
const CAT_LIST = ["All","ii-V-I","Blues","Bebop","Modal","Pentatonic","Chromatic","Enclosure","Turnaround"];

// ============================================================
// THEMES
// ============================================================
const TH={
  classic:{
    name:"Classic",desc:"Light, editorial, elegant",
    bg:"#EEEDE6",card:"#fff",border:"#E0DFD8",borderSub:"#E8E7E3",
    text:"#1A1A1A",muted:"#8E8E93",subtle:"#B0AFA8",dimBorder:"#C5C4BE",
    accent:"#6366F1",accentBg:"rgba(99,102,241,0.08)",accentBorder:"rgba(99,102,241,0.2)",accentGlow:"rgba(99,102,241,0.2)",
    noteBg:"#FAFAF6",noteStroke:"#1A1A1A",staffStroke:"#D5D4CE",barStroke:"#C5C4BE",chordFill:"#6366F1",metaFill:"#8E8E93",
    headerBg:"rgba(238,237,230,0.88)",filterBg:"#E8E7E0",inputBg:"#FAFAF6",inputBorder:"#E0DFD8",
    titleFont:"'Instrument Serif',Georgia,serif",
    playBg:"#6366F1",progressBg:"#E8E7E3",pillBg:"#fff",pillBorder:"#E8E7E3",
    settingsBg:"#FAFAF6",
  },
  studio:{
    name:"Studio",desc:"Dark, vibrant, musician-first",
    bg:"#08080F",card:"#12121E",cardRaised:"#16162A",border:"#1C1C30",borderSub:"#252540",
    text:"#F2F2FA",muted:"#8888A0",subtle:"#55556A",dimBorder:"#333348",
    accent:"#22D89E",accentBg:"rgba(34,216,158,0.12)",accentBorder:"rgba(34,216,158,0.35)",accentGlow:"rgba(34,216,158,0.3)",
    noteBg:"#14142A",noteStroke:"#F2F2FA",staffStroke:"#6A6A84",barStroke:"#8585A0",chordFill:"#22D89E",metaFill:"#9898B0",
    headerBg:"rgba(14,14,26,0.97)",tabBarBg:"rgba(14,14,26,0.97)",filterBg:"#10101A",inputBg:"#10101A",inputBorder:"#1C1C30",
    titleFont:"'Inter',sans-serif",
    playBg:"linear-gradient(135deg,#22D89E,#1AB87A)",playFlat:"#22D89E",progressBg:"#1A1A28",pillBg:"#10101A",pillBorder:"#252540",
    settingsBg:"#0C0C16",
  }
};

// Category & instrument colors for Studio theme
const CAT_COL={"ii-V-I":"#22D89E","Blues":"#A78BFA","Bebop":"#F59E0B","Modal":"#3B82F6","Pentatonic":"#EC4899","Chromatic":"#EF4444","Enclosure":"#F97316","Turnaround":"#06B6D4"};
const INST_COL={"Alto Sax":"#A78BFA","Tenor Sax":"#8B5CF6","Trumpet":"#F59E0B","Piano":"#3B82F6","Guitar":"#EF4444","Trombone":"#F97316","Flute":"#EC4899","Clarinet":"#06B6D4"};
function getCatColor(cat,th){return th===TH.studio?(CAT_COL[cat]||th.accent):th.accent;}
function getInstColor(inst,th){return th===TH.studio?(INST_COL[inst]||th.accent):th.accent;}

// Custom SVG icons — designed, not emoji
const S=React.createElement;
const IC={
  flame:(sz=14,c="#F97316",active=true)=>{const uid="fg"+Math.random().toString(36).slice(2,8);
    return S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0,filter:active?"drop-shadow(0 0 4px rgba(249,115,22,0.5))":"none"}},
    S("defs",null,
      active&&S("linearGradient",{id:uid,x1:"0",y1:"0",x2:"0",y2:"1"},
        S("stop",{offset:"0%",stopColor:"#FBBF24"}),
        S("stop",{offset:"45%",stopColor:"#F97316"}),
        S("stop",{offset:"100%",stopColor:"#DC2626"}))),
    S("path",{d:"M12 1C12 1 8.5 5 8.5 9.5c0 1.5.5 2.8 1.2 3.8C8.2 12 7 10.2 7 10.2S5 12.5 5 15.5C5 19.6 8.1 23 12 23s7-3.4 7-7.5c0-3-2-5.3-2-5.3s-1.2 1.8-2.7 3.1c.7-1 1.2-2.3 1.2-3.8C15.5 5 12 1 12 1z",
      fill:active?"url(#"+uid+")":c,opacity:active?1:0.35,style:active?{animation:"flameFlicker 0.8s ease-in-out infinite",transformOrigin:"12px 23px"}:{}}),
    active&&S("path",{d:"M12 23c2.2 0 4-2.2 4-4.5 0-1.8-1.2-3.2-2-4.2-.4.8-1.2 1.4-1.2 1.4s-.8-1.5-.8-3c0 0-1.5 1.8-2 3.8-.3 1 .1 2.2.5 3 .6 1 1.5 1.8 1.5 3.5z",
      fill:"#FDE68A",opacity:0.8,style:{animation:"flameCore 1.2s ease-in-out infinite",transformOrigin:"12px 23px"}}));},
  flameOff:(sz=14)=>{const uid="fo"+Math.random().toString(36).slice(2,8);
    return S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("defs",null,S("linearGradient",{id:uid,x1:"0",y1:"0",x2:"0",y2:"1"},
      S("stop",{offset:"0%",stopColor:"#92400E",stopOpacity:0.3}),
      S("stop",{offset:"100%",stopColor:"#7C2D12",stopOpacity:0.18}))),
    S("path",{d:"M12 1C12 1 8.5 5 8.5 9.5c0 1.5.5 2.8 1.2 3.8C8.2 12 7 10.2 7 10.2S5 12.5 5 15.5C5 19.6 8.1 23 12 23s7-3.4 7-7.5c0-3-2-5.3-2-5.3s-1.2 1.8-2.7 3.1c.7-1 1.2-2.3 1.2-3.8C15.5 5 12 1 12 1z",
      fill:"url(#"+uid+")"}),
    S("path",{d:"M12 1C12 1 8.5 5 8.5 9.5c0 1.5.5 2.8 1.2 3.8C8.2 12 7 10.2 7 10.2S5 12.5 5 15.5C5 19.6 8.1 23 12 23s7-3.4 7-7.5c0-3-2-5.3-2-5.3s-1.2 1.8-2.7 3.1c.7-1 1.2-2.3 1.2-3.8C15.5 5 12 1 12 1z",
      stroke:"#B45309",strokeWidth:1.2,fill:"none",opacity:0.4}),
    S("path",{d:"M12 23c2.2 0 4-2.2 4-4.5 0-1.8-1.2-3.2-2-4.2-.4.8-1.2 1.4-1.2 1.4s-.8-1.5-.8-3c0 0-1.5 1.8-2 3.8-.3 1 .1 2.2.5 3 .6 1 1.5 1.8 1.5 3.5z",
      fill:"#B45309",opacity:0.12}));},
  target:(sz=14,c="#22D89E")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("circle",{cx:12,cy:12,r:10,stroke:c,strokeWidth:1.5,fill:"none"}),
    S("circle",{cx:12,cy:12,r:6,stroke:c,strokeWidth:1.5,fill:"none"}),
    S("circle",{cx:12,cy:12,r:2.5,fill:c})),
  targetOff:(sz=14,c="#55556A")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("circle",{cx:12,cy:12,r:10,stroke:c,strokeWidth:1.5,fill:"none"}),
    S("circle",{cx:12,cy:12,r:6,stroke:c,strokeWidth:1.5,fill:"none"}),
    S("circle",{cx:12,cy:12,r:2,stroke:c,strokeWidth:1,fill:"none"})),
  bolt:(sz=12,c="#fff")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M13 2L4 14h7l-1 8 9-12h-7l1-8z",fill:c})),
  arrowR:(sz=12,c="#22D89E")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M5 12h14m-6-6l6 6-6 6",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})),
  loop:(sz=12,c="#fff")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M17 2l4 4-4 4M7 22l-4-4 4-4",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}),
    S("path",{d:"M21 6H8a4 4 0 00-4 4v1M3 18h13a4 4 0 004-4v-1",stroke:c,strokeWidth:2,strokeLinecap:"round"})),
  code:(sz=12,c="#55556A")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M16 18l6-6-6-6M8 6l-6 6 6 6",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})),
  speed:(sz=12,c="#F97316")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M12 2a10 10 0 00-10 10h2a8 8 0 0116 0h2A10 10 0 0012 2z",fill:c,opacity:0.2}),
    S("path",{d:"M12 6l1 6 3.5 2",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})),
  slow:(sz=12,c="#8888A0")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("circle",{cx:12,cy:12,r:9,stroke:c,strokeWidth:1.5,fill:"none"}),
    S("path",{d:"M12 6v6l4 2",stroke:c,strokeWidth:1.5,strokeLinecap:"round"})),
  pip:(sz=6,c="#22D89E")=>S("svg",{width:sz,height:sz,viewBox:"0 0 10 10",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("circle",{cx:5,cy:5,r:4,fill:c})),
  // Tab bar icons — minimal stroked style
  tabLicks:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M9 18V5l12-2v13",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round",strokeLinejoin:"round"}),
    S("circle",{cx:6,cy:18,r:3,stroke:c,strokeWidth:a?2:1.5,fill:a?c:"none"}),
    S("circle",{cx:18,cy:16,r:3,stroke:c,strokeWidth:a?2:1.5,fill:a?c:"none"})),
  tabEar:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M6 12a6 6 0 1112 0c0 3.5-2 5-3 7-0.5 1-1 2-3 2s-2-1.5-2-2.5c0-1.5 2-2 2-4",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round",fill:"none"}),
    a&&S("circle",{cx:12,cy:11,r:2,fill:c})),
  tabRhythm:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M12 4v8",stroke:c,strokeWidth:a?2.5:1.5,strokeLinecap:"round"}),
    S("path",{d:"M5 20h14",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round"}),
    S("path",{d:"M12 12l-6 8",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round"}),
    S("circle",{cx:12,cy:3.5,r:2,stroke:c,strokeWidth:a?2:1.5,fill:a?c:"none"})),
  tabSettings:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("circle",{cx:12,cy:8,r:4,stroke:c,strokeWidth:a?2:1.5,fill:a?c+"30":"none"}),
    S("path",{d:"M4 21c0-4 3.6-7 8-7s8 3 8 7",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round",fill:"none"})),
  gear:(sz=20,c="#888")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M12 15a3 3 0 100-6 3 3 0 000 6z",stroke:c,strokeWidth:1.5}),
    S("path",{d:"M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",stroke:c,strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round"})),
  tabPractice:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("rect",{x:4,y:3,width:16,height:18,rx:2,stroke:c,strokeWidth:a?2:1.5,fill:a?c+"20":"none"}),
    S("path",{d:"M8 8h8M8 12h6M8 16h4",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round"})),
  tabTrain:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round",strokeLinejoin:"round",fill:a?c+"25":"none"})),
  tabSessions:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("rect",{x:3,y:4,width:18,height:17,rx:2,stroke:c,strokeWidth:a?2:1.5,fill:a?c+"15":"none"}),
    S("path",{d:"M3 9h18",stroke:c,strokeWidth:a?2:1.5}),
    S("path",{d:"M8 2v4M16 2v4",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round"}),
    a&&S("circle",{cx:12,cy:15,r:2,fill:c})),
  tabMe:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("circle",{cx:12,cy:8,r:4,stroke:c,strokeWidth:a?2:1.5,fill:a?c+"30":"none"}),
    S("path",{d:"M4 21c0-4 3.6-7 8-7s8 3 8 7",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round",fill:"none"})),
};

// Full-screen fire burst animation on like
function FireBurst({originX,originY,onDone}){
  const cvRef=useRef(null);
  useEffect(()=>{const cv=cvRef.current;if(!cv)return;const ctx=cv.getContext("2d");
    const dpr=window.devicePixelRatio||1;
    const W=window.innerWidth,H=window.innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+"px";cv.style.height=H+"px";ctx.scale(dpr,dpr);
    const cols=["#FBBF24","#F97316","#EF4444","#DC2626","#FDE68A","#FB923C","#FBBF24","#fff"];
    const ox=originX||W/2,oy=originY||H/2;
    const P=[];for(let i=0;i<55;i++){
      const a=Math.random()*Math.PI*2;const sp=(2+Math.random()*6)*(0.7+Math.random()*0.6);
      P.push({x:ox,y:oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-Math.random()*3,
        r:2+Math.random()*5,life:1,decay:0.012+Math.random()*0.015,
        col:cols[Math.floor(Math.random()*cols.length)],
        grav:0.06+Math.random()*0.04,trail:[]});}
    for(let i=0;i<8;i++){
      const a=Math.random()*Math.PI*2;
      P.push({x:ox,y:oy,vx:Math.cos(a)*(1+Math.random()*2),vy:-3-Math.random()*4,
        r:4+Math.random()*4,life:1,decay:0.008+Math.random()*0.008,
        col:cols[Math.floor(Math.random()*3)],grav:0.03,trail:[]});}
    let raf;let done=false;
    const finish=()=>{if(done)return;done=true;ctx.clearRect(0,0,W,H);if(onDone)onDone();};
    const draw=()=>{if(done)return;
      ctx.clearRect(0,0,W,H);let alive=0;
      for(const p of P){if(p.life<0.03){p.life=0;continue;}alive++;
        p.trail.push({x:p.x,y:p.y,a:p.life});if(p.trail.length>6)p.trail.shift();
        p.vy+=p.grav;p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;
        for(let i=0;i<p.trail.length;i++){const t2=p.trail[i];const ta=t2.a*0.3*(i/p.trail.length);
          if(ta<0.02)continue;
          ctx.beginPath();ctx.arc(t2.x,t2.y,p.r*0.6*(i/p.trail.length),0,Math.PI*2);
          ctx.fillStyle=p.col;ctx.globalAlpha=ta;ctx.fill();}
        if(p.life<0.03)continue;
        ctx.globalAlpha=p.life;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);
        ctx.fillStyle=p.col;ctx.fill();
        if(p.life>0.1){ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life*2.5,0,Math.PI*2);
        ctx.fillStyle=p.col;ctx.globalAlpha=p.life*0.15;ctx.fill();}}
      ctx.globalAlpha=1;
      if(alive>0){raf=requestAnimationFrame(draw);}else{finish();}};
    raf=requestAnimationFrame(draw);
    const safety=setTimeout(finish,2500);
    return()=>{cancelAnimationFrame(raf);clearTimeout(safety);ctx.clearRect(0,0,W,H);};
  },[]);
  return React.createElement("canvas",{ref:cvRef,style:{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:9998,pointerEvents:"none"}});}

// ============================================================
// COACH MARKS — anchored onboarding tooltips
// ============================================================
const FEED_TIPS=[
  {target:"[data-coach='daily']",text:"Daily pick — a fresh lick every morning",pos:"below"},
  {target:"[data-coach='flame']",text:"Flame your favourites",pos:"below"},
  {target:"[data-coach='fab']",text:"Add your own licks",pos:"above"},
];
const DETAIL_TIPS=[
  {target:"[data-coach='player']",text:"Slow down, loop, nail it",pos:"above"},
  {target:"[data-coach='transpose']",text:"Tap to play in your key",pos:"below"},
  {target:"[data-coach='metro']",text:"Progressive bumps tempo each loop",pos:"below"},
  {target:"[data-coach='ab-loop']",text:"Drag A/B to loop tricky bars",pos:"below"},
];
const EAR_TIPS=[
  {target:"[data-coach='ear-hints']",text:"Stuck? Use hints for starting note & chords",pos:"below"},
  {target:"[data-coach='ear-reveal']",text:"Played it back? Reveal to check yourself",pos:"above"},
];
const RHYTHM_TIPS=[
  {target:"[data-coach='rhythm-modes']",text:"Metronome, sight-reading & polyrhythms",pos:"below"},
  {target:"[data-coach='rhythm-metro']",text:"Tap the dots to set accents & mutes",pos:"below"},
];

function CoachMarks({tips,onDone,th}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const[idx,setIdx]=useState(0);
  const[show,setShow]=useState(false);
  const[gone,setGone]=useState(false);
  const accent=isStudio?t.accent:"#6366F1";
  const total=tips.length;

  // Slide in after short delay
  useEffect(()=>{const tm=setTimeout(()=>setShow(true),1000);return()=>clearTimeout(tm);},[]);

  // Auto-advance every 4s
  useEffect(()=>{
    if(!show||gone)return;
    const tm=setInterval(()=>{
      setIdx(p=>{if(p>=total-1){clearInterval(tm);return p;}return p+1;});
    },4000);
    return()=>clearInterval(tm);
  },[show,gone,total]);

  const dismiss=useCallback(()=>{
    setGone(true);setTimeout(onDone,350);
  },[onDone]);

  const next=useCallback((e)=>{
    if(e)e.stopPropagation();
    if(idx>=total-1)dismiss();
    else setIdx(i=>i+1);
  },[idx,total,dismiss]);

  if(gone&&!show)return null;

  return React.createElement("div",{onClick:next,style:{
    position:"fixed",bottom:"calc(68px + env(safe-area-inset-bottom, 0px))",left:12,right:12,zIndex:500,
    pointerEvents:"auto",cursor:"pointer",
    transform:show&&!gone?"translateY(0)":"translateY(120%)",
    opacity:show&&!gone?1:0,
    transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease"}},
    React.createElement("div",{style:{
      background:isStudio?"rgba(240,240,250,0.96)":"rgba(28,28,40,0.96)",
      backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
      border:"1px solid "+(isStudio?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.08)"),
      borderRadius:14,padding:"12px 16px",
      boxShadow:isStudio?"0 8px 32px rgba(0,0,0,0.3)":"0 8px 32px rgba(0,0,0,0.25)",
      display:"flex",alignItems:"center",gap:12}},
      // Accent pip
      React.createElement("div",{style:{width:6,height:6,borderRadius:3,background:accent,flexShrink:0,
        animation:"coachPulse 2s ease-in-out infinite"}}),
      // Tip text
      React.createElement("span",{key:idx,style:{flex:1,fontSize:12,color:isStudio?"#333":"#E8E8F0",
        fontFamily:"'Inter',sans-serif",fontWeight:500,lineHeight:1.4,
        animation:"coachIn 0.25s ease"}},tips[idx].text),
      // Dots + dismiss
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,flexShrink:0}},
        React.createElement("div",{style:{display:"flex",gap:3}},
          tips.map((_,i)=>React.createElement("div",{key:i,style:{
            width:i===idx?12:4,height:4,borderRadius:2,
            background:i===idx?accent:(isStudio?"#C0C0CC":"#555"),
            transition:"all 0.3s"}}))),
        React.createElement("button",{onClick:function(e){e.stopPropagation();dismiss();},style:{
          background:"none",border:"none",color:isStudio?"#888":"#999",
          fontSize:16,cursor:"pointer",padding:"0 0 0 4px",lineHeight:1}},"\u00D7"))));}

const SAMPLE_LICKS = [  { id:1, title:"Classic Charlie Parker ii-V-I", artist:"Charlie Parker", instrument:"Alto Sax", category:"ii-V-I", key:"C Major", tempo:180, abc:'X:1\nT:Parker ii-V-I\nM:4/4\nL:1/8\nQ:1/4=180\nK:C\n"Dm7"d2 fe dc BA | "G7"B2 AG ^FG AB | "Cmaj7"c4 z4 |', youtubeId:"hkDjOjfUbJM", youtubeStart:45, spotifyId:"4a7NbEGRb3MGnSJQyjsiv5", likes:234, user:"BirdLover42", tags:["bebop","essential"], description:"The quintessential Bird lick over a ii-V-I in C." },
  { id:2, title:"Coltrane Pentatonic Run", artist:"John Coltrane", instrument:"Tenor Sax", category:"Pentatonic", key:"Bb Major", tempo:160, abc:"X:1\nT:Coltrane Pentatonic\nM:4/4\nL:1/16\nQ:1/4=160\nK:Bb\n\"Bbmaj7\"B2cd efga | bagf edcB | \"Eb7\"e2fg abc'b | agfe dcBA |", youtubeId:"TsgGbgWDOuo", youtubeStart:120, spotifyId:"7aBo1GlChOBEEreEHqB7EY", likes:189, user:"TraneFanatic", tags:["modal","advanced"], description:"A flowing pentatonic idea from Trane's modal period." },
  { id:3, title:"Clifford Brown Turnaround", artist:"Clifford Brown", instrument:"Trumpet", category:"Turnaround", key:"F Major", tempo:140, abc:'X:1\nT:Brownie Turnaround\nM:4/4\nL:1/8\nQ:1/4=140\nK:F\n"Fmaj7"f2 ed cA GF | "D7"^F2 AB cd ef | "Gm7"g2 fe dc BA | "C7"G2 AB c4 |', youtubeId:"p9VOoYfIFek", youtubeStart:30, likes:156, user:"BrownieJazz", tags:["turnaround","hard-bop"], description:"Brownie's elegant turnaround lick." },
  { id:4, title:"Bill Evans Shell Voicings", artist:"Bill Evans", instrument:"Piano", category:"ii-V-I", key:"D Minor", tempo:120, abc:'X:1\nT:Evans Shells\nM:4/4\nL:1/4\nQ:1/4=120\nK:Dm\n"Em7b5"[EB]2 [EA]2 | "A7"[^CG]2 [^CF]2 | "Dm7"[DA]4 |', youtubeId:"bJBgtAIC5Wk", youtubeStart:60, likes:312, user:"EvansKeys", tags:["voicings","essential"], description:"Bill Evans' signature shell voicing approach." },
  { id:5, title:"Wes Montgomery Octave Lick", artist:"Wes Montgomery", instrument:"Guitar", category:"Blues", key:"Bb Blues", tempo:130, abc:'X:1\nT:Wes Octaves\nM:4/4\nL:1/8\nQ:1/4=130\nK:Bb\n"Bb7"B,2 D2 F2 A2 | B2 AF DB, z2 | "Eb7"E,2 G,2 B,2 d2 | e2 dB G,E, z2 |', youtubeId:"MOm17yw__tE", youtubeStart:15, likes:201, user:"OctaveKing", tags:["octaves","blues"], description:"Wes's trademark octave technique." }
];

// ============================================================
// SUPABASE HELPERS
// ============================================================
function dbToLick(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist || '',
    instrument: row.instrument || 'Alto Sax',
    category: row.category || 'ii-V-I',
    key: row.key || 'C',
    tempo: row.tempo || 120,
    abc: row.abc || '',
    youtubeId: row.youtube_id || null,
    youtubeStart: row.youtube_start || 0,
    spotifyId: row.spotify_id || null,
    likes: row.likes || 0,
    user: row.username || 'Anonymous',
    tags: row.tags || [],
    description: row.description || '',
  };
}
function lickToDb(d) {
  return {
    title: d.title,
    artist: d.artist || '',
    instrument: d.instrument || 'Alto Sax',
    category: d.category || 'ii-V-I',
    key: d.key || 'C',
    tempo: d.tempo || 120,
    abc: d.abc || '',
    youtube_id: d.youtubeId || null,
    youtube_start: d.youtubeStart || 0,
    spotify_id: d.spotifyId || null,
    likes: 0,
    username: d.user || 'Anonymous',
    tags: d.tags || [],
    description: d.description || '',
  };
}
async function fetchLicks() {
  try {
    const { data, error } = await supabase
      .from('licks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(dbToLick);
  } catch (e) {
    console.warn('Supabase fetch failed, using sample licks:', e);
    return null; // signals fallback
  }
}
async function insertLick(d) {
  try {
    const { data, error } = await supabase
      .from('licks')
      .insert(lickToDb(d))
      .select()
      .single();
    if (error) throw error;
    return dbToLick(data);
  } catch (e) {
    console.error('Failed to insert lick:', e);
    return null;
  }
}
async function updateLikes(id, newCount) {
  try {
    await supabase.from('licks').update({ likes: newCount }).eq('id', id);
  } catch (e) {
    console.error('Failed to update likes:', e);
  }
}

const SOUND_PRESETS = [
  { id:"piano", label:"Piano", sample:true },
  { id:"rhodes", label:"Rhodes", sample:true },
  { id:"sax", label:"Sax" },
  { id:"trumpet", label:"Trumpet" },
  { id:"guitar", label:"Guitar" },
  { id:"flute", label:"Flute" },
  { id:"vibes", label:"Vibes" },
];

const INST_TRANS = {"Concert":0,"Alto Sax":9,"Tenor Sax":2,"Bb Trumpet":2,"Clarinet":2,"Trombone":0,"Piano":0,"Guitar":0,"Flute":0};
const TRANS_INSTRUMENTS = ["Concert","Alto Sax","Tenor Sax","Bb Trumpet","Clarinet"];

// ============================================================
// MUSIC THEORY
// ============================================================
const KEY_SIG={C:{},"Am":{},G:{f:1},"Em":{f:1},D:{f:1,c:1},"Bm":{f:1,c:1},A:{f:1,c:1,g:1},E:{f:1,c:1,g:1,d:1},B:{f:1,c:1,g:1,d:1,a:1},"F#":{f:1,c:1,g:1,d:1,a:1,e:1},F:{b:-1},"Dm":{b:-1},Bb:{b:-1,e:-1},"Gm":{b:-1,e:-1},Eb:{b:-1,e:-1,a:-1},"Cm":{b:-1,e:-1,a:-1},Ab:{b:-1,e:-1,a:-1,d:-1},"Fm":{b:-1,e:-1,a:-1,d:-1},Db:{b:-1,e:-1,a:-1,d:-1,g:-1},Gb:{b:-1,e:-1,a:-1,d:-1,g:-1,c:-1}};
const N2M={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const KEY_NAMES=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const FLAT_ROOTS=new Set([1,3,5,8,10]);
const SHARP_ABC=[{n:"C",a:""},{n:"C",a:"^"},{n:"D",a:""},{n:"D",a:"^"},{n:"E",a:""},{n:"F",a:""},{n:"F",a:"^"},{n:"G",a:""},{n:"G",a:"^"},{n:"A",a:""},{n:"A",a:"^"},{n:"B",a:""}];
const FLAT_ABC=[{n:"C",a:""},{n:"D",a:"_"},{n:"D",a:""},{n:"E",a:"_"},{n:"E",a:""},{n:"F",a:""},{n:"G",a:"_"},{n:"G",a:""},{n:"A",a:"_"},{n:"A",a:""},{n:"B",a:"_"},{n:"B",a:""}];
function chordToNotes(cn){let r=cn.trim();if(!r)return[];let root=r[0].toUpperCase(),ri=1;if(ri<r.length&&(r[ri]==="b"||r[ri]==="#"))ri++;const rs=r.substring(0,ri),q=r.substring(ri).toLowerCase();let st=N2M[rs[0]]||0;if(rs.includes("b"))st--;if(rs.includes("#"))st++;st=((st%12)+12)%12;let iv;if(q.includes("maj7"))iv=[0,4,7,11];else if(q.includes("m7b5"))iv=[0,3,6,10];else if(q.includes("dim"))iv=[0,3,6,9];else if(q.includes("m7"))iv=[0,3,7,10];else if(q.includes("m"))iv=[0,3,7];else if(q.includes("9"))iv=[0,4,7,10,14];else if(q.includes("7"))iv=[0,4,7,10];else if(q.includes("6"))iv=[0,4,7,9];else if(q.includes("sus4"))iv=[0,5,7];else iv=[0,4,7];const nn=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];return iv.map(i=>nn[((st+i)%12+12)%12]+"3");}

// ============================================================
// TRANSPOSE
// ============================================================
function trKeyName(name,semi){let ri=1;if(ri<name.length&&(name[ri]==="b"||name[ri]==="#"))ri++;const rs=name.substring(0,ri),sfx=name.substring(ri);let s=N2M[rs[0].toUpperCase()]||0;if(rs.includes("#"))s++;if(rs.includes("b"))s--;s=((s+semi)%12+12)%12;return KEY_NAMES[s]+sfx;}
function trChord(ch,semi){if(!ch)return ch;let ri=1;if(ri<ch.length&&(ch[ri]==="b"||ch[ri]==="#"))ri++;const rs=ch.substring(0,ri),q=ch.substring(ri);let s=N2M[rs[0].toUpperCase()]||0;if(rs.includes("#"))s++;if(rs.includes("b"))s--;s=((s+semi)%12+12)%12;return KEY_NAMES[s]+q;}
function trMusic(line,semi,ks,useFlat,newKs){const nm=useFlat?FLAT_ABC:SHARP_ABC;let out="",i=0;while(i<line.length){if(line[i]==='"'){out+='"';i++;let ch="";while(i<line.length&&line[i]!=='"'){ch+=line[i];i++;}out+=trChord(ch,semi);if(i<line.length){out+='"';i++;}continue;}let acc=null,ai=i;while(i<line.length&&(line[i]==="^"||line[i]==="_"||line[i]==="=")){if(line[i]==="^")acc=(acc===null?1:acc+1);else if(line[i]==="_")acc=(acc===null?-1:acc-1);else acc=0;i++;}if(i<line.length&&((line[i]>="A"&&line[i]<="G")||(line[i]>="a"&&line[i]<="g"))){const nc=line[i];i++;const isLo=nc>="a";const nu=nc.toUpperCase();let om=0;while(i<line.length&&(line[i]==="'"||line[i]===",")){if(line[i]==="'")om++;else om--;i++;}let oct=(isLo?5:4)+om;let ns=N2M[nu]||0;if(acc!==null)ns+=acc;else{const ka=ks[nu.toLowerCase()];if(ka)ns+=ka;}let ap=ns+oct*12+semi;let no=Math.floor(ap/12);let nsm=((ap%12)+12)%12;const ch=nm[nsm];const wantAcc=ch.a==="^"?1:ch.a==="_"?-1:0;const ksAcc=(newKs&&newKs[ch.n.toLowerCase()])||0;if(wantAcc!==ksAcc){if(wantAcc===0)out+="=";else if(wantAcc===1)out+="^";else out+="_";}if(no>=5){out+=ch.n.toLowerCase();for(let o=6;o<=no;o++)out+="'";}else{out+=ch.n;for(let o=3;o>=no;o--)out+=",";}continue;}if(acc!==null){out+=line.substring(ai,i);continue;}out+=line[i];i++;}return out;}
function transposeAbc(abc,semi){if(!semi)return abc;const lines=abc.split("\n");let out=[],ks={},nks={},nkr=0;for(const line of lines){const t=line.trim();if(t.startsWith("K:")){const k=t.slice(2).trim().split(/\s/)[0];ks=KEY_SIG[k]||{};const nk=trKeyName(k,semi);nks=KEY_SIG[nk]||{};let ri2=1;if(ri2<nk.length&&(nk[ri2]==="b"||nk[ri2]==="#"))ri2++;const nrs=nk.substring(0,ri2);nkr=N2M[nrs[0]]||0;if(nrs.includes("#"))nkr++;if(nrs.includes("b"))nkr--;nkr=((nkr%12)+12)%12;out.push("K:"+nk);}else if(/^[A-Z]:/.test(t)){out.push(line);}else{out.push(trMusic(line,semi,ks,FLAT_ROOTS.has(nkr),nks));}}return out.join("\n");}

// ============================================================
// ABC PARSER
// ============================================================
function parseAbc(abcStr,tOv){const lines=abcStr.split("\n");let dL=1/8,bpm=120,ks={},tsN=4;for(const l of lines){const t=l.trim();if(t.startsWith("L:")){const m=t.match(/(\d+)\/(\d+)/);if(m)dL=parseInt(m[1])/parseInt(m[2]);}else if(t.startsWith("Q:")){const m=t.match(/(\d+)$/);if(m)bpm=parseInt(m[1]);}else if(t.startsWith("K:")){ks=KEY_SIG[t.replace("K:","").trim().split(/\s/)[0]]||{};}else if(t.startsWith("M:")){const m=t.match(/(\d+)\/(\d+)/);if(m)tsN=parseInt(m[1]);}}if(tOv)bpm=tOv;const spb=60/bpm;let mu="";for(const l of lines){const t=l.trim();if(/^[A-Z]:/.test(t))continue;mu+=" "+t;}const ev=[],ch=[];let i=0;while(i<mu.length){const c=mu[i];if(c===" "||c==="\t"){i++;continue;}if(c==="|"||c===":"){i++;continue;}if(c==="]"){i++;continue;}if(c==='"'){i++;let cn="";while(i<mu.length&&mu[i]!=='"'){cn+=mu[i];i++;}if(i<mu.length)i++;let p=0;for(const e of ev)p+=e.rL;ch.push({name:cn,pos:p});continue;}if(c==="!"||c==="+"){i++;while(i<mu.length&&mu[i]!==c)i++;if(i<mu.length)i++;continue;}if(c==="("){i++;while(i<mu.length&&mu[i]>="0"&&mu[i]<="9")i++;continue;}if(c==="-"||c==="~"||c==="."||c==="H"){i++;continue;}if(c==="["){if(i+1<mu.length&&(mu[i+1]==="|"||mu[i+1]==="1"||mu[i+1]==="2")){i++;continue;}i++;const ct=[];while(i<mu.length&&mu[i]!=="]"){const nr=rN(mu,i,ks);if(nr){ct.push(nr.t);i=nr.n;}else i++;}if(i<mu.length)i++;const dr=rD(mu,i);i=dr.n;ev.push({tn:ct.length?ct:null,rL:dL*dr.m});continue;}if(c==="z"||c==="x"){i++;const dr=rD(mu,i);i=dr.n;ev.push({tn:null,rL:dL*dr.m});continue;}const nr=rN(mu,i,ks);if(nr){i=nr.n;const dr=rD(mu,i);i=dr.n;ev.push({tn:[nr.t],rL:dL*dr.m});continue;}i++;}return{events:ev,chords:ch,bpm,spb,tsNum:tsN};}
function applyTiming(p,sw){const{events:ev,spb}=p;const eL=1/8;const r=[];let pos=0;const swShift=sw===1?0.08:sw>=2?0.167:0;const velDown=sw>0?1-(sw===1?0.06:0.1):1;const velUp=sw>0?1+(sw===1?0.08:0.12):1;for(const e of ev){let d=e.rL*4*spb;let st=pos*4*spb;let vel=1;if(sw>0&&Math.abs(e.rL-eL)<0.001){const bL=1/4;const pIB=((pos%bL)+bL)%bL;if(pIB<0.001){d=(1/4)*(0.5+swShift)*4*spb;vel=velDown;}else if(Math.abs(pIB-eL)<0.001){st+=swShift*(1/4)*4*spb;d=(1/4)*(0.5-swShift)*4*spb;vel=velUp;}}r.push({tones:e.tn,dur:Math.max(d,0.02),startTime:st,vel:vel});pos+=e.rL;}return{scheduled:r,totalDur:pos*4*spb,chordTimes:p.chords.map(c=>({name:c.name,time:c.pos*4*spb}))};}
function rN(s,i,ks){let a=null;while(i<s.length&&(s[i]==="^"||s[i]==="_"||s[i]==="=")){if(s[i]==="^")a=(a===null?1:a+1);else if(s[i]==="_")a=(a===null?-1:a-1);else a=0;i++;}if(i>=s.length)return null;const c=s[i];if(!((c>="A"&&c<="G")||(c>="a"&&c<="g")))return null;const lo=c>="a",nl=c.toUpperCase();let o=lo?5:4;i++;while(i<s.length&&(s[i]==="'"||s[i]===",")){if(s[i]==="'")o++;else o--;i++;}let sa=0;if(a!==null)sa=a;else{const ka=ks[nl.toLowerCase()];if(ka)sa=ka;}let tn=nl;if(sa>0)tn+="#";else if(sa<0)tn+="b";tn+=o;return{t:tn,n:i};}
function rD(s,i){let nm="";while(i<s.length&&s[i]>="0"&&s[i]<="9"){nm+=s[i];i++;}let m=nm?parseInt(nm):1;if(i<s.length&&s[i]==="/"){i++;let dn="";while(i<s.length&&s[i]>="0"&&s[i]<="9"){dn+=s[i];i++;}m=m/(dn?parseInt(dn):2);}return{m:m||1,n:i};}

// ============================================================
// SYNTH ENGINE
// ============================================================
const SAL_BASE="https://tonejs.github.io/audio/salamander/";
const SAL_MAP={"C2":"C2.mp3","D#2":"Ds2.mp3","F#2":"Fs2.mp3","A2":"A2.mp3","C3":"C3.mp3","D#3":"Ds3.mp3","F#3":"Fs3.mp3","A3":"A3.mp3","C4":"C4.mp3","D#4":"Ds4.mp3","F#4":"Fs4.mp3","A4":"A4.mp3","C5":"C5.mp3","D#5":"Ds5.mp3","F#5":"Fs5.mp3","A5":"A5.mp3","C6":"C6.mp3","D#6":"Ds6.mp3","F#6":"Fs6.mp3","A6":"A6.mp3","C7":"C7.mp3"};
let _sampler=null,_samplerReady=false,_samplerPromise=null,_samplerFailed=false;
function preloadPiano(){if(_samplerPromise)return _samplerPromise;_samplerPromise=new Promise(res=>{try{_sampler=new Tone.Sampler({urls:SAL_MAP,baseUrl:SAL_BASE,release:1.5,onload:()=>{_samplerReady=true;res(true);},onerror:()=>{_samplerFailed=true;res(false);}});setTimeout(()=>{if(!_samplerReady){_samplerFailed=true;res(false);}},15000);}catch(e){_samplerFailed=true;res(false);}});return _samplerPromise;}
function makeSamplerPiano(bag){const rev=new Tone.Reverb({decay:2.8,wet:0.18}).toDestination();const comp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.005,release:0.12}).connect(rev);_sampler.disconnect();_sampler.connect(comp);bag.push(rev,comp);return{play:(n,d,t,v)=>{try{_sampler.triggerAttackRelease(n,d,t,v);}catch(e){}}};}
function makeSamplerRhodes(bag){const rev=new Tone.Reverb({decay:2.2,wet:0.18}).toDestination();const ch=new Tone.Chorus({frequency:0.7,delayTime:4,depth:0.2,wet:0.2}).connect(rev);ch.start();const tr=new Tone.Tremolo({frequency:3,depth:0.22,wet:0.3}).connect(ch);tr.start();const flt=new Tone.Filter({frequency:3000,type:"lowpass",rolloff:-12}).connect(tr);_sampler.disconnect();_sampler.connect(flt);bag.push(rev,ch,tr,flt);return{play:(n,d,t,v)=>{try{_sampler.triggerAttackRelease(n,d,t,v);}catch(e){}}};}
function makeSynthPiano(bag){
  // Rich piano: layered AMSynth + harmonic partials + reverb + compression
  const rev=new Tone.Reverb({decay:2.8,wet:0.2}).toDestination();
  const comp=new Tone.Compressor({threshold:-20,ratio:3,attack:0.003,release:0.15}).connect(rev);
  // Main body — AM synthesis gives bell-like piano harmonics
  const s=new Tone.PolySynth(Tone.AMSynth,{
    harmonicity:2,
    oscillator:{type:"fatsine3",spread:12,count:3},
    modulation:{type:"sine"},
    envelope:{attack:0.005,decay:1.2,sustain:0.04,release:1.8},
    modulationEnvelope:{attack:0.003,decay:0.6,sustain:0,release:0.5},
    volume:-8
  }).connect(comp);
  // Bright attack layer — short percussive "hammer hit"
  const atk=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:"sine8"},
    envelope:{attack:0.001,decay:0.06,sustain:0,release:0.04},
    volume:-18
  }).connect(comp);
  bag.push(s,atk,comp,rev);
  return{play:(n,d,t,v)=>{s.triggerAttackRelease(n,d,t,v);atk.triggerAttackRelease(n,"32n",t,v);}};
}
function makeSax(bag){
  // Sax: FM with breath noise, vibrato, formant-like filtering
  const rev=new Tone.Reverb({decay:1.8,wet:0.2}).toDestination();
  const vib=new Tone.Vibrato({frequency:5.2,depth:0.1,wet:0.45}).connect(rev);
  // Two-band formant approximation
  const f1=new Tone.Filter({frequency:1200,type:"bandpass",Q:2}).connect(vib);
  const f2=new Tone.Filter({frequency:3200,type:"bandpass",Q:1.5}).connect(vib);
  const mix=new Tone.Gain(1).connect(f1);mix.connect(f2);
  const s=new Tone.PolySynth(Tone.FMSynth,{
    harmonicity:2,
    modulationIndex:6,
    oscillator:{type:"sine"},
    modulation:{type:"triangle"},
    envelope:{attack:0.04,decay:0.2,sustain:0.55,release:0.5},
    modulationEnvelope:{attack:0.08,decay:0.3,sustain:0.4,release:0.45},
    volume:-8
  }).connect(mix);
  // Breath noise layer
  const nFlt=new Tone.Filter({frequency:4000,type:"bandpass",Q:0.8}).connect(rev);
  const breathNoise=new Tone.NoiseSynth({
    noise:{type:"pink"},
    envelope:{attack:0.05,decay:0.15,sustain:0.08,release:0.3},
    volume:-26
  }).connect(nFlt);
  bag.push(s,breathNoise,mix,f1,f2,nFlt,vib,rev);
  return{play:(n,d,t,v)=>{s.triggerAttackRelease(n,d,t,v);breathNoise.triggerAttackRelease(d,t,v);}};
}
function makeTrumpet(bag){
  // Trumpet: bright FM, muted high partials, controlled bite
  const rev=new Tone.Reverb({decay:1.5,wet:0.16}).toDestination();
  const flt=new Tone.Filter({frequency:6000,type:"lowpass",rolloff:-12}).connect(rev);
  const dist=new Tone.Distortion({distortion:0.08,wet:0.15}).connect(flt);
  const s=new Tone.PolySynth(Tone.FMSynth,{
    harmonicity:3,
    modulationIndex:8,
    oscillator:{type:"sawtooth8"},
    modulation:{type:"square2"},
    envelope:{attack:0.04,decay:0.12,sustain:0.5,release:0.35},
    modulationEnvelope:{attack:0.025,decay:0.15,sustain:0.5,release:0.3},
    volume:-12
  }).connect(dist);
  // Bright attack
  const atk=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:"square8"},
    envelope:{attack:0.001,decay:0.03,sustain:0,release:0.02},
    volume:-22
  }).connect(flt);
  bag.push(s,atk,dist,flt,rev);
  return{play:(n,d,t,v)=>{s.triggerAttackRelease(n,d,t,v);atk.triggerAttackRelease(n,"64n",t,v);}};
}
function makeGuitar(bag){
  // Guitar: pluck-like with fast decay, chorus for width
  const rev=new Tone.Reverb({decay:1.2,wet:0.14}).toDestination();
  const ch=new Tone.Chorus({frequency:0.8,delayTime:4,depth:0.15,wet:0.12}).connect(rev);ch.start();
  const flt=new Tone.Filter({frequency:3200,type:"lowpass",rolloff:-24}).connect(ch);
  // Nylon string approximation via FM with fast pluck decay
  const s=new Tone.PolySynth(Tone.FMSynth,{
    harmonicity:3.5,
    modulationIndex:1.5,
    oscillator:{type:"triangle"},
    modulation:{type:"square"},
    envelope:{attack:0.003,decay:0.35,sustain:0.02,release:0.8},
    modulationEnvelope:{attack:0.002,decay:0.08,sustain:0,release:0.15},
    volume:-7
  }).connect(flt);
  // Pluck transient — short noise burst
  const nFlt=new Tone.Filter({frequency:5000,type:"bandpass",Q:1}).connect(rev);
  const pluckNoise=new Tone.NoiseSynth({
    noise:{type:"white"},
    envelope:{attack:0.001,decay:0.015,sustain:0,release:0.01},
    volume:-20
  }).connect(nFlt);
  bag.push(s,pluckNoise,flt,nFlt,ch,rev);
  return{play:(n,d,t,v)=>{s.triggerAttackRelease(n,d,t,v);pluckNoise.triggerAttackRelease("32n",t,v);}};
}
function makeFlute(bag){
  // Flute: pure sine with breath noise, wide vibrato, airy reverb
  const rev=new Tone.Reverb({decay:3.2,wet:0.3}).toDestination();
  const vib=new Tone.Vibrato({frequency:5.8,depth:0.15,wet:0.55}).connect(rev);
  const s=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:"fatsine2",spread:8,count:2},
    envelope:{attack:0.08,decay:0.12,sustain:0.6,release:0.6},
    volume:-7
  }).connect(vib);
  // Breath noise
  const nFlt=new Tone.Filter({frequency:6000,type:"highpass",rolloff:-12}).connect(rev);
  const breath=new Tone.NoiseSynth({
    noise:{type:"white"},
    envelope:{attack:0.06,decay:0.1,sustain:0.1,release:0.4},
    volume:-24
  }).connect(nFlt);
  bag.push(s,breath,nFlt,vib,rev);
  return{play:(n,d,t,v)=>{s.triggerAttackRelease(n,d,t,v);breath.triggerAttackRelease(d,t,v);}};
}
function makeVibes(bag){
  // Vibes: metallic FM with tremolo, long decay
  const rev=new Tone.Reverb({decay:4,wet:0.3}).toDestination();
  const tr=new Tone.Tremolo({frequency:4.2,depth:0.25,wet:0.28}).connect(rev);tr.start();
  const s=new Tone.PolySynth(Tone.FMSynth,{
    harmonicity:7,
    modulationIndex:0.5,
    oscillator:{type:"sine"},
    modulation:{type:"sine"},
    envelope:{attack:0.001,decay:2.2,sustain:0.015,release:3},
    modulationEnvelope:{attack:0.001,decay:0.5,sustain:0,release:0.4},
    volume:-8
  }).connect(tr);
  // Mallet attack transient
  const atk=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:"sine4"},
    envelope:{attack:0.001,decay:0.04,sustain:0,release:0.03},
    volume:-16
  }).connect(rev);
  bag.push(s,atk,tr,rev);
  return{play:(n,d,t,v)=>{s.triggerAttackRelease(n,d,t,v);atk.triggerAttackRelease(n,"64n",t,v);}};
}
function makeMelSynth(id,bag){if((id==="piano"||id==="rhodes")&&_samplerReady&&_sampler)return id==="piano"?makeSamplerPiano(bag):makeSamplerRhodes(bag);switch(id){case"piano":case"rhodes":return makeSynthPiano(bag);case"sax":return makeSax(bag);case"trumpet":return makeTrumpet(bag);case"guitar":return makeGuitar(bag);case"flute":return makeFlute(bag);case"vibes":return makeVibes(bag);default:return makeSynthPiano(bag);}}
let _chordSampler=null,_chordSamplerReady=false,_chordSamplerPromise=null;
function preloadChordPiano(){if(_chordSamplerPromise)return _chordSamplerPromise;_chordSamplerPromise=new Promise(res=>{try{_chordSampler=new Tone.Sampler({urls:SAL_MAP,baseUrl:SAL_BASE,release:1.2,volume:-14,onload:()=>{_chordSamplerReady=true;res(true);},onerror:()=>{res(false);}});setTimeout(()=>{if(!_chordSamplerReady)res(false);},15000);}catch(e){res(false);}});return _chordSamplerPromise;}
function makeChordSynth(bag){
  // Use pre-loaded piano sampler for warm comping sound
  if(_chordSamplerReady&&_chordSampler){
    const rev=new Tone.Reverb({decay:2.5,wet:0.22}).toDestination();
    const comp=new Tone.Compressor({threshold:-24,ratio:4,attack:0.01,release:0.15}).connect(rev);
    const flt=new Tone.Filter({frequency:2200,type:"lowpass",rolloff:-12}).connect(comp);
    _chordSampler.disconnect();_chordSampler.connect(flt);
    bag.push(flt,comp,rev);
    return _chordSampler;
  }
  // Fallback: FM synth comping
  const rev=new Tone.Reverb({decay:3,wet:0.22}).toDestination();const ch=new Tone.Chorus({frequency:0.4,delayTime:6,depth:0.22,wet:0.22}).connect(rev);ch.start();const tr=new Tone.Tremolo({frequency:2.2,depth:0.12,wet:0.18}).connect(ch);tr.start();const flt=new Tone.Filter({frequency:1800,type:"lowpass",rolloff:-24}).connect(tr);const s=new Tone.PolySynth(Tone.FMSynth,{harmonicity:3,modulationIndex:0.6,oscillator:{type:"fatsine2",spread:15,count:3},modulation:{type:"sine"},envelope:{attack:0.015,decay:1.0,sustain:0.3,release:1.5},modulationEnvelope:{attack:0.008,decay:0.6,sustain:0,release:0.6},volume:-18}).connect(flt);bag.push(s,flt,tr,ch,rev);return s;
}
function makeClick(bag){const rev=new Tone.Reverb({decay:0.2,wet:0.06}).toDestination();const flt=new Tone.Filter({frequency:7000,type:"bandpass",Q:2}).connect(rev);const hi=new Tone.NoiseSynth({noise:{type:"white"},envelope:{attack:0.001,decay:0.035,sustain:0,release:0.015},volume:-10}).connect(flt);const lo=new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.001,decay:0.02,sustain:0,release:0.01},volume:-16}).connect(flt);bag.push(hi,lo,flt,rev);return{hi,lo};}
let _pS=null,_pR=null,_pReady=false;
function _ensurePreviewSynth(){
  if(_pReady&&_pS)return;
  try{
    if(_pR)try{_pR.dispose();}catch(e){}
    if(_pS)try{_pS.dispose();}catch(e){}
    _pR=new Tone.Reverb({decay:1.4,wet:0.18}).toDestination();
    _pS=new Tone.AMSynth({harmonicity:2,oscillator:{type:"fatsine3",spread:10,count:3},modulation:{type:"sine"},envelope:{attack:0.003,decay:0.6,sustain:0.05,release:0.9},modulationEnvelope:{attack:0.003,decay:0.3,sustain:0,release:0.3},volume:-6}).connect(_pR);
    _pReady=true;
  }catch(e){_pReady=false;}
}
function prevNote(n,o,a){
  try{
    Tone.start();
    var nm=n;if(a===1)nm+="#";else if(a===-1)nm+="b";nm+=o;
    // Use sampler if available — reconnect to destination in case effects chain was disposed
    if(_samplerReady&&_sampler){try{_sampler.toDestination();}catch(e){}_sampler.triggerAttackRelease(nm,"4n");return;}
    // Fallback: persistent synth
    _ensurePreviewSynth();
    if(_pS)_pS.triggerAttackRelease(nm,"4n");
  }catch(e){}
}

// ============================================================
// CARD PREVIEW PLAYER — lightweight, global singleton
// ============================================================
var _preview={id:null,stop:null,subs:new Set(),gen:0};
function previewSubscribe(fn){_preview.subs.add(fn);return function(){_preview.subs.delete(fn);};}
function previewNotify(){_preview.subs.forEach(function(fn){fn(_preview.id);});}
function previewStop(){if(_preview.stop){try{_preview.stop();}catch(e){}_preview.stop=null;}_preview.id=null;_preview.gen++;previewNotify();}
async function previewPlay(lickId,abc,tempo){
  previewStop();
  var myGen=_preview.gen;
  try{await Tone.start();}catch(e){}
  // If another play/stop happened during await, bail out
  if(myGen!==_preview.gen)return;
  var parsed=parseAbc(abc,tempo);
  var result=applyTiming(parsed,0);
  var notes=result.scheduled;var totalDur=result.totalDur;
  // Dedicated synth per preview — fully disposable, no shared state
  var rev=new Tone.Reverb({decay:1.8,wet:0.16}).toDestination();
  var syn=new Tone.PolySynth(Tone.FMSynth,{harmonicity:2,modulationIndex:0.8,oscillator:{type:"fatsine2",spread:12,count:3},modulation:{type:"sine"},envelope:{attack:0.005,decay:0.5,sustain:0.15,release:0.8},modulationEnvelope:{attack:0.005,decay:0.4,sustain:0,release:0.4},volume:-10}).connect(rev);
  // Check again after synth creation
  if(myGen!==_preview.gen){try{syn.dispose();}catch(e){}try{rev.dispose();}catch(e){}return;}
  var now=Tone.now();
  for(var i=0;i<notes.length;i++){var n=notes[i];if(!n.tones)continue;for(var j=0;j<n.tones.length;j++){try{syn.triggerAttackRelease(n.tones[j],Math.min(n.dur*0.85,1.5),now+n.startTime);}catch(e){}}}
  _preview.id=lickId;
  var tid=setTimeout(function(){if(_preview.id===lickId)previewStop();},totalDur*1000+300);
  _preview.stop=function(){clearTimeout(tid);try{syn.releaseAll();}catch(e){}try{syn.dispose();}catch(e){}try{rev.dispose();}catch(e){}};
  previewNotify();
}
function usePreviewState(lickId){
  var ref=useRef(false);var _=useState(0);var force=_[1];
  useEffect(function(){return previewSubscribe(function(activeId){var now=activeId===lickId;if(now!==ref.current){ref.current=now;force(function(c){return c+1;});}});},[lickId]);
  return ref.current;
}
function PreviewBtn({lickId,abc,tempo,th,size}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var playing=usePreviewState(lickId);var sz=size||28;
  var handleClick=function(e){e.stopPropagation();if(playing){previewStop();}else{previewPlay(lickId,abc,tempo);}};
  return React.createElement("button",{onClick:handleClick,style:{width:sz,height:sz,borderRadius:sz/2,border:"none",background:playing?(isStudio?"#22D89E":"#6366F1"):(isStudio?"rgba(34,216,158,0.12)":"rgba(99,102,241,0.08)"),cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",boxShadow:playing?"0 2px 10px "+(isStudio?"rgba(34,216,158,0.3)":"rgba(99,102,241,0.25)"):"none"}},
    playing?React.createElement("div",{style:{width:sz*0.28,height:sz*0.28,borderRadius:2,background:isStudio?"#fff":"#fff"}}):
    React.createElement("div",{style:{width:0,height:0,borderTop:(sz*0.2)+"px solid transparent",borderBottom:(sz*0.2)+"px solid transparent",borderLeft:(sz*0.3)+"px solid "+(isStudio?"#22D89E":"#6366F1"),marginLeft:sz*0.06}}));
}

// ============================================================
// ABCjs
// ============================================================
function useAbcjs(){const[ok,s]=useState(false);useEffect(()=>{if(window.ABCJS){s(true);return;}const sc=document.createElement("script");sc.src=ABCJS_CDN;sc.onload=()=>s(true);document.head.appendChild(sc);},[]);return ok;}
// Get time fractions for each sounding event (notes only, not rests)
function getNoteTimeFracs(abc){try{const p=parseAbc(abc);let total=0;for(const e of p.events)total+=e.rL;if(total===0)return[];let pos=0;const fracs=[];for(const e of p.events){if(e.tn)fracs.push({frac:pos/total,endFrac:(pos+e.rL)/total});pos+=e.rL;}return fracs;}catch(e){return[];}}
function getAllEventFracs(abc){try{const p=parseAbc(abc);let total=0;for(const e of p.events)total+=e.rL;if(total===0)return[];let pos=0;const fracs=[];for(const e of p.events){fracs.push({frac:pos/total,endFrac:(pos+e.rL)/total,isNote:!!e.tn});pos+=e.rL;}return fracs;}catch(e){return[];}}
// Count bars from ABC by counting | separators in music lines
function getBarInfo(abc){
  const lines=abc.split("\n");let music="";
  for(const l of lines){const t=l.trim();if(/^[A-Z]:/.test(t))continue;music+=t+" ";}
  // Split by | and count non-empty segments
  const segs=music.split(/\|+/).map(s=>s.trim()).filter(s=>s.length>0&&!/^[:\[\]12]+$/.test(s));
  const nBars=Math.max(1,segs.length);
  // Also parse time sig for beat subdivision
  let tsNum=4,tsDen=4;
  for(const l of lines){const m=l.trim().match(/^M:(\d+)\/(\d+)/);if(m){tsNum=parseInt(m[1]);tsDen=parseInt(m[2]);}}
  return{nBars,tsNum,tsDen,beatsPerBar:tsNum};
}

// ============================================================
// NOTATION — light theme, black notes, coral cursor
// ============================================================

// ============================================================
// NOTATION — theme-aware
// ============================================================
function Notation({abc,compact,abRange,curNoteRef,focus,th}){
  const ref=useRef(null);const ok=useAbcjs();const prevNoteRef=useRef(-1);const rafRef=useRef(null);
  const t=th||TH.classic;
  useEffect(()=>{if(!ok||!ref.current||!window.ABCJS)return;
    prevNoteRef.current=-1;
    // Lock current height before re-render to prevent layout shift
    var el=ref.current;var prevH=el.offsetHeight;if(prevH>0)el.style.minHeight=prevH+"px";
    // Count bars to force stable line breaks across transpositions
    var barInfo=getBarInfo(abc);var nBars=barInfo.nBars;
    // Force all bars on one line if <=4, otherwise 4 per line — deterministic
    var mpl=nBars<=4?nBars:4;
    const opts={responsive:"resize",paddingtop:focus?14:2,paddingbottom:focus?14:2,paddingleft:0,paddingright:0,add_classes:true};
    if(compact){opts.staffwidth=400;opts.scale=0.85;}
    else if(focus){opts.staffwidth=500;opts.scale=1.35;opts.wrap={minSpacing:1.0,maxSpacing:1.8,preferredMeasuresPerLine:mpl};}
    else{opts.staffwidth=420;opts.scale=1.0;opts.wrap={minSpacing:1.0,maxSpacing:1.8,preferredMeasuresPerLine:mpl};}
    try{window.ABCJS.renderAbc(ref.current,abc,opts);}catch(e){}
    // Release height lock after paint (double-rAF ensures browser has painted)
    requestAnimationFrame(function(){requestAnimationFrame(function(){if(el)el.style.minHeight="";});});
    if(!ref.current)return;const svg=ref.current.querySelector("svg");if(!svg)return;
    const isStudio=t===TH.studio;
    svg.querySelectorAll("path").forEach(p=>{p.setAttribute("stroke",t.noteStroke);p.setAttribute("fill",t.noteStroke);});
    svg.querySelectorAll(".abcjs-staff path").forEach(p=>{p.setAttribute("stroke",t.staffStroke);p.setAttribute("fill","none");});
    svg.querySelectorAll(".abcjs-staff-extra path").forEach(p=>{p.setAttribute("stroke",isStudio?t.staffStroke:t.muted);p.setAttribute("fill",isStudio?t.staffStroke:t.muted);});
    svg.querySelectorAll(".abcjs-bar path").forEach(p=>{p.setAttribute("stroke",t.barStroke);});
    svg.querySelectorAll("text").forEach(p=>p.setAttribute("fill",t.metaFill));
    svg.querySelectorAll("text.abcjs-chord").forEach(p=>{p.setAttribute("fill",t.chordFill);p.style.fontSize=isStudio?"14px":"12px";p.style.fontWeight=isStudio?"600":"400";if(isStudio)p.style.filter="drop-shadow(0 0 4px "+t.chordFill+"50)";});
    svg.querySelectorAll(".abcjs-title,.abcjs-meta-top").forEach(el=>el.style.display="none");
    const noteEls=svg.querySelectorAll(".abcjs-note");if(!noteEls.length)return;
    const fracs=getNoteTimeFracs(abc);
    const hasRange=abRange&&(abRange[0]>0.001||abRange[1]<0.999);
    if(hasRange){
      // Dim out-of-range notes
      noteEls.forEach((el,idx)=>{if(idx>=fracs.length)return;const f=fracs[idx];
        const inRange=f.frac>=abRange[0]-0.001&&f.endFrac<=abRange[1]+0.001;
        if(!inRange){el.querySelectorAll("path").forEach(p=>{p.setAttribute("fill-opacity","0.12");p.setAttribute("stroke-opacity","0.12");});}});
      // Dim out-of-range rests
      var restEls=svg.querySelectorAll(".abcjs-rest");
      var allFracs=getAllEventFracs(abc);var restIdx=0;
      for(var ai=0;ai<allFracs.length;ai++){if(!allFracs[ai].isNote){if(restIdx<restEls.length){
        var af=allFracs[ai];var inR=af.frac>=abRange[0]-0.001&&af.endFrac<=abRange[1]+0.001;
        if(!inR){restEls[restIdx].querySelectorAll("path").forEach(function(p){p.setAttribute("fill-opacity","0.12");p.setAttribute("stroke-opacity","0.12");});}
        restIdx++;}}}
      // Dim out-of-range beams/stems/flags — proximity to nearest note
      // Build array of {bbox, inRange} for each note
      var noteBoxes=[];
      noteEls.forEach(function(el,idx){if(idx>=fracs.length)return;var f=fracs[idx];
        try{var bb=el.getBBox();noteBoxes.push({x:bb.x,y:bb.y,w:bb.width,h:bb.height,
          inR:f.frac>=abRange[0]-0.001&&f.endFrac<=abRange[1]+0.001});}catch(e){}});
      if(noteBoxes.length>0){svg.querySelectorAll("path").forEach(function(p){
        // Skip if inside a known group
        if(p.closest(".abcjs-staff,.abcjs-staff-extra,.abcjs-bar,.abcjs-note,.abcjs-rest"))return;
        try{var pb=p.getBBox();if(pb.width<0.5&&pb.height<0.5)return;
          var cx=pb.x+pb.width/2,cy=pb.y+pb.height/2;
          // Find nearest note by distance
          var bestDist=Infinity,bestInR=false;
          for(var ni=0;ni<noteBoxes.length;ni++){var nb=noteBoxes[ni];
            var dx=Math.max(0,Math.abs(cx-(nb.x+nb.w/2))-nb.w/2);
            var dy=Math.max(0,Math.abs(cy-(nb.y+nb.h/2))-nb.h/2);
            var dist=dx*dx+dy*dy;if(dist<bestDist){bestDist=dist;bestInR=nb.inR;}}
          if(!bestInR){p.setAttribute("fill-opacity","0.12");p.setAttribute("stroke-opacity","0.12");}
        }catch(e){}});}
    }
  },[abc,ok,compact,abRange,focus,th]);
  // Cursor: poll curNoteRef via rAF — zero React re-renders
  useEffect(()=>{if(!curNoteRef||compact)return;
    const tick=()=>{const cn=curNoteRef.current;
      if(cn!==prevNoteRef.current&&ref.current){
        const svg=ref.current.querySelector("svg");if(svg){
          const noteEls=svg.querySelectorAll(".abcjs-note");
          const fracs=getNoteTimeFracs(abc);const hasRange=abRange&&(abRange[0]>0.001||abRange[1]<0.999);
          if(prevNoteRef.current>=0&&prevNoteRef.current<noteEls.length){
            const el=noteEls[prevNoteRef.current];
            el.querySelectorAll("path,circle,ellipse").forEach(p=>{
              p.style.fill=t.noteStroke;p.style.stroke=t.noteStroke;
              if(hasRange&&prevNoteRef.current<fracs.length){const f=fracs[prevNoteRef.current];const inR=f.frac>=abRange[0]-0.001&&f.endFrac<=abRange[1]+0.001;
                p.style.fillOpacity=inR?"1":"0.12";p.style.strokeOpacity=inR?"1":"0.12";
              }else{p.style.fillOpacity="1";p.style.strokeOpacity="1";}});
            el.style.filter="none";el.style.transition="";}
          if(cn>=0&&cn<noteEls.length){
            const el=noteEls[cn];
            el.querySelectorAll("path,circle,ellipse").forEach(p=>{
              p.style.fill=t.accent;p.style.stroke=t.accent;
              p.style.fillOpacity="1";p.style.strokeOpacity="1";});
            el.style.filter="drop-shadow(0 0 8px "+t.accentGlow+")";
            el.style.transition="filter 0.05s";}
        }prevNoteRef.current=cn;}
      rafRef.current=requestAnimationFrame(tick);};
    rafRef.current=requestAnimationFrame(tick);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[abc,abRange,th,compact,curNoteRef]);
  if(!ok)return React.createElement("div",{style:{height:compact?50:80,display:"flex",alignItems:"center",justifyContent:"center",color:t.subtle,fontSize:12,fontFamily:"'Inter',sans-serif"}},"Loading...");
  const isStudio=t===TH.studio;
  return React.createElement("div",{ref,style:{borderRadius:focus?0:isStudio?12:10,background:focus?"transparent":compact?"transparent":t.noteBg,padding:focus?"0":compact?"2px 4px":(isStudio?"10px 14px":"8px 12px"),border:focus?"none":compact?"none":"1px solid "+(isStudio?t.staffStroke+"30":t.borderSub),overflow:compact?"hidden":"visible",transition:"min-height 0.15s ease"}});}

// ============================================================
// A/B RANGE BAR — themed
// ============================================================
function ABRangeBar({abc,abA,abB,setAbA,setAbB,onReset,th}){
  const t=th||TH.classic;const barRef=useRef(null);const dragRef=useRef(null);
  const info=getBarInfo(abc);const{nBars,beatsPerBar}=info;
  const onStart=which=>e=>{e.preventDefault();e.stopPropagation();dragRef.current=which;
    const onMove=ev=>{if(!barRef.current||!dragRef.current)return;const rect=barRef.current.getBoundingClientRect();const raw=(ev.touches?ev.touches[0]:ev).clientX;let pct=Math.max(0,Math.min(1,(raw-rect.left)/rect.width));const snap=1/(nBars*beatsPerBar);pct=Math.round(pct/snap)*snap;if(dragRef.current==="a"){setAbA(Math.min(pct,abB-snap));}else{setAbB(Math.max(pct,abA+snap));}};
    const onEnd=()=>{dragRef.current=null;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onEnd);window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onEnd);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onEnd);window.addEventListener("touchmove",onMove,{passive:false});window.addEventListener("touchend",onEnd);};
  const ticks=[];for(let b=0;b<=nBars;b++){ticks.push(React.createElement("div",{key:"b"+b,style:{position:"absolute",left:(b/nBars*100)+"%",top:0,bottom:0,width:1,background:b===0||b===nBars?t.dimBorder:t.border}}));if(b<nBars)for(let bt=1;bt<beatsPerBar;bt++){ticks.push(React.createElement("div",{key:"t"+b+"-"+bt,style:{position:"absolute",left:((b+bt/beatsPerBar)/nBars*100)+"%",top:"60%",bottom:0,width:1,background:t.border,opacity:0.5}}));}}
  return React.createElement("div",{style:{marginTop:8,marginBottom:4}},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}},
      React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},nBars+" bars"),
      (abA>0.001||abB<0.999)&&React.createElement("button",{onClick:e=>{e.stopPropagation();onReset();},style:{fontSize:9,color:t.muted,background:t.filterBg,border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"'Inter',sans-serif"}},"Reset")),
    React.createElement("div",{ref:barRef,style:{position:"relative",height:32,margin:"0 14px",touchAction:"none"}},
      React.createElement("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,background:t.noteBg,borderRadius:8,border:"1px solid "+t.border,overflow:"hidden"}},
        ticks,
        React.createElement("div",{style:{position:"absolute",left:(abA*100)+"%",width:((abB-abA)*100)+"%",top:0,height:"100%",background:t.accentBg,borderLeft:"2px solid "+t.accent,borderRight:"2px solid "+t.accent}})),
      React.createElement("div",{onMouseDown:onStart("a"),onTouchStart:onStart("a"),style:{position:"absolute",left:"calc("+(abA*100)+"% - 14px)",top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:8,background:t.card,border:"2px solid "+t.accent,cursor:"grab",touchAction:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}},
        React.createElement("span",{style:{fontSize:10,fontWeight:700,color:t.accent,fontFamily:"monospace"}},"A")),
      React.createElement("div",{onMouseDown:onStart("b"),onTouchStart:onStart("b"),style:{position:"absolute",left:"calc("+(abB*100)+"% - 14px)",top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:8,background:t.card,border:"2px solid "+t.accent,cursor:"grab",touchAction:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}},
        React.createElement("span",{style:{fontSize:10,fontWeight:700,color:t.accent,fontFamily:"monospace"}},"B"))));}


// ============================================================
// PLAYER — themed, 3-tier
// ============================================================
function Player({abc,tempo,abOn,abA,abB,setAbOn,setAbA,setAbB,pT,sPT,lickTempo,trInst,setTrInst,trMan,setTrMan,onCurNote,th,onLoopComplete,forceLoop,autoPlay,hideControls,ctrlRef}){
  const t=th||TH.classic;
  const[pl,sPl]=useState(false);const[lp,sLp]=useState(forceLoop||false);const[bk,sBk]=useState(false);const[ml,sMl]=useState(true);const[fl,sFl]=useState("straight");
  const[sound,setSound]=useState("piano");const[loading,setLoading]=useState(false);const[samplesOk,setSamplesOk]=useState(_samplerReady);
  const[ci,setCi]=useState(true);const lcDispRef=useRef(null);const[settingsOpen,setSettingsOpen]=useState(false);
  const prBarRef=useRef(null);
  const bagRef=useRef([]);const aR=useRef(null);const tR=useRef(0);const dR=useRef(0);const sT=useRef(true);
  const lR=useRef(false);const mR=useRef(false);const bR=useRef(false);const mlR=useRef(true);const fR=useRef("straight");const soR=useRef("piano");const ciR=useRef(true);
  const abOnR=useRef(false);const abAR=useRef(0);const abBR=useRef(1);const lcR=useRef(0);
  const noteFracsR=useRef(null);const curNoteR=useRef(-1);const onCurNoteR=useRef(null);const onLoopCompleteR=useRef(null);
  const pTR=useRef(pT||tempo);
  const abcR=useRef(abc);const toneStartR=useRef(0);
  const lickTS=useMemo(function(){var m=abc.match(/M:(\d+)\/(\d+)/);return m?[parseInt(m[1]),parseInt(m[2])]:null;},[abc]);
  useEffect(()=>{abcR.current=abc;},[abc]);
  useEffect(()=>{lR.current=lp;},[lp]);useEffect(()=>{bR.current=bk;},[bk]);
  useEffect(()=>{mlR.current=ml;},[ml]);useEffect(()=>{fR.current=fl;},[fl]);useEffect(()=>{soR.current=sound;},[sound]);
  useEffect(()=>{ciR.current=ci;},[ci]);
  useEffect(()=>{abOnR.current=abOn;abAR.current=abA;abBR.current=abB;},[abOn,abA,abB]);
  useEffect(()=>{onCurNoteR.current=onCurNote;},[onCurNote]);
  useEffect(()=>{onLoopCompleteR.current=onLoopComplete;},[onLoopComplete]);
  useEffect(()=>{pTR.current=pT||tempo;},[pT,tempo]);
  useEffect(()=>{if(!samplesOk&&_samplerReady)setSamplesOk(true);},[]);
  const setPr=v=>{if(prBarRef.current)prBarRef.current.style.width=(v*100)+"%";};
  const setLc=v=>{if(lcDispRef.current){lcDispRef.current.textContent=v;lcDispRef.current.parentElement.style.display=v>1?"flex":"none";}};
  const scheduledTimers=useRef([]);
  const clearScheduled=()=>{for(const tid of scheduledTimers.current)clearTimeout(tid);scheduledTimers.current=[];};
  const disposeBag=()=>{clearScheduled();if(_sampler&&_samplerReady)try{_sampler.releaseAll();_sampler.disconnect();}catch(e){}if(_chordSampler&&_chordSamplerReady)try{_chordSampler.releaseAll();_chordSampler.disconnect();}catch(e){}for(const n of bagRef.current){try{n.releaseAll&&n.releaseAll();}catch(e){}try{n.stop&&n.stop();}catch(e){}try{n.dispose();}catch(e){}}bagRef.current=[];};
  const metroCtrlRef=useRef({});// MiniMetronome writes start/stop here
  const clr=useCallback(()=>{sT.current=true;if(aR.current)cancelAnimationFrame(aR.current);disposeBag();sPl(false);setPr(0);setLc(0);setLoading(false);lcR.current=0;curNoteR.current=-1;if(onCurNoteR.current)onCurNoteR.current(-1);try{metroCtrlRef.current.stop&&metroCtrlRef.current.stop();}catch(e){}},[]);
  // Live restart at new BPM (called when user changes BPM during playback)
  const liveRestart=useCallback((newBpm)=>{
    if(sT.current)return;// not playing
    sT.current=true;if(aR.current)cancelAnimationFrame(aR.current);disposeBag();
    pTR.current=newBpm;
    const p=parseAbc(abcR.current,newBpm);sT.current=false;
    // Shared time ref for lick + metronome
    var t0=Tone.now();toneStartR.current=t0;
    ciOffR.current=0;sch(p,false,t0);
    try{metroCtrlRef.current.start&&metroCtrlRef.current.start(t0);}catch(e){}
    const an=()=>{if(sT.current)return;const el=Tone.now()-toneStartR.current;const dur=dR.current;if(dur<=0)return;
      const cOff=ciOffR.current;const musicEl=el-cOff;
      if(musicEl<0){setPr(0);aR.current=requestAnimationFrame(an);return;}
      if(abOnR.current){
        const abStart=abAR.current;const abEnd=abBR.current;const segDur=dur*(abEnd-abStart);
        if(segDur<=0){aR.current=requestAnimationFrame(an);return;}
        const segP=musicEl/segDur;
        if(segP>=1&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm)pTR.current=metroCtrlRef.current.getBpm();var lt0=toneStartR.current+ciOffR.current+segDur;toneStartR.current=lt0;lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);return;}
        const effP=abStart+(musicEl%segDur)/dur;
        setPr(Math.min(effP,1));
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(effP>=fracs[i].frac-0.001&&effP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
      }else{
        const rawP=musicEl/dur;
        setPr(Math.min(rawP,1));
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(rawP>=fracs[i].frac-0.001&&rawP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
        if(rawP>=1){if(lR.current&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm)pTR.current=metroCtrlRef.current.getBpm();var lt0=toneStartR.current+ciOffR.current+dR.current;toneStartR.current=lt0;lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);}else{clr();}return;}
      }
      aR.current=requestAnimationFrame(an);};aR.current=requestAnimationFrame(an);
  },[]);
  useEffect(()=>()=>clr(),[]);
  const sch=(parsed,doCi,refNow)=>{disposeBag();const bag=[];const sw=fR.current==="straight"?0:fR.current==="swing"?1:2;
    const{scheduled:notes,totalDur,chordTimes}=applyTiming(parsed,sw);dR.current=totalDur;
    const mel=makeMelSynth(soR.current,bag);const click=makeClick(bag);
    const cs=makeChordSynth(bag);bagRef.current=bag;const now=refNow||Tone.now();
    let cOff=doCi?parsed.spb*parsed.tsNum:0;
    const abActive=abOnR.current;const abS=abActive?abAR.current*totalDur:0;const abE=abActive?abBR.current*totalDur:totalDur;
    const timers=[];
    // Schedule melody via setTimeout (cancellable on stop)
    for(const n of notes){if(!n.tones)continue;if(abActive&&(n.startTime<abS-0.001||n.startTime>=abE-0.001))continue;const delay=((cOff+(abActive?n.startTime-abS:n.startTime)))*1000;
      if(mlR.current){const _n=n;timers.push(setTimeout(()=>{if(sT.current)return;_n.tones.forEach(tn=>mel.play(tn,Math.min(_n.dur*0.9,2),Tone.now(),_n.vel));},Math.max(0,delay)));}}
    // Schedule backing chords
    if(bR.current)for(const c of chordTimes){if(abActive&&(c.time<abS-0.001||c.time>=abE-0.001))continue;const cn=chordToNotes(c.name);if(cn.length){const delay=(cOff+(abActive?c.time-abS:c.time))*1000;timers.push(setTimeout(()=>{if(sT.current)return;cs.triggerAttackRelease(cn,"2n");},Math.max(0,delay)));}}
    // Schedule metronome clicks
    if(mR.current){const bLen=parsed.spb;for(let tm=0;tm<totalDur;tm+=bLen){if(abActive&&(tm<abS-0.001||tm>=abE-0.001))continue;const delay=(cOff+(abActive?tm-abS:tm))*1000;const bIdx=Math.round(tm/bLen)%parsed.tsNum;timers.push(setTimeout(()=>{if(sT.current)return;click[bIdx===0?"hi":"lo"].triggerAttackRelease("32n");},Math.max(0,delay)));}}
    scheduledTimers.current=timers;
    noteFracsR.current=getNoteTimeFracs(abcR.current);dR.current=totalDur;return cOff;};
  const ciOffR=useRef(0);
  const tg=async()=>{if(pl){clr();return;}if(!sT.current)return;sT.current=false;try{await Tone.start();}catch(e){}
    // Read BPM from metronome (single source of truth)
    if(metroCtrlRef.current.getBpm){pTR.current=metroCtrlRef.current.getBpm();}
    setLoading(true);
    if(!_samplerReady&&!_samplerFailed){await preloadPiano();setSamplesOk(_samplerReady);}
    if(!_chordSamplerReady)await preloadChordPiano();
    const p=parseAbc(abcR.current,pTR.current);
    // Capture ONE time reference — shared by lick notes AND metronome
    var t0=Tone.now();toneStartR.current=t0;
    var useCi=ciR.current;
    ciOffR.current=sch(p,useCi,t0);
    // Start metronome at t0 — during count-in it ticks alone, then lick joins
    try{metroCtrlRef.current.start&&metroCtrlRef.current.start(t0);}catch(e){}
    sPl(true);lcR.current=1;setLc(1);setLoading(false);
    const an=()=>{if(sT.current)return;const el=Tone.now()-toneStartR.current;const dur=dR.current;if(dur<=0)return;
      const cOff=ciOffR.current;const musicEl=el-cOff;
      if(musicEl<0){setPr(0);aR.current=requestAnimationFrame(an);return;}
      if(abOnR.current){
        const abStart=abAR.current;const abEnd=abBR.current;const segDur=dur*(abEnd-abStart);
        if(segDur<=0){aR.current=requestAnimationFrame(an);return;}
        const segP=musicEl/segDur;
        if(segP>=1&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm)pTR.current=metroCtrlRef.current.getBpm();lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}var lt0=toneStartR.current+ciOffR.current+segDur;toneStartR.current=lt0;ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);return;}
        const effP=abStart+(musicEl%segDur)/dur;
        setPr(Math.min(effP,1));
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(effP>=fracs[i].frac-0.001&&effP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
      }else{
        const rawP=musicEl/dur;
        setPr(Math.min(rawP,1));
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(rawP>=fracs[i].frac-0.001&&rawP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
        if(rawP>=1){if(lR.current&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm)pTR.current=metroCtrlRef.current.getBpm();var lt0=toneStartR.current+ciOffR.current+dR.current;toneStartR.current=lt0;lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);}else{clr();}return;}
      }
      aR.current=requestAnimationFrame(an);};aR.current=requestAnimationFrame(an);};
  const tgRef=useRef(null);tgRef.current=tg;
  useEffect(function(){if(ctrlRef)ctrlRef.current={toggle:function(){tgRef.current&&tgRef.current();},playing:pl};},[pl]);
  const autoPlayPrev=useRef(false);
  useEffect(function(){if(autoPlay&&!autoPlayPrev.current&&tgRef.current){var t2=setTimeout(function(){tgRef.current();},50);autoPlayPrev.current=true;return function(){clearTimeout(t2);};}
    if(!autoPlay&&autoPlayPrev.current){autoPlayPrev.current=false;clr();}},[autoPlay]);
  const bb={border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",fontFamily:"'Inter',sans-serif"};
  const pill=(a,ic,fn,label)=>React.createElement("button",{onClick:e=>{e.stopPropagation();fn();},style:{...bb,gap:4,padding:"5px 12px",fontSize:11,fontWeight:a?600:500,borderRadius:20,background:a?t.accentBg:t.pillBg,color:a?t.accent:t.subtle,border:a?"1.5px solid "+t.accentBorder:"1.5px solid "+t.pillBorder,boxShadow:a?"0 0 8px "+t.accentGlow:"none",letterSpacing:0.2}},ic,label?" "+label:"");
  const sBtn=(a,l,fn)=>React.createElement("button",{onClick:e=>{e.stopPropagation();fn();},style:{...bb,gap:4,padding:"6px 12px",fontSize:11,fontWeight:500,borderRadius:8,background:a?t.accentBg:t.filterBg,color:a?t.accent:t.muted}},l);
  const nonDefaults=[!ml&&"mute",bk&&"back",fl!=="straight"&&"feel",ci===false&&"no-ci",sound!=="piano"&&"sound"].filter(Boolean);

  if(hideControls)return React.createElement("div",{style:{marginTop:8}},
    // Progress bar only (thin)
    React.createElement("div",{style:{height:3,background:t.progressBg,borderRadius:3,overflow:"hidden",marginBottom:8}},
      React.createElement("div",{ref:prBarRef,style:{width:"0%",height:"100%",background:t.accent,borderRadius:3}})),
    // Melody toggle
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6}},
      pill(ml,ml?"\u266B":"\u2715",()=>sMl(!ml),ml?"Melody":"Melody off")),
    // MINI METRONOME
    React.createElement("div",{"data-coach":"metro",style:{background:t.settingsBg||t.card,borderRadius:12,border:"1px solid "+t.border,padding:"4px 12px",marginBottom:6}},
      React.createElement(MiniMetronome,{th:t,initBpm:pT||tempo,syncPlaying:pl,ctrlRef:metroCtrlRef,onBpmChange:function(v){pTR.current=v;if(sPT)sPT(v);if(!sT.current)liveRestart(v);},lickTempo:lickTempo||tempo,onSetLoop:function(v){if(v)sLp(true);},lickTimeSig:lickTS})),
    // SETTINGS
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
      React.createElement("button",{onClick:e=>{e.stopPropagation();setSettingsOpen(!settingsOpen);},style:{...bb,gap:4,padding:"5px 10px",fontSize:11,fontWeight:400,borderRadius:8,background:settingsOpen?t.filterBg:"transparent",color:settingsOpen?t.text:t.muted}},"Settings",settingsOpen?" \u25B4":" \u25BE"),
      nonDefaults.length>0&&!settingsOpen&&React.createElement("span",{style:{fontSize:10,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:500}},nonDefaults.length+" changed")),
    settingsOpen&&React.createElement("div",{style:{marginTop:6,padding:"14px",background:t.settingsBg,borderRadius:12,border:"1px solid "+t.border,display:"flex",flexDirection:"column",gap:14}},
      React.createElement("div",null,
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,display:"block",marginBottom:6,letterSpacing:0.5}},"SOUND"),
        React.createElement("div",{style:{display:"flex",gap:4,overflowX:"auto",scrollbarWidth:"none"}},SOUND_PRESETS.map(p=>React.createElement("button",{key:p.id,onClick:e=>{e.stopPropagation();setSound(p.id);},style:{...bb,gap:3,padding:"6px 10px",fontSize:11,borderRadius:8,whiteSpace:"nowrap",background:sound===p.id?t.accentBg:t.filterBg,color:sound===p.id?t.accent:t.muted}},p.label)))),
      React.createElement("div",null,
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,display:"block",marginBottom:6,letterSpacing:0.5}},"FEEL"),
        React.createElement("div",{style:{display:"flex",gap:4}},["straight","swing","hard-swing"].map(v=>sBtn(fl===v,v==="straight"?"Straight":v==="swing"?"Swing":"Hard Swing",()=>sFl(v))))),
      React.createElement("div",{style:{display:"flex",gap:5,flexWrap:"wrap"}},
        sBtn(bk,"Backing "+(bk?"\u2713":"\u2717"),()=>sBk(!bk)),
        sBtn(ci,"Count-in "+(ci?"\u2713":"\u2717"),()=>setCi(!ci)))));

  return React.createElement("div",{style:{marginTop:12}},
    // ROW 1: Play button, progress bar, pills
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
      React.createElement("button",{onClick:e=>{e.stopPropagation();tg();},style:{...bb,width:t===TH.studio?48:42,height:t===TH.studio?48:42,borderRadius:"50%",flexShrink:0,background:pl?t.filterBg:loading?t.filterBg:t.playBg,boxShadow:pl||loading?"none":"0 4px 18px "+(t.accentGlow||"rgba(0,0,0,0.1)"),animation:!pl&&!loading&&t===TH.studio?"playPulse 2.5s ease-in-out infinite":"none"}},
        loading?React.createElement("div",{style:{width:16,height:16,border:"2px solid "+t.accentBg,borderTopColor:t.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}):
        pl?React.createElement("div",{style:{display:"flex",gap:2.5}},React.createElement("div",{style:{width:3,height:14,background:t.muted,borderRadius:1}}),React.createElement("div",{style:{width:3,height:14,background:t.muted,borderRadius:1}})):
        React.createElement("div",{style:{width:0,height:0,borderTop:"8px solid transparent",borderBottom:"8px solid transparent",borderLeft:"13px solid #fff",marginLeft:2}})),
      React.createElement("div",{style:{flex:1,height:4,background:t.progressBg,borderRadius:4,overflow:"hidden",position:"relative"}},
        abOn&&React.createElement("div",{style:{position:"absolute",left:((abA||0)*100)+"%",width:(((abB||1)-(abA||0))*100)+"%",height:"100%",background:t.accentBg}}),
        React.createElement("div",{ref:prBarRef,style:{position:"absolute",left:0,width:"0%",height:"100%",background:t.accent,borderRadius:4}})),
      lp&&React.createElement("div",{style:{display:"none",alignItems:"center",gap:2,flexShrink:0,background:t.accent,borderRadius:10,padding:"2px 7px 2px 5px",animation:"loopPulse 1.2s ease-in-out infinite"}},t===TH.studio?IC.loop(10,"#fff"):React.createElement("span",{style:{fontSize:9,color:"#fff",fontWeight:600}},"\u00D7"),React.createElement("span",{ref:lcDispRef,style:{fontSize:9,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}})),
      pill(lp,"\u221E",()=>sLp(!lp),"Loop"),
      setAbOn&&React.createElement("span",{"data-coach":"ab-loop"},pill(abOn,"\u2759\u2759",()=>{setAbOn(!abOn);if(!abOn){setAbA(0);setAbB(1);}},"A\u2009\u00B7\u2009B"))),

    // ROW 2: Melody toggle
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginTop:8}},
      pill(ml,ml?"\u266B":"\u2715",()=>sMl(!ml),ml?"Melody":"Melody off")),

    // MINI METRONOME — single source of truth for tempo
    React.createElement("div",{"data-coach":"metro",style:{marginTop:8,background:t.settingsBg||t.card,borderRadius:12,border:"1px solid "+t.border,padding:"4px 12px"}},
      React.createElement(MiniMetronome,{th:t,initBpm:pT||tempo,syncPlaying:pl,ctrlRef:metroCtrlRef,onBpmChange:function(v){pTR.current=v;if(sPT)sPT(v);if(!sT.current)liveRestart(v);},lickTempo:lickTempo||tempo,onSetLoop:function(v){if(v)sLp(true);},lickTimeSig:lickTS})),

    // SETTINGS
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginTop:8}},
      React.createElement("button",{onClick:e=>{e.stopPropagation();setSettingsOpen(!settingsOpen);},style:{...bb,gap:4,padding:"5px 10px",fontSize:11,fontWeight:400,borderRadius:8,background:settingsOpen?t.filterBg:"transparent",color:settingsOpen?t.text:t.muted}},"Settings",settingsOpen?" \u25B4":" \u25BE"),
      nonDefaults.length>0&&!settingsOpen&&React.createElement("span",{style:{fontSize:10,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:500}},nonDefaults.length+" changed")),
    settingsOpen&&React.createElement("div",{style:{marginTop:6,padding:"14px",background:t.settingsBg,borderRadius:12,border:"1px solid "+t.border,display:"flex",flexDirection:"column",gap:14}},
      setTrInst&&React.createElement(TransposeBar,{trInst,setTrInst,trMan,setTrMan,th:t}),
      React.createElement("div",null,
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,display:"block",marginBottom:6,letterSpacing:0.5}},"SOUND"),
        React.createElement("div",{style:{display:"flex",gap:4,overflowX:"auto",scrollbarWidth:"none"}},SOUND_PRESETS.map(p=>React.createElement("button",{key:p.id,onClick:e=>{e.stopPropagation();setSound(p.id);},style:{...bb,gap:3,padding:"6px 10px",fontSize:11,borderRadius:8,whiteSpace:"nowrap",background:sound===p.id?t.accentBg:t.filterBg,color:sound===p.id?t.accent:t.muted}},p.label)))),
      React.createElement("div",null,
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,display:"block",marginBottom:6,letterSpacing:0.5}},"FEEL"),
        React.createElement("div",{style:{display:"flex",gap:4}},["straight","swing","hard-swing"].map(v=>sBtn(fl===v,v==="straight"?"Straight":v==="swing"?"Swing":"Hard Swing",()=>sFl(v))))),
      React.createElement("div",{style:{display:"flex",gap:5,flexWrap:"wrap"}},
        sBtn(bk,"Backing "+(bk?"\u2713":"\u2717"),()=>sBk(!bk)),
        sBtn(ci,"Count-in "+(ci?"\u2713":"\u2717"),()=>setCi(!ci)))));}


// ============================================================
// TRANSPOSE BAR — themed
// ============================================================
function TransposeBar({trInst,setTrInst,trMan,setTrMan,th}){const t=th||TH.classic;const total=(INST_TRANS[trInst]||0)+trMan;
  return React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}},
      React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"TRANSPOSE"),
      total!==0&&React.createElement("button",{onClick:()=>{setTrInst("Concert");setTrMan(0);},style:{fontSize:10,color:t.muted,background:t.filterBg,border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"'Inter',sans-serif"}},"Reset")),
    React.createElement("div",{style:{display:"flex",gap:4,marginBottom:8,overflowX:"auto",scrollbarWidth:"none"}},TRANS_INSTRUMENTS.map(inst=>React.createElement("button",{key:inst,onClick:()=>setTrInst(inst),style:{padding:"6px 10px",borderRadius:8,border:"none",background:trInst===inst?t.accentBg:t.filterBg,color:trInst===inst?t.accent:t.muted,fontSize:11,fontFamily:"'Inter',sans-serif",cursor:"pointer",whiteSpace:"nowrap",fontWeight:trInst===inst?500:400}},inst==="Concert"?"Concert":inst))),
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
      React.createElement("span",{style:{fontSize:9,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"Key"),
      React.createElement("button",{onClick:()=>setTrMan(m=>m-1),style:{width:28,height:28,borderRadius:8,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
      React.createElement("span",{style:{fontSize:13,color:trMan?t.accent:t.muted,fontFamily:"'JetBrains Mono',monospace",minWidth:28,textAlign:"center",fontWeight:trMan?600:400}},trMan>0?"+"+trMan:String(trMan)),
      React.createElement("button",{onClick:()=>setTrMan(m=>m+1),style:{width:28,height:28,borderRadius:8,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+"),
      total!==0&&React.createElement("span",{style:{marginLeft:"auto",fontSize:11,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600,background:t.accentBg,padding:"3px 10px",borderRadius:6}},trKeyName("C",total))));}
// NOTE BUILDER — light theme
// ============================================================
const DURS=[{label:"W",name:"Whole",eighths:8},{label:"H",name:"Half",eighths:4},{label:"Q",name:"Quarter",eighths:2},{label:"8",name:"8th",eighths:1},{label:"16",name:"16th",eighths:0.5}];
function noteIcon(idx,color,sz){var c=color||"#666",s=sz||22,h=s,w=Math.round(s*0.7);
  // Whole: open oval
  if(idx===0)return React.createElement("svg",{width:w,height:h,viewBox:"0 0 16 22"},React.createElement("ellipse",{cx:8,cy:14,rx:5.5,ry:3.8,fill:"none",stroke:c,strokeWidth:1.8}));
  // Half: open oval + stem
  if(idx===1)return React.createElement("svg",{width:w,height:h,viewBox:"0 0 16 22"},React.createElement("ellipse",{cx:7,cy:15,rx:5,ry:3.5,fill:"none",stroke:c,strokeWidth:1.8,transform:"rotate(-15 7 15)"}),React.createElement("line",{x1:12,y1:15,x2:12,y2:2,stroke:c,strokeWidth:1.5}));
  // Quarter: filled oval + stem
  if(idx===2)return React.createElement("svg",{width:w,height:h,viewBox:"0 0 16 22"},React.createElement("ellipse",{cx:7,cy:15,rx:5,ry:3.5,fill:c,transform:"rotate(-15 7 15)"}),React.createElement("line",{x1:12,y1:15,x2:12,y2:2,stroke:c,strokeWidth:1.5}));
  // 8th: filled oval + stem + flag
  if(idx===3)return React.createElement("svg",{width:w,height:h,viewBox:"0 0 16 22"},React.createElement("ellipse",{cx:7,cy:15,rx:5,ry:3.5,fill:c,transform:"rotate(-15 7 15)"}),React.createElement("line",{x1:12,y1:15,x2:12,y2:2,stroke:c,strokeWidth:1.5}),React.createElement("path",{d:"M12 2 C13 4 14.5 6.5 12 10",fill:"none",stroke:c,strokeWidth:1.4,strokeLinecap:"round"}));
  // 16th: filled oval + stem + double flag
  return React.createElement("svg",{width:w,height:h,viewBox:"0 0 16 22"},React.createElement("ellipse",{cx:7,cy:15,rx:5,ry:3.5,fill:c,transform:"rotate(-15 7 15)"}),React.createElement("line",{x1:12,y1:15,x2:12,y2:2,stroke:c,strokeWidth:1.5}),React.createElement("path",{d:"M12 2 C13 3.5 14.5 5.5 12 8.5",fill:"none",stroke:c,strokeWidth:1.4,strokeLinecap:"round"}),React.createElement("path",{d:"M12 5.5 C13 7 14.5 9 12 12",fill:"none",stroke:c,strokeWidth:1.4,strokeLinecap:"round"}));}
const NOTE_NMS=["C","D","E","F","G","A","B"];const CHORD_PR=["maj7","m7","7","m7b5","dim7","6","9","sus4"];
function e2s(e){if(e===1)return"";if(e===0.5)return"/2";if(e===0.75)return"3/4";if(e===1.5)return"3/2";if(e===3)return"3";if(e===6)return"6";if(e===12)return"12";if(Number.isInteger(e))return String(e);return String(Math.round(e*2))+"/2";}
var KEY_SIG_ACC={"C":{},"G":{F:1},"D":{F:1,C:1},"A":{F:1,C:1,G:1},"E":{F:1,C:1,G:1,D:1},"B":{F:1,C:1,G:1,D:1,A:1},"F#":{F:1,C:1,G:1,D:1,A:1,E:1},"Gb":{B:-1,E:-1,A:-1,D:-1,G:-1,C:-1},"F":{B:-1},"Bb":{B:-1,E:-1},"Eb":{B:-1,E:-1,A:-1},"Ab":{B:-1,E:-1,A:-1,D:-1},"Db":{B:-1,E:-1,A:-1,D:-1,G:-1}};
function buildAbc(items,keySig,timeSig,tempo,chords){const[tsN,tsD]=timeSig.split("/").map(Number);const bE=tsN*(8/tsD);const beatE=8/tsD;const bG=tsD===8?3:2;let abc="X:1\nT:My Lick\nM:"+timeSig+"\nL:1/8\nQ:1/4="+tempo+"\nK:"+keySig+"\n";const ksMap=KEY_SIG_ACC[keySig]||{};let pos=0,ns=false,nc=0;var barAlts={};var triCount=0;var chObj=chords||{};for(var ii=0;ii<items.length;ii++){var item=items[ii];if(item.type==="chord")continue;const ei=DURS[item.dur].eighths*(item.dotted?1.5:1);var effEi=item.tri?ei*(2/3):ei;if(pos>0){const bN=pos/bE;if(Math.abs(bN-Math.round(bN))<0.01&&Math.round(bN)>0){abc+=" | ";ns=false;barAlts={};}}if(nc>0&&ns)abc+=" ";var beatIdx=Math.round(pos/beatE);if(chObj[beatIdx])abc+='"'+chObj[beatIdx]+'"';if(item.tri&&triCount%3===0)abc+="(3";if(item.tri)triCount++;else triCount=0;if(item.type==="rest")abc+="z"+e2s(ei);else if(item.type==="note"){var ksA=ksMap[item.note]||0;var prevA=barAlts.hasOwnProperty(item.note)?barAlts[item.note]:ksA;var needsAcc=false;if(item.acc!==prevA){needsAcc=true;}else if(item.acc===ksA&&barAlts.hasOwnProperty(item.note)&&barAlts[item.note]!==ksA){needsAcc=true;}if(needsAcc){if(item.acc===1)abc+="^";else if(item.acc===-1)abc+="_";else abc+="=";}barAlts[item.note]=item.acc;if(item.oct>=5){abc+=item.note.toLowerCase();for(let o=6;o<=item.oct;o++)abc+="'";}else{abc+=item.note.toUpperCase();for(let o=3;o>=item.oct;o--)abc+=",";}abc+=e2s(ei);}const eP=pos+effEi;ns=ei>=2||Math.floor((eP-0.001)/bG)>Math.floor(pos/bG)||Math.floor((eP-0.001)/bE)>Math.floor(pos/bE);pos=eP;nc++;}if(nc>0)abc+=" |";return abc;}
function NoteBuilder({onAbcChange,keySig,timeSig,tempo,previewEl,playerEl}){const[items,sIt]=useState([]);const[cA,sCA]=useState(0);const[cO,sCO]=useState(5);const[cD,sCD]=useState(2);const[dt,sDt]=useState(false);const[tri,sTri]=useState(false);const[chords,sChords]=useState({});const[chEd,sChEd]=useState(null);const[chRoot,sChRoot]=useState("C");const[chQual,sChQual]=useState("maj7");const sR=useRef(null);useEffect(()=>{onAbcChange(buildAbc(items,keySig,timeSig,tempo,chords));},[items,keySig,timeSig,tempo,chords]);useEffect(()=>{if(sR.current)sR.current.scrollLeft=sR.current.scrollWidth;},[items]);const[tsN,tsD]=timeSig.split("/").map(Number);const bE=tsN*(8/tsD);const beatE=8/tsD;let tE=0;for(const it of items)if(it.type==="note"||it.type==="rest")tE+=DURS[it.dur].eighths*(it.dotted?1.5:1)*(it.tri?2/3:1);const cBar=Math.floor(tE/bE)+1;const pIB=tE%bE;const cBeat=Math.floor(pIB/beatE)+1;const totalBeats=Math.max(tsN,Math.ceil(tE/beatE));const ac="#6366F1",mu="#8E8E93";
  const renderItem=(item,idx)=>{let pB=0;for(let j=0;j<idx;j++){const it=items[j];if(it.type==="note"||it.type==="rest")pB+=DURS[it.dur].eighths*(it.dotted?1.5:1)*(it.tri?2/3:1);}const atBar=idx>0&&pB>0&&Math.abs(pB%bE)<0.01;const els=[];if(atBar)els.push(React.createElement("div",{key:idx+"b",style:{width:2,height:44,background:"#E0DFD8",borderRadius:1,flexShrink:0,marginRight:2}}));let ct,bg="#F5F4F0";if(item.type==="note"){const aS=item.acc===1?"\u266F":item.acc===-1?"\u266D":"";ct=React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:0}},React.createElement("span",{style:{fontSize:13,fontWeight:600,fontFamily:"'Instrument Serif',serif",lineHeight:1.1,color:"#1A1A1A"}},aS+item.note+(item.dotted?".":"")+(item.tri?"\u00B3":"")),React.createElement("span",{style:{fontSize:8,color:mu,lineHeight:1}},item.oct),noteIcon(item.dur,"#666",16));bg="rgba(99,102,241,0.04)";}else if(item.type==="rest"){ct=React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center"}},React.createElement("span",{style:{fontSize:10,color:mu}},"rest"),noteIcon(item.dur,"#AAA",14));bg="#F0EFE8";}els.push(React.createElement("div",{key:idx,onClick:()=>sIt(p=>p.filter((_,i)=>i!==idx)),style:{minWidth:38,height:48,borderRadius:8,background:bg,color:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",padding:"2px 5px",cursor:"pointer",flexShrink:0,border:"1px solid #E8E7E3"}},ct));return els;};
  // Chord lane: beat slots with inline editor
  var chordLaneEl=React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:4}},
    React.createElement("div",{style:{display:"flex",gap:2,overflow:"auto"}},
      Array.from({length:totalBeats},function(_,bi){
        var ch=chords[bi];var isEd=chEd===bi;var barNum=Math.floor(bi/tsN)+1;var beatNum=(bi%tsN)+1;var isBarStart=bi%tsN===0;
        return React.createElement("div",{key:bi,onClick:function(){if(isEd){sChEd(null);}else{if(ch){var ps=ch.match(/^([A-G][b#]?)(.*)/);if(ps){sChRoot(ps[1]);sChQual(ps[2]||"maj7");}}sChEd(bi);}},style:{flex:1,minWidth:44,padding:ch?"4px 2px":"6px 2px",borderRadius:8,border:isEd?"2px solid "+ac:"1px solid "+(ch?"rgba(99,102,241,0.2)":"#E8E7E3"),background:isEd?"rgba(99,102,241,0.06)":ch?"rgba(99,102,241,0.03)":"#FAFAF8",cursor:"pointer",textAlign:"center",position:"relative",borderLeft:isBarStart&&bi>0?"2px solid #D0CFc8":undefined}},
          ch?React.createElement("div",{style:{fontSize:11,fontWeight:600,color:ac,fontFamily:"'Instrument Serif',serif",lineHeight:1.2}},ch):React.createElement("div",{style:{fontSize:10,color:"#CCC"}},"+"),
          React.createElement("div",{style:{fontSize:7,color:"#BBB",fontFamily:"monospace",lineHeight:1}},beatNum));})),
    // Inline chord editor
    chEd!==null&&React.createElement("div",{style:{background:"rgba(99,102,241,0.03)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:10,padding:8}},
      React.createElement("div",{style:{display:"flex",gap:3,marginBottom:5,flexWrap:"wrap"}},["C","D","E","F","G","A","B","Bb","Eb","Ab","Db","F#"].map(function(r){return React.createElement("button",{key:r,onClick:function(){sChRoot(r);},style:{padding:"2px 7px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'Instrument Serif',serif",fontWeight:600,background:chRoot===r?"rgba(99,102,241,0.1)":"#F0EFE8",color:chRoot===r?ac:"#666"}},r);})),
      React.createElement("div",{style:{display:"flex",gap:3,marginBottom:6,flexWrap:"wrap"}},CHORD_PR.map(function(q){return React.createElement("button",{key:q,onClick:function(){sChQual(q);},style:{padding:"2px 6px",borderRadius:5,border:"none",cursor:"pointer",fontSize:10,fontFamily:"monospace",background:chQual===q?"rgba(99,102,241,0.1)":"#F0EFE8",color:chQual===q?ac:mu}},q);})),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
        React.createElement("span",{style:{fontSize:14,color:ac,fontFamily:"'Instrument Serif',serif",fontWeight:600}},chRoot+chQual),
        React.createElement("button",{onClick:function(){sChords(function(p){var n=Object.assign({},p);n[chEd]=chRoot+chQual;return n;});sChEd(null);},style:{padding:"4px 12px",borderRadius:7,border:"none",background:ac,color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}},"Set"),
        chords[chEd]&&React.createElement("button",{onClick:function(){sChords(function(p){var n=Object.assign({},p);delete n[chEd];return n;});sChEd(null);},style:{padding:"4px 10px",borderRadius:7,border:"1px solid #E0DFD8",background:"#F5F4F0",color:"#E53935",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}},"\u2715"),
        React.createElement("button",{onClick:function(){sChEd(null);},style:{padding:"4px 10px",borderRadius:7,border:"1px solid #E0DFD8",background:"#F5F4F0",color:mu,fontSize:10,cursor:"pointer",fontFamily:"'Inter',sans-serif"}},"Cancel"))));
  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
    // 1. Bar indicator
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",background:"#F5F4F0",borderRadius:8}},
      React.createElement("span",{style:{fontSize:10,color:mu,fontFamily:"monospace",letterSpacing:1}},"BAR "+cBar),
      React.createElement("span",{style:{fontSize:14,color:ac,fontFamily:"'Instrument Serif',serif",minWidth:60}},"Beat "+cBeat),
      React.createElement("div",{style:{display:"flex",gap:4,flex:1}},Array.from({length:tsN},function(_,i){return React.createElement("div",{key:i,style:{flex:1,height:4,borderRadius:2,background:i<cBeat-1?ac:i===cBeat-1?"rgba(99,102,241,0.35)":"#E8E7E3"}});})),
      items.length>0&&React.createElement("button",{onClick:function(){sIt(function(p){return p.slice(0,-1);});},style:{fontSize:10,color:mu,background:"#E8E7E3",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontFamily:"monospace"}},"\u21A9"),
      items.length>0&&React.createElement("button",{onClick:function(){sIt([]);sChords({});},style:{fontSize:10,color:"#E53935",background:"rgba(229,57,53,0.06)",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontFamily:"monospace"}},"\u2715")),
    // 2. Duration picker
    React.createElement("div",{style:{display:"flex",gap:4,alignItems:"center"}},
      DURS.map(function(dd,i){return React.createElement("button",{key:i,onClick:function(){sCD(i);},style:{padding:"4px 6px",borderRadius:8,border:"1px solid "+(cD===i?"rgba(99,102,241,0.2)":"#E8E7E3"),cursor:"pointer",background:cD===i?"rgba(99,102,241,0.04)":"#fff",color:cD===i?ac:"#888",display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:36}},noteIcon(i,cD===i?ac:"#888"),React.createElement("span",{style:{fontSize:7,letterSpacing:0.5,fontFamily:"monospace"}},dd.name));}),
      React.createElement("div",{style:{width:1,height:28,background:"#E8E7E3"}}),
      React.createElement("button",{onClick:function(){sDt(!dt);},style:{padding:"4px 10px",borderRadius:8,border:"1px solid "+(dt?"rgba(99,102,241,0.2)":"#E8E7E3"),cursor:"pointer",background:dt?"rgba(99,102,241,0.04)":"#fff",color:dt?ac:"#888",fontSize:18,fontWeight:700}},"\u00B7"),
      React.createElement("button",{onClick:function(){sTri(!tri);},style:{padding:"4px 8px",borderRadius:8,border:"1px solid "+(tri?"rgba(99,102,241,0.2)":"#E8E7E3"),cursor:"pointer",background:tri?"rgba(99,102,241,0.04)":"#fff",color:tri?ac:"#888",fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}},"3")),
    // 3. Chord lane
    chordLaneEl,
    // Slot: notation preview
    previewEl,
    // 4. Octave selector + Rest
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4}},
      React.createElement("span",{style:{fontSize:9,color:mu,fontFamily:"monospace"}},"OCT"),
      React.createElement("button",{onClick:function(){sCO(function(o){return Math.max(2,o-1);});},style:{width:26,height:26,borderRadius:6,border:"1px solid #E8E7E3",background:"#fff",color:"#444",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
      React.createElement("span",{style:{fontSize:16,color:ac,fontFamily:"'Instrument Serif',serif",minWidth:20,textAlign:"center"}},cO),
      React.createElement("button",{onClick:function(){sCO(function(o){return Math.min(7,o+1);});},style:{width:26,height:26,borderRadius:6,border:"1px solid #E8E7E3",background:"#fff",color:"#444",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+"),
      React.createElement("div",{style:{width:1,height:20,background:"#E8E7E3",marginLeft:4,marginRight:4}}),
      React.createElement("button",{onClick:function(){sIt(function(p){return p.concat([{type:"rest",dur:cD,dotted:dt,tri:tri}]);});},style:{padding:"4px 10px",borderRadius:8,border:"1px solid #E0DFD8",background:"#F5F4F0",color:mu,fontSize:10,cursor:"pointer",fontFamily:"monospace"}},"Rest")),
    // 5. Piano keyboard
    React.createElement("div",{style:{position:"relative",height:110,userSelect:"none"}},
      React.createElement("div",{style:{display:"flex",height:"100%",gap:2}},
        ["C","D","E","F","G","A","B"].map(function(n){return React.createElement("button",{key:n,onClick:function(){prevNote(n,cO,0);sIt(function(p){return p.concat([{type:"note",note:n,acc:0,oct:cO,dur:cD,dotted:dt,tri:tri}]);});},style:{flex:1,height:"100%",borderRadius:8,border:"1px solid #D5D4CE",cursor:"pointer",background:"#fff",color:"#1A1A1A",fontSize:15,fontWeight:600,fontFamily:"'Instrument Serif',Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",paddingBottom:8,position:"relative",zIndex:1}},n);})),
      (function(){var flatKeys=["F","Bb","Eb","Ab","Db","Gb"];var useFlats=flatKeys.indexOf(keySig)>=0||keySig==="C";
        var blacks=useFlats?
          [{n:"D",a:-1,l:"D\u266D",x:"11.5%"},{n:"E",a:-1,l:"E\u266D",x:"25%"},{n:"G",a:-1,l:"G\u266D",x:"53.5%"},{n:"A",a:-1,l:"A\u266D",x:"67.5%"},{n:"B",a:-1,l:"B\u266D",x:"81.5%"}]:
          [{n:"C",a:1,l:"C\u266F",x:"11.5%"},{n:"D",a:1,l:"D\u266F",x:"25%"},{n:"F",a:1,l:"F\u266F",x:"53.5%"},{n:"G",a:1,l:"G\u266F",x:"67.5%"},{n:"A",a:1,l:"A\u266F",x:"81.5%"}];
        return blacks.map(function(k){return React.createElement("button",{key:k.l,onClick:function(e){e.stopPropagation();prevNote(k.n,cO,k.a);sIt(function(p){return p.concat([{type:"note",note:k.n,acc:k.a,oct:cO,dur:cD,dotted:dt,tri:tri}]);});},style:{position:"absolute",top:0,left:k.x,width:"10%",height:"62%",borderRadius:"0 0 6px 6px",border:"1px solid #333",cursor:"pointer",background:"linear-gradient(180deg,#2A2A2A,#111)",color:"#ccc",fontSize:9,fontWeight:600,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:5,zIndex:2,boxShadow:"0 2px 4px rgba(0,0,0,0.3)"}},k.l);});}())),
    // Slot: player/metronome
    playerEl);}

// ============================================================
// SHEET FOCUS — fullscreen notation overlay
// ============================================================
function SheetFocus({abc,onClose,abRange,curNoteRef,th,playerCtrlRef}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const[playing,setPlaying]=useState(false);
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  // Poll playing state from playerCtrlRef
  useEffect(()=>{if(!playerCtrlRef)return;var iv=setInterval(function(){var p=playerCtrlRef.current&&playerCtrlRef.current.playing;if(p!==playing)setPlaying(!!p);},100);return function(){clearInterval(iv);};},[playing]);
  var onToggle=function(){if(playerCtrlRef&&playerCtrlRef.current&&playerCtrlRef.current.toggle)playerCtrlRef.current.toggle();};
  return React.createElement("div",{"data-sheet-focus":"true",style:{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",maxWidth:"none",zIndex:9999,background:t.card,display:"flex",flexDirection:"column",animation:"fadeIn 0.15s ease"}},
    React.createElement("div",{style:{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:"52px 16px 72px",paddingTop:"calc(env(safe-area-inset-top, 0px) + 52px)",minHeight:0}},
      React.createElement(Notation,{abc,compact:false,focus:true,abRange,curNoteRef,th:t})),
    // Bottom bar with play/stop
    React.createElement("div",{style:{position:"absolute",bottom:0,left:0,right:0,padding:"12px 16px",paddingBottom:"max(12px, env(safe-area-inset-bottom))",background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid "+t.border,display:"flex",alignItems:"center",justifyContent:"center",gap:16}},
      React.createElement("button",{onClick:onToggle,style:{width:48,height:48,borderRadius:24,border:"none",background:playing?(isStudio?"#EF4444":t.muted):(isStudio?t.playBg:t.accent),color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:playing?"none":"0 4px 16px "+t.accentGlow,transition:"all 0.15s"}},playing?"\u25A0":"\u25B6")),
    React.createElement("button",{onClick:onClose,style:{position:"absolute",top:"calc(env(safe-area-inset-top, 0px) + 10px)",right:20,width:40,height:40,borderRadius:12,border:"1px solid "+t.border,background:t.card,color:t.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.15)",zIndex:10}},"\u2715"));}


// ============================================================
// YOUTUBE PLAYER — themed
// ============================================================
function parseYT(u){if(!u)return{videoId:"",startTime:0};let v="",s=0;const m=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);if(m)v=m[1];const t1=u.match(/[?&]t=(\d+)m(\d+)s/);if(t1)s=parseInt(t1[1])*60+parseInt(t1[2]);else{const t2=u.match(/[?&]t=(\d+)/);if(t2)s=parseInt(t2[1]);}const t3=u.match(/[?&]start=(\d+)/);if(t3)s=parseInt(t3[1]);return{videoId:v,startTime:s};}
function fT(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function YTP({videoId,startTime,isActive,th}){const t=th||TH.classic;const[on,sO]=useState(false);if(!isActive||!videoId)return null;
  return React.createElement("div",{style:{marginTop:12}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6}},
      React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"monospace",letterSpacing:1}},"ORIGINAL"),
      startTime>0&&React.createElement("span",{style:{fontSize:10,fontFamily:"monospace",color:t.accent,background:t.accentBg,padding:"2px 8px",borderRadius:8}},"\u23F1 "+fT(startTime))),
    React.createElement("div",{style:{position:"relative",paddingBottom:"56.25%",borderRadius:12,overflow:"hidden",background:"#1A1A1A"}},
      on?React.createElement("iframe",{src:"https://www.youtube.com/embed/"+videoId+"?start="+(startTime||0)+"&autoplay=1&rel=0",style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"},allow:"autoplay; encrypted-media",allowFullScreen:true}):
      React.createElement("button",{onClick:e=>{e.stopPropagation();sO(true);},style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",background:"linear-gradient(135deg,#2a2a3e,#1a1a2e)",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}},
        React.createElement("div",{style:{width:52,height:52,borderRadius:"50%",background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px "+t.accentGlow}},
          React.createElement("div",{style:{width:0,height:0,borderTop:"10px solid transparent",borderBottom:"10px solid transparent",borderLeft:"16px solid #fff",marginLeft:3}})),
        React.createElement("span",{style:{color:"rgba(255,255,255,0.4)",fontSize:11,fontFamily:"monospace"}},startTime>0?"\u25B6 "+fT(startTime):"\u25B6 PLAY"))));}

// Spotify URL parser & embed
function parseSpotify(u){if(!u)return"";const m=u.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);if(m)return m[1];const m2=u.match(/spotify:track:([a-zA-Z0-9]+)/);return m2?m2[1]:"";}
function SpotifyEmbed({trackId,th}){const t=th||TH.classic;if(!trackId)return null;
  return React.createElement("div",{style:{marginTop:12}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6}},
      React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"monospace",letterSpacing:1}},"SPOTIFY"),
      React.createElement("span",{style:{fontSize:10,color:"#1DB954",fontFamily:"monospace",fontWeight:600}},"\u266B")),
    React.createElement("iframe",{src:"https://open.spotify.com/embed/track/"+trackId+"?utm_source=generator&theme=0",style:{width:"100%",height:80,border:"none",borderRadius:12},allow:"autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",loading:"lazy"}));}

// ============================================================
// PITCH DETECTION — autocorrelation-based
// ============================================================
// ============================================================
// LICK DETAIL — full-screen practice view, themed
// ============================================================
function LickDetail({lick,onBack,th,liked,saved,onLike,onSave,showTips,onTipsDone,onReShowTips,defaultInst,onDeletePrivate}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const[trInst,setTrInst]=useState(defaultInst||"Concert");const[trMan,setTrMan]=useState(0);
  const[pT,sPT]=useState(lick.tempo);
  const[abOn,setAbOn]=useState(false);const[abA,setAbA]=useState(0);const[abB,setAbB]=useState(1);
  const curNoteRef=useRef(-1);const[focus,setFocus]=useState(false);
  const playerCtrlRef=useRef({toggle:null,playing:false});
  const[trOpen,setTrOpen]=useState(false);const[moreOpen,setMoreOpen]=useState(false);
  const lc=lick.likes;
  const[burst,sBurst]=useState(null);const burstKeyRef=useRef(0);
  const instOff=INST_TRANS[trInst]||0;
  const notationAbc=transposeAbc(lick.abc,instOff+trMan);
  const soundAbc=trMan?transposeAbc(lick.abc,trMan):lick.abc;
  
  const keyDisplay=lick.key+((instOff+trMan)?" \u2192 "+trKeyName(lick.key.split(" ")[0],instOff+trMan):"");
  const catC=getCatColor(lick.category,t);const instC=getInstColor(lick.instrument,t);

  return React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,background:t.bg,overflowY:"auto",WebkitOverflowScrolling:"touch"}},
    React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"0 16px 100px"}},

      // HEADER
      React.createElement("div",{style:{position:"sticky",top:0,zIndex:100,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",padding:"12px 0 10px",paddingTop:"calc(env(safe-area-inset-top, 0px) + 12px)",borderBottom:"1px solid "+t.border,marginBottom:16}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
          React.createElement("button",{onClick:onBack,style:{background:"none",border:"none",cursor:"pointer",color:isStudio?t.accent:t.muted,fontSize:22,padding:"4px 8px 4px 0",display:"flex",alignItems:"center"}},"\u2039"),
          React.createElement("div",{style:{flex:1,minWidth:0}},
            React.createElement("h1",{style:{fontSize:20,fontWeight:isStudio?700:600,color:t.text,margin:0,fontFamily:t.titleFont,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.title),
            React.createElement("p",{style:{fontSize:11,color:t.muted,margin:"2px 0 0",fontFamily:"'JetBrains Mono',monospace"}},lick.artist)),
          React.createElement("div",{style:{display:"flex",gap:8,flexShrink:0,alignItems:"center"}},
            React.createElement("button",{onClick:e=>{onLike(lick.id);if(!liked&&isStudio){const r=e.target.closest("button").getBoundingClientRect();burstKeyRef.current++;sBurst({x:r.left+r.width/2,y:r.top+r.height/2,k:burstKeyRef.current});const b=e.target.closest("button");b.style.animation="none";void b.offsetHeight;b.style.animation="firePop 0.35s ease";}},style:{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",gap:5,transition:"all 0.15s"}},isStudio?(liked?IC.flame(22,"#F97316",true):IC.flameOff(22)):React.createElement("span",{style:{fontSize:22,color:liked?"#EF4444":t.muted}},liked?"\u2665":"\u2661"),React.createElement("span",{style:{fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:liked?(isStudio?"#F97316":"#EF4444"):t.muted}},lc)),
            React.createElement("button",{onClick:e=>{onSave(lick.id);if(!saved&&isStudio&&e.target.closest("button")){const b=e.target.closest("button");b.style.animation="none";void b.offsetHeight;b.style.animation="firePop 0.35s ease";}},style:{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",transition:"all 0.15s"}},isStudio?IC.target(22,saved?"#22D89E":"#55556A"):React.createElement("span",{style:{fontSize:22,color:saved?"#F59E0B":t.muted}},saved?"\u2605":"\u2606")),
            !showTips&&onReShowTips&&React.createElement("button",{onClick:onReShowTips,style:{width:20,height:20,borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.subtle,fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,marginLeft:2,animation:"helpGlow 0.8s ease"}},"?")))),

      // META chips — colorful in Studio
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:14,flexWrap:"wrap"}},
        React.createElement("span",{style:{fontSize:10,display:"flex",alignItems:"center",gap:4,color:instC,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",background:instC+"18",padding:"4px 10px",borderRadius:8,border:isStudio?"1px solid "+instC+"30":"none"}},lick.instrument),
        React.createElement("span",{style:{fontSize:10,color:catC,fontWeight:isStudio?600:400,fontFamily:"'JetBrains Mono',monospace",background:isStudio?catC+"18":t.card,padding:"4px 10px",borderRadius:8,border:isStudio?"1px solid "+catC+"30":"1px solid "+t.border}},lick.category),
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",background:t.card,padding:"4px 10px",borderRadius:8,border:"1px solid "+t.border}},keyDisplay),
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",background:t.card,padding:"4px 10px",borderRadius:8,border:"1px solid "+t.border,display:"flex",alignItems:"center",gap:3}},isStudio&&lick.tempo>=160&&IC.flame(11,"#F97316",true),isStudio&&lick.tempo<=100&&IC.slow(11,"#8888A0"),"\u2669="+lick.tempo)),

      // NOTATION + PLAYER — unified card
      React.createElement("div",{"data-coach":"player",style:{background:t.card,borderRadius:14,padding:14,border:"1px solid "+t.border,marginBottom:12,position:"relative",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}},
        React.createElement("div",{onClick:()=>setFocus(true),style:{cursor:"zoom-in"}},
          React.createElement(Notation,{abc:notationAbc,compact:false,abRange:abOn?[abA,abB]:null,curNoteRef,th:t})),
        React.createElement("button",{onClick:()=>setFocus(true),style:{position:"absolute",top:10,right:10,width:28,height:28,borderRadius:7,background:t.accentBg,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid "+t.accentBorder,cursor:"pointer"}},React.createElement("span",{style:{fontSize:12,color:t.accent}},"\u26F6")),
        abOn&&React.createElement("div",{style:{borderTop:"1px solid "+t.border,marginTop:8,paddingTop:8}},
          React.createElement(ABRangeBar,{abc:notationAbc,abA,abB,setAbA,setAbB,onReset:()=>{setAbA(0);setAbB(1);},th:t})),
        React.createElement("div",{style:{borderTop:"1px solid "+t.border,marginTop:abOn?8:10,paddingTop:6}},
          React.createElement(Player,{abc:soundAbc,tempo:pT,abOn,abA,abB,setAbOn,setAbA,setAbB,pT,sPT,lickTempo:lick.tempo,trInst:null,setTrInst:null,trMan:null,setTrMan:null,onCurNote:n=>{curNoteRef.current=n;},th:t,ctrlRef:playerCtrlRef}))),
      focus&&React.createElement(SheetFocus,{abc:notationAbc,onClose:()=>setFocus(false),abRange:abOn?[abA,abB]:null,curNoteRef,th:t,playerCtrlRef:playerCtrlRef}),

      // TRANSPOSE — collapsible
      React.createElement("button",{onClick:function(){setTrOpen(!trOpen);},style:{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"10px 14px",borderRadius:trOpen?"14px 14px 0 0":14,border:"1px solid "+t.border,borderBottom:trOpen?"none":"1px solid "+t.border,background:t.card,cursor:"pointer",marginBottom:trOpen?0:12,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
          React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600}},"TRANSPOSE"),
          (instOff+trMan)!==0&&React.createElement("span",{style:{fontSize:10,color:t.accent,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,background:t.accentBg,padding:"2px 8px",borderRadius:6}},trKeyName("C",instOff+trMan))),
        React.createElement("span",{style:{fontSize:10,color:t.subtle,transform:trOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}},"\u25BC")),
      trOpen&&React.createElement("div",{"data-coach":"transpose",style:{background:t.card,borderRadius:"0 0 14px 14px",padding:"10px 14px 14px",border:"1px solid "+t.border,borderTop:"none",marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}},
        React.createElement(TransposeBar,{trInst,setTrInst,trMan,setTrMan,th:t})),

      // MORE — Description, Tags, YouTube, Spotify collapsed
      (lick.description||lick.youtubeId||lick.spotifyId||(lick.tags&&lick.tags.length>0))&&React.createElement("div",{style:{marginBottom:12}},
        React.createElement("button",{onClick:function(){setMoreOpen(!moreOpen);},style:{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"10px 14px",borderRadius:moreOpen?"14px 14px 0 0":14,border:"1px solid "+t.border,borderBottom:moreOpen?"none":"1px solid "+t.border,background:t.card,cursor:"pointer"}},
          React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600}},"MORE"),
          React.createElement("span",{style:{fontSize:10,color:t.subtle,transform:moreOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}},"\u25BC")),
        moreOpen&&React.createElement("div",{style:{background:t.card,borderRadius:"0 0 14px 14px",padding:"10px 14px 14px",border:"1px solid "+t.border,borderTop:"none",display:"flex",flexDirection:"column",gap:12}},
          lick.description&&React.createElement("p",{style:{fontSize:14,color:t.muted,lineHeight:1.7,margin:0,fontStyle:"italic",fontFamily:t.titleFont}},lick.description),
          lick.tags&&lick.tags.length>0&&React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
            lick.tags.map((tag,i)=>{const cols=Object.values(CAT_COL);const c=isStudio?cols[i%cols.length]:t.accent;
              return React.createElement("span",{key:i,style:{fontSize:11,color:c,fontFamily:"'JetBrains Mono',monospace",background:isStudio?c+"15":t.accentBg,padding:"5px 12px",borderRadius:10,border:"1px solid "+(isStudio?c+"30":t.accentBorder),display:"flex",alignItems:"center",gap:5}},isStudio&&IC.pip(5,c),tag);})),
          React.createElement(YTP,{videoId:lick.youtubeId,startTime:lick.youtubeStart,isActive:true,th:t}),
          React.createElement(SpotifyEmbed,{trackId:lick.spotifyId,th:t}))),

      // ABC CODE
      React.createElement("details",{style:{marginTop:12}},
        React.createElement("summary",{style:{fontSize:11,color:t.subtle,fontFamily:"monospace",cursor:"pointer",letterSpacing:1,display:"flex",alignItems:"center",gap:5}},isStudio&&IC.code(11,t.subtle),isStudio?"ABC CODE":"VIEW ABC"),
        React.createElement("pre",{style:{fontSize:12,color:t.accent,background:t.card,padding:14,borderRadius:12,marginTop:8,overflow:"auto",fontFamily:"'JetBrains Mono',monospace",lineHeight:1.5,whiteSpace:"pre-wrap",border:"1px solid "+t.border}},notationAbc))),

      // PRIVATE LICK ACTIONS
      lick.private&&React.createElement("div",{style:{marginTop:16,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}},
        onDeletePrivate&&React.createElement("button",{onClick:function(){if(confirm("Delete this lick?"))onDeletePrivate(lick.id);},style:{padding:"12px 20px",borderRadius:12,border:"1.5px solid #EF4444",background:"#EF444410",color:"#EF4444",fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u2715  Delete"),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,padding:"8px 12px",borderRadius:10,background:isStudio?"rgba(34,216,158,0.1)":"#E8F5E9"}},
          React.createElement("span",{style:{fontSize:10,color:isStudio?"#22D89E":"#2E7D32",fontFamily:"'Inter',sans-serif",fontWeight:500}},"\uD83D\uDD12 Private \u00B7 Offline"))),

    burst&&React.createElement(FireBurst,{key:burst.k,originX:burst.x,originY:burst.y,onDone:()=>sBurst(null)}),
    showTips&&React.createElement(CoachMarks,{tips:DETAIL_TIPS,onDone:onTipsDone,th:t}));}


// ============================================================
// DAILY LICK CARD — compact, themed
// ============================================================
function DailyLickCard({lick,onSelect,th,liked,saved,onLike,onSave,userInst:userInst}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const uOff=INST_TRANS[userInst]||0;const cardAbc=uOff?transposeAbc(lick.abc,uOff):lick.abc;
  const keyDisp=uOff?trKeyName(lick.key.split(" ")[0],uOff):lick.key;
  
  const catC=getCatColor(lick.category,t);const instC=getInstColor(lick.instrument,t);
  return React.createElement("div",{"data-coach":"daily",onClick:()=>onSelect(lick),style:{background:isStudio?(t.cardRaised||t.card):t.card,borderRadius:isStudio?20:16,padding:0,marginBottom:isStudio?18:14,border:"1px solid "+(isStudio?catC+"25":t.border),cursor:"pointer",boxShadow:isStudio?"0 4px 24px "+catC+"20, 0 1px 8px rgba(0,0,0,0.4), inset 0 1px 0 "+catC+"10":"0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",transition:"box-shadow 0.2s, transform 0.15s",overflow:"hidden",display:"flex"}},
    isStudio&&React.createElement("div",{style:{width:5,flexShrink:0,background:"linear-gradient(180deg,"+catC+","+instC+")",boxShadow:"2px 0 12px "+catC+"30"}}),
    React.createElement("div",{style:{flex:1,padding:isStudio?18:16}},
      // TOP: badge + date
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:isStudio?12:10}},
        React.createElement("div",{style:{background:isStudio?"linear-gradient(135deg,"+catC+","+instC+")":t.accent,borderRadius:isStudio?10:8,padding:isStudio?"5px 14px":"4px 12px",display:"flex",alignItems:"center",gap:4,boxShadow:isStudio?"0 2px 12px "+catC+"40":"none"}},
          IC.bolt(10,"#fff"),
          React.createElement("span",{style:{fontSize:9,fontWeight:700,color:"#fff",fontFamily:"'Inter',sans-serif",letterSpacing:1}},"DAILY PICK")),
        React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},new Date().toLocaleDateString("en",{month:"short",day:"numeric"}))),
      // TITLE + META
      React.createElement("h3",{style:{fontSize:isStudio?22:18,fontWeight:700,color:t.text,margin:"0 0 6px",fontFamily:t.titleFont,letterSpacing:isStudio?-0.3:0}},lick.title),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:isStudio?12:10,flexWrap:"wrap"}},
        React.createElement("span",{style:{fontSize:10,color:instC,fontFamily:"'JetBrains Mono',monospace",background:isStudio?instC+"18":"transparent",padding:isStudio?"2px 8px":"0",borderRadius:6}},lick.artist),
        React.createElement("span",{style:{fontSize:10,color:t.muted}},"\u00B7"),
        React.createElement("span",{style:{fontSize:10,color:isStudio?catC:t.muted,fontFamily:"'JetBrains Mono',monospace",fontWeight:isStudio?600:400}},lick.category),
        React.createElement("span",{style:{fontSize:10,color:t.muted}},"\u00B7"),
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},keyDisp+" \u00B7 \u2669="+lick.tempo)),
      // NOTATION
      React.createElement("div",{style:{marginTop:6,display:"flex",justifyContent:"center",overflow:"hidden"}},
        React.createElement(Notation,{abc:cardAbc,compact:true,th:t})),
      // ACTION ROW — Instagram style
      React.createElement("div",{"data-coach":"flame",style:{display:"flex",alignItems:"center",gap:2,marginTop:isStudio?14:10,paddingTop:isStudio?12:8,borderTop:"1px solid "+t.border}},
        React.createElement(PreviewBtn,{lickId:lick.id,abc:cardAbc,tempo:lick.tempo,th:t,size:30}),
        React.createElement("button",{onClick:e=>{e.stopPropagation();onLike(lick.id);},style:{background:"none",border:"none",cursor:"pointer",padding:"4px 2px",marginLeft:6,display:"flex",alignItems:"center",gap:4,transition:"all 0.15s"}},
          isStudio?(liked?IC.flame(20,"#F97316",true):IC.flameOff(20)):React.createElement("span",{style:{fontSize:20,color:liked?"#EF4444":t.muted}},liked?"\u2665":"\u2661")),
        React.createElement("button",{onClick:e=>{e.stopPropagation();onSave(lick.id);},style:{background:"none",border:"none",cursor:"pointer",padding:"4px 2px",display:"flex",alignItems:"center",marginLeft:4,transition:"all 0.15s"}},
          isStudio?IC.target(20,saved?"#22D89E":"#55556A"):React.createElement("span",{style:{fontSize:20,color:saved?"#F59E0B":t.muted}},saved?"\u2605":"\u2606")),
        React.createElement("div",{style:{flex:1}}),
        React.createElement("span",{style:{fontSize:11,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:liked?(isStudio?"#F97316":"#EF4444"):t.muted}},lick.likes+(isStudio?(lick.likes===1?" flame":" flames"):(lick.likes===1?" like":" likes"))),
        isStudio?IC.arrowR(14,catC):React.createElement("span",{style:{fontSize:14,color:t.subtle,marginLeft:6}},"\u203A"))));}


// ============================================================
// LICK CARD — compact, themed
// ============================================================
function LickCard({lick,onSelect,th,liked,saved,onLike,onSave,userInst:userInst}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const uOff=INST_TRANS[userInst]||0;const cardAbc=uOff?transposeAbc(lick.abc,uOff):lick.abc;
  const keyDisp=uOff?trKeyName(lick.key.split(" ")[0],uOff):lick.key;
  
  const catC=getCatColor(lick.category,t);
  return React.createElement("div",{onClick:()=>onSelect(lick),style:{background:isStudio?(t.cardRaised||t.card):t.card,borderRadius:isStudio?16:14,padding:0,marginBottom:isStudio?12:8,border:"1px solid "+(isStudio?catC+"18":t.border),cursor:"pointer",transition:"all 0.15s",boxShadow:isStudio?"0 2px 16px "+catC+"15, 0 1px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)":"0 2px 10px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",overflow:"hidden",display:"flex"}},
    isStudio&&React.createElement("div",{style:{width:4,flexShrink:0,background:catC,boxShadow:"1px 0 8px "+catC+"25"}}),
    React.createElement("div",{style:{flex:1,padding:isStudio?16:14}},
      // TITLE + META
      React.createElement("div",{style:{marginBottom:8}},
        React.createElement("h3",{style:{fontSize:isStudio?17:16,fontWeight:isStudio?700:600,color:t.text,margin:"0 0 5px",lineHeight:1.3,fontFamily:t.titleFont,letterSpacing:isStudio?-0.2:0}},lick.title),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}},
          React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},lick.artist),
          isStudio&&React.createElement("span",{style:{fontSize:9,color:catC,fontFamily:"'JetBrains Mono',monospace",background:catC+"15",padding:"2px 8px",borderRadius:6,fontWeight:600,border:"1px solid "+catC+"20"}},lick.category),
          React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},keyDisp),
          React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"\u2669="+lick.tempo),
          lick.private&&React.createElement("span",{style:{fontSize:8,color:isStudio?"#22D89E":"#2E7D32",fontFamily:"'Inter',sans-serif",fontWeight:600,background:isStudio?"rgba(34,216,158,0.15)":"#E8F5E9",padding:"2px 6px",borderRadius:4}},"\uD83D\uDD12 Private"))),
      // NOTATION
      React.createElement("div",{style:{marginTop:4,display:"flex",justifyContent:"center",overflow:"hidden"}},
        React.createElement(Notation,{abc:cardAbc,compact:true,th:t})),
      // ACTION ROW — Instagram style
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:2,marginTop:isStudio?12:8,paddingTop:isStudio?10:6,borderTop:"1px solid "+(isStudio?t.border:t.border)}},
        React.createElement(PreviewBtn,{lickId:lick.id,abc:cardAbc,tempo:lick.tempo,th:t,size:26}),
        React.createElement("button",{onClick:e=>{e.stopPropagation();onLike(lick.id);},style:{background:"none",border:"none",cursor:"pointer",padding:"3px 2px",marginLeft:6,display:"flex",alignItems:"center",gap:3,transition:"all 0.15s"}},
          isStudio?(liked?IC.flame(18,"#F97316",true):IC.flameOff(18)):React.createElement("span",{style:{fontSize:18,color:liked?"#EF4444":t.muted}},liked?"\u2665":"\u2661")),
        React.createElement("button",{onClick:e=>{e.stopPropagation();onSave(lick.id);},style:{background:"none",border:"none",cursor:"pointer",padding:"3px 2px",display:"flex",alignItems:"center",marginLeft:4,transition:"all 0.15s"}},
          isStudio?IC.target(18,saved?"#22D89E":"#55556A"):React.createElement("span",{style:{fontSize:18,color:saved?"#F59E0B":t.muted}},saved?"\u2605":"\u2606")),
        React.createElement("div",{style:{flex:1}}),
        React.createElement("span",{style:{fontSize:10,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:liked?(isStudio?"#F97316":"#EF4444"):t.muted}},lick.likes+(isStudio?(lick.likes===1?" flame":" flames"):(lick.likes===1?" like":" likes"))),
        isStudio?React.createElement("div",{style:{marginLeft:6}},IC.arrowR(12,catC)):React.createElement("span",{style:{fontSize:13,color:t.subtle,marginLeft:6}},"\u203A"))));}


// ============================================================
// EAR TRAINER — listen first, reveal notation, self-rate
// ============================================================
function EarTrainer({licks,onLike,onOpen,likedSet,th,userInst:userInst}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const instOff=INST_TRANS[userInst]||0;
  const[queue]=useState(()=>{const ids=licks.map(l=>l.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return ids;});
  const[idx,setIdx]=useState(0);
  const[phase,setPhase]=useState("listen"); // listen | reveal | rated
  const[hintsUsed,setHintsUsed]=useState(0); // 0=none, 1=starting note, 2=chords
  const[streak,setStreak]=useState(0);const[bestStreak,setBestStreak]=useState(0);
  const[xp,setXp]=useState(0);const[results,setResults]=useState([]); // [{id,rating,hints}]
  const[showSummary,setShowSummary]=useState(false);
  const[pT,sPT]=useState(null); // override tempo
  const curNoteRef=useRef(-1);

  const done=idx>=queue.length;const lick=done?null:licks.find(l=>l.id===queue[idx]);
  const catC=lick?getCatColor(lick.category,t):t.accent;

  // Ear level
  const levels=[{name:"Beginner",min:0},{name:"Developing",min:15},{name:"Sharp",min:50},{name:"Golden Ear",min:120}];
  const curLevel=levels.filter(l=>xp>=l.min).pop()||levels[0];
  const nextLevel=levels.find(l=>l.min>xp);
  const levelProg=nextLevel?((xp-curLevel.min)/(nextLevel.min-curLevel.min)):1;

  const reveal=()=>setPhase("reveal");
  const useHint=()=>setHintsUsed(h=>Math.min(h+1,2));

  const rate=(rating)=>{
    const pts=rating==="nailed"?3:rating==="close"?1:0;
    const newStreak=rating==="nailed"?streak+1:0;
    setXp(x=>x+pts);setStreak(newStreak);
    if(newStreak>bestStreak)setBestStreak(newStreak);
    setResults(r=>[...r,{id:lick.id,rating,hints:hintsUsed}]);
    if(rating==="nailed")onLike(lick.id);
    setPhase("rated");
    // Auto-advance after 1.2s
    setTimeout(()=>{
      if(idx+1>=queue.length){setShowSummary(true);}
      else{setIdx(i=>i+1);setPhase("listen");setHintsUsed(0);sPT(null);curNoteRef.current=-1;}
    },1200);
  };

  // Extract clues from lick
  const getStartNote=(abc)=>{const lines=abc.split("\n");let ml="";for(const l of lines){if(!/^[A-Z]:/.test(l.trim()))ml+=l+" ";}const m=ml.match(/[A-Ga-g]/);return m?m[0].toUpperCase():"?"};
  const getChords=(abc)=>{const m=abc.match(/"([^"]+)"/g);return m?[...new Set(m.map(c=>c.replace(/"/g,"")))].slice(0,4):[]};

  // Session summary
  if(showSummary){
    const nailed=results.filter(r=>r.rating==="nailed").length;
    const close=results.filter(r=>r.rating==="close").length;
    const total=results.length;
    const pct=total?Math.round(nailed/total*100):0;
    const msg=pct>=80?"Your ear is on fire!":pct>=50?"Getting sharper every day.":"Keep at it — ears take time.";
    return React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",animation:"fadeIn 0.4s ease"}},
      
      React.createElement("h2",{style:{fontSize:22,fontWeight:700,color:t.text,fontFamily:t.titleFont,margin:"0 0 6px"}},"Session Complete"),
      React.createElement("p",{style:{fontSize:14,color:t.muted,fontFamily:"'Inter',sans-serif",margin:"0 0 24px"}},msg),
      // Stats
      React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:16,marginBottom:24}},
        [{n:nailed,l:"Nailed",c:"#22D89E"},{n:close,l:"Close",c:"#F59E0B"},{n:total-nailed-close,l:"Nope",c:"#EF4444"}].map(s=>
          React.createElement("div",{key:s.l,style:{background:t.card,borderRadius:14,padding:"14px 18px",border:"1px solid "+t.border,minWidth:80}},
            React.createElement("div",{style:{fontSize:24,fontWeight:700,color:s.c,fontFamily:"'JetBrains Mono',monospace"}},s.n),
            React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:4}},s.l)))),
      // Best streak
      bestStreak>1&&React.createElement("div",{style:{marginBottom:24,display:"flex",alignItems:"center",justifyContent:"center",gap:6}},
        IC.flame(16,"#F97316",true),
        React.createElement("span",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"Best streak: "+bestStreak)),
      // XP + level
      React.createElement("div",{style:{background:t.card,borderRadius:14,padding:16,border:"1px solid "+t.border,marginBottom:24}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}},
          React.createElement("span",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},""+curLevel.name),
          React.createElement("span",{style:{fontSize:11,color:t.accent,fontFamily:"'JetBrains Mono',monospace"}},xp+" XP")),
        nextLevel&&React.createElement("div",{style:{height:6,background:t.progressBg,borderRadius:3,overflow:"hidden"}},
          React.createElement("div",{style:{height:"100%",width:(levelProg*100)+"%",background:t.accent,borderRadius:3,transition:"width 0.5s ease"}}))),
      // Replay
      React.createElement("button",{onClick:()=>{setIdx(0);setPhase("listen");setHintsUsed(0);setResults([]);setStreak(0);setShowSummary(false);sPT(null);curNoteRef.current=-1;},style:{padding:"12px 28px",background:t.accent,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px "+t.accentGlow}},"Train Again"));
  }

  if(!lick)return null;

  const earAbc=instOff?transposeAbc(lick.abc,instOff):lick.abc;
  const startNote=getStartNote(earAbc);const chords=getChords(earAbc);
  const keyDisplay=instOff?trKeyName(lick.key.split(" ")[0],instOff):lick.key;
  const isRevealed=phase==="reveal"||phase==="rated";

  return React.createElement("div",{style:{padding:"8px 0"}},
    // Progress + streak bar
    React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}},
      // Progress
      React.createElement("div",{style:{flex:1,display:"flex",alignItems:"center",gap:8}},
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},(idx+1)+"/"+queue.length),
        React.createElement("div",{style:{flex:1,height:4,background:t.progressBg,borderRadius:2,overflow:"hidden"}},
          React.createElement("div",{style:{height:"100%",width:((idx/queue.length)*100)+"%",background:t.accent,borderRadius:2,transition:"width 0.4s ease"}}))),
      // Streak
      streak>0&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,background:isStudio?"rgba(249,115,22,0.1)":"#FEF3E2",padding:"3px 10px",borderRadius:8,marginLeft:10}},
        IC.flame(12,"#F97316",true),
        React.createElement("span",{style:{fontSize:11,fontWeight:700,color:"#F97316",fontFamily:"'JetBrains Mono',monospace"}},streak)),
      // XP
      React.createElement("div",{style:{marginLeft:8,fontSize:10,color:t.accent,fontFamily:"'JetBrains Mono',monospace",background:isStudio?t.accentBg:t.accent+"12",padding:"3px 8px",borderRadius:6}},""+xp+"xp")),

    // CARD
    React.createElement("div",{style:{background:isStudio?(t.cardRaised||t.card):t.card,borderRadius:20,border:"1px solid "+(isStudio?catC+"30":t.border),boxShadow:isStudio?"0 8px 40px "+catC+"15, 0 2px 12px rgba(0,0,0,0.4)":"0 4px 24px rgba(0,0,0,0.08)",overflow:"hidden"}},
      // Color strip
      isStudio&&React.createElement("div",{style:{height:4,background:"linear-gradient(90deg,"+catC+","+t.accent+")"}}),

      React.createElement("div",{style:{padding:20}},
        // Clues row — only category visible before reveal
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:14,flexWrap:"wrap"}},
          React.createElement("span",{style:{fontSize:10,color:catC,fontFamily:"'JetBrains Mono',monospace",background:catC+"15",padding:"3px 10px",borderRadius:6,fontWeight:600,border:"1px solid "+catC+"25"}},lick.category),
          isRevealed&&React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",animation:"fadeIn 0.3s ease"}},keyDisplay),
          isRevealed&&React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",animation:"fadeIn 0.3s ease"}},"\u2669="+lick.tempo),
          isRevealed&&instOff!==0&&React.createElement("span",{style:{fontSize:9,color:t.accent,fontFamily:"'JetBrains Mono',monospace",background:isStudio?t.accentBg:t.accent+"12",padding:"2px 6px",borderRadius:4,animation:"fadeIn 0.3s ease"}},userInst)),

        // Title — hidden until reveal
        !isRevealed?React.createElement("h2",{style:{fontSize:20,fontWeight:700,color:t.subtle,margin:"0 0 4px",fontFamily:t.titleFont,fontStyle:"italic"}},"Can you hear it?")
        :React.createElement("div",{style:{animation:"fadeIn 0.4s ease"}},
          React.createElement("h2",{style:{fontSize:20,fontWeight:700,color:t.text,margin:"0 0 4px",fontFamily:t.titleFont}},lick.title),
          React.createElement("div",{style:{fontSize:12,color:t.muted,fontFamily:"'JetBrains Mono',monospace",marginBottom:2}},lick.artist)),

        // HINTS — shown as chips
        React.createElement("div",{"data-coach":"ear-hints",style:{display:"flex",gap:6,marginTop:10,marginBottom:14}},
          // Hint 1: starting note
          hintsUsed>=1?React.createElement("div",{style:{fontSize:11,color:t.text,fontFamily:"'JetBrains Mono',monospace",background:isStudio?t.accent+"18":t.accent+"12",padding:"4px 10px",borderRadius:8,border:"1px solid "+t.accentBorder}},"Starts on "+startNote)
          :!isRevealed&&React.createElement("button",{onClick:useHint,style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",background:t.filterBg,padding:"4px 10px",borderRadius:8,border:"1px solid "+t.border,cursor:"pointer"}},"Starting note"),
          // Hint 2: chords
          hintsUsed>=2?React.createElement("div",{style:{fontSize:11,color:t.text,fontFamily:"'JetBrains Mono',monospace",background:isStudio?t.accent+"18":t.accent+"12",padding:"4px 10px",borderRadius:8,border:"1px solid "+t.accentBorder}},""+chords.join(" \u2192 "))
          :hintsUsed>=1&&!isRevealed&&React.createElement("button",{onClick:useHint,style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",background:t.filterBg,padding:"4px 10px",borderRadius:8,border:"1px solid "+t.border,cursor:"pointer"}},"Chord changes")),

        // NOTATION AREA
        React.createElement("div",{style:{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:14}},
          // Notation — blurred or revealed
          React.createElement("div",{style:{filter:isRevealed?"blur(0)":"blur(12px)",transition:"filter 0.6s ease",WebkitFilter:isRevealed?"blur(0)":"blur(12px)",pointerEvents:isRevealed?"auto":"none",opacity:isRevealed?1:0.3}},
            React.createElement("div",{style:{background:t.noteBg,borderRadius:14,padding:12,border:"1px solid "+(isStudio?t.staffStroke+"30":t.borderSub)}},
              React.createElement(Notation,{abc:earAbc,compact:false,curNoteRef:curNoteRef,th:t}))),
          // Mystery overlay when not revealed
          !isRevealed&&React.createElement("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:isStudio?"rgba(12,12,24,0.5)":"rgba(255,255,255,0.3)",borderRadius:14,backdropFilter:"blur(2px)",WebkitBackdropFilter:"blur(2px)"}},
            IC.tabEar(28,t.accent,false),
            React.createElement("span",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"Listen first, then reveal"))),

        // PLAYER — with tempo slider
        React.createElement(Player,{abc:lick.abc,tempo:pT||lick.tempo,pT:pT||lick.tempo,sPT:sPT,lickTempo:lick.tempo,onCurNote:function(n){curNoteRef.current=n;},th:t}),

        // ACTION AREA
        !isRevealed&&phase==="listen"&&React.createElement("button",{"data-coach":"ear-reveal",onClick:reveal,style:{width:"100%",padding:"14px",marginTop:14,background:"none",border:"2px dashed "+(isStudio?t.accent+"50":t.border),borderRadius:14,color:isStudio?t.accent:t.text,fontSize:14,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",transition:"all 0.2s"}},"I think I got it — reveal!"),

        // OPEN IN DETAIL — after reveal, before rating
        isRevealed&&React.createElement("button",{onClick:()=>onOpen(lick),style:{width:"100%",padding:"10px",marginTop:10,background:t.filterBg,border:"1px solid "+t.border,borderRadius:10,color:t.muted,fontSize:11,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s"}},
          React.createElement("span",{style:{fontSize:13}},"\u25B6"),
          "Open full lick \u203A"),

        // RATE BUTTONS
        phase==="reveal"&&React.createElement("div",{style:{marginTop:16,animation:"fadeIn 0.3s ease"}},
          React.createElement("p",{style:{textAlign:"center",fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",margin:"0 0 10px",fontWeight:500}},"How'd you do?"),
          React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}},
            [{key:"nailed",emoji:null,label:"Nailed it",c:"#22D89E",pts:"+3"},
             {key:"close",label:"Close",c:"#F59E0B",pts:"+1"},
             {key:"nope",label:"Not yet",c:"#EF4444",pts:""}].map(r=>
              React.createElement("button",{key:r.key,onClick:()=>rate(r.key),style:{padding:"12px 8px",background:t.card,border:"2px solid "+r.c+"40",borderRadius:14,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.15s"}},
                React.createElement("div",{style:{width:10,height:10,borderRadius:5,background:r.c}}),
                React.createElement("span",{style:{fontSize:11,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},r.label),
                r.pts&&React.createElement("span",{style:{fontSize:9,color:r.c,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}},r.pts+" xp"))))),

        // RATED FEEDBACK
        phase==="rated"&&React.createElement("div",{style:{marginTop:16,textAlign:"center",animation:"fadeIn 0.3s ease"}},
          (function(){var lr=results[results.length-1]||{};var lrr=lr.rating||"nope";return React.createElement("div",{style:{fontSize:16,fontWeight:600,color:lrr==="nailed"?t.accent:lrr==="close"?"#F59E0B":"#EF4444",fontFamily:"'Inter',sans-serif"}},
            lrr==="nailed"?(streak>1?streak+" in a row!":"Nice ear!")
            :lrr==="close"?"Almost there!"
            :"Keep training!");}()),
          React.createElement("p",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",marginTop:6}},"Next lick coming up...")))));
}


// ============================================================
// METRONOME — precision Web Audio scheduling
// ============================================================
function Metronome({th}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const[bpm,setBpm]=useState(120);
  const[playing,setPlaying]=useState(false);
  const[timeSig,setTimeSig]=useState([4,4]); // [beats, noteValue]
  const[subdivision,setSubdivision]=useState(1); // 1=quarter,2=8th,3=triplet,4=16th
  const[swing,setSwing]=useState(0); // 0-100, only applies to 8th subdivisions
  // Per-beat state: 0=normal, 1=accent, 2=muted — click cycles through
  const[beatStates,setBeatStates]=useState(()=>{const a=new Array(4).fill(0);a[0]=1;return a;});
  const[currentBeat,setCurrentBeat]=useState(-1);
  const[sound,setSound]=useState("click"); // click, wood, cowbell
  const[settingsOpen,setSettingsOpen]=useState(false);
  // Mode: metronome vs tempo trainer
  const[mode,setMode]=useState("metronome"); // metronome | trainer
  // Trainer settings
  const[trStartBpm,setTrStartBpm]=useState(80);
  const[trEndBpm,setTrEndBpm]=useState(160);
  const[trIncrement,setTrIncrement]=useState(4);
  const[trBarsPerStep,setTrBarsPerStep]=useState(4);
  const[trCurrentBpm,setTrCurrentBpm]=useState(80);
  const[trBarInStep,setTrBarInStep]=useState(0); // which bar within current step
  const[trDone,setTrDone]=useState(false);

  // Refs for scheduler
  const actxRef=useRef(null);
  const timerRef=useRef(null);
  const nextNoteTimeRef=useRef(0);
  const currentSubRef=useRef(0); // which subdivision we're on
  const beatRef=useRef(-1);
  const bpmRef=useRef(bpm);
  const timeSigRef=useRef(timeSig);
  const subRef=useRef(subdivision);
  const swingRef=useRef(swing);
  const beatStatesRef=useRef(beatStates);
  const soundRef=useRef(sound);
  const playingRef=useRef(false);
  // Trainer refs
  const modeRef=useRef(mode);
  const trCurrentBpmRef=useRef(trStartBpm);
  const trBarInStepRef=useRef(0);
  const trBarsPerStepRef=useRef(trBarsPerStep);
  const trIncrementRef=useRef(trIncrement);
  const trEndBpmRef=useRef(trEndBpm);
  const trDoneRef=useRef(false);

  useEffect(()=>{bpmRef.current=bpm;},[bpm]);
  useEffect(()=>{timeSigRef.current=timeSig;},[timeSig]);
  useEffect(()=>{subRef.current=subdivision;},[subdivision]);
  useEffect(()=>{swingRef.current=swing;},[swing]);
  useEffect(()=>{beatStatesRef.current=beatStates;},[beatStates]);
  useEffect(()=>{soundRef.current=sound;},[sound]);
  useEffect(()=>{modeRef.current=mode;},[mode]);
  useEffect(()=>{trBarsPerStepRef.current=trBarsPerStep;},[trBarsPerStep]);
  useEffect(()=>{trIncrementRef.current=trIncrement;},[trIncrement]);
  useEffect(()=>{trEndBpmRef.current=trEndBpm;},[trEndBpm]);

  // Rebuild beatStates when time sig changes
  useEffect(()=>{const n=timeSig[0];const a=new Array(n).fill(0);a[0]=1;setBeatStates(a);},[timeSig]);

  const cycleBeat=(i)=>{setBeatStates(prev=>{const n=[...prev];n[i]=(n[i]+1)%3;return n;});};


  // Tap tempo
  const tapTimesRef=useRef([]);
  const tapTempo=()=>{
    const now=performance.now();
    const taps=tapTimesRef.current;
    taps.push(now);
    // Keep last 5 taps
    if(taps.length>5)taps.shift();
    if(taps.length>=2){
      const intervals=[];
      for(let i=1;i<taps.length;i++)intervals.push(taps[i]-taps[i-1]);
      // Discard if any interval > 2s (reset)
      if(intervals.some(iv=>iv>2000)){tapTimesRef.current=[now];return;}
      const avg=intervals.reduce((a,b)=>a+b,0)/intervals.length;
      const newBpm=Math.round(60000/avg);
      if(newBpm>=30&&newBpm<=300)setBpm(newBpm);
    }
  };

  const scheduleNote=(time,isAccent,isSub)=>{
    const actx=actxRef.current;if(!actx)return;
    const snd=soundRef.current;
    // Oscillator click
    const osc=actx.createOscillator();
    const gain=actx.createGain();
    osc.connect(gain);gain.connect(actx.destination);
    if(snd==="click"){
      osc.type="triangle";
      osc.frequency.value=isAccent?1200:800;
      gain.gain.setValueAtTime(isAccent?0.6:0.3,time);
      gain.gain.exponentialRampToValueAtTime(0.001,time+0.03);
      osc.start(time);osc.stop(time+0.03);
    }else if(snd==="wood"){
      osc.type="sine";
      osc.frequency.value=isAccent?3200:2400;
      gain.gain.setValueAtTime(isAccent?0.4:0.2,time);
      gain.gain.exponentialRampToValueAtTime(0.001,time+0.015);
      osc.start(time);osc.stop(time+0.02);
    }else{ // cowbell
      osc.type="square";
      osc.frequency.value=isAccent?800:560;
      gain.gain.setValueAtTime(isAccent?0.15:0.08,time);
      gain.gain.exponentialRampToValueAtTime(0.001,time+0.06);
      osc.start(time);osc.stop(time+0.06);
    }
    // Subdivision clicks are quieter
    if(isSub){gain.gain.setValueAtTime(0.12,time);}
  };

  const scheduler=()=>{
    const actx=actxRef.current;if(!actx)return;
    const lookAhead=0.1; // schedule 100ms ahead
    while(nextNoteTimeRef.current<actx.currentTime+lookAhead){
      const curSub=currentSubRef.current;
      const beats=timeSigRef.current[0];
      const sub=subRef.current;
      const totalSubs=beats*sub;
      const beatIdx=Math.floor(curSub/sub);
      const subIdx=curSub%sub;
      const bs=(beatStatesRef.current||[])[beatIdx]||0; // 0=normal,1=accent,2=muted
      const isBeat=subIdx===0;
      const isAccent=bs===1&&isBeat;
      const isMuted=bs===2&&isBeat;

      // Play sound: skip only muted beat clicks, subdivisions always play
      if(!isMuted)scheduleNote(nextNoteTimeRef.current,isAccent,!isBeat);

      // Update visual beat (use setTimeout to sync with audio)
      const bt=beatIdx;
      const dt=(nextNoteTimeRef.current-actx.currentTime)*1000;
      if(isBeat)setTimeout(()=>{if(playingRef.current)setCurrentBeat(bt);},Math.max(0,dt));

      // Calculate next note time
      const secPerBeat=60.0/bpmRef.current;
      let subDuration=secPerBeat/sub;

      // Swing: only for subdivision=2 (8th notes)
      if(sub===2&&swingRef.current>0){
        const swingRatio=0.5+(swingRef.current/100)*0.17; // 50% to 67%
        if(subIdx===0)subDuration=secPerBeat*swingRatio;
        else subDuration=secPerBeat*(1-swingRatio);
      }

      nextNoteTimeRef.current+=subDuration;
      var nextSub=(curSub+1)%totalSubs;
      // Bar completed — check trainer auto-increment
      if(nextSub===0&&modeRef.current==="trainer"&&!trDoneRef.current){
        trBarInStepRef.current++;
        var barInStep=trBarInStepRef.current;
        setTimeout(function(){if(playingRef.current)setTrBarInStep(barInStep);},Math.max(0,dt));
        if(barInStep>=trBarsPerStepRef.current){
          trBarInStepRef.current=0;
          var newBpm=trCurrentBpmRef.current+trIncrementRef.current;
          if(newBpm>trEndBpmRef.current){
            trDoneRef.current=true;
            setTimeout(function(){setTrDone(true);},Math.max(0,dt));
          }else{
            trCurrentBpmRef.current=newBpm;
            bpmRef.current=newBpm;
            setTimeout(function(){if(playingRef.current){setTrCurrentBpm(newBpm);setBpm(newBpm);setTrBarInStep(0);}},Math.max(0,dt));
          }
        }
      }
      currentSubRef.current=nextSub;
    }
  };

  const startStop=()=>{
    if(playing){
      // Stop
      if(timerRef.current)clearInterval(timerRef.current);
      timerRef.current=null;
      playingRef.current=false;
      setPlaying(false);setCurrentBeat(-1);
      return;
    }
    // Start
    if(!actxRef.current)actxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    const actx=actxRef.current;
    if(actx.state==="suspended")actx.resume();
    currentSubRef.current=0;
    nextNoteTimeRef.current=actx.currentTime+0.05;
    // Init trainer
    if(mode==="trainer"){
      setBpm(trStartBpm);bpmRef.current=trStartBpm;
      setTrCurrentBpm(trStartBpm);trCurrentBpmRef.current=trStartBpm;
      setTrBarInStep(0);trBarInStepRef.current=0;
      setTrDone(false);trDoneRef.current=false;
    }
    playingRef.current=true;
    setPlaying(true);
    timerRef.current=setInterval(scheduler,25); // check every 25ms
  };

  // Cleanup
  useEffect(()=>()=>{if(timerRef.current)clearInterval(timerRef.current);},[]);

  const TIME_SIGS=[[4,4],[3,4],[5,4],[6,8],[7,8],[2,4]];
  const SUB_OPTS=[{v:1,l:"\u2669"},{v:2,l:"\u266A"},{v:3,l:"3"},{v:4,l:"\u266C"}];
  const SOUNDS=[{v:"click",l:"Click"},{v:"wood",l:"Wood"},{v:"cowbell",l:"Bell"}];

  // Trainer computed values
  var trTotalSteps=trIncrement>0?Math.ceil((trEndBpm-trStartBpm)/trIncrement):1;
  var trCurrentStep=trIncrement>0?Math.floor((trCurrentBpm-trStartBpm)/trIncrement):0;
  var trProgress=trTotalSteps>0?trCurrentStep/trTotalSteps:0;

  return React.createElement("div",{style:{padding:"24px 0",maxWidth:400,margin:"0 auto"}},
    // Mode toggle
    React.createElement("div",{style:{display:"flex",gap:4,marginBottom:24,background:t.filterBg,borderRadius:10,padding:3}},
      [["metronome","Metronome"],["trainer","Tempo Trainer"]].map(function(m){
        return React.createElement("button",{key:m[0],onClick:function(){if(!playing){setMode(m[0]);}},style:{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:mode===m[0]?t.card:"transparent",color:mode===m[0]?t.text:t.subtle,fontSize:12,fontWeight:mode===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:playing?"default":"pointer",boxShadow:mode===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s",opacity:playing&&mode!==m[0]?0.4:1}},m[1]);
      })),

    // BPM display
    React.createElement("div",{style:{textAlign:"center",marginBottom:mode==="trainer"?16:28}},
      React.createElement("div",{style:{fontSize:64,fontWeight:700,color:mode==="trainer"&&playing?t.accent:t.text,fontFamily:"'JetBrains Mono',monospace",lineHeight:1,letterSpacing:-3,transition:"color 0.3s"}},bpm),
      React.createElement("div",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:4,letterSpacing:1}},mode==="trainer"&&playing?"Step "+(trCurrentStep+1)+" of "+(trTotalSteps+1):"BPM")),

    // Trainer progress bar (only in trainer mode)
    mode==="trainer"&&React.createElement("div",{style:{padding:"0 8px",marginBottom:20}},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:6}},
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},trStartBpm),
        playing&&React.createElement("span",{style:{fontSize:10,color:t.accent,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}},"Bar "+(trBarInStep+1)+"/"+trBarsPerStep),
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},trEndBpm)),
      React.createElement("div",{style:{height:6,background:t.progressBg,borderRadius:3,overflow:"hidden",position:"relative"}},
        React.createElement("div",{style:{height:"100%",width:(trProgress*100)+"%",background:"linear-gradient(90deg,"+t.accent+",#F59E0B)",borderRadius:3,transition:"width 0.4s ease"}})),
      trDone&&React.createElement("div",{style:{textAlign:"center",marginTop:10,animation:"fadeIn 0.4s ease"}},
        React.createElement("span",{style:{fontSize:14,fontWeight:700,color:t.accent,fontFamily:"'Inter',sans-serif"}},"Target reached! "+trEndBpm+" BPM"))),

    // Beat visualization — click to cycle: normal → accent → muted
    React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:12,marginBottom:20}},
      beatStates.map(function(bs,i){
        var active=playing&&currentBeat===i;
        var isAcc=bs===1;var isMuted=bs===2;
        var scale=active?1.2:1;
        var bg=isMuted?(isStudio?"rgba(255,255,255,0.05)":"#F3F3F3")
          :active?(isAcc?t.accent:"#F59E0B")
          :isAcc?(isStudio?t.accent+"40":t.accent+"25")
          :(isStudio?t.border+"60":t.border);
        var bdr=isAcc?"2px solid "+t.accent
          :isMuted?"2px dashed "+(isStudio?t.border:t.borderSub)
          :"2px solid "+(isStudio?t.border:t.borderSub);
        var shadow=active&&!isMuted?"0 0 16px "+(isAcc?t.accentGlow:"rgba(245,158,11,0.4)"):"none";
        return React.createElement("button",{key:i,onClick:function(){cycleBeat(i);},style:{width:32,height:32,borderRadius:"50%",background:bg,border:bdr,transform:"scale("+scale+")",transition:"transform 0.06s ease, background 0.06s ease, box-shadow 0.06s ease",boxShadow:shadow,cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}},
          isMuted&&React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,lineHeight:1}},"\u00D7"),
          isAcc&&!active&&React.createElement("span",{style:{fontSize:8,color:t.accent,fontWeight:700}},"\u25B2"));
      })),

    // METRONOME MODE: BPM slider + presets
    mode==="metronome"&&React.createElement("div",null,
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"0 8px"}},
      React.createElement("button",{onClick:()=>setBpm(b=>Math.max(30,b-1)),style:{width:36,height:36,borderRadius:10,background:t.card,border:"1px solid "+t.border,color:t.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace"}},"\u2212"),
      React.createElement("input",{type:"range",min:30,max:300,value:bpm,onChange:e=>setBpm(parseInt(e.target.value)),style:{flex:1,cursor:"pointer",height:4,accentColor:isStudio?t.accent:"#6366F1"}}),
      React.createElement("button",{onClick:()=>setBpm(b=>Math.min(300,b+1)),style:{width:36,height:36,borderRadius:10,background:t.card,border:"1px solid "+t.border,color:t.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace"}},"+")),

    // BPM presets
    React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:6,marginBottom:24,flexWrap:"wrap"}},
      [60,80,100,120,140,160,200,240].map(b=>React.createElement("button",{key:b,onClick:()=>setBpm(b),style:{padding:"5px 10px",borderRadius:8,border:"1px solid "+(bpm===b?t.accent:t.border),background:bpm===b?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:bpm===b?t.accent:t.muted,fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:bpm===b?700:400,cursor:"pointer"}},b))),
    ), // end metronome mode

    // TRAINER MODE: start/end/increment/bars settings
    mode==="trainer"&&!playing&&React.createElement("div",{style:{background:t.card,borderRadius:16,padding:16,border:"1px solid "+t.border,marginBottom:20}},
      // Start BPM
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}},
        React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600}},"Start"),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
          React.createElement("button",{onClick:function(){setTrStartBpm(function(v){return Math.max(30,v-5);});},style:{width:28,height:28,borderRadius:8,background:t.filterBg,border:"1px solid "+t.border,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
          React.createElement("span",{style:{fontSize:18,fontWeight:700,color:t.text,fontFamily:"'JetBrains Mono',monospace",minWidth:44,textAlign:"center"}},trStartBpm),
          React.createElement("button",{onClick:function(){setTrStartBpm(function(v){return Math.min(290,v+5);});},style:{width:28,height:28,borderRadius:8,background:t.filterBg,border:"1px solid "+t.border,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+"))),
      // End BPM
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}},
        React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600}},"Target"),
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
          React.createElement("button",{onClick:function(){setTrEndBpm(function(v){return Math.max(trStartBpm+5,v-5);});},style:{width:28,height:28,borderRadius:8,background:t.filterBg,border:"1px solid "+t.border,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
          React.createElement("span",{style:{fontSize:18,fontWeight:700,color:t.accent,fontFamily:"'JetBrains Mono',monospace",minWidth:44,textAlign:"center"}},trEndBpm),
          React.createElement("button",{onClick:function(){setTrEndBpm(function(v){return Math.min(300,v+5);});},style:{width:28,height:28,borderRadius:8,background:t.filterBg,border:"1px solid "+t.border,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+"))),
      // Increment + Bars per step row
      React.createElement("div",{style:{display:"flex",gap:16}},
        React.createElement("div",{style:{flex:1}},
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,marginBottom:6}},"+ BPM each step"),
          React.createElement("div",{style:{display:"flex",gap:4}},
            [1,2,4,5,10].map(function(v){return React.createElement("button",{key:v,onClick:function(){setTrIncrement(v);},style:{flex:1,padding:"6px",borderRadius:6,border:"1px solid "+(trIncrement===v?t.accent:t.border),background:trIncrement===v?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:trIncrement===v?t.accent:t.muted,fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:trIncrement===v?700:400,cursor:"pointer"}},v);}))),
        React.createElement("div",{style:{flex:1}},
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,marginBottom:6}},"Bars per step"),
          React.createElement("div",{style:{display:"flex",gap:4}},
            [2,4,8,16].map(function(v){return React.createElement("button",{key:v,onClick:function(){setTrBarsPerStep(v);},style:{flex:1,padding:"6px",borderRadius:6,border:"1px solid "+(trBarsPerStep===v?t.accent:t.border),background:trBarsPerStep===v?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:trBarsPerStep===v?t.accent:t.muted,fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:trBarsPerStep===v?700:400,cursor:"pointer"}},v);}))))),

    // Start / Tap row
    React.createElement("div",{style:{display:"flex",gap:10,marginBottom:28,padding:"0 8px"}},
      React.createElement("button",{onClick:startStop,style:{flex:1,padding:"16px",borderRadius:14,border:"none",background:playing?(isStudio?"#EF4444":"#EF4444"):t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:playing?"0 4px 20px rgba(239,68,68,0.4)":"0 4px 20px "+t.accentGlow,transition:"all 0.15s",letterSpacing:0.5}},playing?"\u25A0  Stop":mode==="trainer"?"\u25B6  Start Training":"\u25B6  Start"),
      mode==="metronome"&&React.createElement("button",{onClick:tapTempo,style:{padding:"16px 24px",borderRadius:14,border:"2px solid "+t.border,background:t.card,color:t.text,fontSize:14,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",transition:"all 0.1s"}},"Tap")),

    // Settings toggle
    React.createElement("button",{onClick:function(){setSettingsOpen(!settingsOpen);},style:{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"10px 12px",borderRadius:10,border:"none",background:t.filterBg,color:t.muted,fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",marginBottom:settingsOpen?12:0}},
      React.createElement("span",null,"\u2699\uFE0F Settings"),
      React.createElement("span",{style:{fontSize:10,color:t.subtle,transform:settingsOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}},"\u25BC")),

    // Collapsible settings
    settingsOpen&&React.createElement("div",{style:{marginBottom:8}},
      // Time Signature
      React.createElement("div",{style:{marginBottom:14}},
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:8}},"TIME SIGNATURE"),
        React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
          TIME_SIGS.map(ts=>React.createElement("button",{key:ts[0]+"/"+ts[1],onClick:()=>{setTimeSig(ts);if(playing){currentSubRef.current=0;}},style:{padding:"6px 14px",borderRadius:8,border:"1px solid "+(timeSig[0]===ts[0]&&timeSig[1]===ts[1]?t.accent:t.border),background:timeSig[0]===ts[0]&&timeSig[1]===ts[1]?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:timeSig[0]===ts[0]&&timeSig[1]===ts[1]?t.accent:t.muted,fontSize:13,fontFamily:"'JetBrains Mono',monospace",fontWeight:timeSig[0]===ts[0]&&timeSig[1]===ts[1]?700:400,cursor:"pointer"}},ts[0]+"/"+ts[1])))),

      // Subdivision
      React.createElement("div",{style:{marginBottom:14}},
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:8}},"SUBDIVISION"),
        React.createElement("div",{style:{display:"flex",gap:6}},
          SUB_OPTS.map(s=>React.createElement("button",{key:s.v,onClick:()=>setSubdivision(s.v),style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(subdivision===s.v?t.accent:t.border),background:subdivision===s.v?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:subdivision===s.v?t.accent:t.muted,fontSize:16,cursor:"pointer",fontWeight:subdivision===s.v?700:400}},s.l)))),

      // Swing (only when subdivision = 2)
      subdivision===2&&React.createElement("div",{style:{marginBottom:14}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
          React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"SWING"),
          React.createElement("span",{style:{fontSize:11,color:swing>0?t.accent:t.muted,fontFamily:"'JetBrains Mono',monospace",fontWeight:swing>0?700:400}},swing>0?swing+"%":"Off")),
        React.createElement("input",{type:"range",min:0,max:100,value:swing,onChange:e=>setSwing(parseInt(e.target.value)),style:{width:"100%",cursor:"pointer",height:4,accentColor:isStudio?t.accent:"#6366F1"}})),

      // Sound
      React.createElement("div",null,
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:8}},"SOUND"),
        React.createElement("div",{style:{display:"flex",gap:4}},
          SOUNDS.map(function(s){return React.createElement("button",{key:s.v,onClick:function(){setSound(s.v);},style:{flex:1,padding:"6px",borderRadius:6,border:"1px solid "+(sound===s.v?t.accent:t.border),background:sound===s.v?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:sound===s.v?t.accent:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:sound===s.v?600:400,cursor:"pointer"}},s.l);})))));}


// ============================================================
// MINI METRONOME — compact inline metronome for Player Practice mode
// Same Web Audio scheduler as full Metronome, compact UI
// ============================================================
function MiniMetronome({th,initBpm,syncPlaying,ctrlRef,onBpmChange,lickTempo,onSetLoop,lickTimeSig}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var bb={border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",fontFamily:"'Inter',sans-serif"};
  var[bpm,setBpm]=useState(initBpm||120);
  var[playing,setPlaying]=useState(false);
  var[muted,setMuted]=useState(false);
  var mutedRef=useRef(false);
  useEffect(function(){mutedRef.current=muted;},[muted]);
  var[timeSig,setTimeSig]=useState(lickTimeSig||[4,4]);
  // Auto-sync time sig from lick
  useEffect(function(){if(lickTimeSig){setTimeSig(lickTimeSig);}},[lickTimeSig?lickTimeSig[0]:0,lickTimeSig?lickTimeSig[1]:0]);
  var[subdivision,setSubdivision]=useState(1);
  var[swing,setSwing]=useState(0);
  var[beatStates,setBeatStates]=useState(function(){var a=[1,0,0,0];return a;});
  var[currentBeat,setCurrentBeat]=useState(-1);
  var[sound,setSound]=useState("click");
  var[moreOpen,setMoreOpen]=useState(false);
  // Progressive trainer
  var[progOn,setProgOn]=useState(false);
  var[progTarget,setProgTarget]=useState(Math.round((initBpm||120)*1.5));
  var[progInc,setProgInc]=useState(5);
  var[progBars,setProgBars]=useState(4);
  var[progCurBpm,setProgCurBpm]=useState(initBpm||120);
  var[progBarInStep,setProgBarInStep]=useState(0);
  var[progDone,setProgDone]=useState(false);

  // Refs
  var actxRef=useRef(null);var timerRef=useRef(null);
  var nextNoteTimeRef=useRef(0);var currentSubRef=useRef(0);
  var beatRef=useRef(-1);var bpmRef=useRef(bpm);
  var timeSigRef=useRef(timeSig);var subRef=useRef(subdivision);
  var swingRef=useRef(swing);var beatStatesRef=useRef(beatStates);
  var soundRef=useRef(sound);var playingRef=useRef(false);
  var progOnRef=useRef(false);var progTargetRef=useRef(progTarget);
  var progIncRef=useRef(progInc);var progBarsRef=useRef(progBars);
  var progCurBpmRef=useRef(bpm);var progBarRef=useRef(0);var progDoneRef=useRef(false);
  var progLoopRef=useRef(0);// loop counter for synced progressive mode

  useEffect(function(){bpmRef.current=bpm;},[bpm]);
  useEffect(function(){timeSigRef.current=timeSig;},[timeSig]);
  useEffect(function(){subRef.current=subdivision;},[subdivision]);
  useEffect(function(){swingRef.current=swing;},[swing]);
  useEffect(function(){beatStatesRef.current=beatStates;},[beatStates]);
  useEffect(function(){soundRef.current=sound;},[sound]);
  useEffect(function(){progOnRef.current=progOn;},[progOn]);
  useEffect(function(){progTargetRef.current=progTarget;},[progTarget]);
  useEffect(function(){progIncRef.current=progInc;},[progInc]);
  useEffect(function(){progBarsRef.current=progBars;},[progBars]);
  useEffect(function(){var n=timeSig[0];var a=new Array(n).fill(0);a[0]=1;setBeatStates(a);},[timeSig]);

  // Change BPM and notify parent
  var changeBpm=function(v){var nv=Math.max(30,Math.min(300,typeof v==="function"?v(bpm):v));setBpm(nv);bpmRef.current=nv;if(onBpmChange)onBpmChange(nv);return nv;};

  var cycleBeat=function(i){setBeatStates(function(prev){var n=[].concat(prev);n[i]=(n[i]+1)%3;return n;});};

  // Tap tempo
  var tapTimesRef=useRef([]);
  var tapTempo=function(){
    var now=performance.now();var taps=tapTimesRef.current;taps.push(now);
    if(taps.length>5)taps.shift();
    if(taps.length>=2){
      var intervals=[];for(var i=1;i<taps.length;i++)intervals.push(taps[i]-taps[i-1]);
      if(intervals.some(function(iv){return iv>2000;})){tapTimesRef.current=[now];return;}
      var avg=intervals.reduce(function(a,b){return a+b;},0)/intervals.length;
      var nb=Math.round(60000/avg);if(nb>=30&&nb<=300)changeBpm(nb);
    }
  };

  var scheduleNote=function(time,isAccent,isSub){
    if(mutedRef.current)return;// silent when muted — scheduler still runs for beat dots
    var actx=actxRef.current;if(!actx)return;
    var snd=soundRef.current;
    var osc=actx.createOscillator();var gain=actx.createGain();
    osc.connect(gain);gain.connect(actx.destination);
    if(snd==="click"){osc.type="triangle";osc.frequency.value=isAccent?1200:800;gain.gain.setValueAtTime(isAccent?0.6:0.3,time);gain.gain.exponentialRampToValueAtTime(0.001,time+0.03);osc.start(time);osc.stop(time+0.03);
    }else if(snd==="wood"){osc.type="sine";osc.frequency.value=isAccent?3200:2400;gain.gain.setValueAtTime(isAccent?0.4:0.2,time);gain.gain.exponentialRampToValueAtTime(0.001,time+0.015);osc.start(time);osc.stop(time+0.02);
    }else{osc.type="square";osc.frequency.value=isAccent?800:560;gain.gain.setValueAtTime(isAccent?0.15:0.08,time);gain.gain.exponentialRampToValueAtTime(0.001,time+0.06);osc.start(time);osc.stop(time+0.06);}
    if(isSub)gain.gain.setValueAtTime(0.12,time);
  };

  var scheduler=function(){
    var actx=actxRef.current;if(!actx)return;
    while(nextNoteTimeRef.current<actx.currentTime+0.15){
      var curSub=currentSubRef.current;var beats=timeSigRef.current[0];var sub=subRef.current;
      var totalSubs=beats*sub;var beatIdx=Math.floor(curSub/sub);var subIdx=curSub%sub;
      var bs=(beatStatesRef.current||[])[beatIdx]||0;
      var isBeat=subIdx===0;var isAccent=bs===1&&isBeat;var isMuted=bs===2&&isBeat;
      if(!isMuted)scheduleNote(nextNoteTimeRef.current,isAccent,!isBeat);
      var bt=beatIdx;var dt=(nextNoteTimeRef.current-actx.currentTime)*1000;
      if(isBeat)setTimeout(function(){var b=bt;return function(){if(playingRef.current)setCurrentBeat(b);};}(),Math.max(0,dt));
      var secPerBeat=60.0/bpmRef.current;var subDuration=secPerBeat/sub;
      if(sub===2&&swingRef.current>0){var sr=0.5+(swingRef.current/100)*0.17;subDuration=subIdx===0?secPerBeat*sr:secPerBeat*(1-sr);}
      nextNoteTimeRef.current+=subDuration;
      var nextSub=(curSub+1)%totalSubs;
      // Progressive bar counting — only standalone (not synced). Synced uses notifyLoop instead.
      if(nextSub===0&&progOnRef.current&&!progDoneRef.current&&!ctrlRef){
        progBarRef.current++;var bar=progBarRef.current;
        setTimeout(function(){var b=bar;return function(){if(playingRef.current)setProgBarInStep(b%progBarsRef.current);};}(),Math.max(0,dt));
        if(progBarRef.current>=progBarsRef.current){
          progBarRef.current=0;
          var newBpm=progCurBpmRef.current+progIncRef.current;
          if(newBpm>progTargetRef.current){progDoneRef.current=true;setTimeout(function(){setProgDone(true);},Math.max(0,dt));}
          else{progCurBpmRef.current=newBpm;bpmRef.current=newBpm;
            setTimeout(function(){var nb2=newBpm;return function(){if(playingRef.current){setProgCurBpm(nb2);setBpm(nb2);setProgBarInStep(0);}}}(),Math.max(0,dt));}
        }
      }
      currentSubRef.current=nextSub;
    }
  };

  // Get Tone.js native AudioContext for same-clock sync
  var getToneCtx=function(){
    try{if(typeof Tone!=="undefined"&&Tone.context){return Tone.context.rawContext||Tone.context._context||Tone.context;}}catch(e){}return null;
  };

  var doStart=function(startAt){
    if(playingRef.current){
      // Already running — reset beat to bar start for loop re-sync
      currentSubRef.current=0;
      var a=actxRef.current;if(a)nextNoteTimeRef.current=startAt||a.currentTime+0.02;
      return;
    }
    // When synced (ctrlRef set), use Tone's AudioContext — same clock as Lick audio
    if(ctrlRef){var tc=getToneCtx();if(tc)actxRef.current=tc;}
    if(!actxRef.current)actxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef.current;if(actx.state==="suspended")actx.resume();
    currentSubRef.current=0;
    // Use startAt (Tone.now()) for exact sync with pre-scheduled lick notes
    nextNoteTimeRef.current=startAt||actx.currentTime+0.02;
    if(progOn){setProgCurBpm(bpm);progCurBpmRef.current=bpm;setProgBarInStep(0);progBarRef.current=0;progLoopRef.current=0;setProgDone(false);progDoneRef.current=false;}
    playingRef.current=true;setPlaying(true);timerRef.current=setInterval(scheduler,25);
  };
  var doStop=function(){
    if(!playingRef.current)return;
    if(timerRef.current)clearInterval(timerRef.current);timerRef.current=null;
    playingRef.current=false;
    setPlaying(false);setCurrentBeat(-1);
  };
  var startStop=function(){if(playing)doStop();else doStart();};

  // Register start/stop/getBpm/notifyLoop on ctrlRef so Player can call directly
  useEffect(function(){
    if(ctrlRef){ctrlRef.current={start:doStart,stop:doStop,getBpm:function(){return bpmRef.current;},setBpmLive:function(v){bpmRef.current=v;setBpm(v);},
      notifyLoop:function(){
        // Called by Player on each lick loop — drives synced progressive
        if(!progOnRef.current||progDoneRef.current)return null;
        progLoopRef.current++;
        var lp=progLoopRef.current;var needed=progBarsRef.current;
        setProgBarInStep(lp%needed);
        if(lp>=needed){
          progLoopRef.current=0;
          var newBpm=progCurBpmRef.current+progIncRef.current;
          if(newBpm>progTargetRef.current){progDoneRef.current=true;setProgDone(true);return null;}
          else{progCurBpmRef.current=newBpm;bpmRef.current=newBpm;setBpm(newBpm);setProgCurBpm(newBpm);setProgBarInStep(0);
            return newBpm;}// Player reads via getBpm(), no need for onBpmChange
        }
        return null;
      }};}
  });

  // Sync stop when Player stops
  useEffect(function(){
    if(syncPlaying===undefined)return;
    if(!syncPlaying&&playingRef.current)doStop();
  },[syncPlaying]);

  useEffect(function(){return function(){if(timerRef.current)clearInterval(timerRef.current);};},[]);

  var TIME_SIGS=[[4,4],[3,4],[5,4],[6,8],[7,8],[2,4]];
  var SUB_OPTS=[{v:1,l:"\u2669"},{v:2,l:"\u266A"},{v:3,l:"3"},{v:4,l:"\u266C"}];
  var SOUNDS=[{v:"click",l:"Click"},{v:"wood",l:"Wood"},{v:"cowbell",l:"Bell"}];
  var chip=function(active,label,onClick){return React.createElement("button",{onClick:function(e){e.stopPropagation();onClick();},style:{padding:"3px 8px",borderRadius:6,border:"1px solid "+(active?t.accent:t.border),background:active?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:active?t.accent:t.muted,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:active?700:400,cursor:"pointer"}},label);};

  var isSynced=!!ctrlRef;
  return React.createElement("div",{style:{padding:"10px 0"}},
    // ROW 1: Mute/Play + BPM + controls
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:8}},
      // Synced: mute/unmute toggle. Standalone: play/stop
      isSynced?React.createElement("button",{onClick:function(e){e.stopPropagation();setMuted(!muted);},style:{width:36,height:36,borderRadius:10,background:muted?(isStudio?"rgba(255,255,255,0.06)":"#F3F3F3"):t.accent,color:muted?t.subtle:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",border:muted?"1.5px dashed "+t.border:"none",boxShadow:muted?"none":"0 2px 12px "+t.accentGlow,transition:"all 0.15s",opacity:playing?1:0.5}},
        muted?React.createElement("span",{style:{fontSize:14,lineHeight:1}},"\u2715"):React.createElement("span",{style:{fontSize:14,lineHeight:1}},"\u266A"))
      :React.createElement("button",{onClick:function(e){e.stopPropagation();startStop();},style:{width:36,height:36,borderRadius:10,background:playing?"#EF4444":t.accent,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",border:"none",boxShadow:playing?"0 2px 12px rgba(239,68,68,0.3)":"0 2px 12px "+t.accentGlow,transition:"all 0.15s"}},
        playing?React.createElement("div",{style:{width:10,height:10,borderRadius:1,background:"#fff"}}):React.createElement("div",{style:{width:0,height:0,borderTop:"7px solid transparent",borderBottom:"7px solid transparent",borderLeft:"11px solid #fff",marginLeft:2}})),
      React.createElement("span",{style:{fontSize:22,fontWeight:700,color:playing&&!muted?t.accent:t.text,fontFamily:"'JetBrains Mono',monospace",minWidth:36,transition:"color 0.15s",opacity:muted?0.4:1}},bpm),
      React.createElement("div",{style:{display:"flex",gap:2}},
        React.createElement("button",{onClick:function(e){e.stopPropagation();changeBpm(function(b){return b-5;});},style:{width:24,height:24,borderRadius:6,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
        React.createElement("button",{onClick:function(e){e.stopPropagation();changeBpm(function(b){return b+5;});},style:{width:24,height:24,borderRadius:6,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+")
      ),
      React.createElement("button",{onClick:function(e){e.stopPropagation();tapTempo();},style:{padding:"4px 10px",borderRadius:7,border:"1.5px solid "+t.border,background:t.card,color:t.text,fontSize:10,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"TAP"),
      lickTempo&&bpm!==lickTempo&&React.createElement("button",{onClick:function(e){e.stopPropagation();changeBpm(lickTempo);},style:{padding:"4px 8px",borderRadius:7,border:"none",background:"none",color:t.muted,fontSize:9,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u21A9 "+lickTempo),
      React.createElement("div",{style:{marginLeft:"auto"}},
        React.createElement("button",{onClick:function(e){e.stopPropagation();setMoreOpen(!moreOpen);},style:{padding:"3px 8px",borderRadius:6,background:moreOpen?t.filterBg:"transparent",color:moreOpen?t.text:t.subtle,fontSize:9,fontFamily:"'Inter',sans-serif",cursor:"pointer",border:"none"}},moreOpen?"\u25B4 Less":"\u25BE More"))),

    // ROW 2: Beat dots — click to cycle accent/normal/muted
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:moreOpen?8:0,opacity:muted?0.35:1,transition:"opacity 0.15s"}},
      beatStates.map(function(bs,i){
        var active=playing&&currentBeat===i;var isAcc=bs===1;var isMut=bs===2;
        var bg=isMut?(isStudio?"rgba(255,255,255,0.05)":"#F3F3F3"):active?(isAcc?t.accent:"#F59E0B"):isAcc?(isStudio?t.accent+"40":t.accent+"25"):(isStudio?t.border+"60":t.border);
        return React.createElement("button",{key:i,onClick:function(e){e.stopPropagation();cycleBeat(i);},style:{width:22,height:22,borderRadius:"50%",background:bg,border:isAcc?"2px solid "+t.accent:isMut?"2px dashed "+t.border:"2px solid "+(isStudio?t.border:t.borderSub||t.border),transform:active?"scale(1.2)":"scale(1)",transition:"all 0.06s",boxShadow:active&&!isMut?"0 0 10px "+(isAcc?t.accentGlow:"rgba(245,158,11,0.4)"):"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}},
          isMut&&React.createElement("span",{style:{fontSize:8,color:t.subtle,fontWeight:700}},"\u00D7"),
          isAcc&&!active&&React.createElement("span",{style:{fontSize:6,color:t.accent,fontWeight:700}},"\u25B2"));
      }),
      React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",marginLeft:4}},timeSig[0]+"/"+timeSig[1]),
      // Subdivision pills inline
      SUB_OPTS.map(function(s){return React.createElement("button",{key:s.v,onClick:function(e){e.stopPropagation();setSubdivision(s.v);},style:{width:22,height:22,borderRadius:6,border:"1px solid "+(subdivision===s.v?t.accent:t.border),background:subdivision===s.v?(isStudio?t.accent+"20":t.accent+"10"):"transparent",color:subdivision===s.v?t.accent:t.subtle,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}},s.l);})),

    // MORE panel: time sig, swing, sound, progressive
    moreOpen&&React.createElement("div",{style:{padding:"8px 0",display:"flex",flexDirection:"column",gap:8}},
      // Time signatures (hidden when synced to lick)
      !lickTimeSig&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}},
        React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"TIME"),
        TIME_SIGS.map(function(ts){return chip(timeSig[0]===ts[0]&&timeSig[1]===ts[1],ts[0]+"/"+ts[1],function(){setTimeSig(ts);});})),
      // Sound
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4}},
        React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"SOUND"),
        SOUNDS.map(function(s){return chip(sound===s.v,s.l,function(){setSound(s.v);});})),
      // Swing (when subdivision=2)
      subdivision===2&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
        React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"SWING"),
        React.createElement("input",{type:"range",min:0,max:100,value:swing,onClick:function(e){e.stopPropagation();},onChange:function(e){e.stopPropagation();setSwing(parseInt(e.target.value));},style:{flex:1,height:3,accentColor:t.accent}}),
        React.createElement("span",{style:{fontSize:10,color:swing>0?t.accent:t.muted,fontFamily:"'JetBrains Mono',monospace",fontWeight:swing>0?600:400,minWidth:28}},swing>0?swing+"%":"Off")),
      // Progressive
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}},
        chip(progOn,"Progressive",function(){var nv=!progOn;setProgOn(nv);if(nv&&isSynced&&onSetLoop)onSetLoop(true);}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"\u2192"),
        progOn&&React.createElement("input",{type:"number",value:progTarget,onClick:function(e){e.stopPropagation();},onChange:function(e){e.stopPropagation();setProgTarget(parseInt(e.target.value)||180);},style:{width:40,padding:"3px 4px",borderRadius:5,border:"1px solid "+t.border,background:t.filterBg,color:t.accent,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center",fontWeight:600}}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"+"),
        progOn&&React.createElement("input",{type:"number",value:progInc,onClick:function(e){e.stopPropagation();},onChange:function(e){e.stopPropagation();setProgInc(parseInt(e.target.value)||5);},style:{width:28,padding:"3px 4px",borderRadius:5,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"/"),
        progOn&&React.createElement("input",{type:"number",value:progBars,onClick:function(e){e.stopPropagation();},onChange:function(e){e.stopPropagation();setProgBars(Math.max(1,parseInt(e.target.value)||1));},style:{width:24,padding:"3px 4px",borderRadius:5,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},isSynced?"loops":"bars")),
      progOn&&playing&&React.createElement("div",{style:{fontSize:10,color:progDone?"#22D89E":t.accent,fontFamily:"'Inter',sans-serif",fontWeight:500}},
        progDone?"\u2713 Target reached! "+progTarget+" BPM":(isSynced?"Loop ":"Bar ")+(progBarInStep+1)+"/"+progBars+" \u00B7 "+progCurBpm+" BPM")));
}
function RhythmGame({th,sharedInput,sharedMicSilent}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var inputMode=sharedInput||"tap";
  var micSilent=sharedMicSilent!==undefined?sharedMicSilent:true;
  var curNoteRef=useRef(-1);
  var[difficulty,setDifficulty]=useState("easy");
  var[rgBpm,setRgBpm]=useState(90);
  var[phase,setPhase]=useState("setup"); // setup|ready|listening|countdown|playing|results
  var[pattern,setPattern]=useState(null); // {abc,onsets}
  var[taps,setTaps]=useState([]);
  var[countdown,setCountdown]=useState(4);
  var[results,setResults]=useState(null);
  var[currentNote,setCurrentNote]=useState(-1);
  var[bars,setBars]=useState(2);
  var[rgSettingsOpen,setRgSettingsOpen]=useState(false);
  var[playAlong,setPlayAlong]=useState(false);
  var[micActive,setMicActive]=useState(false);
  var[micLevel,setMicLevel]=useState(0);

  var actxRef2=useRef(null);
  var patStartRef=useRef(0);
  var tapsRef=useRef([]);
  var phaseRef=useRef("setup");
  var timerRef2=useRef(null);
  var countRef=useRef(4);
  var nextClickRef=useRef(0);
  var beatCountRef=useRef(0);
  var totalBeatsRef=useRef(0);
  var onsetsRef=useRef([]);
  var bpmRef2=useRef(rgBpm);
  var playAlongRef=useRef(false);
  var micStreamRef=useRef(null);
  var analyserRef=useRef(null);
  var micTimerRef=useRef(null);
  var lastTriggerRef=useRef(0);
  var inputModeRef=useRef(inputMode);
  var micSilentRef=useRef(micSilent);

  useEffect(function(){bpmRef2.current=rgBpm;},[rgBpm]);
  useEffect(function(){phaseRef.current=phase;},[phase]);
  useEffect(function(){playAlongRef.current=playAlong;},[playAlong]);
  useEffect(function(){inputModeRef.current=inputMode;},[inputMode]);
  useEffect(function(){micSilentRef.current=micSilent;},[micSilent]);

  // Mic: start listening for claps
  var startMic=function(){
    if(!actxRef2.current)actxRef2.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef2.current;
    if(actx.state==="suspended")actx.resume();
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      micStreamRef.current=stream;
      var source=actx.createMediaStreamSource(stream);
      var analyser=actx.createAnalyser();
      analyser.fftSize=512;
      analyser.smoothingTimeConstant=0.1;
      source.connect(analyser);
      analyserRef.current=analyser;
      setMicActive(true);
      var buf=new Float32Array(analyser.fftSize);
      var threshold=0.12;
      var debounceMs=80;
      var prevRms=0;
      micTimerRef.current=setInterval(function(){
        if(!analyserRef.current)return;
        analyserRef.current.getFloatTimeDomainData(buf);
        var sum=0;
        for(var i=0;i<buf.length;i++)sum+=buf[i]*buf[i];
        var rms=Math.sqrt(sum/buf.length);
        setMicLevel(Math.min(1,rms*5));
        var now=actx.currentTime;
        if(rms>threshold&&rms>prevRms*1.3&&(now-lastTriggerRef.current)*1000>debounceMs){
          lastTriggerRef.current=now;
          if(phaseRef.current==="playing"||phaseRef.current==="countdown"){
            var tapTime=now-patStartRef.current;
            if(phaseRef.current==="countdown"&&tapTime<-0.2){prevRms=rms;return;}
            tapsRef.current.push(tapTime);
            setTaps(function(prev){return prev.concat([tapTime]);});
          }
        }
        prevRms=rms;
      },8);
    }).catch(function(){console.warn("Mic unavailable");});
  };

  var stopMic=function(){
    if(micTimerRef.current){clearInterval(micTimerRef.current);micTimerRef.current=null;}
    if(micStreamRef.current){micStreamRef.current.getTracks().forEach(function(tk){tk.stop();});micStreamRef.current=null;}
    analyserRef.current=null;setMicActive(false);setMicLevel(0);
  };

  // Generate random rhythm pattern
  var generatePattern=function(diff,numBars){
    var beatsPerBar=4;
    var totalBeats=numBars*beatsPerBar;
    // Beat patterns: each array fills exactly 1 beat (4 sixteenths)
    // {d:duration_in_16ths, r:rest, tie:tie_to_next}
    // "triplet" is a special beat type
    var easyPool=[
      [{d:4}],                      // quarter note
      [{d:4,r:true}],               // quarter rest
      [{d:2},{d:2}],                // two eighths
    ];
    var medPool=[
      [{d:4}],[{d:4}],             // quarter (weighted)
      [{d:2},{d:2}],[{d:2},{d:2}], // two eighths (weighted)
      [{d:4,r:true}],               // quarter rest
      [{d:2},{d:2,r:true}],         // eighth + eighth rest
      [{d:2,r:true},{d:2}],         // eighth rest + eighth
    ];
    var hardPool=[
      [{d:4}],
      [{d:2},{d:2}],
      [{d:1},{d:1},{d:2}],          // 2 sixteenths + eighth
      [{d:2},{d:1},{d:1}],          // eighth + 2 sixteenths
      [{d:1},{d:1},{d:1},{d:1}],    // 4 sixteenths
      [{d:4,r:true}],
      [{d:2},{d:2,r:true}],
      [{d:2,r:true},{d:2}],
    ];
    var expertPool=[
      [{d:4}],
      [{d:2},{d:2}],
      [{d:1},{d:1},{d:2}],
      [{d:2},{d:1},{d:1}],
      [{d:1},{d:1},{d:1},{d:1}],
      [{d:4,r:true}],
      [{d:2},{d:2,r:true}],
      [{d:3},{d:1}],                // dotted eighth + sixteenth
      [{d:1},{d:3}],                // sixteenth + dotted eighth
      "triplet",                    // 3 triplet eighths
    ];
    var pool=diff==="easy"?easyPool:diff==="medium"?medPool:diff==="hard"?hardPool:expertPool;

    // Generate beat by beat
    var beats=[];
    for(var i=0;i<totalBeats;i++){
      var cands=pool.slice();
      // First beat: no rest
      if(i===0)cands=cands.filter(function(p){return p==="triplet"||!p[0].r;});
      // Avoid two rests in a row
      if(i>0){
        var prev=beats[i-1];
        if(prev!=="triplet"&&prev.length===1&&prev[0].r)
          cands=cands.filter(function(p){return p==="triplet"||!p[0].r;});
      }
      if(cands.length===0)cands=pool.slice();
      beats.push(cands[Math.floor(Math.random()*cands.length)]);
    }

    // Second pass: randomly tie consecutive quarters into half notes
    for(var i2=0;i2<beats.length-1;i2++){
      var b1=beats[i2],b2=beats[i2+1];
      if(b1!=="triplet"&&b2!=="triplet"&&
         b1.length===1&&!b1[0].r&&b1[0].d===4&&
         b2.length===1&&!b2[0].r&&b2[0].d===4&&
         Math.random()<(diff==="easy"?0.3:0.2)){
        beats[i2]=[{d:4,tie:true}]; // tied quarter
        i2++; // skip next (it stays as C4, no new onset)
      }
    }

    // Build ABC and calculate onsets
    var secPer16=(60.0/rgBpm)/4;
    var tokens=[];
    var onsets=[];
    var pos16=0;
    var tiedFromPrev=false;

    for(var bi=0;bi<beats.length;bi++){
      var beat=beats[bi];
      if(beat==="triplet"){
        // 3 eighth-note triplets filling 1 beat
        tokens.push("(3C2C2C2");
        if(!tiedFromPrev)onsets.push(pos16*secPer16);
        else tiedFromPrev=false;
        onsets.push((pos16+4/3)*secPer16);
        onsets.push((pos16+8/3)*secPer16);
        pos16+=4;
      }else{
        for(var ni=0;ni<beat.length;ni++){
          var ev=beat[ni];
          if(ev.r){
            tokens.push("z"+(ev.d>1?ev.d:""));
            pos16+=ev.d;
            tiedFromPrev=false;
          }else{
            var ns="C"+(ev.d>1?ev.d:"");
            if(ev.tie)ns+="-";
            tokens.push(ns);
            if(!tiedFromPrev)onsets.push(pos16*secPer16);
            pos16+=ev.d;
            tiedFromPrev=!!ev.tie;
          }
        }
      }
      // Bar line every 4 beats
      if((bi+1)%beatsPerBar===0&&bi<totalBeats-1)tokens.push("|");
    }

    var abcStr="X:1\nM:4/4\nL:1/16\nK:C clef=perc\n"+tokens.join(" ")+" |";
    return {abc:abcStr,onsets:onsets,totalLen:pos16*secPer16};
  };

  // Click sound
  var playClick=function(time,accent){
    var actx=actxRef2.current;if(!actx)return;
    var osc=actx.createOscillator();var gain=actx.createGain();
    osc.connect(gain);gain.connect(actx.destination);
    osc.type="triangle";
    osc.frequency.value=accent?1200:800;
    gain.gain.setValueAtTime(accent?0.5:0.25,time);
    gain.gain.exponentialRampToValueAtTime(0.001,time+0.03);
    osc.start(time);osc.stop(time+0.03);
  };

  // Tap feedback sound
  var playTapSound=function(){
    var actx=actxRef2.current;if(!actx)return;
    var osc=actx.createOscillator();var gain=actx.createGain();
    osc.connect(gain);gain.connect(actx.destination);
    osc.type="sine";osc.frequency.value=600;
    gain.gain.setValueAtTime(0.15,actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.04);
    osc.start(actx.currentTime);osc.stop(actx.currentTime+0.04);
  };

  // Scheduler: runs countdown clicks then pattern clicks
  var scheduler2=function(){
    var actx=actxRef2.current;if(!actx)return;
    var lookAhead=0.1;
    while(nextClickRef.current<actx.currentTime+lookAhead){
      var beatNum=beatCountRef.current;
      var total=totalBeatsRef.current;
      if(beatNum>=total){
        // Done playing
        clearInterval(timerRef2.current);timerRef2.current=null;
        setTimeout(function(){
          if(phaseRef.current==="playing")scoreResults();
        },300);
        return;
      }
      var isAccent=beatNum%4===0;
      var muteClick=inputModeRef.current==="mic"&&micSilentRef.current;
      if(!muteClick)playClick(nextClickRef.current,isAccent);

      // Countdown display sync
      var bt=beatNum;var dt2=(nextClickRef.current-actx.currentTime)*1000;
      if(beatNum<4){
        var c=4-beatNum;
        setTimeout(function(){setCountdown(c);},Math.max(0,dt2));
      }
      // Set patStartRef to the EXACT scheduled time of beat 1 (beatNum 4)
      if(beatNum===3){
        // Beat 1 will be at nextClickRef + secPerBeat — set it now so early taps work
        var secPerBeatNow=60.0/bpmRef2.current;
        patStartRef.current=nextClickRef.current+secPerBeatNow;
      }
      if(beatNum===4){
        setTimeout(function(){setPhase("playing");phaseRef.current="playing";},Math.max(0,dt2));
        // Schedule play-along note sounds if enabled
        if(playAlongRef.current&&!muteClick){
          var ons2=onsetsRef.current;
          var actx2=actxRef2.current;
          for(var pai=0;pai<ons2.length;pai++){
            (function(onset){
              var t3=nextClickRef.current-secPerBeat+onset; // patStart is this beat's time
              // Use a temp variable to avoid closure issues
              var noteTime=patStartRef.current+onset;
              var osc2=actx2.createOscillator();var gain2=actx2.createGain();
              osc2.connect(gain2);gain2.connect(actx2.destination);
              osc2.type="sine";osc2.frequency.value=1600;
              gain2.gain.setValueAtTime(0.2,noteTime);
              gain2.gain.exponentialRampToValueAtTime(0.001,noteTime+0.05);
              osc2.start(noteTime);osc2.stop(noteTime+0.06);
            })(ons2[pai]);
          }
        }
      }
      // Note cursor sync (during playing phase)
      if(beatNum>=4){
        var playBeat=beatNum-4;
        var secPer16=(60.0/bpmRef2.current)/4;
        var beatTime=playBeat*4*secPer16; // each beat = 4 sixteenths
        (function(bTime,dly){
          setTimeout(function(){
            // Find which onset is closest
            var ons=onsetsRef.current;
            var ci=-1;
            for(var oi=0;oi<ons.length;oi++){
              if(Math.abs(ons[oi]-bTime)<0.01){ci=oi;break;}
            }
            if(ci>=0)setCurrentNote(ci);
          },Math.max(0,dly));
        })(beatTime,dt2);
      }

      var secPerBeat=60.0/bpmRef2.current;
      nextClickRef.current+=secPerBeat;
      beatCountRef.current++;
    }
  };

  // Play rhythm preview — schedule clicks on all onsets
  var playPreview=function(pat,skipPhase){
    if(!actxRef2.current)actxRef2.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef2.current;
    if(actx.state==="suspended")actx.resume();
    var now=actx.currentTime+0.1;
    var secPerBeat=60.0/rgBpm;
    // Play 4-beat countdown first
    for(var c=0;c<4;c++){
      playClick(now+c*secPerBeat,c===0);
    }
    var patStart=now+4*secPerBeat;
    // Play metronome during pattern
    var patBeats=bars*4;
    for(var b=0;b<patBeats;b++){
      playClick(patStart+b*secPerBeat,b%4===0);
    }
    // Play note onsets as higher pitched click
    for(var oi=0;oi<pat.onsets.length;oi++){
      (function(onset){
        var t2=patStart+onset;
        var osc=actx.createOscillator();var gain=actx.createGain();
        osc.connect(gain);gain.connect(actx.destination);
        osc.type="sine";osc.frequency.value=1600;
        gain.gain.setValueAtTime(0.3,t2);
        gain.gain.exponentialRampToValueAtTime(0.001,t2+0.05);
        osc.start(t2);osc.stop(t2+0.05);
      })(pat.onsets[oi]);
    }
    // Set total duration for button state
    if(!skipPhase){
      var totalDur=(4+patBeats)*secPerBeat;
      setPhase("listening");phaseRef.current="listening";
      setTimeout(function(){if(phaseRef.current==="listening")setPhase("ready");},totalDur*1000+100);
    }
  };

  // Score the taps against expected onsets
  var scoreResults=function(){
    var ons=onsetsRef.current;
    var ts=tapsRef.current;
    var details=[];
    var used=new Array(ts.length).fill(false);

    for(var i=0;i<ons.length;i++){
      var expected=ons[i];
      var bestDiff=Infinity;var bestJ=-1;
      for(var j=0;j<ts.length;j++){
        if(used[j])continue;
        var diff=Math.abs(ts[j]-expected);
        if(diff<bestDiff){bestDiff=diff;bestJ=j;}
      }
      var rating="miss";var diffMs=bestDiff*1000;
      if(bestJ>=0&&diffMs<=150){
        used[bestJ]=true;
        if(diffMs<=40)rating="perfect";
        else if(diffMs<=80)rating="good";
        else if(diffMs<=120)rating="ok";
        else rating="late";
      }
      details.push({expected:expected,rating:rating,diffMs:Math.round(diffMs),tapTime:bestJ>=0?ts[bestJ]:null});
    }
    // Extra taps
    var extras=used.filter(function(u){return !u;}).length;
    var perfect=details.filter(function(d){return d.rating==="perfect";}).length;
    var good=details.filter(function(d){return d.rating==="good";}).length;
    var ok=details.filter(function(d){return d.rating==="ok";}).length;
    var late=details.filter(function(d){return d.rating==="late";}).length;
    var miss=details.filter(function(d){return d.rating==="miss";}).length;
    var total=details.length;
    var score=total>0?Math.round(((perfect*3+good*2+ok*1)/(total*3))*100):0;

    setResults({details:details,extras:extras,perfect:perfect,good:good,ok:ok,late:late,miss:miss,score:score,total:total});
    stopMic();
    setPhase("results");
  };

  // Generate pattern and go to ready screen
  var generateReady=function(){
    var pat=generatePattern(difficulty,bars);
    setPattern(pat);
    setPhase("ready");
  };

  // Start game with current pattern
  var startGame=function(withPlayAlong){
    var pat=pattern||generatePattern(difficulty,bars);
    if(!pattern)setPattern(pat);
    setPlayAlong(!!withPlayAlong);
    onsetsRef.current=pat.onsets;
    tapsRef.current=[];setTaps([]);
    setResults(null);setCurrentNote(-1);
    setCountdown(4);countRef.current=4;

    if(!actxRef2.current)actxRef2.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef2.current;
    if(actx.state==="suspended")actx.resume();

    var countdownBeats=4;
    var patternBeats=bars*4;
    totalBeatsRef.current=countdownBeats+patternBeats;
    beatCountRef.current=0;
    nextClickRef.current=actx.currentTime+0.1;

    setPhase("countdown");phaseRef.current="countdown";
    if(inputModeRef.current==="mic")startMic();
    timerRef2.current=setInterval(scheduler2,25);
  };

  // Retry with same pattern
  var retrySame=function(withPlayAlong){
    if(!pattern)return;
    setPlayAlong(!!withPlayAlong);
    onsetsRef.current=pattern.onsets;
    tapsRef.current=[];setTaps([]);
    setResults(null);setCurrentNote(-1);
    setCountdown(4);countRef.current=4;

    if(!actxRef2.current)actxRef2.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef2.current;
    if(actx.state==="suspended")actx.resume();

    var countdownBeats=4;
    var patternBeats=bars*4;
    totalBeatsRef.current=countdownBeats+patternBeats;
    beatCountRef.current=0;
    nextClickRef.current=actx.currentTime+0.1;

    setPhase("countdown");phaseRef.current="countdown";
    if(inputModeRef.current==="mic")startMic();
    timerRef2.current=setInterval(scheduler2,25);
  };

  // Handle tap — works during playing AND late countdown (for early beat 1)
  var handleTap=function(e){
    if(e)e.preventDefault();
    var ph=phaseRef.current;
    if(ph!=="playing"&&ph!=="countdown")return;
    var actx=actxRef2.current;if(!actx)return;
    // patStartRef is set when beat 3 of countdown is scheduled
    if(!patStartRef.current)return;
    var tapTime=actx.currentTime-patStartRef.current;
    // During countdown, only allow taps within 200ms before beat 1
    if(ph==="countdown"&&tapTime<-0.2)return;
    tapsRef.current.push(tapTime);
    setTaps(function(prev){return prev.concat([tapTime]);});
    playTapSound();
  };

  // Cleanup
  useEffect(function(){return function(){if(timerRef2.current)clearInterval(timerRef2.current);stopMic();};},[]);

  var DIFFS=[
    {v:"easy",l:"Easy",d:"\u2669 \u266A + ties",c:"#22D89E"},
    {v:"medium",l:"Medium",d:"+ rests, syncopation",c:"#F59E0B"},
    {v:"hard",l:"Hard",d:"+ sixteenths",c:"#EF4444"},
    {v:"expert",l:"Expert",d:"+ triplets, dotted 8ths",c:t.accent}
  ];

  // RESULTS SCREEN
  if(phase==="results"&&results){
    var msg=results.score>=90?"Incredible timing!":results.score>=70?"Solid rhythm!":results.score>=50?"Getting there!":"Keep practicing!";
    return React.createElement("div",{style:{padding:"24px 0",maxWidth:400,margin:"0 auto"}},
      // Score
      React.createElement("div",{style:{textAlign:"center",marginBottom:24,animation:"fadeIn 0.4s ease"}},
        React.createElement("div",{style:{fontSize:56,fontWeight:700,color:results.score>=70?t.accent:results.score>=50?"#F59E0B":"#EF4444",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}},results.score+"%"),
        React.createElement("div",{style:{fontSize:14,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:8}},msg)),
      // Stats grid
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}},
        [{n:results.perfect,l:"Perfect",c:"#22D89E"},{n:results.good,l:"Good",c:"#6366F1"},{n:results.ok+results.late,l:"Off",c:"#F59E0B"},{n:results.miss,l:"Miss",c:"#EF4444"},{n:results.extras,l:"Extra",c:"#9CA3AF"},{n:results.total,l:"Total",c:t.text}].map(function(s){
          return React.createElement("div",{key:s.l,style:{background:t.card,borderRadius:12,padding:"10px 8px",border:"1px solid "+t.border,textAlign:"center"}},
            React.createElement("div",{style:{width:6,height:6,borderRadius:3,background:s.c,margin:"0 auto 4px"}}),
            React.createElement("div",{style:{fontSize:20,fontWeight:700,color:s.c,fontFamily:"'JetBrains Mono',monospace"}},s.n),
            React.createElement("div",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:2}},s.l));
        })),
      // Per-note detail
      pattern&&React.createElement("div",{style:{background:t.card,borderRadius:14,padding:12,border:"1px solid "+t.border,marginBottom:20}},
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:10}},"NOTE BY NOTE"),
        React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap"}},
          results.details.map(function(d,i){
            var c=d.rating==="perfect"?"#22D89E":d.rating==="good"?"#6366F1":d.rating==="ok"||d.rating==="late"?"#F59E0B":"#EF4444";
            var sym=d.rating==="perfect"?"\u2713":d.rating==="good"?"\u2713":d.rating==="ok"||d.rating==="late"?"\u223C":"\u2716";
            return React.createElement("div",{key:i,style:{width:32,height:32,borderRadius:8,background:c+"18",border:"1.5px solid "+c+"50",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:c,fontWeight:700}},sym);
          }))),
      // Notation replay
      pattern&&React.createElement("div",{style:{background:t.noteBg,borderRadius:14,padding:12,border:"1px solid "+(isStudio?t.staffStroke+"30":t.borderSub),marginBottom:20}},
        React.createElement(Notation,{abc:pattern.abc,compact:false,th:t})),
      // Actions
      React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        React.createElement("button",{onClick:function(){setPhase("ready");setResults(null);},style:{width:"100%",padding:"14px",borderRadius:14,border:"none",background:t.accent,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px "+t.accentGlow}},"Same Rhythm"),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{onClick:function(){playPreview(pattern,true);},style:{padding:"12px 16px",borderRadius:14,border:"2px solid "+t.border,background:t.card,color:t.text,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"▶"),
          React.createElement("button",{onClick:function(){setPattern(null);generateReady();},style:{flex:1,padding:"12px",borderRadius:14,border:"2px solid "+t.accent+"40",background:isStudio?t.accent+"10":t.accent+"08",color:t.accent,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"New Rhythm"),
          React.createElement("button",{onClick:function(){setPhase("setup");setPattern(null);},style:{padding:"12px 20px",borderRadius:14,border:"2px solid "+t.border,background:t.card,color:t.text,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u2190"))));
  }

  // SETUP SCREEN
  if(phase==="setup"){
    return React.createElement("div",{style:{padding:"16px 0",maxWidth:400,margin:"0 auto"}},
      // Difficulty — always visible, primary choice
      React.createElement("div",{style:{marginBottom:16}},
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:8}},"DIFFICULTY"),
        React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:6}},
          DIFFS.map(function(d){
            var sel=difficulty===d.v;
            return React.createElement("button",{key:d.v,onClick:function(){setDifficulty(d.v);},style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,border:"1px solid "+(sel?t.accent:t.border),background:sel?(isStudio?t.accent+"15":t.accent+"08"):t.filterBg,cursor:"pointer",transition:"all 0.15s"}},
              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
                React.createElement("div",{style:{width:6,height:6,borderRadius:3,background:d.c,flexShrink:0}}),
                React.createElement("span",{style:{fontSize:13,fontWeight:sel?600:400,color:sel?t.text:t.muted,fontFamily:"'Inter',sans-serif"}},d.l)),
              React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif"}},d.d));
          }))),

      // Settings toggle — BPM + Bars
      React.createElement("button",{onClick:function(){setRgSettingsOpen(!rgSettingsOpen);},style:{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"10px 12px",borderRadius:10,border:"none",background:t.filterBg,color:t.muted,fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",marginBottom:rgSettingsOpen?12:16}},
        React.createElement("span",null,"\u2699\uFE0F Tempo "+rgBpm+" \u00B7 "+bars+" bar"+(bars>1?"s":"")),
        React.createElement("span",{style:{fontSize:10,color:t.subtle,transform:rgSettingsOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}},"\u25BC")),

      rgSettingsOpen&&React.createElement("div",{style:{marginBottom:16}},
        // BPM
        React.createElement("div",{style:{marginBottom:14}},
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
            React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"TEMPO"),
            React.createElement("span",{style:{fontSize:18,fontWeight:700,color:t.text,fontFamily:"'JetBrains Mono',monospace"}},rgBpm)),
          React.createElement("input",{type:"range",min:40,max:200,value:rgBpm,onChange:function(e){setRgBpm(parseInt(e.target.value));},style:{width:"100%",cursor:"pointer",height:4,accentColor:isStudio?t.accent:"#6366F1"}}),
          React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:6,marginTop:8}},
            [60,80,100,120,140].map(function(b){return React.createElement("button",{key:b,onClick:function(){setRgBpm(b);},style:{padding:"4px 10px",borderRadius:6,border:"1px solid "+(rgBpm===b?t.accent:t.border),background:rgBpm===b?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:rgBpm===b?t.accent:t.muted,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:rgBpm===b?700:400,cursor:"pointer"}},b);}))),
        // Bars
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:8}},"BARS"),
          React.createElement("div",{style:{display:"flex",gap:6}},
            [1,2,4].map(function(b){return React.createElement("button",{key:b,onClick:function(){setBars(b);},style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(bars===b?t.accent:t.border),background:bars===b?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:bars===b?t.accent:t.muted,fontSize:14,fontFamily:"'JetBrains Mono',monospace",fontWeight:bars===b?700:400,cursor:"pointer"}},b);}))),
      ),

      // Generate
      React.createElement("button",{onClick:generateReady,style:{width:"100%",padding:"16px",borderRadius:14,border:"none",background:t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 20px "+t.accentGlow,letterSpacing:0.5}},"\u25B6  Generate Rhythm"));
  }

  // READY SCREEN — pattern generated, choose what to do
  if(phase==="ready"||phase==="listening"){
    var isListening=phase==="listening";
    return React.createElement("div",{style:{padding:"24px 0",maxWidth:400,margin:"0 auto"}},
      // Notation
      pattern&&React.createElement("div",{style:{background:t.noteBg,borderRadius:14,padding:12,border:"1px solid "+(isStudio?t.staffStroke+"30":t.borderSub),marginBottom:20}},
        React.createElement(Notation,{abc:pattern.abc,compact:false,th:t}),
        isListening&&React.createElement("div",{style:{textAlign:"center",marginTop:8}},
          React.createElement("span",{style:{fontSize:10,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600}},"Playing..."))),
      // Action buttons
      React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        // Primary: Start
        React.createElement("button",{onClick:function(){if(!isListening)startGame(false);},style:{width:"100%",padding:"16px",borderRadius:14,border:"none",background:isListening?t.subtle:t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",boxShadow:isListening?"none":"0 4px 20px "+t.accentGlow,letterSpacing:0.5,opacity:isListening?0.5:1}},"\u25B6  Tap Solo"),
        // Secondary row
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{onClick:function(){if(!isListening)playPreview(pattern);},style:{flex:1,padding:"12px",borderRadius:10,border:"1px solid "+(isListening?t.accent:t.border),background:isListening?(isStudio?t.accent+"15":t.accent+"08"):t.filterBg,color:isListening?t.accent:t.text,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",opacity:isListening?0.7:1}},isListening?"...":"Listen"),
          React.createElement("button",{onClick:function(){if(!isListening)startGame(true);},style:{flex:1,padding:"12px",borderRadius:10,border:"1px solid "+(isListening?t.subtle:t.accent+"40"),background:isListening?t.filterBg:(isStudio?t.accent+"08":t.accent+"06"),color:isListening?t.subtle:t.accent,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",opacity:isListening?0.5:1}},"\u25B6 Guide")),
        // Tertiary row
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{onClick:function(){if(!isListening){setPhase("setup");setPattern(null);}},style:{flex:1,padding:"8px",borderRadius:8,border:"none",background:"transparent",color:t.subtle,fontSize:10,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",opacity:isListening?0.5:1}},"\u2190 Settings"),
          React.createElement("button",{onClick:function(){if(!isListening)generateReady();},style:{flex:1,padding:"8px",borderRadius:8,border:"none",background:"transparent",color:t.subtle,fontSize:10,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",opacity:isListening?0.5:1}},"New Pattern"))));
  }

  // COUNTDOWN + PLAYING SCREEN
  return React.createElement("div",{style:{padding:"24px 0",maxWidth:400,margin:"0 auto",userSelect:"none",WebkitUserSelect:"none"}},
    // Fixed-height header area — prevents layout shift between countdown/playing
    React.createElement("div",{style:{height:44,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}},
      phase==="countdown"&&React.createElement("div",{style:{textAlign:"center"}},
        React.createElement("span",{key:countdown,style:{fontSize:36,fontWeight:700,color:t.accent,fontFamily:"'JetBrains Mono',monospace"}},countdown),
        React.createElement("span",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",marginLeft:10}},"Get ready...")),
      phase==="playing"&&React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}},
        React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"\u2669="+rgBpm),
        playAlong&&React.createElement("span",{style:{fontSize:9,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600,background:isStudio?t.accentBg:t.accent+"12",padding:"2px 8px",borderRadius:4}},"Guide"),
        inputMode==="mic"&&React.createElement("span",{style:{fontSize:9,color:"#22D89E",fontFamily:"'Inter',sans-serif",fontWeight:600,background:"#22D89E18",padding:"2px 8px",borderRadius:4}},"Mic"),
        React.createElement("span",{style:{fontSize:11,color:t.accent,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}},taps.length+" taps"),
        React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Tap!"))),

    // Notation
    pattern&&React.createElement("div",{style:{background:t.noteBg,borderRadius:14,padding:12,border:"1px solid "+(isStudio?t.staffStroke+"30":t.borderSub),marginBottom:16}},
      React.createElement(Notation,{abc:pattern.abc,compact:false,th:t})),

    // TAP ZONE (tap mode) or MIC ZONE (mic mode)
    inputMode==="tap"&&React.createElement("button",{onPointerDown:handleTap,style:{width:"100%",padding:"60px",borderRadius:20,border:"3px dashed "+(phase==="playing"?t.accent+"80":phase==="countdown"?t.accent+"40":t.border),background:phase==="playing"?(isStudio?t.accent+"08":t.accent+"05"):t.filterBg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,touchAction:"manipulation",WebkitTapHighlightColor:"transparent",WebkitUserSelect:"none"}},
      phase==="playing"?IC.tabRhythm(40,t.accent,true):IC.tabEar(40,t.subtle,false),
      React.createElement("div",{style:{fontSize:14,fontWeight:600,color:phase==="playing"?t.text:t.subtle,fontFamily:"'Inter',sans-serif"}},phase==="playing"?"TAP HERE":phase==="countdown"?"Get ready to tap!":"Waiting..."),
      React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",visibility:phase==="playing"?"visible":"hidden"}},"Tap each note in time with the metronome")),
    inputMode==="mic"&&React.createElement("div",{style:{width:"100%",padding:"40px 20px",borderRadius:20,border:"3px dashed "+(phase==="playing"?t.accent+"80":t.accent+"40"),background:phase==="playing"?(isStudio?t.accent+"08":t.accent+"05"):t.filterBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}},
      IC.tabEar(40,"#22D89E",true),
      React.createElement("div",{style:{fontSize:14,fontWeight:600,color:phase==="playing"?t.text:t.subtle,fontFamily:"'Inter',sans-serif"}},phase==="playing"?"Clap the rhythm!":phase==="countdown"?"Get ready to clap!":"Listening..."),
      // Mic level bar
      React.createElement("div",{style:{width:"80%",height:8,background:t.progressBg||t.filterBg,borderRadius:4,overflow:"hidden"}},
        React.createElement("div",{style:{height:"100%",width:(micLevel*100)+"%",background:micLevel>0.6?"#EF4444":micLevel>0.3?t.accent:"#22D89E",borderRadius:4,transition:"width 0.05s ease"}})),
      React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif"}},phase==="playing"?taps.length+" claps detected":micActive?"Mic active":"Starting mic...")));
}



// ============================================================
// POLYRHYTHM TRAINER — circular visualization
// ============================================================
function PolyrhythmTrainer({th,sharedInput,sharedMicSilent}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var pInputMode=sharedInput||"tap";
  var pMicSilent=sharedMicSilent!==undefined?sharedMicSilent:true;
  var[polyA,setPolyA]=useState(3); // app plays
  var[polyB,setPolyB]=useState(4); // user taps
  var[bpm,setBpm]=useState(80); // tempo of pulse A
  var[playing,setPlaying]=useState(false);
  var[swapped,setSwapped]=useState(false); // swap which one user taps
  var[cycles,setCycles]=useState(4);
  var[polySettingsOpen,setPolySettingsOpen]=useState(false);
  var[angle,setAngle]=useState(0); // 0-1 progress through cycle
  var[taps,setTaps]=useState([]);
  var[phase,setPhase]=useState("setup"); // setup|countdown|playing|results
  var[countdown,setCountdown]=useState(4);
  var[results,setResults]=useState(null);
  var[activeA,setActiveA]=useState(-1); // which A dot is lit
  var[activeB,setActiveB]=useState(-1);
  var[lastTapFlash,setLastTapFlash]=useState(0);
  var[pMicActive,setPMicActive]=useState(false);
  var[pMicLevel,setPMicLevel]=useState(0);

  var actxRef=useRef(null);
  var playingRef=useRef(false);
  var tapsRef=useRef([]);
  var angleRef=useRef(0);
  var cycleStartRef=useRef(0);
  var cycleDurRef=useRef(0);
  var cycleCountRef=useRef(0);
  var totalCyclesRef=useRef(4);
  var polyARef=useRef(polyA);
  var polyBRef=useRef(polyB);
  var swappedRef=useRef(false);
  var animRef=useRef(null);
  var scheduledRef=useRef({a:new Set(),b:new Set()});
  var phaseRef=useRef("setup");
  var countdownTimerRef=useRef(null);
  var pMicStreamRef=useRef(null);
  var pAnalyserRef=useRef(null);
  var pMicTimerRef=useRef(null);
  var pLastTriggerRef=useRef(0);
  var pInputModeRef=useRef(pInputMode);
  var pMicSilentRef=useRef(pMicSilent);

  useEffect(function(){polyARef.current=polyA;},[polyA]);
  useEffect(function(){polyBRef.current=polyB;},[polyB]);
  useEffect(function(){swappedRef.current=swapped;},[swapped]);
  useEffect(function(){phaseRef.current=phase;},[phase]);
  useEffect(function(){pInputModeRef.current=pInputMode;},[pInputMode]);
  useEffect(function(){pMicSilentRef.current=pMicSilent;},[pMicSilent]);

  var userPulse=function(){return swapped?polyA:polyB;};
  var appPulse=function(){return swapped?polyB:polyA;};

  // Mic start
  var pStartMic=function(){
    if(!actxRef.current)actxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef.current;
    if(actx.state==="suspended")actx.resume();
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      pMicStreamRef.current=stream;
      var source=actx.createMediaStreamSource(stream);
      var analyser=actx.createAnalyser();
      analyser.fftSize=512;analyser.smoothingTimeConstant=0.1;
      source.connect(analyser);
      pAnalyserRef.current=analyser;
      setPMicActive(true);
      var buf=new Float32Array(analyser.fftSize);
      var threshold=0.12;var debounceMs=80;var prevRms=0;
      pMicTimerRef.current=setInterval(function(){
        if(!pAnalyserRef.current)return;
        pAnalyserRef.current.getFloatTimeDomainData(buf);
        var sum=0;for(var i=0;i<buf.length;i++)sum+=buf[i]*buf[i];
        var rms=Math.sqrt(sum/buf.length);
        setPMicLevel(Math.min(1,rms*5));
        var now=actx.currentTime;
        if(rms>threshold&&rms>prevRms*1.3&&(now-pLastTriggerRef.current)*1000>debounceMs){
          pLastTriggerRef.current=now;
          if(phaseRef.current==="playing"||phaseRef.current==="countdown"){
            var tapTime=actx.currentTime-cycleStartRef.current;
            var cycleDur=cycleDurRef.current;
            var cycNum=cycleCountRef.current;
            var absTap=cycNum*cycleDur+(tapTime%cycleDur);
            if(tapTime<0)absTap=cycNum*cycleDur+tapTime;
            tapsRef.current.push({abs:absTap,rel:tapTime,cycle:cycNum});
            setTaps(function(prev){return prev.concat([absTap]);});
            setLastTapFlash(Date.now());
          }
        }
        prevRms=rms;
      },8);
    }).catch(function(){console.warn("Mic unavailable");});
  };

  var pStopMic=function(){
    if(pMicTimerRef.current){clearInterval(pMicTimerRef.current);pMicTimerRef.current=null;}
    if(pMicStreamRef.current){pMicStreamRef.current.getTracks().forEach(function(tk){tk.stop();});pMicStreamRef.current=null;}
    pAnalyserRef.current=null;setPMicActive(false);setPMicLevel(0);
  };

  // Sound: distinct pitches for A and B
  var playSound=function(time,isA){
    var actx=actxRef.current;if(!actx)return;
    var osc=actx.createOscillator();var gain=actx.createGain();
    osc.connect(gain);gain.connect(actx.destination);
    if(isA){
      osc.type="triangle";osc.frequency.value=1000;
      gain.gain.setValueAtTime(0.35,time);
      gain.gain.exponentialRampToValueAtTime(0.001,time+0.06);
      osc.start(time);osc.stop(time+0.06);
    }else{
      osc.type="sine";osc.frequency.value=660;
      gain.gain.setValueAtTime(0.25,time);
      gain.gain.exponentialRampToValueAtTime(0.001,time+0.08);
      osc.start(time);osc.stop(time+0.08);
    }
  };

  // Animation + scheduling loop
  var animLoop=function(){
    var actx=actxRef.current;
    if(!actx||!playingRef.current){animRef.current=null;return;}

    var now=actx.currentTime;
    var cycleDur=cycleDurRef.current;
    var elapsed=now-cycleStartRef.current;
    var progress=elapsed/cycleDur;

    // Cycle completed
    if(progress>=1){
      cycleCountRef.current++;
      if(cycleCountRef.current>=totalCyclesRef.current){
        // Done
        playingRef.current=false;
        setPlaying(false);
        scorePolyResults();
        return;
      }
      cycleStartRef.current+=cycleDur;
      elapsed=now-cycleStartRef.current;
      progress=elapsed/cycleDur;
      scheduledRef.current={a:new Set(),b:new Set()};
    }

    // Update angle
    angleRef.current=progress;
    setAngle(progress);

    // Schedule app sounds (lookahead 100ms)
    var ap=appPulse();
    var muteAudio=pInputModeRef.current==="mic"&&pMicSilentRef.current;
    var lookAhead=0.1;
    for(var i=0;i<ap;i++){
      var beatTime=cycleStartRef.current+(i/ap)*cycleDur;
      if(beatTime>=now-0.01&&beatTime<now+lookAhead&&!scheduledRef.current.a.has(i)){
        scheduledRef.current.a.add(i);
        if(!muteAudio)playSound(Math.max(beatTime,now),true);
        // Visual
        (function(idx){
          var dt=(beatTime-now)*1000;
          setTimeout(function(){setActiveA(idx);setTimeout(function(){setActiveA(-1);},150);},Math.max(0,dt));
        })(i);
      }
    }

    // Visual for user pulse beats (to light up dots when playhead crosses)
    var up=userPulse();
    for(var j=0;j<up;j++){
      var uBeatTime=cycleStartRef.current+(j/up)*cycleDur;
      if(uBeatTime>=now-0.01&&uBeatTime<now+lookAhead&&!scheduledRef.current.b.has(j)){
        scheduledRef.current.b.add(j);
        (function(idx){
          var dt2=(uBeatTime-now)*1000;
          setTimeout(function(){setActiveB(idx);setTimeout(function(){setActiveB(-1);},150);},Math.max(0,dt2));
        })(j);
      }
    }

    animRef.current=requestAnimationFrame(animLoop);
  };

  // Start
  var startPlay=function(){
    if(!actxRef.current)actxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef.current;
    if(actx.state==="suspended")actx.resume();

    tapsRef.current=[];setTaps([]);
    setResults(null);setActiveA(-1);setActiveB(-1);
    totalCyclesRef.current=cycles;
    cycleCountRef.current=0;
    scheduledRef.current={a:new Set(),b:new Set()};

    // Cycle duration: app's pulse count at the given BPM
    var ap=appPulse();
    var cycleDur=(ap/bpm)*60;
    cycleDurRef.current=cycleDur;

    // Countdown: ap clicks at app pulse rate
    var secPerBeat=60.0/bpm;
    var countStart=actx.currentTime+0.1;
    var muteAudio=pInputModeRef.current==="mic"&&pMicSilentRef.current;
    for(var c=0;c<ap;c++){
      if(!muteAudio)playSound(countStart+c*secPerBeat,true);
    }
    setPhase("countdown");phaseRef.current="countdown";
    setCountdown(ap);
    if(pInputModeRef.current==="mic")pStartMic();
    var cIdx=0;
    countdownTimerRef.current=setInterval(function(){
      cIdx++;
      if(cIdx<ap){setCountdown(ap-cIdx);}
      else{
        clearInterval(countdownTimerRef.current);
        cycleStartRef.current=countStart+ap*secPerBeat;
        playingRef.current=true;
        setPlaying(true);
        setPhase("playing");phaseRef.current="playing";
        animRef.current=requestAnimationFrame(animLoop);
      }
    },secPerBeat*1000);
  };

  // Demo: play both pulses together so user hears the polyrhythm
  var playDemo=function(){
    if(!actxRef.current)actxRef.current=new(window.AudioContext||window.webkitAudioContext)();
    var actx=actxRef.current;
    if(actx.state==="suspended")actx.resume();

    setActiveA(-1);setActiveB(-1);
    var ap=appPulse();var up=userPulse();
    var cycleDur=(ap/bpm)*60;
    cycleDurRef.current=cycleDur;
    cycleCountRef.current=0;
    totalCyclesRef.current=2; // play 2 demo cycles
    scheduledRef.current={a:new Set(),b:new Set()};

    // Countdown: ap clicks
    var secPerBeat=60.0/bpm;
    var countStart=actx.currentTime+0.1;
    for(var c=0;c<ap;c++){
      playSound(countStart+c*secPerBeat,true);
    }

    // Schedule BOTH pulses for 2 cycles
    var patStart=countStart+ap*secPerBeat;
    for(var cy=0;cy<2;cy++){
      var cOff=patStart+cy*cycleDur;
      for(var a=0;a<ap;a++){playSound(cOff+(a/ap)*cycleDur,true);}
      for(var b=0;b<up;b++){
        // User pulse: different sound (lower pitch)
        (function(time){
          var osc=actx.createOscillator();var gain=actx.createGain();
          osc.connect(gain);gain.connect(actx.destination);
          osc.type="sine";osc.frequency.value=660;
          gain.gain.setValueAtTime(0.3,time);
          gain.gain.exponentialRampToValueAtTime(0.001,time+0.08);
          osc.start(time);osc.stop(time+0.08);
        })(cOff+(b/up)*cycleDur);
      }
    }

    // Animate the circle during demo — start with countdown
    cycleStartRef.current=patStart;
    setPhase("countdown");phaseRef.current="countdown";
    setCountdown(ap);

    var demoAnim=function(){
      var actx2=actxRef.current;
      if(!actx2||!playingRef.current){animRef.current=null;return;}
      var now=actx2.currentTime;
      var elapsed=now-cycleStartRef.current;
      var progress=elapsed/cycleDur;
      if(progress>=1){
        cycleCountRef.current++;
        if(cycleCountRef.current>=2){
          playingRef.current=false;setPlaying(false);
          setPhase("setup");phaseRef.current="setup";
          setAngle(0);setActiveA(-1);setActiveB(-1);
          return;
        }
        cycleStartRef.current+=cycleDur;
        elapsed=now-cycleStartRef.current;
        progress=elapsed/cycleDur;
        scheduledRef.current={a:new Set(),b:new Set()};
      }
      setAngle(progress);
      var lookAhead=0.1;
      for(var i=0;i<ap;i++){
        var bt=cycleStartRef.current+(i/ap)*cycleDur;
        if(bt>=now-0.01&&bt<now+lookAhead&&!scheduledRef.current.a.has(i)){
          scheduledRef.current.a.add(i);
          (function(idx){var dt=(bt-now)*1000;setTimeout(function(){setActiveA(idx);setTimeout(function(){setActiveA(-1);},150);},Math.max(0,dt));})(i);
        }
      }
      for(var j=0;j<up;j++){
        var bt2=cycleStartRef.current+(j/up)*cycleDur;
        if(bt2>=now-0.01&&bt2<now+lookAhead&&!scheduledRef.current.b.has(j)){
          scheduledRef.current.b.add(j);
          (function(idx){var dt=(bt2-now)*1000;setTimeout(function(){setActiveB(idx);setTimeout(function(){setActiveB(-1);},150);},Math.max(0,dt));})(j);
        }
      }
      animRef.current=requestAnimationFrame(demoAnim);
    };

    var dIdx=0;
    countdownTimerRef.current=setInterval(function(){
      dIdx++;
      if(dIdx<ap){setCountdown(ap-dIdx);}
      else{
        clearInterval(countdownTimerRef.current);
        setPhase("demo");phaseRef.current="demo";
        playingRef.current=true;setPlaying(true);
        animRef.current=requestAnimationFrame(demoAnim);
      }
    },secPerBeat*1000);
  };

  // Stop
  var stopPlay=function(){
    playingRef.current=false;
    setPlaying(false);
    if(animRef.current){cancelAnimationFrame(animRef.current);animRef.current=null;}
    if(countdownTimerRef.current){clearInterval(countdownTimerRef.current);}
    pStopMic();
    setPhase("setup");setAngle(0);setActiveA(-1);setActiveB(-1);
  };

  // Handle tap
  var handlePolyTap=function(e){
    if(e)e.preventDefault();
    var ph=phaseRef.current;
    if(ph!=="playing"&&ph!=="countdown")return;
    var actx=actxRef.current;if(!actx)return;
    var tapTime=actx.currentTime-cycleStartRef.current;
    // Relative to current cycle
    var cycleDur=cycleDurRef.current;
    var cycNum=cycleCountRef.current;
    var absTap=cycNum*cycleDur+(tapTime%cycleDur);
    if(tapTime<0)absTap=cycNum*cycleDur+tapTime; // early tap
    tapsRef.current.push({abs:absTap,rel:tapTime,cycle:cycNum});
    setTaps(function(prev){return prev.concat([absTap]);});
    setLastTapFlash(Date.now());
    // Feedback sound
    var osc=actx.createOscillator();var gain=actx.createGain();
    osc.connect(gain);gain.connect(actx.destination);
    osc.type="sine";osc.frequency.value=550;
    gain.gain.setValueAtTime(0.12,actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.04);
    osc.start(actx.currentTime);osc.stop(actx.currentTime+0.04);
  };

  // Score
  var scorePolyResults=function(){
    var up=userPulse();
    var cycleDur=cycleDurRef.current;
    var allExpected=[];
    for(var c=0;c<cycles;c++){
      for(var b=0;b<up;b++){
        allExpected.push(c*cycleDur+(b/up)*cycleDur);
      }
    }
    var ts=tapsRef.current;
    var used=new Array(ts.length).fill(false);
    var details=[];
    for(var i=0;i<allExpected.length;i++){
      var exp=allExpected[i];
      var bestDiff=Infinity;var bestJ=-1;
      for(var j=0;j<ts.length;j++){
        if(used[j])continue;
        var diff=Math.abs(ts[j].abs-exp);
        if(diff<bestDiff){bestDiff=diff;bestJ=j;}
      }
      var rating="miss";var diffMs=bestDiff*1000;
      if(bestJ>=0&&diffMs<=180){
        used[bestJ]=true;
        if(diffMs<=40)rating="perfect";
        else if(diffMs<=80)rating="good";
        else if(diffMs<=130)rating="ok";
        else rating="late";
      }
      details.push({rating:rating,diffMs:Math.round(diffMs)});
    }
    var perfect=details.filter(function(d){return d.rating==="perfect";}).length;
    var good=details.filter(function(d){return d.rating==="good";}).length;
    var ok=details.filter(function(d){return d.rating==="ok";}).length;
    var miss=details.filter(function(d){return d.rating==="miss";}).length;
    var total=details.length;
    var extras=used.filter(function(u){return !u;}).length;
    var score=total>0?Math.round(((perfect*3+good*2+ok*1)/(total*3))*100):0;
    setResults({details:details,perfect:perfect,good:good,ok:ok,miss:miss,extras:extras,score:score,total:total});
    pStopMic();
    setPhase("results");
  };

  // Cleanup
  useEffect(function(){return function(){
    if(animRef.current)cancelAnimationFrame(animRef.current);
    if(countdownTimerRef.current)clearInterval(countdownTimerRef.current);
    pStopMic();
  };},[]);

  // SVG circle helpers
  var CX=160,CY=160,RA=130,RB=95;
  var dotPos=function(idx,total,radius){
    var ang=(idx/total)*Math.PI*2-Math.PI/2;
    return {x:CX+Math.cos(ang)*radius,y:CY+Math.sin(ang)*radius};
  };
  var playheadEnd=function(progress){
    var ang=progress*Math.PI*2-Math.PI/2;
    return {x:CX+Math.cos(ang)*140,y:CY+Math.sin(ang)*140};
  };

  var PRESETS=[[2,3],[3,2],[3,4],[4,3],[5,4],[5,3],[7,4]];

  // RESULTS
  if(phase==="results"&&results){
    
    return React.createElement("div",{style:{padding:"24px 0",maxWidth:400,margin:"0 auto"}},
      React.createElement("div",{style:{textAlign:"center",marginBottom:20}},
        React.createElement("div",{style:{fontSize:48,fontWeight:700,color:results.score>=70?t.accent:results.score>=50?"#F59E0B":"#EF4444",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}},results.score+"%"),
        React.createElement("div",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:8}},polyA+":"+polyB+" — You tapped the "+userPulse())),
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}},
        [{n:results.perfect,l:"Perfect",c:"#22D89E"},{n:results.good,l:"Good",c:"#6366F1"},{n:results.ok,l:"Off",c:"#F59E0B"},{n:results.miss,l:"Miss",c:"#EF4444"},{n:results.extras,l:"Extra",c:"#9CA3AF"},{n:results.total,l:"Total",c:t.text}].map(function(s){
          return React.createElement("div",{key:s.l,style:{background:t.card,borderRadius:12,padding:"10px 8px",border:"1px solid "+t.border,textAlign:"center"}},
            React.createElement("div",{style:{fontSize:20,fontWeight:700,color:s.c,fontFamily:"'JetBrains Mono',monospace"}},s.n),
            React.createElement("div",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:2}},s.l));
        })),
      React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
        React.createElement("button",{onClick:startPlay,style:{width:"100%",padding:"14px",borderRadius:14,border:"none",background:t.accent,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px "+t.accentGlow}},"Try Again"),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{onClick:playDemo,style:{padding:"10px 16px",borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Demo"),
          React.createElement("button",{onClick:function(){setSwapped(!swapped);},style:{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.muted,fontSize:11,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u21C4 Swap Roles"),
          React.createElement("button",{onClick:function(){setPhase("setup");setAngle(0);},style:{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.muted,fontSize:11,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u2190 Settings"))));
  }

  // SETUP
  if(phase==="setup"){
    return React.createElement("div",{style:{padding:"16px 0",maxWidth:400,margin:"0 auto"}},

      // Presets — primary choice
      React.createElement("div",{style:{marginBottom:12}},
        React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}},
          PRESETS.map(function(p){
            var sel=polyA===p[0]&&polyB===p[1];
            return React.createElement("button",{key:p[0]+":"+p[1],onClick:function(){setPolyA(p[0]);setPolyB(p[1]);},style:{padding:"10px 16px",borderRadius:10,border:"1px solid "+(sel?t.accent:t.border),background:sel?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:sel?t.accent:t.muted,fontSize:16,fontFamily:"'JetBrains Mono',monospace",fontWeight:sel?700:500,cursor:"pointer",minWidth:58,transition:"all 0.15s"}},p[0]+":"+p[1]);
          })),
        // Role info — compact inline
        React.createElement("div",{style:{marginTop:10,padding:"8px 14px",background:t.filterBg,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
            React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600}},"APP"),
            React.createElement("span",{style:{fontSize:16,fontWeight:700,color:t.accent,fontFamily:"'JetBrains Mono',monospace"}},appPulse())),
          React.createElement("button",{onClick:function(){setSwapped(!swapped);},style:{padding:"4px 12px",borderRadius:6,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:10,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u21C4"),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
            React.createElement("span",{style:{fontSize:16,fontWeight:700,color:"#F59E0B",fontFamily:"'JetBrains Mono',monospace"}},userPulse()),
            React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600}},"YOU")))),

      // Circle preview — smaller
      React.createElement("div",{style:{display:"flex",justifyContent:"center",marginBottom:12}},
        React.createElement("svg",{width:200,height:200,viewBox:"0 0 320 320",style:{maxWidth:"100%",opacity:0.5}},
          React.createElement("circle",{cx:CX,cy:CY,r:RA,fill:"none",stroke:isStudio?t.border+"40":t.border,strokeWidth:1.5}),
          React.createElement("circle",{cx:CX,cy:CY,r:RB,fill:"none",stroke:isStudio?t.border+"30":t.borderSub,strokeWidth:1,strokeDasharray:"4 4"}),
          Array.from({length:appPulse()}).map(function(x,i){
            var pos=dotPos(i,appPulse(),RA);
            return React.createElement("circle",{key:"a"+i,cx:pos.x,cy:pos.y,r:7,fill:isStudio?t.accent+"50":t.accent+"30",stroke:t.accent,strokeWidth:1.5});
          }),
          Array.from({length:userPulse()}).map(function(x,j){
            var pos=dotPos(j,userPulse(),RB);
            return React.createElement("circle",{key:"b"+j,cx:pos.x,cy:pos.y,r:7,fill:isStudio?"#F59E0B50":"#F59E0B30",stroke:"#F59E0B",strokeWidth:1.5});
          }),
          React.createElement("circle",{cx:CX,cy:CY,r:4,fill:t.subtle+"60"}))),

      // Settings toggle — Tempo + Cycles
      React.createElement("button",{onClick:function(){setPolySettingsOpen(!polySettingsOpen);},style:{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"10px 12px",borderRadius:10,border:"none",background:t.filterBg,color:t.muted,fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",marginBottom:polySettingsOpen?12:16}},
        React.createElement("span",null,"\u2699\uFE0F "+bpm+" BPM \u00B7 "+cycles+" cycles"),
        React.createElement("span",{style:{fontSize:10,color:t.subtle,transform:polySettingsOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}},"\u25BC")),

      polySettingsOpen&&React.createElement("div",{style:{marginBottom:16}},
        React.createElement("div",{style:{marginBottom:14}},
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
            React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"TEMPO"),
            React.createElement("span",{style:{fontSize:18,fontWeight:700,color:t.text,fontFamily:"'JetBrains Mono',monospace"}},bpm)),
          React.createElement("input",{type:"range",min:40,max:180,value:bpm,onChange:function(e){setBpm(parseInt(e.target.value));},style:{width:"100%",cursor:"pointer",height:4,accentColor:isStudio?t.accent:"#6366F1"}})),
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:8}},"CYCLES"),
          React.createElement("div",{style:{display:"flex",gap:6}},
            [2,4,8,16].map(function(c){return React.createElement("button",{key:c,onClick:function(){setCycles(c);},style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(cycles===c?t.accent:t.border),background:cycles===c?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:cycles===c?t.accent:t.muted,fontSize:14,fontFamily:"'JetBrains Mono',monospace",fontWeight:cycles===c?700:400,cursor:"pointer"}},c);})))),

      // Demo + Start
      React.createElement("div",{style:{display:"flex",gap:10}},
        React.createElement("button",{onClick:playDemo,style:{padding:"16px 20px",borderRadius:14,border:"2px solid "+t.border,background:t.card,color:t.text,fontSize:14,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Demo"),
        React.createElement("button",{onClick:startPlay,style:{flex:1,padding:"16px",borderRadius:14,border:"none",background:t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 20px "+t.accentGlow,letterSpacing:0.5}},"\u25B6  Start")));
  }

  // COUNTDOWN + PLAYING + DEMO
  var ph=playheadEnd(angle);
  var tapFlashAgo=Date.now()-lastTapFlash;
  var tapGlow=tapFlashAgo<120;
  var isDemo=phase==="demo";
  return React.createElement("div",{style:{padding:"12px 0",maxWidth:400,margin:"0 auto",userSelect:"none",WebkitUserSelect:"none"}},
    // Header
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"0 4px"}},
      React.createElement("div",{style:{fontSize:22,fontWeight:700,color:t.text,fontFamily:"'JetBrains Mono',monospace"}},polyA+":"+polyB),
      phase==="countdown"&&React.createElement("span",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Get ready..."),
      phase==="playing"&&React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Cycle "+(cycleCountRef.current+1)+"/"+cycles),
      isDemo&&React.createElement("span",{style:{fontSize:11,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600,background:isStudio?t.accentBg:t.accent+"12",padding:"3px 10px",borderRadius:6}},"Demo"),
      !isDemo&&React.createElement("div",{style:{textAlign:"right",display:"flex",alignItems:"center",gap:6}},
        pInputMode==="mic"&&React.createElement("span",{style:{fontSize:9,color:"#22D89E",fontFamily:"'Inter',sans-serif",fontWeight:600,background:"#22D89E18",padding:"2px 8px",borderRadius:4}},"Mic"),
        React.createElement("span",{style:{fontSize:11,color:t.accent,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}},taps.length+" taps"))),

    // SVG Circle Visualization
    React.createElement("div",{style:{display:"flex",justifyContent:"center",marginBottom:12}},
      React.createElement("svg",{width:320,height:320,viewBox:"0 0 320 320",style:{maxWidth:"100%"}},
        // Track circles
        React.createElement("circle",{cx:CX,cy:CY,r:RA,fill:"none",stroke:isStudio?t.border+"40":t.border,strokeWidth:1.5}),
        React.createElement("circle",{cx:CX,cy:CY,r:RB,fill:"none",stroke:isStudio?t.border+"30":t.borderSub,strokeWidth:1,strokeDasharray:"4 4"}),
        // Playhead line
        (phase==="playing"||isDemo)&&React.createElement("line",{x1:CX,y1:CY,x2:ph.x,y2:ph.y,stroke:isDemo?"#F59E0B":t.accent,strokeWidth:2,strokeLinecap:"round",opacity:0.6}),
        // Pulse A dots (outer — app plays)
        Array.from({length:appPulse()}).map(function(x,i){
          var pos=dotPos(i,appPulse(),RA);
          var active=activeA===i;
          return React.createElement("circle",{key:"a"+i,cx:pos.x,cy:pos.y,r:active?10:7,fill:active?t.accent:(isStudio?t.accent+"50":t.accent+"30"),stroke:t.accent,strokeWidth:active?2.5:1.5,style:{transition:"r 0.08s ease"}});
        }),
        // Pulse B dots (inner — user taps)
        Array.from({length:userPulse()}).map(function(x,j){
          var pos=dotPos(j,userPulse(),RB);
          var active=activeB===j;
          return React.createElement("circle",{key:"b"+j,cx:pos.x,cy:pos.y,r:active?10:7,fill:active?"#F59E0B":(isStudio?"#F59E0B50":"#F59E0B30"),stroke:"#F59E0B",strokeWidth:active?2.5:1.5,style:{transition:"r 0.08s ease"}});
        }),
        // Center dot or countdown number
        phase!=="countdown"&&React.createElement("circle",{cx:CX,cy:CY,r:4,fill:t.subtle+"60"}),
        phase==="countdown"&&React.createElement("text",{x:CX,y:CY+18,textAnchor:"middle",fill:t.accent,fontSize:56,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"},countdown),
        // Legend
        React.createElement("circle",{cx:22,cy:300,r:5,fill:t.accent}),
        React.createElement("text",{x:32,y:304,fill:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif"},"App: "+appPulse()),
        React.createElement("circle",{cx:142,cy:300,r:5,fill:"#F59E0B"}),
        React.createElement("text",{x:152,y:304,fill:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif"},"You: "+userPulse()))),

    // Demo: explanation text
    isDemo&&React.createElement("div",{style:{textAlign:"center",marginBottom:12,padding:"0 16px"}},
      React.createElement("div",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5}},"Listen to both pulses together \u2014 outer ring (high) = "+appPulse()+", inner ring (low) = "+userPulse())),

    // TAP ZONE (tap mode, not during demo)
    !isDemo&&pInputMode==="tap"&&React.createElement("button",{onPointerDown:handlePolyTap,style:{width:"100%",padding:"36px 20px",borderRadius:20,border:"3px dashed "+(phase==="playing"?(tapGlow?"#F59E0B":t.accent+"60"):t.accent+"30"),background:tapGlow?"#F59E0B08":(phase==="playing"?(isStudio?t.accent+"06":t.accent+"04"):t.filterBg),cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,touchAction:"manipulation",WebkitTapHighlightColor:"transparent",WebkitUserSelect:"none",transition:"border-color 0.1s, background 0.1s"}},
      phase==="playing"?IC.tabRhythm(28,t.accent,true):IC.tabEar(28,t.subtle,false),
      React.createElement("span",{style:{fontSize:14,fontWeight:600,color:phase==="playing"?t.text:t.subtle,fontFamily:"'Inter',sans-serif"}},phase==="playing"?"TAP the "+userPulse():phase==="countdown"?"Get ready...":"Waiting...")),
    // MIC ZONE (mic mode, not during demo)
    !isDemo&&pInputMode==="mic"&&React.createElement("div",{style:{width:"100%",padding:"28px 20px",borderRadius:20,border:"3px dashed "+(phase==="playing"?(tapGlow?"#F59E0B":t.accent+"60"):t.accent+"30"),background:tapGlow?"#F59E0B08":(phase==="playing"?(isStudio?t.accent+"06":t.accent+"04"):t.filterBg),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}},
      IC.tabEar(28,"#22D89E",true),
      React.createElement("div",{style:{fontSize:14,fontWeight:600,color:phase==="playing"?t.text:t.subtle,fontFamily:"'Inter',sans-serif"}},phase==="playing"?"Clap the "+userPulse()+"!":phase==="countdown"?"Get ready to clap!":"Listening..."),
      React.createElement("div",{style:{width:"70%",height:8,background:t.progressBg||t.filterBg,borderRadius:4,overflow:"hidden"}},
        React.createElement("div",{style:{height:"100%",width:(pMicLevel*100)+"%",background:pMicLevel>0.6?"#EF4444":pMicLevel>0.3?"#F59E0B":"#22D89E",borderRadius:4,transition:"width 0.05s ease"}})),
      React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif"}},phase==="playing"?taps.length+" claps":pMicActive?"Mic active":"Starting mic...")),
    // Stop button
    (phase==="playing"||isDemo)&&React.createElement("button",{onClick:stopPlay,style:{width:"100%",marginTop:10,padding:"10px",borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.muted,fontSize:11,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},isDemo?"\u25A0 Stop Demo":"\u25A0 Stop"));
}


// ============================================================
// EDITOR — themed
// ============================================================
function Editor({onClose,onSubmit,onSubmitPrivate,th}){const t=th||TH.classic;const isStudio=t===TH.studio;
  const[title,sT]=useState("");const[artist,sA]=useState("");const[inst,sI]=useState("Alto Sax");const[cat,sC]=useState("ii-V-I");const[keySig,sK]=useState("C");const[timeSig,sTS]=useState("4/4");const[tempo,sTm]=useState("120");const[abc,sAbc]=useState("X:1\nT:My Lick\nM:4/4\nL:1/8\nQ:1/4=120\nK:C\n");const[mode,setMode]=useState("visual");const[yu,sYu]=useState("");const[tm,sTmn]=useState("");const[ts,sTs]=useState("");const[sp,sSp]=useState("");const[desc,sD]=useState("");const[tags,sTg]=useState("");const[extrasOpen,setExtrasOpen]=useState(false);
  // Pre-init audio on editor open for instant feedback
  useEffect(function(){try{Tone.start();}catch(e){}preloadPiano();preloadChordPiano();_ensurePreviewSynth();},[]);
  const KEYS=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];const TS=["4/4","3/4","6/8","5/4","7/8"];const yt=parseYT(yu);const tSec=(parseInt(tm)||0)*60+(parseInt(ts)||0);
  const lb={fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:4};
  const ip={width:"100%",background:t.inputBg,border:"1px solid "+t.inputBorder,borderRadius:10,padding:"10px 14px",color:t.text,fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"};
  const hasNotes=abc.split("\n").length>6||abc.includes("|");
  const canPublish=title&&hasNotes;
  const step1Done=!!title;const step2Done=hasNotes;
  const extrasCount=(yu&&yt.videoId?1:0)+(sp&&parseSpotify(sp)?1:0)+(desc?1:0)+(tags?1:0);

  // Section wrapper
  const sec=(num,label,done,children)=>React.createElement("div",{style:{background:t.card,borderRadius:14,padding:"16px 16px 14px",border:"1px solid "+(done?t.accentBorder:t.border),marginBottom:16,transition:"border-color 0.3s"}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:14}},
      React.createElement("div",{style:{width:22,height:22,borderRadius:7,background:done?(isStudio?t.accentBg:t.accent+"15"):t.filterBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?11:10,fontWeight:700,color:done?t.accent:t.subtle,fontFamily:"'JetBrains Mono',monospace",border:"1px solid "+(done?t.accentBorder:t.border),transition:"all 0.3s"}},done?"\u2713":num),
      React.createElement("span",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},label)),
    children);

  return React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,background:t.bg,display:"flex",flexDirection:"column"}},
    // Scrollable content
    React.createElement("div",{style:{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"0 16px"}},
        // Header
        React.createElement("div",{style:{position:"sticky",top:0,zIndex:10,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",padding:"14px 0 12px",paddingTop:"calc(env(safe-area-inset-top, 0px) + 14px)",borderBottom:"1px solid "+t.border,marginBottom:18}},
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            React.createElement("div",null,
              React.createElement("h2",{style:{color:t.text,fontSize:20,margin:0,fontFamily:t.titleFont,fontWeight:isStudio?700:600}},"Share a Lick"),
              React.createElement("p",{style:{margin:"3px 0 0",fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Add notation, preview it, publish.")),
            React.createElement("button",{onClick:onClose,style:{background:t.filterBg,border:"1px solid "+t.border,color:t.muted,width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u00D7"))),

        // STEP 1 — Identity
        sec("1","Name it",step1Done,
          React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
            React.createElement("div",null,
              React.createElement("label",{style:lb},"TITLE *"),
              React.createElement("input",{style:{...ip,fontSize:16,fontWeight:600,padding:"12px 14px"},value:title,onChange:e=>sT(e.target.value),placeholder:'e.g. "Bird\'s ii-V-I in C"',autoFocus:true})),
            React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}},
              React.createElement("div",null,
                React.createElement("label",{style:lb},"ARTIST"),
                React.createElement("input",{style:ip,value:artist,onChange:e=>sA(e.target.value),placeholder:"Charlie Parker"})),
              React.createElement("div",null,
                React.createElement("label",{style:lb},"INSTRUMENT"),
                React.createElement("select",{style:{...ip,appearance:"none",cursor:"pointer"},value:inst,onChange:e=>sI(e.target.value)},INST_LIST.filter(i=>i!=="All").map(i=>React.createElement("option",{key:i,value:i,style:{background:t.card}},i))))),
            React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}},
              React.createElement("div",null,
                React.createElement("label",{style:lb},"CATEGORY"),
                React.createElement("select",{style:{...ip,appearance:"none",cursor:"pointer",fontSize:12,padding:"10px 8px"},value:cat,onChange:e=>sC(e.target.value)},CAT_LIST.filter(c=>c!=="All").map(c=>React.createElement("option",{key:c,value:c,style:{background:t.card}},c)))),
              React.createElement("div",null,
                React.createElement("label",{style:lb},"KEY"),
                React.createElement("select",{style:{...ip,appearance:"none",cursor:"pointer",fontSize:12,padding:"10px 8px"},value:keySig,onChange:e=>sK(e.target.value)},KEYS.map(k=>React.createElement("option",{key:k,value:k,style:{background:t.card}},k)))),
              React.createElement("div",null,
                React.createElement("label",{style:lb},"TIME"),
                React.createElement("select",{style:{...ip,appearance:"none",cursor:"pointer",fontSize:12,padding:"10px 8px"},value:timeSig,onChange:e=>sTS(e.target.value)},TS.map(ts2=>React.createElement("option",{key:ts2,value:ts2,style:{background:t.card}},ts2)))),
              React.createElement("div",null,
                React.createElement("label",{style:lb},"BPM"),
                React.createElement("input",{style:{...ip,fontSize:12,padding:"10px 8px"},type:"number",value:tempo,onChange:e=>sTm(e.target.value)}))))),

        // STEP 2 — Notation
        sec("2","Write the notes",step2Done,
          React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
            React.createElement("div",{style:{display:"flex",gap:0,background:t.filterBg,borderRadius:10,padding:3}},
              React.createElement("button",{onClick:()=>setMode("visual"),style:{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:500,background:mode==="visual"?t.card:"transparent",color:mode==="visual"?t.text:t.subtle,boxShadow:mode==="visual"?"0 1px 3px rgba(0,0,0,0.06)":"none"}},"Note Builder"),
              React.createElement("button",{onClick:()=>setMode("abc"),style:{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:500,background:mode==="abc"?t.card:"transparent",color:mode==="abc"?t.text:t.subtle,boxShadow:mode==="abc"?"0 1px 3px rgba(0,0,0,0.06)":"none"}},"ABC Code")),
            // Input — NoteBuilder or ABC code
            mode==="visual"?React.createElement("div",{style:{borderRadius:12,padding:14,border:"1px solid "+t.border}},
              React.createElement(NoteBuilder,{onAbcChange:sAbc,keySig,timeSig,tempo:parseInt(tempo)||120,
                previewEl:hasNotes?React.createElement("div",{style:{background:t.noteBg,borderRadius:10,padding:10,border:"1px solid "+t.borderSub}},
                  React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}},
                    React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,fontWeight:600}},"PREVIEW"),
                    React.createElement("span",{style:{fontSize:9,color:t.accent,fontFamily:"monospace"}},"\u2713")),
                  React.createElement(Notation,{abc,compact:false,th:t})):null,
                playerEl:React.createElement(Player,{abc,tempo:parseInt(tempo)||120,th:t})}))
            :React.createElement("div",null,
              React.createElement("textarea",{style:{...ip,height:120,resize:"vertical",lineHeight:1.6,fontFamily:"'JetBrains Mono',monospace",fontSize:13},value:abc,onChange:e=>sAbc(e.target.value),spellCheck:false}),
              hasNotes&&React.createElement("div",{style:{marginTop:8}},React.createElement(Notation,{abc,compact:false,th:t})),
              React.createElement(Player,{abc,tempo:parseInt(tempo)||120,th:t})))),

        // STEP 3 — Extras (collapsible)
        React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,marginBottom:16,overflow:"hidden"}},
          React.createElement("button",{onClick:()=>setExtrasOpen(!extrasOpen),style:{width:"100%",background:"none",border:"none",padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
              React.createElement("div",{style:{width:22,height:22,borderRadius:7,background:extrasCount>0?(isStudio?t.accentBg:t.accent+"15"):t.filterBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:extrasCount>0?t.accent:t.subtle,fontFamily:"'JetBrains Mono',monospace",border:"1px solid "+(extrasCount>0?t.accentBorder:t.border)}},extrasCount>0?extrasCount:"3"),
              React.createElement("span",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"Extras"),
              React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:400}},"optional")),
            React.createElement("span",{style:{fontSize:14,color:t.subtle,transition:"transform 0.2s",transform:extrasOpen?"rotate(180deg)":"rotate(0)"}},"\u25BE")),
          extrasOpen&&React.createElement("div",{style:{padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:14,animation:"fadeIn 0.2s ease"}},
            // Reference Audio
            React.createElement("div",null,
              React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"YOUTUBE URL"),
              React.createElement("input",{style:{...ip,fontSize:13},value:yu,onChange:e=>sYu(e.target.value),placeholder:"https://youtube.com/watch?v=..."}),
              yu&&yt.videoId&&React.createElement("div",{style:{marginTop:6,display:"flex",alignItems:"center",gap:4}},
                React.createElement("span",{style:{fontSize:9,color:t.accent,fontFamily:"monospace"}},"\u2713 "+yt.videoId),
                React.createElement("span",{style:{fontSize:9,color:t.subtle,fontFamily:"monospace"}},yt.startTime>0?" @ "+fT(yt.startTime):"")),
              yu&&!yt.videoId&&React.createElement("span",{style:{fontSize:9,color:"#EF4444",fontFamily:"monospace",display:"block",marginTop:4}},"Invalid YouTube URL")),
            yu&&yt.videoId&&React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
              React.createElement("div",null,
                React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"START MIN"),
                React.createElement("input",{style:{...ip,fontSize:13},type:"number",min:0,value:tm,onChange:e=>sTmn(e.target.value),placeholder:"0"})),
              React.createElement("div",null,
                React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"START SEC"),
                React.createElement("input",{style:{...ip,fontSize:13},type:"number",min:0,max:59,value:ts,onChange:e=>sTs(e.target.value),placeholder:"0"}))),
            React.createElement("div",null,
              React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"SPOTIFY TRACK URL"),
              React.createElement("input",{style:{...ip,fontSize:13},value:sp,onChange:e=>sSp(e.target.value),placeholder:"https://open.spotify.com/track/..."}),
              sp&&parseSpotify(sp)&&React.createElement("span",{style:{fontSize:9,color:"#1DB954",fontFamily:"monospace",display:"block",marginTop:4}},"\u2713 Track found"),
              sp&&!parseSpotify(sp)&&React.createElement("span",{style:{fontSize:9,color:"#EF4444",fontFamily:"monospace",display:"block",marginTop:4}},"Paste a Spotify track URL")),
            React.createElement("div",null,
              React.createElement("label",{style:lb},"DESCRIPTION"),
              React.createElement("textarea",{style:{...ip,height:70,resize:"vertical",fontSize:13},value:desc,onChange:e=>sD(e.target.value),placeholder:"What makes this lick special?"})),
            React.createElement("div",null,
              React.createElement("label",{style:lb},"TAGS"),
              React.createElement("input",{style:{...ip,fontSize:13},value:tags,onChange:e=>sTg(e.target.value),placeholder:"bebop, essential, blues"})))),

        // Spacer for sticky button
        React.createElement("div",{style:{height:80}}))),

    // Sticky publish bar
    React.createElement("div",{style:{position:"sticky",bottom:0,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid "+t.border,padding:"12px 16px",paddingBottom:"max(12px, env(safe-area-inset-bottom))"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",display:"flex",alignItems:"center",gap:8}},
        !canPublish&&React.createElement("div",{style:{flex:1,display:"flex",gap:6,alignItems:"center"}},
          !step1Done&&React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",background:t.filterBg,padding:"3px 8px",borderRadius:6}},"\u2460 needs a title"),
          step1Done&&!step2Done&&React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",background:t.filterBg,padding:"3px 8px",borderRadius:6}},"\u2461 add some notes")),
        canPublish&&React.createElement("div",{style:{flex:1}}),
        React.createElement("button",{onClick:()=>{if(!canPublish)return;var d={title,artist,instrument:inst,category:cat,key:keySig,tempo:parseInt(tempo),abc,youtubeId:yt.videoId,youtubeStart:tSec,spotifyId:parseSpotify(sp),description:desc,tags:tags.split(",").map(tg2=>tg2.trim()).filter(Boolean)};onSubmitPrivate(d);},disabled:!canPublish,style:{padding:"12px 20px",background:canPublish?t.card:t.border,color:canPublish?t.text:t.subtle,border:canPublish?"1.5px solid "+t.accent:"none",borderRadius:12,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:canPublish?"pointer":"default",transition:"all 0.2s"}},"\uD83D\uDD12 Private"),
        React.createElement("button",{onClick:()=>{if(!canPublish)return;var d={title,artist,instrument:inst,category:cat,key:keySig,tempo:parseInt(tempo),abc,youtubeId:yt.videoId,youtubeStart:tSec,spotifyId:parseSpotify(sp),description:desc,tags:tags.split(",").map(tg2=>tg2.trim()).filter(Boolean)};onSubmit(d);},disabled:!canPublish,style:{padding:"12px 24px",background:canPublish?(isStudio?t.playBg:t.accent):t.border,color:canPublish?"#fff":t.subtle,border:"none",borderRadius:12,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:canPublish?"pointer":"default",boxShadow:canPublish?"0 4px 16px "+t.accentGlow:"none",transition:"all 0.2s"}},"Publish"))));}


// ============================================================
// PRACTICE PLAN — builder + runner
// ============================================================
var EXERCISE_TYPES=[
  {type:"lick",label:"Lick",desc:"Practice a specific lick"},
  {type:"allkeys",label:"All Keys",desc:"Practice a lick through all 12 keys"},
  {type:"ear",label:"Ear Training",desc:"Interval & melody recognition"},
  {type:"rhythm",label:"Rhythm Reading",desc:"Sight-read rhythms"},
  {type:"metronome",label:"Metronome",desc:"Free practice with click"},
  {type:"free",label:"Free Practice",desc:"Custom exercise, just timer"},
];
var DEFAULT_PLAN={id:1,name:"Morning Warmup",items:[
  {id:1,type:"metronome",title:"Long Tones",minutes:5,bpm:60},
  {id:2,type:"lick",title:"Lick",minutes:5,lickId:null},
  {id:3,type:"ear",title:"Ear Training",minutes:5},
  {id:4,type:"rhythm",title:"Rhythm Reading",minutes:3},
  {id:5,type:"free",title:"Scales",minutes:5},
]};

function PracticePlan({th,licks,savedSet,onStartSession,historyKey:externalHistoryKey}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var[plans,setPlans]=useState([DEFAULT_PLAN]);
  var[activePlanId,setActivePlanId]=useState(1);
  var[addOpen,setAddOpen]=useState(false);
  var[pickingLickFor,setPickingLickFor]=useState(null);
  var[expandedId,setExpandedId]=useState(null);
  var[dragIdx,setDragIdx]=useState(null);
  var[dragOverIdx,setDragOverIdx]=useState(null);
  var[historyKey,setHistoryKey]=useState(0);
  var effectiveHistoryKey=(externalHistoryKey||0)+historyKey;
  var ghostRef=useRef(null);
  var nextId=useRef(100);
  var getStg=function(){try{return window.storage||null;}catch(e){return null;}};

  useEffect(function(){
    var s=getStg();if(!s)return;
    s.get("etudy:plans").then(function(r){
      if(r&&r.value){try{var p=JSON.parse(r.value);if(p.length)setPlans(p);}catch(e){}}
    }).catch(function(){});
  },[]);

  var savePlans=function(p){setPlans(p);var s=getStg();if(s)s.set("etudy:plans",JSON.stringify(p)).catch(function(){});};
  var plan=plans.find(function(p){return p.id===activePlanId;})||plans[0];
  var totalMin=plan?plan.items.reduce(function(s,i){return s+i.minutes;},0):0;
  var addItem=function(type){
    var item={id:++nextId.current,type:type,minutes:5,title:EXERCISE_TYPES.find(function(e){return e.type===type;}).label};
    if(type==="metronome")item.bpm=120;if(type==="lick"||type==="allkeys")item.lickId=null;
    if(type==="allkeys")item.minutes=10;
    var updated=plans.map(function(p){return p.id===plan.id?Object.assign({},p,{items:[].concat(p.items,[item])}):p;});
    savePlans(updated);setAddOpen(false);setExpandedId(item.id);
  };
  var removeItem=function(id){
    var updated=plans.map(function(p){return p.id===plan.id?Object.assign({},p,{items:p.items.filter(function(i){return i.id!==id;})}):p;});
    savePlans(updated);if(expandedId===id)setExpandedId(null);
  };
  var updateItem=function(id,field,value){
    var updated=plans.map(function(p){return p.id===plan.id?Object.assign({},p,{items:p.items.map(function(i){
      if(i.id!==id)return i;var n=Object.assign({},i);n[field]=value;return n;
    })}):p;});savePlans(updated);
  };
  var assignLick=function(id,lick){
    var updated=plans.map(function(p){return p.id===plan.id?Object.assign({},p,{items:p.items.map(function(i){
      if(i.id!==id)return i;return Object.assign({},i,{lickId:lick.id,title:lick.title});
    })}):p;});savePlans(updated);setPickingLickFor(null);
  };
  var reorderItems=function(from,to){
    if(from===to)return;var items=[].concat(plan.items);var m=items.splice(from,1)[0];items.splice(to,0,m);
    var updated=plans.map(function(p){return p.id===plan.id?Object.assign({},p,{items:items}):p;});savePlans(updated);
  };
  var updatePlanName=function(name){savePlans(plans.map(function(p){return p.id===plan.id?Object.assign({},p,{name:name}):p;}));};
  var addPlan=function(){var np={id:Date.now(),name:"New Plan",items:[]};savePlans([].concat(plans,[np]));setActivePlanId(np.id);};
  var deletePlan=function(){if(plans.length<=1)return;var u=plans.filter(function(p){return p.id!==plan.id;});savePlans(u);setActivePlanId(u[0].id);};
  var fmtTime=function(min){var h=Math.floor(min/60);var m=min%60;return h>0?h+"h "+m+"min":m+" min";};
  var typeColor=function(type){
    if(type==="lick")return isStudio?"#22D89E":"#6366F1";if(type==="allkeys")return isStudio?"#F472B6":"#EC4899";if(type==="ear")return isStudio?"#A78BFA":"#8B5CF6";
    if(type==="rhythm")return isStudio?"#F59E0B":"#D97706";if(type==="metronome")return isStudio?"#3B82F6":"#2563EB";
    return isStudio?"#EC4899":"#9CA3AF";
  };
  var getLick=function(id){return licks.find(function(l){return l.id===id;})||null;};

  // ─── DRAG — grip handle only, immediate, with ghost ───
  var killGhost=function(){if(ghostRef.current){try{document.body.removeChild(ghostRef.current);}catch(e){}ghostRef.current=null;}};

  var dragIdxRef=useRef(null);
  var dragOverRef=useRef(null);

  var onGripDown=function(idx,e){
    e.preventDefault();e.stopPropagation();
    var pt=e.touches?e.touches[0]:e;
    dragIdxRef.current=idx;dragOverRef.current=idx;
    setDragIdx(idx);setDragOverIdx(idx);setExpandedId(null);
    document.body.style.overflow="hidden";
    killGhost();
    var els=document.querySelectorAll("[data-pp-item]");
    if(els[idx]){
      var rect=els[idx].getBoundingClientRect();
      var g=els[idx].cloneNode(true);
      g.style.cssText="position:fixed;left:"+rect.left+"px;top:"+rect.top+"px;width:"+rect.width+"px;height:"+rect.height+"px;opacity:0.8;z-index:9999;pointer-events:none;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.22);background:"+t.card+";border:2px solid "+t.accent+";overflow:hidden;";
      g.querySelectorAll("input,button,select").forEach(function(c){c.style.pointerEvents="none";c.style.opacity="0.5";});
      g._offsetY=pt.clientY-rect.top;
      document.body.appendChild(g);ghostRef.current=g;
    }
  };

  useEffect(function(){
    if(dragIdx===null)return;
    var onMove=function(e){
      if(e.cancelable)e.preventDefault();
      var pt=e.touches?e.touches[0]:e;
      if(ghostRef.current){ghostRef.current.style.top=(pt.clientY-(ghostRef.current._offsetY||30))+"px";}
      var els=document.querySelectorAll("[data-pp-item]");
      var target=els.length-1;
      for(var i=0;i<els.length;i++){
        var r=els[i].getBoundingClientRect();
        if(pt.clientY<r.top+r.height/2){target=i;break;}
      }
      dragOverRef.current=target;
      setDragOverIdx(target);
    };
    var onUp=function(){
      var from=dragIdxRef.current;
      var to=dragOverRef.current;
      if(from!==null&&to!==null)reorderItems(from,to);
      killGhost();
      dragIdxRef.current=null;dragOverRef.current=null;
      setDragIdx(null);setDragOverIdx(null);
      document.body.style.overflow="";
    };
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:false});window.addEventListener("touchend",onUp);
    return function(){
      window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onUp);
    };
  },[dragIdx]);

  // ─── LICK PICKER MODAL ───
  if(pickingLickFor!==null){
    var savedLicks=licks.filter(function(l){return (savedSet&&savedSet.has(l.id))||l.private;});
    return React.createElement("div",{style:{marginBottom:20}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}},
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"SELECT A LICK"),
        React.createElement("button",{onClick:function(){setPickingLickFor(null);},style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:500,background:"none",border:"none",cursor:"pointer"}},"Cancel")),
      savedLicks.length===0?React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,padding:"32px 20px",textAlign:"center"}},
        React.createElement("div",{style:{fontSize:24,marginBottom:8}},isStudio?"\u2605":"\u2606"),
        React.createElement("p",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",margin:"0 0 6px"}},"No saved licks yet"),
        React.createElement("p",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",margin:0,lineHeight:1.5}},"Save licks from the library or create your own private licks to add them to your practice plan.")):
      React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,maxHeight:400,overflowY:"auto"}},
        savedLicks.map(function(lick,i){
          var cc=getCatColor(lick.category,t);
          return React.createElement("button",{key:lick.id,onClick:function(){assignLick(pickingLickFor,lick);},style:{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"none",border:"none",borderBottom:i<savedLicks.length-1?"1px solid "+t.border:"none",cursor:"pointer",textAlign:"left"}},
            React.createElement("div",{style:{width:6,height:6,borderRadius:3,background:cc,flexShrink:0}}),
            React.createElement("div",{style:{flex:1,minWidth:0}},
              React.createElement("span",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.title),
              React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},lick.artist+" \u00B7 "+lick.key+" \u00B7 \u2669="+lick.tempo)),
            React.createElement("span",{style:{fontSize:10,color:cc,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,flexShrink:0}},lick.category));
        })));
  }

  // ─── MAIN RENDER ───
  return React.createElement("div",{style:{marginBottom:20}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}},
      React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"PRACTICE PLAN"),
      React.createElement("button",{onClick:addPlan,style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:500,background:"none",border:"none",cursor:"pointer"}},"+ New")),

    plans.length>1&&React.createElement("div",{style:{display:"flex",gap:4,marginBottom:10,overflowX:"auto",scrollbarWidth:"none"}},
      plans.map(function(p){var a=p.id===activePlanId;
        return React.createElement("button",{key:p.id,onClick:function(){setActivePlanId(p.id);},style:{padding:"6px 14px",borderRadius:8,border:a?"1.5px solid "+t.accent:"1.5px solid "+t.border,background:a?(isStudio?t.accent+"15":t.accent+"08"):t.card,color:a?t.text:t.muted,fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:a?600:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}},p.name);})),
    React.createElement("div",{style:{marginBottom:10}},
      React.createElement("input",{value:plan.name,onChange:function(e){updatePlanName(e.target.value);},style:{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}})),

    plan&&React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,overflow:"hidden"}},
      plan.items.length===0&&React.createElement("div",{style:{padding:"24px 16px",textAlign:"center"}},
        React.createElement("p",{style:{fontSize:13,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"No exercises yet. Tap + to add.")),

      plan.items.map(function(item,idx){
        var tc=typeColor(item.type);
        var aLick=(item.type==="lick"||item.type==="allkeys")&&item.lickId?getLick(item.lickId):null;
        var dragging=dragIdx===idx;
        var dropHere=dragOverIdx===idx&&dragIdx!==null&&dragIdx!==idx;
        var expanded=expandedId===item.id&&dragIdx===null;
        var sub=item.type==="lick"?(aLick?aLick.artist+" \u00B7 "+aLick.key:"Tap to configure")
          :item.type==="allkeys"?(aLick?"12 keys \u00B7 "+aLick.title:"Tap to select lick")
          :item.type==="metronome"?(item.bpm||120)+" BPM"
          :EXERCISE_TYPES.find(function(e){return e.type===item.type;}).label;

        return React.createElement("div",{key:item.id,"data-pp-item":true,style:{
          borderBottom:idx<plan.items.length-1?"1px solid "+t.border:"none",
          opacity:dragging?0.12:1,
          background:dropHere?(t.accent+"0D"):"transparent",
          borderTop:dropHere?"2px solid "+t.accent:"2px solid transparent",
          transition:"opacity 0.15s, background 0.15s, border-color 0.15s"}},

          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:0}},

            // GRIP HANDLE — touch-action:none stops scroll
            React.createElement("div",{
              onTouchStart:function(e){onGripDown(idx,e);},
              onMouseDown:function(e){onGripDown(idx,e);},
              style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,
                padding:"16px 8px 16px 14px",cursor:"grab",touchAction:"none",
                userSelect:"none",WebkitUserSelect:"none",flexShrink:0}},
              React.createElement("div",{style:{width:16,height:2,borderRadius:1,background:t.subtle,opacity:0.5}}),
              React.createElement("div",{style:{width:16,height:2,borderRadius:1,background:t.subtle,opacity:0.5}}),
              React.createElement("div",{style:{width:16,height:2,borderRadius:1,background:t.subtle,opacity:0.5}})),

            // TAP AREA — expand/collapse
            React.createElement("div",{onClick:function(){setExpandedId(expanded?null:item.id);},
              style:{flex:1,display:"flex",alignItems:"center",gap:8,padding:"12px 0",cursor:"pointer",minWidth:0}},
              React.createElement("div",{style:{width:7,height:7,borderRadius:4,background:tc,flexShrink:0}}),
              React.createElement("div",{style:{flex:1,minWidth:0}},
                React.createElement("div",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},item.title),
                React.createElement("div",{style:{fontSize:10,color:tc,fontFamily:"'JetBrains Mono',monospace",fontWeight:500}},sub))),

            React.createElement("div",{style:{fontSize:11,color:t.muted,fontFamily:"'JetBrains Mono',monospace",flexShrink:0,padding:"0 4px"}},item.minutes+"m"),
            React.createElement("div",{onClick:function(){setExpandedId(expanded?null:item.id);},style:{fontSize:10,color:t.subtle,padding:"12px 4px",cursor:"pointer",transition:"transform 0.15s",transform:expanded?"rotate(180deg)":"rotate(0)"}},"\u25BE"),
            React.createElement("button",{onClick:function(e){e.stopPropagation();removeItem(item.id);},
              style:{fontSize:13,color:"#EF4444",background:"none",border:"none",cursor:"pointer",padding:"12px 14px 12px 6px",flexShrink:0}},"\u2715")),

          // EXPANDED EDIT PANEL
          expanded&&React.createElement("div",{style:{padding:"0 14px 14px 46px",display:"flex",flexDirection:"column",gap:10}},
            React.createElement("div",null,
              React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:3}},"TITLE"),
              React.createElement("input",{value:item.title,onChange:function(e){updateItem(item.id,"title",e.target.value);},
                style:{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:12,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}})),
            React.createElement("div",null,
              React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:3}},"DURATION"),
              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
                React.createElement("button",{onClick:function(){updateItem(item.id,"minutes",Math.max(1,item.minutes-1));},style:{width:30,height:30,borderRadius:8,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
                React.createElement("span",{style:{fontSize:16,fontWeight:700,color:t.text,fontFamily:"'JetBrains Mono',monospace",minWidth:50,textAlign:"center"}},item.minutes+" min"),
                React.createElement("button",{onClick:function(){updateItem(item.id,"minutes",Math.min(60,item.minutes+1));},style:{width:30,height:30,borderRadius:8,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+")),
              React.createElement("input",{type:"range",min:1,max:30,value:item.minutes,onChange:function(e){updateItem(item.id,"minutes",parseInt(e.target.value));},style:{width:"100%",marginTop:6,accentColor:t.accent}})),
            (item.type==="lick"||item.type==="allkeys")&&React.createElement("div",null,
              React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:3}},"LICK"),
              React.createElement("button",{onClick:function(){setPickingLickFor(item.id);},style:{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px dashed "+(aLick?tc:t.border),background:aLick?(tc+"08"):t.filterBg,color:aLick?tc:t.subtle,fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:500,cursor:"pointer",textAlign:"left"}},
                aLick?"\u2713 "+aLick.title+" \u2014 tap to change":"Select a lick...")),
            item.type==="metronome"&&React.createElement("div",null,
              React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:3}},"BPM"),
              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
                React.createElement("input",{type:"range",min:40,max:240,value:item.bpm||120,onChange:function(e){updateItem(item.id,"bpm",parseInt(e.target.value));},style:{flex:1,accentColor:t.accent}}),
                React.createElement("span",{style:{fontSize:16,fontWeight:700,color:tc,fontFamily:"'JetBrains Mono',monospace",minWidth:36}},item.bpm||120)))));
      }),

      React.createElement("div",{style:{borderTop:plan.items.length?"1px solid "+t.border:"none"}},
        !addOpen?React.createElement("button",{onClick:function(){setAddOpen(true);},style:{width:"100%",padding:"12px",background:"none",border:"none",color:t.accent,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"+ Add Exercise")
        :React.createElement("div",{style:{padding:"10px 14px",display:"flex",flexDirection:"column",gap:4}},
          EXERCISE_TYPES.map(function(ex){var tc2=typeColor(ex.type);
            return React.createElement("button",{key:ex.type,onClick:function(){addItem(ex.type);},style:{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,border:"1px solid "+t.border,background:t.filterBg,cursor:"pointer"}},
              React.createElement("div",{style:{width:8,height:8,borderRadius:4,background:tc2,flexShrink:0}}),
              React.createElement("div",{style:{flex:1,textAlign:"left"}},
                React.createElement("span",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",display:"block"}},ex.label),
                React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif"}},ex.desc)));}),
          React.createElement("button",{onClick:function(){setAddOpen(false);},style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",background:"none",border:"none",cursor:"pointer",padding:"4px"}},"Cancel"))),
      plans.length>1&&React.createElement("button",{onClick:deletePlan,style:{width:"100%",padding:"10px",borderTop:"1px solid "+t.border,background:"none",border:"none",borderBottomLeftRadius:14,borderBottomRightRadius:14,color:"#EF4444",fontSize:11,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Delete Plan")),

    plan&&plan.items.length>0&&React.createElement("button",{onClick:function(){onStartSession(plan);},style:{width:"100%",marginTop:12,padding:"14px",borderRadius:14,border:"none",background:t.accent,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px "+t.accentGlow,display:"flex",alignItems:"center",justifyContent:"center",gap:8}},
      IC.tabRhythm(18,"#fff",true),"Start Session \u00B7 "+fmtTime(totalMin)));
}

// ============================================================
// PRACTICE HISTORY — session log with stats
// ============================================================
function PracticeHistory({th,historyKey}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var[sessions,setSessions]=useState([]);
  var[loading,setLoading]=useState(true);
  var[expanded,setExpanded]=useState(null);

  var loadHistory=function(){
    try{
      window.storage.get("practice-log").then(function(r){
        if(r&&r.value){try{setSessions(JSON.parse(r.value));}catch(e){}}
        setLoading(false);
      }).catch(function(){setLoading(false);});
    }catch(e){setLoading(false);}
  };
  useEffect(loadHistory,[historyKey||0]);

  var fmtSec=function(s){var m=Math.floor(s/60);var sec=s%60;return(m<10?"0":"")+m+":"+(sec<10?"0":"")+sec;};
  var fmtDate=function(iso){try{var d=new Date(iso);return d.toLocaleDateString("de-DE",{day:"numeric",month:"short"})+", "+d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});}catch(e){return iso;}};

  var clearHistory=function(){
    if(!confirm("Wirklich alle Sessions l\u00F6schen?"))return;
    try{window.storage.delete("practice-log").then(function(){setSessions([]);}).catch(function(){});}catch(e){}
  };

  // Stats
  var totalPracticed=sessions.reduce(function(s,se){return s+se.practicedSec;},0);
  var totalSessions=sessions.length;
  var thisWeek=sessions.filter(function(se){var d=new Date(se.date);var now=new Date();var weekAgo=new Date(now.getTime()-7*24*60*60*1000);return d>=weekAgo;});
  var weekPracticed=thisWeek.reduce(function(s,se){return s+se.practicedSec;},0);

  if(loading)return null;
  if(sessions.length===0)return React.createElement("div",{style:{marginTop:20,padding:"16px",background:t.card,borderRadius:14,border:"1px solid "+t.border,textAlign:"center"}},
    React.createElement("span",{style:{fontSize:12,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"No sessions logged yet. Start a practice session to track your progress."));

  return React.createElement("div",{style:{marginTop:20}},
    // Header
    React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}},
      React.createElement("span",{style:{fontSize:14,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"}},"Practice Log"),
      React.createElement("button",{onClick:clearHistory,style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",background:"none",border:"none",cursor:"pointer"}},"Clear")),

    // Stats bar
    React.createElement("div",{style:{display:"flex",gap:8,marginBottom:14}},
      [{label:"This Week",value:fmtSec(weekPracticed),sub:thisWeek.length+" sessions"},
       {label:"All Time",value:fmtSec(totalPracticed),sub:totalSessions+" sessions"}].map(function(s,i){
        return React.createElement("div",{key:i,style:{flex:1,background:t.card,borderRadius:12,padding:"10px 12px",border:"1px solid "+t.border}},
          React.createElement("div",{style:{fontSize:18,fontWeight:700,color:t.accent,fontFamily:"'JetBrains Mono',monospace"}},s.value),
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:1}},s.label),
          React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},s.sub));
      })),

    // Session list
    React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:6}},
      sessions.slice(0,20).map(function(se,i){
        var isExp=expanded===i;
        var pct=se.plannedSec>0?Math.round((se.practicedSec/se.plannedSec)*100):0;
        return React.createElement("div",{key:se.id||i,style:{background:t.card,borderRadius:12,border:"1px solid "+t.border,overflow:"hidden"}},
          // Summary row
          React.createElement("button",{onClick:function(){setExpanded(isExp?null:i);},style:{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}},
            // Completion indicator
            React.createElement("div",{style:{width:32,height:32,borderRadius:8,background:pct>=80?(isStudio?"#22D89E20":"#22D89E10"):pct>=50?"#F59E0B15":"#EF444415",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},
              React.createElement("span",{style:{fontSize:11,fontWeight:700,color:pct>=80?"#22D89E":pct>=50?"#F59E0B":"#EF4444",fontFamily:"'JetBrains Mono',monospace"}},pct+"%")),
            React.createElement("div",{style:{flex:1,minWidth:0}},
              React.createElement("div",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},se.planName),
              React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},fmtDate(se.date))),
            React.createElement("div",{style:{textAlign:"right",flexShrink:0}},
              React.createElement("div",{style:{fontSize:13,fontWeight:700,color:t.accent,fontFamily:"'JetBrains Mono',monospace"}},fmtSec(se.practicedSec)),
              se.skippedCount>0&&React.createElement("div",{style:{fontSize:9,color:"#F59E0B",fontFamily:"'JetBrains Mono',monospace"}},se.skippedCount+" skipped")),
            React.createElement("span",{style:{fontSize:10,color:t.subtle,transform:isExp?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}},"\u25BC")),
          // Expanded exercise list
          isExp&&se.exercises&&React.createElement("div",{style:{borderTop:"1px solid "+t.border,padding:"8px 14px"}},
            se.exercises.map(function(ex,j){
              return React.createElement("div",{key:j,style:{display:"flex",alignItems:"center",gap:8,padding:"4px 0",opacity:ex.skipped?0.5:1}},
                React.createElement("div",{style:{width:6,height:6,borderRadius:3,background:ex.skipped?"#F59E0B":"#22D89E",flexShrink:0}}),
                React.createElement("span",{style:{fontSize:11,color:t.text,fontFamily:"'Inter',sans-serif",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},ex.title),
                React.createElement("span",{style:{fontSize:10,color:ex.skipped?"#F59E0B":t.muted,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}},ex.skipped?"skip":fmtSec(ex.actualSec)));
            })));
      })));
}


// ============================================================
// ALL KEYS TRAINER — practice a lick through all 12 keys
// ============================================================
var ALL_KEY_NAMES=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
var INTERVALS=[
  {id:"5ths",label:"5ths",semi:7,desc:"Circle of fifths"},
  {id:"4ths",label:"4ths",semi:5,desc:"Circle of fourths"},
  {id:"half",label:"\u00BD",semi:1,desc:"Chromatic"},
  {id:"M2",label:"M2",semi:2,desc:"Whole tone"},
  {id:"m3",label:"m3",semi:3,desc:"Minor thirds"},
  {id:"M3",label:"M3",semi:4,desc:"Major thirds"},
  {id:"tri",label:"TT",semi:6,desc:"Tritone"},
  {id:"rnd",label:"?",semi:0,desc:"Random"},
];
function buildKeySeq(semi,startSt){
  if(semi===0){var a=[];for(var i=0;i<12;i++)a.push(i);for(var j=a.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1));var tmp=a[j];a[j]=a[k];a[k]=tmp;}return a;}
  var seq=[];var cur=(startSt||0)%12;var seen=new Set();
  while(!seen.has(cur)){seen.add(cur);seq.push(cur);cur=(cur+semi)%12;}
  return seq;
}

function AllKeysTrainer({lick,th,userInst,keyProgress,onUpdateProgress}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var uOff=INST_TRANS[userInst]||0;
  var[mode,setMode]=useState("learn"); // learn | drill
  var[activeIdx,setActiveIdx]=useState(0);
  var[stage,setStage]=useState(1); // 1=sheet 2=memory 3=tempo
  var[hidden,setHidden]=useState(false);
  var[interval,setInterval2]=useState("5ths");
  var[repsPerKey,setRepsPerKey]=useState(2);
  var[drilling,setDrilling]=useState(false);
  var[drillKeyIdx,setDrillKeyIdx]=useState(0);
  var[drillReps,setDrillReps]=useState(0);
  var drillRepsRef=useRef(0);
  var drillKeyIdxRef=useRef(0);
  var drillSeqRef=useRef(drillSeq);
  var repsPerKeyRef=useRef(2);
  var curNoteRef=useRef(-1);
  var prog=keyProgress||{};

  // Keep refs in sync
  useEffect(function(){drillSeqRef.current=drillSeq;},[drillSeq]);
  useEffect(function(){repsPerKeyRef.current=repsPerKey;},[repsPerKey]);

  var intDef=INTERVALS.find(function(iv){return iv.id===interval;})||INTERVALS[0];
  var keysPerCycle=buildKeySeq(intDef.semi,0).length;
  var cyclesNeeded=Math.ceil(12/keysPerCycle);
  // Build full 12-key drill sequence by chaining offset cycles
  var drillSeq=useMemo(function(){
    if(intDef.semi===0)return buildKeySeq(0,0); // random already gives 12
    var all=[];var used=new Set();
    for(var c=0;c<cyclesNeeded;c++){
      var cycle=buildKeySeq(intDef.semi,c);
      for(var j=0;j<cycle.length;j++){if(!used.has(cycle[j])){used.add(cycle[j]);all.push(cycle[j]);}}
    }
    return all;
  },[intDef.semi,cyclesNeeded]);

  // Learn mode uses COF order
  var learnOrder=useMemo(function(){return buildKeySeq(7,0);},[]);
  var learnLabels=learnOrder.map(function(st){return ALL_KEY_NAMES[st];});

  // Current key for learn mode
  var learnOffset=learnOrder[activeIdx];
  var learnTotalOff=learnOffset+uOff;
  var learnAbc=transposeAbc(lick.abc,learnTotalOff);
  var learnSoundAbc=transposeAbc(lick.abc,learnOffset);
  var learnKeyName=trKeyName(lick.key.split(" ")[0],learnOffset);
  var slowTempo=Math.max(60,Math.round(lick.tempo*0.65));
  var learnTempo=stage===3?lick.tempo:slowTempo;

  // Current key for drill mode
  var drillOffset=drillSeq[drillKeyIdx]||0;
  var drillTotalOff=drillOffset+uOff;
  var drillAbc=transposeAbc(lick.abc,drillTotalOff);
  var drillSoundAbc=transposeAbc(lick.abc,drillOffset);
  var drillKeyName=trKeyName(lick.key.split(" ")[0],drillOffset);

  var getStage=function(st){return prog[st]||0;};
  var completedKeys=learnOrder.filter(function(st){return getStage(st)>=3;}).length;

  // LEARN: mark key and advance
  var markKey=function(){
    var np=Object.assign({},prog);np[learnOffset]=Math.max(np[learnOffset]||0,stage);
    if(onUpdateProgress)onUpdateProgress(np);
    if(activeIdx<11){setActiveIdx(activeIdx+1);setHidden(stage>=2);}
    else{
      var allDone=learnOrder.every(function(st){return(prog[st]||0)>=stage||(st===learnOffset);});
      if(allDone&&stage<3){setStage(stage+1);setActiveIdx(0);setHidden(stage>=1);}
      else{setActiveIdx(0);setHidden(stage>=2);}
    }
  };

  // DRILL: start/stop
  var startDrill=function(){
    drillRepsRef.current=0;drillKeyIdxRef.current=0;
    repsPerKeyRef.current=repsPerKey;drillSeqRef.current=drillSeq;
    setDrillKeyIdx(0);setDrillReps(0);setDrilling(true);
  };
  var stopDrill=function(){
    setDrilling(false);setDrillReps(0);drillRepsRef.current=0;
  };

  // Seamless callback: on key change, return new abc + countIn for 1-bar metronome lead-in
  // so next loop plays metronome-only (count-in), then melody resumes
  var onDrillLoop=useCallback(function(loopCount){
    drillRepsRef.current++;
    var newReps=drillRepsRef.current;
    setDrillReps(newReps);
    if(newReps>=repsPerKeyRef.current){
      drillRepsRef.current=0;
      drillKeyIdxRef.current++;
      setDrillReps(0);
      setDrillKeyIdx(drillKeyIdxRef.current);
      var seq=drillSeqRef.current;
      if(drillKeyIdxRef.current>=seq.length){
        return{stop:true};
      }
      var newOffset=seq[drillKeyIdxRef.current];
      return{abc:transposeAbc(lick.abc,newOffset),countIn:true};
    }
    return null;
  },[lick.abc]);

  // Stop drill when all keys done
  useEffect(function(){
    if(drilling&&drillKeyIdx>=drillSeq.length){setDrilling(false);}
  },[drillKeyIdx,drilling,drillSeq.length]);

  var stageLabel=stage===1?"Sheet":stage===2?"Memory":"Tempo";
  var stageColor=stage===1?(isStudio?"#22D89E":"#6366F1"):stage===2?(isStudio?"#F59E0B":"#D97706"):(isStudio?"#EF4444":"#DC2626");
  var drillColor=isStudio?"#F472B6":"#EC4899";

  // Shared circle renderer
  var renderCircle=function(order,labels,curSt,accentCol){
    var size=160;var cx=size/2;var cy=size/2;var r=62;var n=order.length;
    return React.createElement("svg",{width:size,height:size,viewBox:"0 0 "+size+" "+size,style:{display:"block",margin:"0 auto 12px"}},
      order.map(function(st,i){
        var angle=(i/n)*Math.PI*2-Math.PI/2;
        var x=cx+Math.cos(angle)*r;var y=cy+Math.sin(angle)*r;
        var ks=getStage(st);var isActive=st===curSt;
        var dotR=isActive?12:9;
        var col=isActive?accentCol:ks>=3?(isStudio?"#22D89E":"#6366F1"):ks>=2?(isStudio?"#F59E0B":"#D97706"):ks>=1?(isStudio?"#3B82F6":"#2563EB"):t.border;
        return React.createElement("g",{key:i,onClick:function(){
          if(mode==="learn"){setActiveIdx(i);setHidden(stage>=2);}
          else if(!drilling){setDrillKeyIdx(i);}
        },style:{cursor:"pointer"}},
          React.createElement("circle",{cx:x,cy:y,r:dotR,fill:col,stroke:isActive?"#fff":"none",strokeWidth:isActive?2:0,opacity:isActive?1:(ks>0?1:0.5)}),
          React.createElement("text",{x:x,y:y+0.5,textAnchor:"middle",dominantBaseline:"central",style:{fontSize:isActive?8:7,fontWeight:isActive?700:500,fill:isActive?"#fff":(ks>=1?"#fff":t.muted),fontFamily:"'Inter',sans-serif",pointerEvents:"none"}},labels?labels[i]:ALL_KEY_NAMES[st]));
      }),
      React.createElement("text",{x:cx,y:cy-6,textAnchor:"middle",style:{fontSize:22,fontWeight:700,fill:t.text,fontFamily:"'JetBrains Mono',monospace"}},mode==="learn"?learnKeyName:drillKeyName),
      mode==="learn"?React.createElement("text",{x:cx,y:cy+12,textAnchor:"middle",style:{fontSize:9,fontWeight:600,fill:accentCol,fontFamily:"'Inter',sans-serif",letterSpacing:0.5}},stageLabel):
        drilling?React.createElement("text",{x:cx,y:cy+12,textAnchor:"middle",style:{fontSize:9,fontWeight:600,fill:drillColor,fontFamily:"'JetBrains Mono',monospace"}},drillReps+"/"+repsPerKey+" reps"):
        React.createElement("text",{x:cx,y:cy+12,textAnchor:"middle",style:{fontSize:9,fontWeight:600,fill:t.muted,fontFamily:"'Inter',sans-serif"}},"Drill"),
      React.createElement("text",{x:cx,y:cy+24,textAnchor:"middle",style:{fontSize:8,fill:t.muted,fontFamily:"'JetBrains Mono',monospace"}},
        mode==="learn"?completedKeys+"/12":(drillKeyIdx+1)+"/12"));
  };

  return React.createElement("div",{style:{padding:"12px 16px",overflowY:"auto",flex:1}},
    // Lick info
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap"}},
      React.createElement("span",{style:{fontSize:12,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"}},lick.title),
      React.createElement("span",{style:{fontSize:10,color:t.accent,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}},lick.artist)),

    // Mode switch: Learn / Drill
    React.createElement("div",{style:{display:"flex",gap:4,marginBottom:12,background:t.filterBg,borderRadius:10,padding:3}},
      [["learn","Learn"],["drill","Drill"]].map(function(m){
        var active=mode===m[0];
        return React.createElement("button",{key:m[0],onClick:function(){setMode(m[0]);if(m[0]==="learn")stopDrill();},style:{flex:1,padding:"8px 6px",borderRadius:8,border:"none",background:active?t.card:"transparent",color:active?t.text:t.subtle,fontSize:11,fontWeight:active?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none"}},m[1]);})),

    // === LEARN MODE ===
    mode==="learn"&&React.createElement("div",null,
      // Circle
      renderCircle(learnOrder,learnLabels,learnOffset,stageColor),
      // Stage selector
      React.createElement("div",{style:{display:"flex",gap:4,marginBottom:12,background:t.filterBg,borderRadius:10,padding:3}},
        [{s:1,l:"Sheet"},{s:2,l:"Memory"},{s:3,l:"Tempo"}].map(function(st){
          var active=stage===st.s;
          return React.createElement("button",{key:st.s,onClick:function(){setStage(st.s);setHidden(st.s>=2);},style:{flex:1,padding:"8px 6px",borderRadius:8,border:"none",background:active?t.card:"transparent",color:active?t.text:t.subtle,fontSize:10,fontWeight:active?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none"}},st.l);})),

      // Notation + Player
      React.createElement("div",{style:{background:t.card,borderRadius:14,padding:14,border:"1px solid "+(isStudio?t.staffStroke+"30":t.border),marginBottom:10}},
        hidden?React.createElement("div",{style:{padding:"20px 16px",textAlign:"center"}},
          IC.tabEar(28,t.muted,false),
          React.createElement("p",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif",margin:"10px 0 0"}},"Play from memory in "+learnKeyName),
          React.createElement("button",{onClick:function(){setHidden(false);},style:{marginTop:10,padding:"5px 14px",borderRadius:8,border:"1px solid "+t.border,background:t.filterBg,color:t.subtle,fontSize:10,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Peek")):
        React.createElement(Notation,{abc:learnAbc,compact:false,th:t,curNoteRef:curNoteRef}),
        React.createElement("div",{style:{borderTop:"1px solid "+t.border,marginTop:10,paddingTop:6}},
          React.createElement(Player,{abc:learnSoundAbc,tempo:learnTempo,abOn:false,abA:0,abB:1,setAbOn:null,setAbA:null,setAbB:null,pT:learnTempo,sPT:null,lickTempo:lick.tempo,trInst:null,setTrInst:null,trMan:null,setTrMan:null,onCurNote:function(n){curNoteRef.current=n;},th:t}))),
      React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",textAlign:"center",marginBottom:4}},"\u2669="+(stage===3?lick.tempo:slowTempo)+(stage===3?" (full tempo)":" (slow)")),

      // Got it button
      React.createElement("button",{onClick:markKey,style:{width:"100%",padding:"14px",borderRadius:12,border:"none",background:stageColor,color:"#fff",fontSize:13,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px "+stageColor+"40",marginBottom:12}},
        activeIdx===11&&stage===3?"Complete!":"Got it \u2192 "+learnLabels[(activeIdx+1)%12]),

      // Key progress grid
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}},
        learnOrder.map(function(st,i){
          var ks=getStage(st);var isActive=i===activeIdx;
          return React.createElement("button",{key:i,onClick:function(){setActiveIdx(i);setHidden(stage>=2);},style:{padding:"6px 2px",borderRadius:6,border:isActive?"1.5px solid "+stageColor:"1px solid "+t.border,background:ks>=3?(stageColor+"18"):isActive?(stageColor+"10"):t.card,cursor:"pointer",textAlign:"center"}},
            React.createElement("div",{style:{fontSize:10,fontWeight:isActive?700:500,color:isActive?stageColor:t.text,fontFamily:"'JetBrains Mono',monospace"}},learnLabels[i]),
            React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:2,marginTop:3}},
              [1,2,3].map(function(s){return React.createElement("div",{key:s,style:{width:4,height:4,borderRadius:2,background:ks>=s?(s===1?(isStudio?"#3B82F6":"#2563EB"):s===2?(isStudio?"#F59E0B":"#D97706"):(isStudio?"#22D89E":"#6366F1")):t.border}});})));
        }))),

    // === DRILL MODE ===
    mode==="drill"&&React.createElement("div",null,

      // === SETUP: settings + start ===
      !drilling&&React.createElement("div",null,
        // Settings card
        React.createElement("div",{style:{background:isStudio?(t.card+"CC"):t.filterBg,borderRadius:14,padding:14,marginBottom:12,border:"1px solid "+t.border}},
          // Interval
          React.createElement("div",{style:{marginBottom:12}},
            React.createElement("div",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:6}},"Interval Pattern"),
            React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap"}},
              INTERVALS.map(function(iv){
                var active=interval===iv.id;
                return React.createElement("button",{key:iv.id,onClick:function(){setInterval2(iv.id);setDrillKeyIdx(0);},style:{padding:"7px 11px",borderRadius:8,border:active?"1.5px solid "+drillColor:"1px solid "+(isStudio?t.border:"transparent"),background:active?(drillColor+"18"):(isStudio?t.bg+"80":t.card),color:active?drillColor:t.text,fontSize:11,fontWeight:active?700:500,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.15s"}},iv.label);
              })),
            React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'Inter',sans-serif",marginTop:5}},intDef.desc)),

          // Reps
          React.createElement("div",null,
            React.createElement("div",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:6}},"Reps per Key"),
            React.createElement("div",{style:{display:"flex",gap:4}},
              [1,2,3,4].map(function(r){
                var active=repsPerKey===r;
                return React.createElement("button",{key:r,onClick:function(){setRepsPerKey(r);},style:{flex:1,padding:"8px",borderRadius:8,border:active?"1.5px solid "+drillColor:"1px solid "+(isStudio?t.border:"transparent"),background:active?(drillColor+"18"):(isStudio?t.bg+"80":t.card),color:active?drillColor:t.text,fontSize:12,fontWeight:active?700:500,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.15s"}},r+"\u00D7");})))),

        // Key path preview
        React.createElement("div",{style:{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"center",marginBottom:14,padding:"0 4px"}},
          drillSeq.map(function(st,i){
            var isCycleBoundary=keysPerCycle<12&&i>0&&i%keysPerCycle===0;
            return React.createElement(React.Fragment,{key:i},
              isCycleBoundary&&React.createElement("span",{style:{fontSize:9,color:t.border,lineHeight:"20px"}},"\u00B7"),
              React.createElement("span",{style:{fontSize:10,fontWeight:600,color:t.muted,fontFamily:"'JetBrains Mono',monospace",padding:"2px 6px",borderRadius:5,background:isStudio?t.card+"60":t.card,border:"1px solid "+t.border}},ALL_KEY_NAMES[st]));
          })),

        // Start button
        React.createElement("button",{onClick:startDrill,style:{width:"100%",padding:"16px",borderRadius:14,border:"none",background:"linear-gradient(135deg, "+drillColor+", "+(isStudio?"#A855F7":"#DB2777")+")",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 6px 24px "+drillColor+"50",transition:"transform 0.15s",letterSpacing:0.3}},
          "\u25B6  Start Drill")),

      // === DRILLING: active drill UI ===
      drilling&&React.createElement("div",null,

        // Key strip — horizontal progress with names
        React.createElement("div",{style:{display:"flex",gap:2,justifyContent:"center",marginBottom:10,padding:"0 2px"}},
          drillSeq.map(function(st,i){
            var done=i<drillKeyIdx;var cur=i===drillKeyIdx;
            return React.createElement("div",{key:i,style:{
              flex:cur?2.2:1,height:cur?30:24,borderRadius:cur?8:6,
              background:done?drillColor:cur?"linear-gradient(135deg, "+drillColor+", "+(isStudio?"#A855F7":"#DB2777")+")":isStudio?t.card+"60":t.filterBg,
              opacity:done?0.5:1,
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              border:cur||done?"none":"1px solid "+t.border,
              boxShadow:cur?"0 2px 12px "+drillColor+"50":"none"
            }},
              React.createElement("span",{style:{fontSize:cur?11:7,fontWeight:cur?800:done?600:500,color:cur||done?"#fff":t.muted,fontFamily:"'JetBrains Mono',monospace"}},ALL_KEY_NAMES[st]));
          })),

        // Current key — large display
        React.createElement("div",{key:"dk-"+drillKeyIdx,style:{textAlign:"center",marginBottom:6,animation:"drillKeyIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"}},
          React.createElement("div",{style:{
            fontSize:44,fontWeight:900,fontFamily:"'JetBrains Mono',monospace",
            background:"linear-gradient(135deg, "+drillColor+", "+(isStudio?"#A855F7":"#DB2777")+")",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            lineHeight:1
          }},drillKeyName),
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:500,marginTop:2}},(drillKeyIdx+1)+" of "+drillSeq.length)),

        // Rep progress — current rep is active
        React.createElement("div",{style:{display:"flex",gap:4,justifyContent:"center",marginBottom:10}},
          Array.from({length:repsPerKey}).map(function(_,i){
            var done2=i<drillReps;var cur2=i===drillReps;
            return React.createElement("div",{key:i,style:{
              width:done2||cur2?20:10,height:6,borderRadius:3,
              background:done2?drillColor:cur2?(drillColor+"70"):isStudio?t.card:t.filterBg,
              border:done2||cur2?"none":"1px solid "+t.border,
              transition:"all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }});
          })),

        // Notation card
        React.createElement("div",{style:{background:t.card,borderRadius:12,padding:10,border:"1px solid "+(isStudio?t.staffStroke+"30":t.border),marginBottom:4}},
          React.createElement(Notation,{key:"drill-n-"+drillOffset,abc:drillAbc,compact:true,th:t,curNoteRef:curNoteRef})),

        // Player with controls visible (hideControls shows settings, no play button)
        React.createElement(Player,{key:"drill-active",abc:drillSoundAbc,tempo:lick.tempo,abOn:false,abA:0,abB:1,setAbOn:null,setAbA:null,setAbB:null,pT:lick.tempo,sPT:null,lickTempo:lick.tempo,trInst:null,setTrInst:null,trMan:null,setTrMan:null,onCurNote:function(n){curNoteRef.current=n;},th:t,forceLoop:true,autoPlay:true,onLoopComplete:onDrillLoop,hideControls:true}),

        // Stop button
        React.createElement("button",{onClick:stopDrill,style:{width:"100%",padding:"13px",borderRadius:12,border:"none",background:isStudio?t.card:t.filterBg,color:drillColor,fontSize:13,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"inset 0 0 0 1.5px "+drillColor,marginTop:8}},
          "\u25A0  Stop"))))
}


// ============================================================
// PLAN RUNNER — fullscreen with embedded exercise content
// ============================================================
function PlanRunner({plan,onClose,th,licks,userInst,keyProgress,onUpdateKeyProgress,onSessionSaved}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var[curIdx,setCurIdx]=useState(0);
  var[elapsed,setElapsed]=useState(0);
  var[paused,setPaused]=useState(false);
  var[finished,setFinished]=useState(false);
  var[lickSpeed,setLickSpeed]=useState(1.0);
  var[trInst,setTrInst]=useState("Concert");
  var[trMan,setTrMan]=useState(0);
  var timerRef=useRef(null);var pausedRef=useRef(false);
  var warningPlayedRef=useRef(false);var transitionRef=useRef(false);
  var curNoteRef=useRef(-1);

  // === CUMULATIVE EXERCISE TIME TRACKING ===
  // accTime stores accumulated seconds per exercise index — persists across visits
  var accTimeRef=useRef(plan.items.map(function(){return 0;}));
  var[sessionSaved,setSessionSaved]=useState(false);

  // Save current elapsed time into accumulator before leaving an exercise
  var saveCurrentTime=function(){accTimeRef.current[curIdx]=elapsed;};

  // Build exercise log from accumulated times for completion screen
  var buildExerciseLog=function(){
    return plan.items.map(function(it,idx){
      var actualSec=accTimeRef.current[idx]||0;
      var plannedSec=it.minutes*60;
      var skipped=actualSec<10||(plannedSec>0&&actualSec<plannedSec*0.2);
      var entry={idx:idx,title:it.title,type:it.type,plannedSec:plannedSec,actualSec:actualSec,skipped:skipped};
      if(it.lickId){var lk=licks?licks.find(function(l){return l.id===it.lickId;}):null;if(lk)entry.lickTitle=(it.type==="allkeys"?"All Keys: ":"")+lk.title;}
      return entry;
    });
  };

  useEffect(function(){try{Tone.start();}catch(e){}},[]);

  var items=plan.items;var item=items[curIdx]||null;
  var totalSec=item?item.minutes*60:0;
  var remaining=Math.max(0,totalSec-elapsed);
  var totalPlanSec=items.reduce(function(s,i){return s+i.minutes*60;},0);
  // Progress: sum all accumulated times + current elapsed for active exercise
  var doneSec=accTimeRef.current.reduce(function(s,v,i){return s+(i===curIdx?elapsed:v);},0);
  var uOff=INST_TRANS[userInst]||0;

  var typeColor=function(type){
    if(type==="lick")return isStudio?"#22D89E":"#6366F1";
    if(type==="allkeys")return isStudio?"#F472B6":"#EC4899";
    if(type==="ear")return isStudio?"#A78BFA":"#8B5CF6";
    if(type==="rhythm")return isStudio?"#F59E0B":"#D97706";
    if(type==="metronome")return isStudio?"#3B82F6":"#2563EB";
    return isStudio?"#EC4899":"#9CA3AF";
  };

  var playGong=function(){try{Tone.start();var now=Tone.now();
    var s=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.01,decay:1.5,sustain:0,release:2}}).toDestination();
    s.triggerAttackRelease("C5","8n",now);setTimeout(function(){try{s.dispose();}catch(e){}},3000);}catch(e){}};
  var playFinish=function(){try{Tone.start();var now=Tone.now();
    var s=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.01,decay:0.8,sustain:0,release:1}}).toDestination();
    s.triggerAttackRelease("G5","16n",now);s.triggerAttackRelease("C6","16n",now+0.15);
    setTimeout(function(){try{s.dispose();}catch(e){}},3000);}catch(e){}};

  // Timer
  useEffect(function(){
    timerRef.current=setInterval(function(){
      if(pausedRef.current||transitionRef.current)return;
      setElapsed(function(e){return e+1;});
    },1000);
    return function(){clearInterval(timerRef.current);};
  },[]);

  // Warning & auto-advance
  useEffect(function(){
    if(!item||finished)return;var rem=totalSec-elapsed;
    if(rem===10&&!warningPlayedRef.current){warningPlayedRef.current=true;playGong();}
    if(rem<=0&&!transitionRef.current){
      transitionRef.current=true;stopMetro();
      saveCurrentTime();
      if(curIdx<items.length-1){playGong();
        setTimeout(function(){
          var nextIdx=curIdx+1;
          setCurIdx(nextIdx);setElapsed(accTimeRef.current[nextIdx]||0);
          warningPlayedRef.current=false;transitionRef.current=false;setLickSpeed(1.0);},800);
      }else{playFinish();clearInterval(timerRef.current);setFinished(true);}
    }
  },[elapsed,curIdx,finished]);
  useEffect(function(){pausedRef.current=paused;},[paused]);

  // METRONOME cleanup — MiniMetronome manages its own lifecycle
  var stopMetro=function(){};// no-op, kept for navigation calls
  useEffect(function(){
    setTrInst("Concert");setTrMan(0);
  },[curIdx]);

  var fmtSec=function(s){var m=Math.floor(s/60);var sec=s%60;return(m<10?"0":"")+m+":"+(sec<10?"0":"")+sec;};
  var skipNext=function(){
    stopMetro();saveCurrentTime();
    if(curIdx<items.length-1){
      var nextIdx=curIdx+1;
      setCurIdx(nextIdx);setElapsed(accTimeRef.current[nextIdx]||0);
      warningPlayedRef.current=false;transitionRef.current=false;setLickSpeed(1.0);
    }else{clearInterval(timerRef.current);setFinished(true);}
  };
  var skipPrev=function(){
    if(curIdx>0){stopMetro();saveCurrentTime();
      var prevIdx=curIdx-1;
      setCurIdx(prevIdx);setElapsed(accTimeRef.current[prevIdx]||0);// resume where left off
      warningPlayedRef.current=false;setLickSpeed(1.0);}
  };

  var tc=item?typeColor(item.type):t.accent;
  var getLick=function(id){return licks?licks.find(function(l){return l.id===id;}):null;};
  var curLick=item&&(item.type==="lick"||item.type==="allkeys")&&item.lickId?getLick(item.lickId):null;

  // FINISHED SCREEN with detailed breakdown
  if(finished){
    var exerciseLog=buildExerciseLog();
    var planned=items.reduce(function(s,i){return s+i.minutes*60;},0);
    // Sum ALL actual practiced time (even partial from skipped exercises, capped at planned)
    var practiced=exerciseLog.reduce(function(s,e){return s+Math.min(e.actualSec,e.plannedSec);},0);
    var skippedCount=exerciseLog.filter(function(e){return e.skipped;}).length;
    var practicedCount=exerciseLog.filter(function(e){return !e.skipped;}).length;
    var pct=planned>0?Math.round((practiced/planned)*100):0;

    var saveSession=function(){
      if(sessionSaved)return;
      var session={
        id:Date.now(),date:new Date().toISOString(),planName:plan.name,planId:plan.id,
        plannedSec:planned,practicedSec:practiced,
        totalExercises:items.length,practicedCount:practicedCount,skippedCount:skippedCount,
        exercises:exerciseLog.map(function(e){return{title:e.lickTitle||e.title,type:e.type,plannedSec:e.plannedSec,actualSec:e.actualSec,skipped:e.skipped};})
      };
      try{
        window.storage.get("practice-log").then(function(res){
          var log=[];try{log=res?JSON.parse(res.value):[];}catch(e){}
          log.unshift(session);if(log.length>100)log=log.slice(0,100);
          window.storage.set("practice-log",JSON.stringify(log)).then(function(){
            setSessionSaved(true);if(onSessionSaved)onSessionSaved();
          });
        }).catch(function(){
          window.storage.set("practice-log",JSON.stringify([session])).then(function(){
            setSessionSaved(true);if(onSessionSaved)onSessionSaved();
          });
        });
      }catch(e){setSessionSaved(true);}
    };

    return React.createElement("div",{style:{position:"fixed",inset:0,zIndex:2000,background:t.bg,overflowY:"auto",WebkitOverflowScrolling:"touch"}},
      React.createElement("div",{style:{maxWidth:440,margin:"0 auto",padding:"40px 20px 60px",paddingTop:"calc(env(safe-area-inset-top, 0px) + 40px)",animation:"fadeIn 0.4s ease"}},
        // Header
        React.createElement("div",{style:{textAlign:"center",marginBottom:28}},
          React.createElement("div",{style:{fontSize:48,fontWeight:700,color:t.accent,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}},fmtSec(practiced)),
          React.createElement("div",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",marginBottom:4}},"practiced"+(planned!==practiced?" of "+fmtSec(planned)+" planned":"")),
          React.createElement("h2",{style:{fontSize:22,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif",margin:"12px 0 4px"}},"Session Complete"),
          React.createElement("p",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif",margin:0}},plan.name)),

        // Stats row
        React.createElement("div",{style:{display:"flex",gap:10,marginBottom:20}},
          [{label:"Practiced",value:practicedCount,color:"#22D89E"},{label:"Skipped",value:skippedCount,color:skippedCount>0?"#F59E0B":t.subtle},{label:"Completion",value:pct+"%",color:pct>=80?t.accent:pct>=50?"#F59E0B":"#EF4444"}].map(function(s,i){
            return React.createElement("div",{key:i,style:{flex:1,background:t.card,borderRadius:12,padding:"12px 10px",textAlign:"center",border:"1px solid "+t.border}},
              React.createElement("div",{style:{fontSize:20,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}},s.value),
              React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:2}},s.label));
          })),

        // Exercise breakdown
        React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,overflow:"hidden",marginBottom:24}},
          React.createElement("div",{style:{padding:"10px 14px",borderBottom:"1px solid "+t.border}},
            React.createElement("span",{style:{fontSize:11,fontWeight:600,color:t.muted,fontFamily:"'Inter',sans-serif",letterSpacing:0.5}},"EXERCISE BREAKDOWN")),
          exerciseLog.sort(function(a,b){return a.idx-b.idx;}).map(function(ex,i){
            var pctEx=ex.plannedSec>0?Math.round((ex.actualSec/ex.plannedSec)*100):0;
            return React.createElement("div",{key:i,style:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:i<exerciseLog.length-1?"1px solid "+t.border:"none",opacity:ex.skipped?0.5:1}},
              // Status dot
              React.createElement("div",{style:{width:8,height:8,borderRadius:4,flexShrink:0,background:ex.skipped?"#F59E0B":"#22D89E"}}),
              // Info
              React.createElement("div",{style:{flex:1,minWidth:0}},
                React.createElement("div",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},ex.lickTitle||ex.title),
                React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},
                  ex.skipped?"skipped ("+ex.actualSec+"s)":fmtSec(ex.actualSec)+" / "+fmtSec(ex.plannedSec))),
              // Mini bar
              !ex.skipped&&React.createElement("div",{style:{width:40,height:4,borderRadius:2,background:t.progressBg,overflow:"hidden",flexShrink:0}},
                React.createElement("div",{style:{height:"100%",width:Math.min(pctEx,100)+"%",background:pctEx>=80?"#22D89E":pctEx>=50?"#F59E0B":"#EF4444",borderRadius:2}})));
          })),

        // Buttons
        React.createElement("div",{style:{display:"flex",gap:10}},
          React.createElement("button",{onClick:function(){saveSession();},style:{flex:1,padding:"14px",borderRadius:14,border:"none",background:sessionSaved?t.filterBg:t.accent,color:sessionSaved?t.accent:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:sessionSaved?"none":"0 4px 16px "+t.accentGlow,transition:"all 0.2s"}},sessionSaved?"\u2713 Saved":"Save Session"),
          React.createElement("button",{onClick:function(){stopMetro();onClose();},style:{padding:"14px 24px",borderRadius:14,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:14,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Close"))));
  }

  // EXERCISE-SPECIFIC CONTENT
  var renderContent=function(){
    // === LICK with notation + player ===
    if(item.type==="lick"&&curLick){
      var totalOff=uOff+(INST_TRANS[trInst]||0)+trMan;
      var notationAbc=totalOff?transposeAbc(curLick.abc,totalOff):curLick.abc;
      var soundAbc=trMan?transposeAbc(curLick.abc,trMan):curLick.abc;
      var keyDisp=totalOff?trKeyName(curLick.key.split(" ")[0],totalOff):curLick.key;
      return React.createElement("div",{style:{flex:1,overflowY:"auto",padding:"16px"}},
        // Lick meta
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap"}},
          React.createElement("span",{style:{fontSize:12,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"}},curLick.title),
          React.createElement("span",{style:{fontSize:10,color:t.accent,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}},curLick.artist),
          React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},keyDisp+" \u00B7 \u2669="+curLick.tempo)),
        // Notation + Player card
        React.createElement("div",{style:{background:t.card,borderRadius:14,padding:14,border:"1px solid "+(isStudio?t.staffStroke+"30":t.border),marginBottom:10}},
          React.createElement(Notation,{abc:notationAbc,compact:false,th:t,curNoteRef:curNoteRef}),
          React.createElement("div",{style:{borderTop:"1px solid "+t.border,marginTop:10,paddingTop:6}},
            React.createElement(Player,{abc:soundAbc,tempo:curLick.tempo,abOn:false,abA:0,abB:1,setAbOn:null,setAbA:null,setAbB:null,pT:curLick.tempo,sPT:null,lickTempo:curLick.tempo,trInst:null,setTrInst:null,trMan:null,setTrMan:null,onCurNote:function(n){curNoteRef.current=n;},th:t}))),

        // TRANSPOSE (compact inline)
        React.createElement("div",{style:{background:t.card,borderRadius:12,padding:"8px 12px",border:"1px solid "+t.border,marginBottom:8}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}},
            React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"TRANSPOSE"),
            TRANS_INSTRUMENTS.map(function(inst){
              return React.createElement("button",{key:inst,onClick:function(){setTrInst(inst);},style:{padding:"3px 8px",borderRadius:6,border:"none",background:trInst===inst?t.accentBg:t.filterBg,color:trInst===inst?t.accent:t.subtle,fontSize:9,fontFamily:"'Inter',sans-serif",cursor:"pointer",fontWeight:trInst===inst?600:400}},inst==="Concert"?"C":inst.replace("Bb ","Bb").replace(" Sax",""));
            }),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:3,marginLeft:"auto"}},
              React.createElement("button",{onClick:function(){setTrMan(trMan-1);},style:{width:22,height:22,borderRadius:6,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
              React.createElement("span",{style:{fontSize:11,color:trMan?t.accent:t.subtle,fontFamily:"'JetBrains Mono',monospace",minWidth:20,textAlign:"center",fontWeight:trMan?600:400}},trMan>0?"+"+trMan:String(trMan)),
              React.createElement("button",{onClick:function(){setTrMan(trMan+1);},style:{width:22,height:22,borderRadius:6,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+")))),

        // Description
        curLick.description&&React.createElement("p",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:8,lineHeight:1.5}},curLick.description));
    }

    // === LICK without assigned lick ===
    if(item.type==="lick"&&!curLick){
      return React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}},
        IC.tabLicks(40,t.subtle,false),
        React.createElement("p",{style:{fontSize:14,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:12}},"No lick assigned"),
        React.createElement("p",{style:{fontSize:11,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"Assign licks in Edit mode"));
    }

    // === ALL KEYS — practice through circle of fifths ===
    if(item.type==="allkeys"&&curLick){
      return React.createElement(AllKeysTrainer,{lick:curLick,th:t,userInst:userInst,
        keyProgress:keyProgress&&keyProgress[curLick.id]?keyProgress[curLick.id]:{},
        onUpdateProgress:function(prog){if(onUpdateKeyProgress)onUpdateKeyProgress(curLick.id,prog);}});
    }
    if(item.type==="allkeys"&&!curLick){
      return React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}},
        IC.tabLicks(40,t.subtle,false),
        React.createElement("p",{style:{fontSize:14,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:12}},"No lick selected"),
        React.createElement("p",{style:{fontSize:11,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"Assign a saved lick to practice in all keys"));
    }

    // === METRONOME with MiniMetronome ===
    if(item.type==="metronome"){
      return React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}},
        React.createElement("div",{style:{fontSize:14,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:12}},item.title),
        React.createElement("div",{style:{width:"100%",maxWidth:360,background:t.card,borderRadius:16,padding:"8px 14px",border:"1px solid "+t.border}},
          React.createElement(MiniMetronome,{th:t,initBpm:item.bpm||120})));
    }

    // === EAR TRAINING prompt ===
    if(item.type==="ear"){
      return React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}},
        IC.tabEar(48,tc,true),
        React.createElement("h2",{style:{fontSize:20,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif",margin:"16px 0 8px"}},"Ear Training"),
        React.createElement("p",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5,maxWidth:280}},"Listen to licks and identify intervals, melodies, and chord changes. Use the Ear tab for guided exercises."));
    }

    // === RHYTHM prompt ===
    if(item.type==="rhythm"){
      return React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}},
        IC.tabRhythm(48,tc,true),
        React.createElement("h2",{style:{fontSize:20,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif",margin:"16px 0 8px"}},"Rhythm Reading"),
        React.createElement("p",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5,maxWidth:280}},"Sight-read rhythmic patterns and work on your timing precision. Use the Rhythm tab for guided exercises."));
    }

    // === FREE PRACTICE — just timer ===
    return React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}},
      React.createElement("div",{style:{width:16,height:16,borderRadius:8,background:tc,marginBottom:16}}),
      React.createElement("h2",{style:{fontSize:20,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif",margin:"0 0 8px"}},item.title),
      React.createElement("p",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Free practice"));
  };

  return React.createElement("div",{style:{position:"fixed",inset:0,zIndex:2000,background:t.bg,display:"flex",flexDirection:"column",overflow:"hidden"}},
    // TOP: Header + timer bar
    React.createElement("div",{style:{flexShrink:0}},
      // Header
      React.createElement("div",{style:{padding:"10px 16px",paddingTop:"calc(env(safe-area-inset-top, 0px) + 10px)",display:"flex",alignItems:"center",gap:8}},
        React.createElement("button",{onClick:function(){stopMetro();onClose();},style:{background:"none",border:"none",cursor:"pointer",color:t.muted,fontSize:22,padding:"4px 8px 4px 0",flexShrink:0}},"\u2039"),
        React.createElement("div",{style:{flex:1,minWidth:0}},
          React.createElement("div",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},item.title),
          React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},(curIdx+1)+"/"+items.length+" \u00B7 "+plan.name)),
        // Nav controls (compact)
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,flexShrink:0}},
          React.createElement("button",{onClick:skipPrev,disabled:curIdx===0,style:{width:30,height:30,borderRadius:8,border:"1px solid "+t.border,background:t.card,color:curIdx===0?t.subtle:t.text,fontSize:11,cursor:curIdx===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:curIdx===0?0.4:1}},"\u25C0"),
          React.createElement("button",{onClick:function(){setPaused(!paused);},style:{width:36,height:36,borderRadius:10,background:paused?t.accent:t.card,boxShadow:paused?"0 2px 10px "+t.accentGlow:"none",color:paused?"#fff":t.text,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",border:paused?"none":"1.5px solid "+t.border}},
            paused?React.createElement("div",{style:{width:0,height:0,borderTop:"6px solid transparent",borderBottom:"6px solid transparent",borderLeft:"10px solid #fff",marginLeft:2}})
            :React.createElement("div",{style:{display:"flex",gap:2.5}},React.createElement("div",{style:{width:3,height:12,background:t.text,borderRadius:1}}),React.createElement("div",{style:{width:3,height:12,background:t.text,borderRadius:1}}))),
          React.createElement("button",{onClick:skipNext,style:{width:30,height:30,borderRadius:8,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u25B6")),
        // Timer badge
        React.createElement("div",{style:{background:remaining<=10?"#EF4444":tc,borderRadius:8,padding:"4px 10px",minWidth:52,textAlign:"center",flexShrink:0}},
          React.createElement("span",{style:{fontSize:13,fontWeight:700,color:"#fff",fontFamily:"'JetBrains Mono',monospace"}},fmtSec(remaining)))),
      // Progress bars
      React.createElement("div",{style:{display:"flex",gap:2,padding:"0 16px 8px"}},
        items.map(function(it,i){
          var pct=i<curIdx?100:i===curIdx?Math.min(100,elapsed/totalSec*100):0;
          return React.createElement("div",{key:it.id,style:{flex:1,height:3,borderRadius:2,background:t.progressBg,overflow:"hidden"}},
            React.createElement("div",{style:{height:"100%",width:pct+"%",background:i===curIdx?(remaining<=10?"#EF4444":typeColor(it.type)):t.accent,borderRadius:2,transition:i===curIdx?"width 1s linear":"none"}}));
        }))),

    // MAIN: Exercise content
    renderContent(),

    // Warning banner
    remaining<=10&&remaining>0&&React.createElement("div",{style:{padding:"8px 16px",background:"#EF444415",textAlign:"center",flexShrink:0}},
      React.createElement("span",{style:{fontSize:12,color:"#EF4444",fontWeight:600,fontFamily:"'Inter',sans-serif",animation:"loopPulse 1s ease-in-out infinite"}},
        curIdx<items.length-1?"Next up: "+items[curIdx+1].title:"Last exercise!")));
}


// ============================================================
// FILTERS — themed
// ============================================================
function Filters({instrument,setInstrument,category,setCategory,sq,setSq,th}){
  const t=th||TH.classic;const isStudio=t===TH.studio;const[open,setOpen]=useState(false);const iRef=useRef(null);
  useEffect(()=>{if(open&&iRef.current)setTimeout(()=>iRef.current&&iRef.current.focus(),60);},[open]);
  const activeCount=(instrument!=="All"?1:0)+(category!=="All"?1:0)+(sq?1:0);
  const instCh=(i,a)=>{const c=isStudio&&a&&i!=="All"?getInstColor(i,t):null;return{padding:"5px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:a?600:400,background:a?(c?c+"18":t.accentBg):"transparent",color:a?(c||t.accent):t.subtle,whiteSpace:"nowrap",transition:"all 0.15s"};};
  const catCh=(c2,a)=>{const c=isStudio&&a&&c2!=="All"?getCatColor(c2,t):null;return{padding:"5px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:a?600:400,background:a?(c?c+"18":t.accentBg):"transparent",color:a?(c||t.accent):t.subtle,whiteSpace:"nowrap",transition:"all 0.15s"};};
  const clearAll=()=>{setInstrument("All");setCategory("All");setSq("");};
  return React.createElement("div",{style:{position:"relative"}},
    // Toggle button — icon only when collapsed
    React.createElement("button",{onClick:()=>setOpen(!open),style:{
      display:"flex",alignItems:"center",justifyContent:"center",gap:4,
      width:32,height:32,borderRadius:16,cursor:"pointer",padding:0,
      background:activeCount>0&&!open?t.accentBg:"transparent",
      border:activeCount>0&&!open?"1px solid "+t.accentBorder:"1px solid "+t.border,
      transition:"all 0.15s",position:"relative"}},
      React.createElement("span",{style:{fontSize:14,color:activeCount>0||open?t.accent:t.subtle}},open?"\u2715":"\u2315"),
      !open&&activeCount>0&&React.createElement("span",{style:{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:7,background:t.accent,color:"#fff",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}},activeCount)),
    // Expanded panel
    open&&React.createElement("div",{onClick:()=>setOpen(false),style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:199}}),
    open&&React.createElement("div",{style:{position:"absolute",top:"100%",right:0,marginTop:6,width:"calc(100vw - 32px)",maxWidth:488,padding:"10px 12px",background:t.settingsBg||t.card,borderRadius:12,border:"1px solid "+t.border,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",zIndex:200,
      display:"flex",flexDirection:"column",gap:8,animation:"coachIn 0.2s ease"}},
      // Search input
      React.createElement("div",{style:{position:"relative"}},
        React.createElement("input",{ref:iRef,type:"text",value:sq,onChange:e=>setSq(e.target.value),placeholder:"Title, artist, key...",style:{width:"100%",background:t.card,border:"1px solid "+(t.inputBorder||t.border),borderRadius:8,padding:"8px 12px 8px 32px",color:t.text,fontSize:12,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}}),
        React.createElement("span",{style:{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:t.subtle,pointerEvents:"none"}},"\u2315")),
      // Instrument row
      React.createElement("div",null,
        React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:4}},"INSTRUMENT"),
        React.createElement("div",{style:{display:"flex",gap:2,overflowX:"auto",scrollbarWidth:"none"}},
          INST_LIST.map(i=>React.createElement("button",{key:i,onClick:()=>setInstrument(i),style:instCh(i,instrument===i)},i)))),
      // Category row
      React.createElement("div",null,
        React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:4}},"CATEGORY"),
        React.createElement("div",{style:{display:"flex",gap:2,overflowX:"auto",scrollbarWidth:"none"}},
          CAT_LIST.map(c=>React.createElement("button",{key:c,onClick:()=>setCategory(c),style:catCh(c,category===c)},c)))),
      // Clear all
      activeCount>0&&React.createElement("button",{onClick:clearAll,style:{alignSelf:"flex-start",padding:"4px 12px",borderRadius:6,border:"none",background:t.filterBg,color:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Clear all")));}


// ============================================================
// APP — theme selector + main view
// ============================================================
export default function Etudy(){
  const[theme,setTheme]=useState(null);const[view,sV]=useState("explore");const[selectedLick,setSelected]=useState(null);const[inst,sI]=useState("All");const[cat,sC]=useState("All");const[sq,sQ]=useState("");const[showEd,sSE]=useState(false);const[licks,sL]=useState(SAMPLE_LICKS);
  // PWA Install prompt
  const[installPrompt,setInstallPrompt]=useState(null);
  const[isStandalone,setIsStandalone]=useState(false);
  const[isIOS,setIsIOS]=useState(false);
  const[showIOSGuide,setShowIOSGuide]=useState(false);
  const[installed,setInstalled]=useState(false);
  useEffect(()=>{
    // Detect if already running as installed PWA
    var standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
    setIsStandalone(standalone);
    // Detect iOS
    var ua=navigator.userAgent||"";
    setIsIOS(/iPad|iPhone|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1));
    // Capture install prompt (Android/Chrome/Edge)
    var handler=function(e){e.preventDefault();setInstallPrompt(e);};
    window.addEventListener("beforeinstallprompt",handler);
    window.addEventListener("appinstalled",function(){setInstalled(true);});
    return function(){window.removeEventListener("beforeinstallprompt",handler);};
  },[]);
  var doInstall=function(){
    if(!installPrompt)return;
    installPrompt.prompt();
    installPrompt.userChoice.then(function(r){if(r.outcome==="accepted")setInstalled(true);setInstallPrompt(null);});
  };
  const[myLicks,setMyLicks]=useState([]);
  const[lickSource,setLickSource]=useState("community"); // community | mine
  const[myLicksSub,setMyLicksSub]=useState("saved"); // saved | private
  const allLicks=useMemo(function(){return[...licks,...myLicks];},[licks,myLicks]);
  const[rhythmSub,setRhythmSub]=useState("metronome"); // metronome | reading | poly
  const[trainSub,setTrainSub]=useState("ear"); // ear | rhythm (later: scales)
  const[showSettings,setShowSettings]=useState(false);
  const[rhythmInput,setRhythmInput]=useState("tap"); // tap | mic — shared across modes
  const[rhythmMicSilent,setRhythmMicSilent]=useState(true);
  const[likedSet,setLikedSet]=useState(new Set());const[savedSet,setSavedSet]=useState(new Set());
  const[userInst,setUserInst]=useState("Concert");
  const[totalHours,setTotalHours]=useState(0);
  const[keyProgress,setKeyProgress]=useState({}); // {lickId: {0: stage, 7: stage, ...}}
  const[streakDays,setStreakDays]=useState(0);
  const[runningPlan,setRunningPlan]=useState(null);
  const[historyRefresh,setHistoryRefresh]=useState(0);
  const exploreScrollRef=useRef(0);const viewRef=useRef("explore");
  const switchView=useCallback((nv)=>{
    previewStop();
    if(viewRef.current==="explore")exploreScrollRef.current=window.scrollY||0;
    viewRef.current=nv;sV(nv);
    if(nv==="explore")setTimeout(()=>window.scrollTo(0,exploreScrollRef.current),0);
    else window.scrollTo(0,0);
  },[]);
  const openLick=useCallback((lick)=>{
    previewStop();
    if(!selectedLick)exploreScrollRef.current=window.scrollY||0;
    setSelected(lick);window.scrollTo(0,0);
    if(!visitedRef.current.detail){visitedRef.current.detail=true;setDetailShowTips(true);}
  },[selectedLick]);
  const closeLick=useCallback(()=>{
    setSelected(null);
    if(viewRef.current==="explore")setTimeout(()=>window.scrollTo(0,exploreScrollRef.current),0);
  },[]);
  const[feedTipped,setFeedTipped]=useState(false);const[detailTipped,setDetailTipped]=useState(false);
  const[earTipped,setEarTipped]=useState(false);const[rhythmTipped,setRhythmTipped]=useState(false);
  // Track first visit per section this session
  const visitedRef=useRef({explore:false,detail:false,ear:false,rhythm:false});
  const[feedShowTips,setFeedShowTips]=useState(false);const[detailShowTips,setDetailShowTips]=useState(false);
  const[earShowTips,setEarShowTips]=useState(false);const[rhythmShowTips,setRhythmShowTips]=useState(false);
  // On first visit to a section, auto-show tips
  useEffect(()=>{
    if(view==="explore"&&!visitedRef.current.explore){visitedRef.current.explore=true;setFeedShowTips(true);}
    if(view==="train"&&trainSub==="ear"&&!visitedRef.current.ear){visitedRef.current.ear=true;setEarShowTips(true);}
    if(view==="train"&&trainSub==="rhythm"&&!visitedRef.current.rhythm){visitedRef.current.rhythm=true;setRhythmShowTips(true);}
  },[view,trainSub]);
  const getStg=()=>{try{return window.storage||null;}catch(e){return null;}};
  // Load persisted state from storage
  useEffect(()=>{
    const s=getStg();if(!s)return;
    s.get("etudy:userInst").then(r=>{if(r&&r.value)setUserInst(r.value);}).catch(()=>{});
    s.get("etudy:savedSet").then(r=>{if(r&&r.value){try{setSavedSet(new Set(JSON.parse(r.value)));}catch(e){}}}).catch(()=>{});
    s.get("etudy:likedSet").then(r=>{if(r&&r.value){try{setLikedSet(new Set(JSON.parse(r.value)));}catch(e){}}}).catch(()=>{});
    s.get("practice-log").then(r=>{if(r&&r.value){try{var sess=JSON.parse(r.value);calcStreak(sess);calcHours(sess);}catch(e){}}}).catch(()=>{});
    s.get("etudy:keyProgress").then(r=>{if(r&&r.value){try{setKeyProgress(JSON.parse(r.value));}catch(e){}}}).catch(()=>{});
    s.get("etudy:myLicks").then(r=>{if(r&&r.value){try{setMyLicks(JSON.parse(r.value));}catch(e){}}}).catch(()=>{});
    // Load full lick data for offline-pinned community licks
    s.get("etudy:savedLicksData").then(r=>{if(r&&r.value){try{var m=JSON.parse(r.value);var existing=new Set(SAMPLE_LICKS.map(l=>l.id));var extra=Object.values(m).filter(l=>!existing.has(l.id));if(extra.length)sL(prev=>[...prev,...extra]);}catch(e){}}}).catch(()=>{});
  },[]);
  // Load community licks from Supabase
  useEffect(()=>{
    fetchLicks().then(data=>{if(data&&data.length>0)sL(data);});
  },[]);
  const calcStreak=(sessions)=>{
    if(!sessions||!sessions.length){setStreakDays(0);return;}
    var days=new Set();sessions.forEach(se=>{try{days.add(new Date(se.date).toISOString().slice(0,10));}catch(e){}});
    var sorted=[...days].sort().reverse();var streak=0;
    var d=new Date();d.setHours(0,0,0,0);
    // Check if practiced today or yesterday to start streak
    var today=d.toISOString().slice(0,10);
    var yest=new Date(d.getTime()-86400000).toISOString().slice(0,10);
    if(!days.has(today)&&!days.has(yest)){setStreakDays(0);return;}
    var cur=days.has(today)?d:new Date(d.getTime()-86400000);
    while(days.has(cur.toISOString().slice(0,10))){streak++;cur=new Date(cur.getTime()-86400000);}
    setStreakDays(streak);
  };
  const changeUserInst=(v)=>{setUserInst(v);const s=getStg();if(s)s.set("etudy:userInst",v).catch(()=>{});};
  const onUpdateKeyProgress=useCallback((lickId,prog)=>{
    setKeyProgress(prev=>{const n=Object.assign({},prev);n[lickId]=prog;
      const g=getStg();if(g)g.set("etudy:keyProgress",JSON.stringify(n)).catch(()=>{});return n;});
  },[]);
  const calcHours=(sessions)=>{
    if(!sessions||!sessions.length){setTotalHours(0);return;}
    var totalSec=sessions.reduce((s,se)=>s+(se.practicedSec||0),0);
    setTotalHours(Math.round(totalSec/360)/10); // 1 decimal
  };
  const markFeedTipped=useCallback(()=>{setFeedTipped(true);setFeedShowTips(false);},[]);
  const markDetailTipped=useCallback(()=>{setDetailTipped(true);setDetailShowTips(false);},[]);
  const markEarTipped=useCallback(()=>{setEarTipped(true);setEarShowTips(false);},[]);
  const markRhythmTipped=useCallback(()=>{setRhythmTipped(true);setRhythmShowTips(false);},[]);
  const toggleLike=id=>{
    const wasLiked=likedSet.has(id);
    const adding=!wasLiked;
    setLikedSet(s=>{const n=new Set(s);if(adding)n.add(id);else n.delete(id);const g=getStg();if(g)g.set("etudy:likedSet",JSON.stringify([...n])).catch(()=>{});return n;});
    const lick=allLicks.find(l=>l.id===id);
    if(lick){const newCount=Math.max(0,(lick.likes||0)+(adding?1:-1));
      sL(prev=>prev.map(l=>l.id===id?{...l,likes:newCount}:l));
      updateLikes(id,newCount);}
  };
  const toggleSave=id=>{
    const lick=allLicks.find(l=>l.id===id);
    setSavedSet(s=>{const n=new Set(s);const adding=!n.has(id);if(adding)n.add(id);else n.delete(id);
      const g=getStg();if(g){g.set("etudy:savedSet",JSON.stringify([...n])).catch(()=>{});
        // Persist full lick data for offline
        if(lick&&adding){g.get("etudy:savedLicksData").then(r=>{var m={};try{m=r&&r.value?JSON.parse(r.value):{};}catch(e){}m[id]=lick;g.set("etudy:savedLicksData",JSON.stringify(m)).catch(()=>{});}).catch(()=>{});}
        if(!adding){g.get("etudy:savedLicksData").then(r=>{var m={};try{m=r&&r.value?JSON.parse(r.value):{};}catch(e){}delete m[id];g.set("etudy:savedLicksData",JSON.stringify(m)).catch(()=>{});}).catch(()=>{});}
      }return n;});};
  useEffect(()=>{preloadPiano();preloadChordPiano();},[]);
  const dayOfYear=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/86400000);
  const dailyLick=licks.length>0?licks[dayOfYear%licks.length]:null;
  const srcLicks=lickSource==="mine"?licks.filter(function(l){return savedSet.has(l.id);}).concat(myLicks):licks;
  const fl=srcLicks.filter(l=>{if(lickSource==="community"&&dailyLick&&l.id===dailyLick.id)return false;if(inst!=="All"&&l.instrument!==inst)return false;if(cat!=="All"&&l.category!==cat)return false;if(sq){const q=sq.toLowerCase();return l.title.toLowerCase().includes(q)||l.artist.toLowerCase().includes(q)||l.key.toLowerCase().includes(q)||(l.tags||[]).some(tg2=>tg2.includes(q));}return true;});
  const addLick=d=>{
    const temp={...d,id:Date.now(),likes:0,user:"You",tags:d.tags||[]};
    sL([temp,...licks]);sSE(false);openLick(temp);
    // Save to Supabase in background, then replace temp with real DB entry
    insertLick({...d,user:"You"}).then(real=>{
      if(real)sL(prev=>prev.map(l=>l.id===temp.id?real:l));
    });
  };
  const addPrivateLick=d=>{const n={...d,id:Date.now(),likes:0,user:"You",tags:d.tags||[],private:true};
    setMyLicks(prev=>{const u=[n,...prev];const g=getStg();if(g)g.set("etudy:myLicks",JSON.stringify(u)).catch(()=>{});return u;});
    sSE(false);setLickSource("mine");openLick(n);};
  const deletePrivateLick=(id)=>{
    setMyLicks(prev=>{const u=prev.filter(l=>l.id!==id);const g=getStg();if(g)g.set("etudy:myLicks",JSON.stringify(u)).catch(()=>{});return u;});
    closeLick();};

  // INSTALL LANDING PAGE — shown only in browser (not when already installed as PWA)
  if(!isStandalone&&!installed&&!theme&&(installPrompt||isIOS)){
    var S=React.createElement;
    var canInstall=!!installPrompt;
    return S("div",{style:{minHeight:"100vh",background:"#08080F",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",position:"relative",overflow:"hidden"}},
      S("style",null,"@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}"),
      // Background glow
      S("div",{style:{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,216,158,0.08) 0%,transparent 70%)",pointerEvents:"none"}}),
      S("div",{style:{textAlign:"center",maxWidth:380,animation:"fadeIn 0.6s ease",position:"relative",zIndex:1}},
        // Logo
        S("div",{style:{fontSize:44,marginBottom:6,animation:"float 3s ease-in-out infinite"}},"\u266A"),
        S("h1",{style:{fontSize:38,fontFamily:"'Instrument Serif',Georgia,serif",color:"#fff",margin:"0 0 4px",fontWeight:400}},"\u00C9tudy"),
        S("p",{style:{fontSize:10,color:"#555566",fontFamily:"'JetBrains Mono',monospace",letterSpacing:4,margin:"0 0 32px"}},"JAZZ LICK COLLECTION"),
        // Feature pills
        S("div",{style:{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:36}},
          ["\uD83C\uDFB5 500+ Jazz Licks","\uD83D\uDC42 Ear Training","\uD83E\uDD41 Rhythm Games","\uD83C\uDFB9 Playback"].map(function(f){
            return S("span",{key:f,style:{padding:"6px 12px",borderRadius:20,background:"rgba(34,216,158,0.08)",border:"1px solid rgba(34,216,158,0.15)",color:"#22D89E",fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:500,whiteSpace:"nowrap"}},f);
          })),
        // Install button (Android/Chrome) or iOS guide
        canInstall?S("button",{onClick:doInstall,style:{width:"100%",padding:"16px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#22D89E,#1AB87A)",color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 24px rgba(34,216,158,0.3),0 8px 40px rgba(34,216,158,0.15)",transition:"transform 0.15s",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:10}},
          S("span",{style:{fontSize:20}},"\u2B07"),
          "App installieren"):
        // iOS guide
        isIOS?S("div",null,
          !showIOSGuide?S("button",{onClick:function(){setShowIOSGuide(true);},style:{width:"100%",padding:"16px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#22D89E,#1AB87A)",color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 24px rgba(34,216,158,0.3)",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:10}},
            S("span",{style:{fontSize:20}},"\u2B07"),
            "App installieren"):
          S("div",{style:{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:"20px",border:"1px solid rgba(34,216,158,0.2)",marginBottom:12,textAlign:"left",animation:"fadeIn 0.3s ease"}},
            S("p",{style:{fontSize:13,fontWeight:600,color:"#fff",fontFamily:"'Inter',sans-serif",marginBottom:14,textAlign:"center"}},"So installierst du \u00C9tudy:"),
            [
              {icon:"\u2B06\uFE0F",text:"Tippe unten auf das Teilen-Symbol",sub:"(Quadrat mit Pfeil nach oben)"},
              {icon:"\u2B07\uFE0F",text:"Scrolle runter im Men\u00FC"},
              {icon:"\u2795",text:'Tippe auf "Zum Home-Bildschirm"'},
              {icon:"\u2705",text:'Tippe auf "Hinzuf\u00FCgen" \u2014 fertig!'}
            ].map(function(step,i){
              return S("div",{key:i,style:{display:"flex",gap:12,alignItems:"flex-start",marginBottom:i<3?14:0}},
                S("span",{style:{fontSize:18,lineHeight:"1.2",flexShrink:0}},step.icon),
                S("div",null,
                  S("span",{style:{fontSize:13,color:"#E8E8F0",fontFamily:"'Inter',sans-serif",fontWeight:500}},step.text),
                  step.sub&&S("span",{style:{display:"block",fontSize:11,color:"#666677",fontFamily:"'Inter',sans-serif",marginTop:2}},step.sub)));
            }))):null,
        // "Continue in browser" link
        S("button",{onClick:function(){setInstalled(true);},style:{background:"none",border:"none",color:"#555566",fontSize:12,fontFamily:"'Inter',sans-serif",cursor:"pointer",padding:"12px",marginTop:4,transition:"color 0.15s"}},
          "Im Browser fortfahren \u2192"),
        // Bottom tagline
        S("p",{style:{fontSize:10,color:"#333344",fontFamily:"'JetBrains Mono',monospace",marginTop:32,letterSpacing:1}},"FREE \u00B7 OFFLINE \u00B7 NO ADS")));
  }

  // THEME SELECTION SCREEN
  if(!theme){return React.createElement("div",{style:{minHeight:"100vh",background:"#111118",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}},
    React.createElement("style",null,"@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes drillPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.95)}}@keyframes drillKeyIn{0%{opacity:0;transform:scale(0.5) translateY(10px)}100%{opacity:1;transform:scale(1) translateY(0)}}@keyframes drillDot{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}"),
    React.createElement("div",{style:{textAlign:"center",maxWidth:400,animation:"fadeIn 0.4s ease"}},
      React.createElement("div",{style:{fontSize:28,marginBottom:8}},"\u266A"),
      React.createElement("h1",{style:{fontSize:32,fontFamily:"'Instrument Serif',Georgia,serif",color:"#fff",margin:"0 0 4px",fontWeight:400}},"\u00C9tudy"),
      React.createElement("p",{style:{fontSize:11,color:"#7B7B8A",fontFamily:"'JetBrains Mono',monospace",letterSpacing:3,margin:"0 0 40px"}},"JAZZ LICK COLLECTION"),
      React.createElement("p",{style:{fontSize:14,color:"#999",margin:"0 0 32px",fontFamily:"'Inter',sans-serif"}},"Choose your vibe"),
      React.createElement("div",{style:{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}},
        // Classic option
        React.createElement("button",{onClick:()=>setTheme("classic"),style:{width:160,padding:0,borderRadius:16,border:"2px solid #2A2A38",background:"#1A1A24",cursor:"pointer",overflow:"hidden",transition:"all 0.2s",textAlign:"left"}},
          React.createElement("div",{style:{height:80,background:"linear-gradient(135deg,#F5F4F0,#E8E7E3)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}},
            React.createElement("div",{style:{width:24,height:3,background:"#6366F1",borderRadius:2}}),
            React.createElement("div",{style:{width:16,height:3,background:"#D5D4CE",borderRadius:2}}),
            React.createElement("div",{style:{width:20,height:3,background:"#1A1A1A",borderRadius:2}})),
          React.createElement("div",{style:{padding:"12px 14px"}},
            React.createElement("div",{style:{fontSize:15,fontWeight:600,color:"#fff",fontFamily:"'Instrument Serif',serif",marginBottom:3}},"Classic"),
            React.createElement("div",{style:{fontSize:10,color:"#7B7B8A",fontFamily:"'Inter',sans-serif"}},"Light \u00B7 Editorial \u00B7 Elegant"))),
        // Studio option
        React.createElement("button",{onClick:()=>setTheme("studio"),style:{width:160,padding:0,borderRadius:16,border:"2px solid #2A2A38",background:"#1A1A24",cursor:"pointer",overflow:"hidden",transition:"all 0.2s",textAlign:"left"}},
          React.createElement("div",{style:{height:80,background:"linear-gradient(135deg,#0A0A12,#13131D)",display:"flex",alignItems:"center",justifyContent:"center",gap:4}},
            React.createElement("div",{style:{width:14,height:14,background:"#22D89E",borderRadius:4}}),
            React.createElement("div",{style:{width:14,height:14,background:"#A78BFA",borderRadius:4}}),
            React.createElement("div",{style:{width:14,height:14,background:"#F59E0B",borderRadius:4}}),
            React.createElement("div",{style:{width:14,height:14,background:"#3B82F6",borderRadius:4}}),
            React.createElement("div",{style:{width:14,height:14,background:"#EC4899",borderRadius:4}})),
          React.createElement("div",{style:{padding:"12px 14px"}},
            React.createElement("div",{style:{fontSize:15,fontWeight:600,color:"#fff",fontFamily:"'Inter',sans-serif",marginBottom:3}},"Studio"),
            React.createElement("div",{style:{fontSize:10,color:"#7B7B8A",fontFamily:"'Inter',sans-serif"}},"Dark \u00B7 Colorful \u00B7 Musician"))))));}
  const t=TH[theme];const isStudio=theme==="studio";
  const css=["@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');","*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}","html,body{background:"+t.bg+"}","::-webkit-scrollbar{display:none}","input:focus,textarea:focus,select:focus{border-color:"+t.accentBorder+"!important;outline:none}","select option{background:"+t.card+"}","input[type=range]{-webkit-appearance:none;background:"+t.progressBg+";border-radius:4px;height:3px}","input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:"+t.accent+";cursor:pointer;box-shadow:0 1px 4px "+t.accentGlow+"}","@keyframes spin{to{transform:rotate(360deg)}}","@keyframes fadeIn{from{opacity:0}to{opacity:1}}","@keyframes playPulse{0%,100%{box-shadow:0 4px 18px "+t.accentGlow+"}50%{box-shadow:0 4px 28px "+t.accentGlow+",0 0 40px "+t.accentGlow+"}}","@keyframes firePop{0%{transform:scale(1)}30%{transform:scale(1.4)}60%{transform:scale(0.9)}100%{transform:scale(1)}}","@keyframes flameFlicker{0%,100%{transform:scaleX(1) scaleY(1)}25%{transform:scaleX(0.94) scaleY(1.03)}50%{transform:scaleX(1.03) scaleY(0.97)}75%{transform:scaleX(0.97) scaleY(1.02)}}","@keyframes flameCore{0%,100%{opacity:0.8;transform:scaleY(1)}50%{opacity:0.5;transform:scaleY(0.85)}}","@keyframes loopPulse{0%,100%{opacity:1}50%{opacity:0.6}}","@keyframes coachIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}","@keyframes coachPulse{0%,100%{opacity:0.5}50%{opacity:1}}","@keyframes drillPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.95)}}","@keyframes drillKeyIn{0%{opacity:0;transform:scale(0.5) translateY(10px)}100%{opacity:1;transform:scale(1) translateY(0)}}","@keyframes drillDot{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}","@keyframes helpGlow{0%{box-shadow:0 0 0 0 "+t.accent+"60;transform:scale(1)}40%{box-shadow:0 0 12px 4px "+t.accent+"40;transform:scale(1.2)}70%{box-shadow:0 0 6px 2px "+t.accent+"20;transform:scale(1.05)}100%{box-shadow:0 0 0 0 transparent;transform:scale(1)}}","[data-sheet-focus]{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;max-width:none!important;z-index:9999!important}"].join("\n");

  return React.createElement("div",{style:{minHeight:"100vh",background:t.bg,color:t.text,maxWidth:520,margin:"0 auto",position:"relative",paddingBottom:"calc(72px + env(safe-area-inset-bottom, 0px))"}},
    React.createElement("style",null,css),
    // Header — clean, just logo + contextual actions
    React.createElement("div",{style:{position:"sticky",top:0,zIndex:100,background:t.headerBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",padding:"10px 16px 0",paddingTop:"calc(env(safe-area-inset-top, 0px) + 10px)",borderBottom:"1px solid "+(isStudio?t.borderSub||t.border:t.border)}},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:view==="explore"?6:12}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
          React.createElement("span",{style:{fontSize:14}},"\u266A"),
          React.createElement("span",{style:{fontSize:18,fontFamily:t.titleFont,color:t.text,fontWeight:theme==="studio"?600:400,letterSpacing:0.3}},"\u00C9tudy")),
        // Context label + help button + settings gear
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
          view!=="explore"&&React.createElement("span",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},view==="train"?"TRAIN":view==="sessions"?"SESSIONS":view==="me"?"ME":""),
          // ? help button — only after tips have been shown once
          (view==="explore"&&feedTipped||view==="train"&&trainSub==="ear"&&earTipped||view==="train"&&trainSub==="rhythm"&&rhythmTipped)&&React.createElement("button",{onClick:function(){
            if(view==="explore")setFeedShowTips(true);
            else if(view==="train"&&trainSub==="ear")setEarShowTips(true);
            else if(view==="train"&&trainSub==="rhythm")setRhythmShowTips(true);
          },style:{width:22,height:22,borderRadius:11,border:"1px solid "+t.border,background:t.filterBg,color:t.subtle,fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all 0.15s",animation:"helpGlow 0.8s ease"}},"?"),
          // Settings gear
          React.createElement("button",{onClick:function(){setShowSettings(true);},style:{width:28,height:28,borderRadius:14,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,opacity:0.7,transition:"opacity 0.15s"}},IC.gear(18,t.muted)))),
      view==="explore"&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,paddingBottom:6}},
        // Source toggle — takes most space
        React.createElement("div",{style:{display:"flex",gap:2,background:t.filterBg,borderRadius:8,padding:2,flex:1}},
          [["community","Community"],["mine","My Licks"+(savedSet.size+myLicks.length?" ("+( savedSet.size+myLicks.length)+")":"")]].map(function(m){
            return React.createElement("button",{key:m[0],onClick:function(){setLickSource(m[0]);},style:{flex:1,padding:"6px 12px",borderRadius:6,border:"none",background:lickSource===m[0]?t.card:"transparent",color:lickSource===m[0]?t.text:t.subtle,fontSize:11,fontWeight:lickSource===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:lickSource===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}},m[1]);
          })),
        // Filter icon — far right
        React.createElement("div",{style:{flexShrink:0}},
          React.createElement(Filters,{instrument:inst,setInstrument:sI,category:cat,setCategory:sC,sq:sq,setSq:sQ,th:t})))),
    // Content
    React.createElement("div",{style:{padding:"12px 16px 24px"}},
      view==="explore"&&React.createElement("div",null,
        lickSource==="community"&&!sq&&inst==="All"&&cat==="All"&&dailyLick&&React.createElement(DailyLickCard,{lick:dailyLick,onSelect:openLick,th:t,liked:likedSet.has(dailyLick.id),saved:savedSet.has(dailyLick.id),onLike:toggleLike,onSave:toggleSave,userInst:userInst}),
        lickSource==="mine"&&fl.length===0&&!sq&&inst==="All"&&cat==="All"&&React.createElement("div",{style:{textAlign:"center",padding:"48px 20px",background:t.card,borderRadius:14,border:"1px solid "+t.border,marginBottom:16}},
          React.createElement("div",{style:{fontSize:32,marginBottom:12}},"\u270D"),
          React.createElement("div",{style:{fontSize:15,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:6}},"Your collection"),
          React.createElement("div",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5,marginBottom:16}},"Pin licks from the community with "+(isStudio?"the target \u2299":"the star \u2605")+" or create your own. Private licks are stored offline on your device."),
          React.createElement("button",{onClick:function(){sSE(true);},style:{padding:"12px 28px",borderRadius:12,border:"none",background:t.accent,color:"#fff",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px "+t.accentGlow}},"\u002B  Create Lick")),
        // My Licks: sub-tabs Saved / Private
        lickSource==="mine"&&fl.length>0&&(function(){
          var savedLicks=fl.filter(function(l){return !l.private;});
          var privateLicks=fl.filter(function(l){return l.private;});
          var activeLicks=myLicksSub==="saved"?savedLicks:privateLicks;
          return React.createElement("div",null,
            React.createElement("div",{style:{display:"flex",gap:2,background:t.filterBg,borderRadius:8,padding:2,marginBottom:12}},
              [["saved",(isStudio?"\u2299 ":"\u2605 ")+"Saved ("+savedLicks.length+")"],["private","\uD83D\uDD12 Private ("+privateLicks.length+")"]].map(function(m){
                return React.createElement("button",{key:m[0],onClick:function(){setMyLicksSub(m[0]);},style:{flex:1,padding:"6px 12px",borderRadius:6,border:"none",background:myLicksSub===m[0]?t.card:"transparent",color:myLicksSub===m[0]?t.text:t.subtle,fontSize:11,fontWeight:myLicksSub===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:myLicksSub===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}},m[1]);})),
            activeLicks.length>0&&activeLicks.map(function(l){return React.createElement(LickCard,{key:l.id,lick:l,onSelect:openLick,th:t,liked:likedSet.has(l.id),saved:savedSet.has(l.id),onLike:toggleLike,onSave:toggleSave,userInst:userInst});}),
            activeLicks.length===0&&React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",background:t.card,borderRadius:14,border:"1px solid "+t.border}},
              React.createElement("div",{style:{fontSize:12,color:t.subtle,fontFamily:"'Inter',sans-serif"}},myLicksSub==="saved"?"No saved licks yet — "+(isStudio?"target \u2299":"star \u2605")+" licks to save them":"No private licks yet — create one with the + button")));
        })(),
        lickSource==="community"&&React.createElement("div",{style:{fontSize:11,color:t.subtle,fontFamily:"'Inter',sans-serif",marginBottom:10,fontWeight:500}},fl.length+" lick"+(fl.length!==1?"s":"")),
        lickSource==="community"&&fl.map(l=>React.createElement(LickCard,{key:l.id,lick:l,onSelect:openLick,th:t,liked:likedSet.has(l.id),saved:savedSet.has(l.id),onLike:toggleLike,onSave:toggleSave,userInst:userInst})),
        fl.length===0&&!(lickSource==="mine"&&!sq&&inst==="All"&&cat==="All")&&React.createElement("div",{style:{textAlign:"center",padding:"60px 20px"}},React.createElement("p",{style:{fontFamily:t.titleFont,fontSize:16,color:t.subtle,fontStyle:theme==="studio"?"normal":"italic"}},"No licks found"))),
      view==="train"&&React.createElement("div",null,
        // Train sub-tabs: Ear | Rhythm (later: Scales)
        React.createElement("div",{style:{display:"flex",gap:4,marginBottom:14,background:t.filterBg,borderRadius:10,padding:3}},
          [["ear","\uD83D\uDC42 Ear"],["rhythm","\uD83E\uDD41 Rhythm"]].map(function(m){
            return React.createElement("button",{key:m[0],onClick:function(){setTrainSub(m[0]);},style:{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:trainSub===m[0]?t.card:"transparent",color:trainSub===m[0]?t.text:t.subtle,fontSize:12,fontWeight:trainSub===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:trainSub===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}},m[1]);
          })),
        // Ear sub-view
        trainSub==="ear"&&React.createElement(EarTrainer,{licks:allLicks,onLike:toggleLike,onOpen:openLick,likedSet:likedSet,th:t,userInst:userInst}),
        // Rhythm sub-view
        trainSub==="rhythm"&&React.createElement("div",null,
          // Rhythm sub-mode tabs
          React.createElement("div",{"data-coach":"rhythm-modes",style:{display:"flex",gap:4,marginBottom:12,background:t.filterBg,borderRadius:10,padding:3}},
            [["metronome","Metro"],["reading","Reading"],["poly","Polyrhythm"]].map(function(m){
              return React.createElement("button",{key:m[0],onClick:function(){setRhythmSub(m[0]);},style:{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:rhythmSub===m[0]?t.card:"transparent",color:rhythmSub===m[0]?t.text:t.subtle,fontSize:11,fontWeight:rhythmSub===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:rhythmSub===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}},m[1]);
            })),
          // Shared input mode toggle (for reading + poly)
          rhythmSub!=="metronome"&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:12}},
            React.createElement("div",{style:{display:"flex",gap:3,flex:1,background:t.filterBg,borderRadius:8,padding:2}},
              [["tap","Tap"],["mic","Mic"]].map(function(m){
                return React.createElement("button",{key:m[0],onClick:function(){setRhythmInput(m[0]);},style:{flex:1,padding:"5px 10px",borderRadius:6,border:"none",background:rhythmInput===m[0]?t.card:"transparent",color:rhythmInput===m[0]?t.text:t.subtle,fontSize:10,fontWeight:rhythmInput===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:rhythmInput===m[0]?"0 1px 3px rgba(0,0,0,0.06)":"none"}},m[1]);
              })),
            rhythmInput==="mic"&&React.createElement("button",{onClick:function(){setRhythmMicSilent(!rhythmMicSilent);},style:{padding:"5px 10px",borderRadius:6,border:"1px solid "+(isStudio?"#F59E0B30":"#FDE68A"),background:isStudio?"#F59E0B10":"#FEF9C3",color:isStudio?"#F59E0B":"#92400E",fontSize:9,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",whiteSpace:"nowrap"}},rhythmMicSilent?"Silent":"Audio")),
          // Components
          rhythmSub==="metronome"&&React.createElement("div",{"data-coach":"rhythm-metro"},React.createElement(Metronome,{th:t})),
          rhythmSub==="reading"&&React.createElement(RhythmGame,{th:t,sharedInput:rhythmInput,sharedMicSilent:rhythmMicSilent}),
          rhythmSub==="poly"&&React.createElement(PolyrhythmTrainer,{th:t,sharedInput:rhythmInput,sharedMicSilent:rhythmMicSilent}))),

      // ─── SESSIONS TAB ───
      view==="sessions"&&React.createElement("div",{style:{padding:"8px 0"}},
        React.createElement(PracticePlan,{th:t,licks:allLicks,savedSet:savedSet,historyKey:historyRefresh,onStartSession:function(plan){try{Tone.start();}catch(e){}setRunningPlan(plan);}}),
        React.createElement(PracticeHistory,{th:t,historyKey:historyRefresh})),

      // ─── ME TAB ───
      view==="me"&&React.createElement("div",{style:{padding:"8px 0"}},

        // ─── QUICK STATS ───
        React.createElement("div",{style:{display:"flex",gap:8,marginBottom:20}},
          [{label:"Saved",value:savedSet.size+myLicks.length,icon:isStudio?IC.target(16,"#22D89E"):React.createElement("span",{style:{fontSize:16,color:"#F59E0B"}},"\u2605")},
           {label:"Streak",value:streakDays,icon:IC.flame(16,isStudio?"#F97316":"#EF4444",true)},
           {label:"Hours",value:totalHours,icon:IC.tabRhythm(16,isStudio?"#3B82F6":"#2563EB",true)}].map(function(s,i){
            return React.createElement("div",{key:i,style:{flex:1,background:t.card,borderRadius:14,padding:"14px 12px",border:"1px solid "+t.border,textAlign:"center",boxShadow:isStudio?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 8px rgba(0,0,0,0.04)"}},
              React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:4,height:18,marginBottom:4}},
                s.icon),
              React.createElement("div",{style:{fontSize:22,fontWeight:700,color:t.text,fontFamily:"'JetBrains Mono',monospace"}},s.value),
              React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:2}},s.label));})),

        // ─── SAVED LICKS ───
        React.createElement("div",{style:{marginBottom:20}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}},
            React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"SAVED LICKS"),
            savedSet.size>0&&React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},savedSet.size+" lick"+(savedSet.size!==1?"s":""))),
          savedSet.size===0&&myLicks.length===0?React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,padding:"20px 16px",textAlign:"center"}},
            React.createElement("span",{style:{fontSize:12,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"Save licks with "+(isStudio?"the target \u2299":"the star \u2605")+" or create your own")):
          React.createElement("div",{style:{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:4}},
            licks.filter(function(l){return savedSet.has(l.id);}).concat(myLicks).map(function(lick){
              var cc=getCatColor(lick.category,t);
              return React.createElement("button",{key:lick.id,onClick:function(){openLick(lick);},style:{minWidth:140,maxWidth:160,flexShrink:0,background:t.card,borderRadius:12,border:"1px solid "+(isStudio?cc+"25":t.border),padding:"12px",cursor:"pointer",textAlign:"left",boxShadow:isStudio?"0 2px 12px "+cc+"15":"0 1px 4px rgba(0,0,0,0.04)"}},
                isStudio&&React.createElement("div",{style:{width:20,height:3,borderRadius:2,background:cc,marginBottom:8}}),
                React.createElement("div",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.title),
                React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.artist),
                React.createElement("div",{style:{fontSize:9,color:cc,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,marginTop:4}},lick.category));}))),

        // ─── LIKED LICKS ───
        React.createElement("div",{style:{marginBottom:20}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}},
            React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},"LIKED LICKS"),
            likedSet.size>0&&React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},likedSet.size+" lick"+(likedSet.size!==1?"s":""))),
          likedSet.size===0?React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,padding:"20px 16px",textAlign:"center"}},
            React.createElement("span",{style:{fontSize:12,color:t.subtle,fontFamily:"'Inter',sans-serif"}},isStudio?"Flame licks you love \uD83D\uDD25 to see them here":"Like licks you love \u2764\uFE0F to see them here")):
          React.createElement("div",{style:{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:4}},
            licks.filter(function(l){return likedSet.has(l.id);}).map(function(lick){
              var cc=getCatColor(lick.category,t);
              return React.createElement("button",{key:lick.id,onClick:function(){openLick(lick);},style:{minWidth:140,maxWidth:160,flexShrink:0,background:t.card,borderRadius:12,border:"1px solid "+(isStudio?cc+"25":t.border),padding:"12px",cursor:"pointer",textAlign:"left",boxShadow:isStudio?"0 2px 12px "+cc+"15":"0 1px 4px rgba(0,0,0,0.04)"}},
                isStudio&&React.createElement("div",{style:{width:20,height:3,borderRadius:2,background:cc,marginBottom:8}}),
                React.createElement("div",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.title),
                React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.artist),
                React.createElement("div",{style:{fontSize:9,color:cc,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,marginTop:4}},lick.category));}))),

        // Version info
        React.createElement("div",{style:{textAlign:"center",padding:"24px 0",marginTop:16}},
          React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}},"\u00C9tudy \u00B7 Beta \u00B7 Jazz Lick Collection"))),

    // BOTTOM TAB BAR
    React.createElement("div",{style:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,zIndex:100,background:t.tabBarBg||t.headerBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:"1px solid "+(isStudio?t.borderSub||t.border:t.border),display:"flex",padding:"6px 16px",paddingBottom:"calc(8px + env(safe-area-inset-bottom, 0px))"}},
      [["explore","tabLicks","Licks"],["train","tabTrain","Train"],["sessions","tabSessions","Sessions"],["me","tabMe","Me"]].map(function(tab){
        var active=view===tab[0];var iconC=active?t.accent:t.subtle;
        return React.createElement("button",{key:tab[0],onClick:function(){switchView(tab[0]);},style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 0",transition:"all 0.15s"}},
          IC[tab[1]](20,iconC,active),
          React.createElement("span",{style:{fontSize:9,fontFamily:"'Inter',sans-serif",fontWeight:active?600:400,color:active?t.accent:t.subtle,letterSpacing:0.3}},tab[2]));})),
    // FAB — only on explore
    view==="explore"&&React.createElement("button",{"data-coach":"fab",onClick:()=>sSE(true),style:{position:"fixed",bottom:"calc(84px + env(safe-area-inset-bottom, 0px))",right:24,width:isStudio?56:52,height:isStudio?56:52,borderRadius:isStudio?18:16,background:t.playBg||t.accent,border:"none",cursor:"pointer",zIndex:500,boxShadow:isStudio?"0 6px 28px "+t.accentGlow+", 0 2px 8px rgba(0,0,0,0.3)":"0 4px 20px "+t.accentGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontWeight:300}},"+"),
    // Overlays
    feedShowTips&&view==="explore"&&!selectedLick&&!showEd&&React.createElement(CoachMarks,{tips:FEED_TIPS,onDone:markFeedTipped,th:t}),
    earShowTips&&view==="train"&&trainSub==="ear"&&!selectedLick&&React.createElement(CoachMarks,{tips:EAR_TIPS,onDone:markEarTipped,th:t}),
    rhythmShowTips&&view==="train"&&trainSub==="rhythm"&&React.createElement(CoachMarks,{tips:RHYTHM_TIPS,onDone:markRhythmTipped,th:t}),
    selectedLick&&React.createElement(LickDetail,{key:selectedLick.id,lick:selectedLick,onBack:closeLick,th:t,liked:likedSet.has(selectedLick.id),saved:savedSet.has(selectedLick.id),onLike:toggleLike,onSave:toggleSave,showTips:detailShowTips,onTipsDone:markDetailTipped,onReShowTips:detailTipped?function(){setDetailShowTips(true);}:null,defaultInst:userInst,onDeletePrivate:deletePrivateLick}),
    showEd&&React.createElement(Editor,{onClose:()=>sSE(false),onSubmit:addLick,onSubmitPrivate:addPrivateLick,th:t}),
    runningPlan&&React.createElement(PlanRunner,{plan:runningPlan,onClose:function(){setRunningPlan(null);},th:t,licks:allLicks,userInst:userInst,keyProgress:keyProgress,onUpdateKeyProgress:onUpdateKeyProgress,onSessionSaved:function(){setHistoryRefresh(function(k){return k+1;});var s=getStg();if(s)s.get("practice-log").then(function(r){if(r&&r.value){try{var sess=JSON.parse(r.value);calcStreak(sess);calcHours(sess);}catch(e){}}}).catch(function(){});}}),
    // Settings sheet
    showSettings&&React.createElement("div",{onClick:function(){setShowSettings(false);},style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:2000,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.15s ease"}},
      React.createElement("div",{onClick:function(e){e.stopPropagation();},style:{width:"100%",maxWidth:520,background:t.card,borderTopLeftRadius:20,borderTopRightRadius:20,padding:"0 20px 32px",maxHeight:"70vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)"}},
        // Pull bar
        React.createElement("div",{style:{display:"flex",justifyContent:"center",padding:"12px 0 16px"}},
          React.createElement("div",{style:{width:36,height:4,borderRadius:2,background:t.border}})),
        // Header
        React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
            IC.gear(18,t.muted),
            React.createElement("span",{style:{fontSize:16,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"}},"Settings")),
          React.createElement("button",{onClick:function(){setShowSettings(false);},style:{background:"none",border:"none",cursor:"pointer",fontSize:18,color:t.muted,padding:"4px"}},"\u00D7")),
        // Instrument
        React.createElement("div",{style:{marginBottom:24}},
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:10}},"INSTRUMENT"),
          React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
            ["Concert","Alto Sax","Tenor Sax","Bb Trumpet","Clarinet","Trombone","Flute"].map(function(name){
              return React.createElement("button",{key:name,onClick:function(){changeUserInst(name);},style:{padding:"8px 14px",borderRadius:10,border:userInst===name?"1.5px solid "+t.accent:"1.5px solid "+t.border,background:userInst===name?(isStudio?t.accent+"15":t.accent+"08"):"transparent",color:userInst===name?t.text:t.muted,fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:userInst===name?600:400,cursor:"pointer",transition:"all 0.15s"}},name);})),
          userInst!=="Concert"&&React.createElement("p",{style:{fontSize:11,color:t.accent,fontFamily:"'Inter',sans-serif",marginTop:8,fontStyle:"italic"}},"All notation auto-transposed for "+userInst)),
        // Theme
        React.createElement("div",{style:{marginBottom:24}},
          React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:10}},"THEME"),
          React.createElement("div",{style:{display:"flex",gap:8}},
            [["classic","Light","Clean, editorial feel"],["studio","Dark","Vibrant, musician-first"]].map(function(x){
              var sel=theme===x[0];
              return React.createElement("button",{key:x[0],onClick:function(){setTheme(x[0]);},style:{flex:1,padding:"16px 14px",borderRadius:14,border:sel?"1.5px solid "+t.accent:"1.5px solid "+t.border,background:sel?(isStudio?t.accent+"15":t.accent+"08"):"transparent",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}},
                React.createElement("div",{style:{fontSize:13,fontWeight:600,color:sel?t.text:t.muted,fontFamily:"'Inter',sans-serif",marginBottom:2}},x[1]),
                React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif"}},x[2]));}))),
        // Version
        React.createElement("div",{style:{textAlign:"center",paddingTop:16,borderTop:"1px solid "+t.border}},
          React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}},"\u00C9tudy \u00B7 Beta"))))
    ));}
