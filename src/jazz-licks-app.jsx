import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { supabase, signInWithGoogle, signInWithMagicLink, verifyOtp, signOut, getSession, onAuthStateChange, fetchProfile, updateProfile } from "./supabase.js";


const ABCJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/abcjs/6.4.1/abcjs-basic-min.js";
const VEXFLOW_CDN = "https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js";
const INST_LIST = ["All","Alto Sax","Soprano Sax","Tenor Sax","Baritone Sax","Trumpet","Piano","Guitar","Bass","Trombone","Flute","Clarinet","Vibes","Violin","Vocals"];
const CAT_LIST = ["All","ii-V-I","Minor ii-V-I","Blues","Bebop","Modal","Pentatonic","Chromatic","Enclosure","Turnaround"];

// ============================================================
// THEMES
// ============================================================
const TH={
  classic:{
    name:"Classic",desc:"Light, editorial, elegant",
    bg:"#EEEDE6",card:"#fff",border:"#E0DFD8",borderSub:"#E8E7E3",
    text:"#1A1A1A",muted:"#8E8E93",subtle:"#B0AFA8",dimBorder:"#C5C4BE",
    accent:"#6366F1",accentBg:"rgba(99,102,241,0.08)",accentBorder:"rgba(99,102,241,0.2)",accentGlow:"rgba(99,102,241,0.2)",
    noteBg:"#fff",noteStroke:"#1C1C1C",staffStroke:"#D0CFC8",barStroke:"#B8B7B0",chordFill:"#6366F1",metaFill:"#8E8E93",
    headerBg:"rgba(238,237,230,0.88)",filterBg:"#E8E7E0",inputBg:"#FAFAF6",inputBorder:"#E0DFD8",
    titleFont:"'Instrument Serif',Georgia,serif",
    playBg:"#6366F1",progressBg:"#E8E7E3",pillBg:"#fff",pillBorder:"#E8E7E3",
    settingsBg:"#FAFAF6",activeTabBg:"#fff",
  },
  studio:{
    name:"Studio",desc:"Dark, vibrant, musician-first",
    bg:"#08080F",card:"#12121E",cardRaised:"#16162A",border:"#1C1C30",borderSub:"#252540",
    text:"#F2F2FA",muted:"#8888A0",subtle:"#55556A",dimBorder:"#333348",
    accent:"#22D89E",accentBg:"rgba(34,216,158,0.12)",accentBorder:"rgba(34,216,158,0.35)",accentGlow:"rgba(34,216,158,0.3)",
    noteBg:"#16162A",noteStroke:"#E8E8F4",staffStroke:"#3A3A54",barStroke:"#50506A",chordFill:"#22D89E",metaFill:"#9898B0",
    headerBg:"rgba(14,14,26,0.97)",tabBarBg:"rgba(14,14,26,0.97)",filterBg:"#10101A",inputBg:"#10101A",inputBorder:"#1C1C30",
    titleFont:"'Inter',sans-serif",
    playBg:"linear-gradient(135deg,#22D89E,#1AB87A)",playFlat:"#22D89E",progressBg:"#1A1A28",pillBg:"#10101A",pillBorder:"#252540",
    settingsBg:"#0C0C16",activeTabBg:"#1E1E35",
  }
};

// Category & instrument colors for Studio theme
const CAT_COL={"ii-V-I":"#22D89E","Minor ii-V-I":"#818CF8","Blues":"#A78BFA","Bebop":"#F59E0B","Modal":"#3B82F6","Pentatonic":"#EC4899","Chromatic":"#EF4444","Enclosure":"#F97316","Turnaround":"#06B6D4"};
const INST_COL={"Alto Sax":"#A78BFA","Soprano Sax":"#10B981","Tenor Sax":"#8B5CF6","Baritone Sax":"#7C3AED","Trumpet":"#F59E0B","Piano":"#3B82F6","Guitar":"#EF4444","Bass":"#0EA5E9","Trombone":"#F97316","Flute":"#EC4899","Clarinet":"#06B6D4","Vibes":"#84CC16","Violin":"#D97706","Vocals":"#F43F5E"};
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
  tabScales:(sz=20,c="#888",a=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M4 20L8 6l4 8 4-12 4 14",stroke:c,strokeWidth:a?2:1.5,strokeLinecap:"round",strokeLinejoin:"round",fill:"none"}),
    a&&S("circle",{cx:8,cy:6,r:1.5,fill:c}),
    a&&S("circle",{cx:16,cy:2,r:1.5,fill:c})),
  iconMetronome:(sz=20,c="#888")=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0}},
    S("path",{d:"M8 21l4-17 4 17",stroke:c,strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}),
    S("path",{d:"M6.5 21h11",stroke:c,strokeWidth:1.8,strokeLinecap:"round"}),
    S("path",{d:"M12 10l5-6",stroke:c,strokeWidth:1.8,strokeLinecap:"round"}),
    S("circle",{cx:17.5,cy:3.5,r:1.5,fill:c})),
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
  // X-Ray / Theory mode icon — magnifying glass with music note
  xray:(sz=16,c="#22D89E",active=false)=>S("svg",{width:sz,height:sz,viewBox:"0 0 24 24",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0,filter:active?"drop-shadow(0 0 6px "+c+"60)":"none"}},
    S("circle",{cx:11,cy:11,r:7,stroke:c,strokeWidth:active?2:1.5,fill:active?c+"15":"none"}),
    S("path",{d:"M16.5 16.5L21 21",stroke:c,strokeWidth:active?2:1.5,strokeLinecap:"round"}),
    S("path",{d:"M11 8v5l2.5-1.5",stroke:c,strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",fill:"none"})),
  // Inline play triangle + stop square for buttons with text
  playInline:(sz=12,c="#fff")=>S("svg",{width:sz,height:sz,viewBox:"0 0 12 12",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0,marginRight:4}},
    S("path",{d:"M3 1.5L10.5 6 3 10.5z",fill:c})),
  stopInline:(sz=12,c="#fff")=>S("svg",{width:sz,height:sz,viewBox:"0 0 12 12",fill:"none",style:{display:"inline-block",verticalAlign:"middle",flexShrink:0,marginRight:4}},
    S("rect",{x:2,y:2,width:8,height:8,rx:1,fill:c})),
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
  {target:"[data-coach='rhythm-metro']",text:"Metronome, sight-reading & polyrhythms",pos:"below"},
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

const SAMPLE_LICKS = [  { id:1, title:"Classic Charlie Parker ii-V-I", artist:"Charlie Parker", instrument:"Alto Sax", category:"ii-V-I", key:"C Major", tempo:180, feel:"swing", abc:'X:1\nT:Parker ii-V-I\nM:4/4\nL:1/8\nQ:1/4=180\nK:C\n"Dm7"d2 fe dc BA | "G7"B2 AG ^FG AB | "Cmaj7"c4 z4 |', youtubeId:"hkDjOjfUbJM", youtubeStart:45, spotifyId:"4a7NbEGRb3MGnSJQyjsiv5", likes:234, user:"BirdLover42", tags:["bebop","essential"], description:"The quintessential Bird lick over a ii-V-I in C." },
  { id:2, title:"Coltrane Pentatonic Run", artist:"John Coltrane", instrument:"Tenor Sax", category:"Pentatonic", key:"Bb Major", tempo:160, feel:"straight", abc:"X:1\nT:Coltrane Pentatonic\nM:4/4\nL:1/16\nQ:1/4=160\nK:Bb\n\"Bbmaj7\"B2cd efga | bagf edcB | \"Eb7\"e2fg abc'b | agfe dcBA |", youtubeId:"TsgGbgWDOuo", youtubeStart:120, spotifyId:"7aBo1GlChOBEEreEHqB7EY", likes:189, user:"TraneFanatic", tags:["modal","advanced"], description:"A flowing pentatonic idea from Trane's modal period." },
  { id:3, title:"Clifford Brown Turnaround", artist:"Clifford Brown", instrument:"Trumpet", category:"Turnaround", key:"F Major", tempo:140, feel:"swing", abc:'X:1\nT:Brownie Turnaround\nM:4/4\nL:1/8\nQ:1/4=140\nK:F\n"Fmaj7"f2 ed cA GF | "D7"^F2 AB cd ef | "Gm7"g2 fe dc BA | "C7"G2 AB c4 |', youtubeId:"p9VOoYfIFek", youtubeStart:30, likes:156, user:"BrownieJazz", tags:["turnaround","hard-bop"], description:"Brownie's elegant turnaround lick." },
  { id:4, title:"Bill Evans Shell Voicings", artist:"Bill Evans", instrument:"Piano", category:"ii-V-I", key:"D Minor", tempo:120, feel:"straight", abc:'X:1\nT:Evans Shells\nM:4/4\nL:1/4\nQ:1/4=120\nK:Dm\n"Em7b5"[EB]2 [EA]2 | "A7"[^CG]2 [^CF]2 | "Dm7"[DA]4 |', youtubeId:"bJBgtAIC5Wk", youtubeStart:60, likes:312, user:"EvansKeys", tags:["voicings","essential"], description:"Bill Evans' signature shell voicing approach." },
  { id:5, title:"Wes Montgomery Octave Lick", artist:"Wes Montgomery", instrument:"Guitar", category:"Blues", key:"Bb Major", tempo:130, feel:"swing", abc:'X:1\nT:Wes Octaves\nM:4/4\nL:1/8\nQ:1/4=130\nK:Bb\n"Bb7"B,2 D2 F2 A2 | B2 AF DB, z2 | "Eb7"E,2 G,2 B,2 d2 | e2 dB G,E, z2 |', youtubeId:"MOm17yw__tE", youtubeStart:15, likes:201, user:"OctaveKing", tags:["octaves","blues"], description:"Wes's trademark octave technique." }
];

// ============================================================
// SUPABASE HELPERS
// ============================================================
function dbToLick(row) {
  var profile = row.profiles || {};
  var displayName = profile.username || row.username || 'Anonymous';
  return {
    id: row.id,
    title: row.title,
    artist: row.artist || '',
    tune: row.tune || '',
    instrument: row.instrument || 'Alto Sax',
    category: row.category || 'ii-V-I',
    key: row.key || 'C',
    tempo: row.tempo || 120,
    abc: row.abc || '',
    youtubeId: row.youtube_id || null,
    youtubeStart: row.youtube_start || 0,
    youtubeEnd: row.youtube_end || null,
    spotifyId: row.spotify_id || null,
    likes: row.likes || 0,
    user: displayName,
    userId: row.user_id || null,
    tags: row.tags || [],
    description: row.description || '',
    feel: row.feel || 'straight',
    status: row.status || 'approved',
    reports: row.reports || 0,
  };
}
function countAbcNotes(abcStr){try{var p=parseAbc(abcStr);return p.events.filter(function(e){return e.tn&&e.tn.length>0;}).length;}catch(e){return 0;}}
function lickToDb(d) {
  return {
    title: d.title,
    artist: d.artist || '',
    tune: d.tune || '',
    instrument: d.instrument || 'Alto Sax',
    category: d.category || 'ii-V-I',
    key: d.key || 'C',
    tempo: d.tempo || 120,
    feel: d.feel || 'straight',
    abc: d.abc || '',
    youtube_id: d.youtubeId || null,
    youtube_start: d.youtubeStart || 0,
    youtube_end: d.youtubeEnd || null,
    spotify_id: d.spotifyId || null,
    likes: 0,
    reports: 0,
    status: 'approved',
    username: d.user || 'Anonymous',
    user_id: d.userId || null,
    tags: d.tags || [],
    description: d.description || '',
  };
}
async function fetchLicks() {
  try {
    const { data, error } = await supabase
      .from('licks')
      .select('*, profiles(display_name, username)')
      .neq('status','reported')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(dbToLick);
  } catch (e) {
    console.warn('Supabase fetch failed, using sample licks:', e);
    return null; // signals fallback
  }
}
async function reportLick(id) {
  try {
    // Increment reports count; auto-hide if >= 3
    const { data, error } = await supabase.from('licks').select('reports').eq('id', id).single();
    if (error) throw error;
    var newCount = (data.reports || 0) + 1;
    var updates = { reports: newCount };
    if (newCount >= 3) updates.status = 'reported';
    await supabase.from('licks').update(updates).eq('id', id);
    return newCount;
  } catch (e) {
    console.error('Failed to report lick:', e);
    return null;
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

// ── User Licks (server-side likes & saves) ──
async function fetchUserLicks(userId) {
  try {
    const { data, error } = await supabase
      .from('user_licks')
      .select('lick_id, type')
      .eq('user_id', userId);
    if (error) throw error;
    var likes = new Set();
    var saves = new Set();
    (data || []).forEach(function(row) {
      if (row.type === 'like') likes.add(row.lick_id);
      if (row.type === 'save') saves.add(row.lick_id);
    });
    return { likes: likes, saves: saves };
  } catch (e) {
    console.error('Failed to fetch user licks:', e);
    return { likes: new Set(), saves: new Set() };
  }
}

async function addUserLick(userId, lickId, type) {
  try {
    await supabase.from('user_licks').upsert(
      { user_id: userId, lick_id: lickId, type: type },
      { onConflict: 'user_id,lick_id,type' }
    );
  } catch (e) {
    console.error('Failed to add user lick:', e);
  }
}

async function removeUserLick(userId, lickId, type) {
  try {
    await supabase.from('user_licks')
      .delete()
      .eq('user_id', userId)
      .eq('lick_id', lickId)
      .eq('type', type);
  } catch (e) {
    console.error('Failed to remove user lick:', e);
  }
}

// ── Public Profile helpers ──
async function fetchPublicProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, instrument, bio, avatar_url, streak, licks_learned, badge_flags')
      .eq('id', userId)
      .eq('is_public', true)
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('fetchPublicProfile failed:', e);
    return null;
  }
}

async function fetchPublicLicksByUser(username) {
  try {
    // First resolve username -> user_id via profiles
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .or('username.eq.' + username + ',display_name.eq.' + username)
      .single();
    var query = supabase
      .from('licks')
      .select('*, profiles(display_name, username)')
      .neq('status', 'reported')
      .neq('status', 'private')
      .order('created_at', { ascending: false });
    if (prof && prof.id) {
      query = query.eq('user_id', prof.id);
    } else {
      query = query.eq('username', username);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map(dbToLick);
  } catch (e) {
    console.warn('fetchPublicLicksByUser failed:', e);
    return [];
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

const INST_TRANS = {"Concert":0,"Alto Sax":9,"Soprano Sax":2,"Tenor Sax":14,"Baritone Sax":21,"Bb Trumpet":2,"Clarinet":2,"Trombone":0,"Piano":0,"Guitar":0,"Bass":0,"Flute":0,"Vibes":0,"Violin":0,"Vocals":0};
const TRANS_INSTRUMENTS = ["Concert","Alto Sax","Soprano Sax","Tenor Sax","Baritone Sax","Bb Trumpet","Clarinet","Trombone","Flute","Bass"];
// Maps profile instrument names → INST_TRANS keys (for offset lookup)
const INST_TO_TRANS={"Alto Sax":"Alto Sax","Soprano Sax":"Soprano Sax","Tenor Sax":"Tenor Sax","Baritone Sax":"Baritone Sax","Trumpet":"Bb Trumpet","Bb Trumpet":"Bb Trumpet","Clarinet":"Clarinet","Trombone":"Trombone","Flute":"Flute","Bass":"Bass","Piano":"Concert","Guitar":"Concert","Vibes":"Concert","Violin":"Concert","Vocals":"Concert","Concert":"Concert"};
function instToTransKey(inst){return INST_TO_TRANS[inst]||"Concert";}
// For userInst storage — keeps actual name so BASS_CLEF_INSTS works correctly
function instToUserInst(inst){
  // Normalize "Trumpet" → "Bb Trumpet", everything else stays as-is
  if(inst==="Trumpet")return "Bb Trumpet";
  return inst||"Concert";
}
const BASS_CLEF_INSTS = new Set(["Bass","Trombone"]);
function injectBassClef(abc){
  var shifted=transposeAbc(abc,-12);
  return shifted.replace(/(K:[^\n]*)/,function(m){return m.includes("clef")?m:m+" clef=bass";});
}

// ============================================================
// MUSIC THEORY
// ============================================================
const KEY_SIG={C:{},"Am":{},G:{f:1},"Em":{f:1},D:{f:1,c:1},"Bm":{f:1,c:1},A:{f:1,c:1,g:1},E:{f:1,c:1,g:1,d:1},B:{f:1,c:1,g:1,d:1,a:1},"F#":{f:1,c:1,g:1,d:1,a:1,e:1},"C#":{f:1,c:1,g:1,d:1,a:1,e:1,b:1},F:{b:-1},"Dm":{b:-1},Bb:{b:-1,e:-1},"Gm":{b:-1,e:-1},Eb:{b:-1,e:-1,a:-1},"Cm":{b:-1,e:-1,a:-1},Ab:{b:-1,e:-1,a:-1,d:-1},"Fm":{b:-1,e:-1,a:-1,d:-1},Db:{b:-1,e:-1,a:-1,d:-1,g:-1},Gb:{b:-1,e:-1,a:-1,d:-1,g:-1,c:-1}};
const N2M={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const KEY_NAMES=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const FLAT_ROOTS=new Set([1,3,5,8,10]);
const SHARP_ABC=[{n:"C",a:""},{n:"C",a:"^"},{n:"D",a:""},{n:"D",a:"^"},{n:"E",a:""},{n:"F",a:""},{n:"F",a:"^"},{n:"G",a:""},{n:"G",a:"^"},{n:"A",a:""},{n:"A",a:"^"},{n:"B",a:""}];
const FLAT_ABC=[{n:"C",a:""},{n:"D",a:"_"},{n:"D",a:""},{n:"E",a:"_"},{n:"E",a:""},{n:"F",a:""},{n:"G",a:"_"},{n:"G",a:""},{n:"A",a:"_"},{n:"A",a:""},{n:"B",a:"_"},{n:"B",a:""}];
function chordToNotes(cn,baseOct){let r=cn.trim();if(!r)return[];let root=r[0].toUpperCase(),ri=1;if(ri<r.length&&(r[ri]==="b"||r[ri]==="#"))ri++;const rs=r.substring(0,ri),q=r.substring(ri).toLowerCase().replace(/[()]/g,"");let st=N2M[rs[0]]||0;if(rs.includes("b"))st--;if(rs.includes("#"))st++;st=((st%12)+12)%12;let iv;if(q.includes("mmaj7")||q.includes("m(maj7)")||q==="mmaj7")iv=[0,3,7,11];else if(q.includes("maj7#11"))iv=[0,4,6,7,11];else if(q.includes("maj9"))iv=[0,4,7,11,14];else if(q.includes("maj7"))iv=[0,4,7,11];else if(q.includes("m7b5"))iv=[0,3,6,10];else if(q.includes("dim7"))iv=[0,3,6,9];else if(q.includes("dim"))iv=[0,3,6,9];else if(q.includes("7alt"))iv=[0,4,6,10,13];else if(q.includes("13b9"))iv=[0,4,7,10,13,21];else if(q.includes("7b9"))iv=[0,4,7,10,13];else if(q.includes("7#9"))iv=[0,4,7,10,15];else if(q.includes("7#11"))iv=[0,4,6,7,10];else if(q.includes("7b13"))iv=[0,4,7,10,20];else if(q.includes("7#5")||q.includes("aug7"))iv=[0,4,8,10];else if(q.includes("m9"))iv=[0,3,7,10,14];else if(q.includes("m7"))iv=[0,3,7,10];else if(q.includes("m6"))iv=[0,3,7,9];else if(q.includes("m"))iv=[0,3,7];else if(q.includes("aug"))iv=[0,4,8];else if(q.includes("13"))iv=[0,4,7,10,14,21];else if(q.includes("9"))iv=[0,4,7,10,14];else if(q.includes("7"))iv=[0,4,7,10];else if(q.includes("6"))iv=[0,4,7,9];else if(q.includes("sus4"))iv=[0,5,7];else iv=[0,4,7];const bo=baseOct||4;const nn=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];return iv.map(i=>{const pc=((st+i)%12+12)%12;const oct=i>=12?bo+1:bo;return nn[pc]+oct;});}
// Bass note: root of chord in octave 2
function chordBassNote(cn){let r=cn.trim();if(!r)return null;let ri=1;if(ri<r.length&&(r[ri]==="b"||r[ri]==="#"))ri++;const rs=r.substring(0,ri);let st=N2M[rs[0].toUpperCase()]||0;if(rs.includes("b"))st--;if(rs.includes("#"))st++;st=((st%12)+12)%12;const nn=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];return nn[st]+"2";}
// Walking bass: root, 5th, approach note patterns
function walkingBassNotes(cn,nextCn){let r=cn.trim();if(!r)return[];let ri=1;if(ri<r.length&&(r[ri]==="b"||r[ri]==="#"))ri++;const rs=r.substring(0,ri),q=r.substring(ri).toLowerCase();let st=N2M[rs[0].toUpperCase()]||0;if(rs.includes("b"))st--;if(rs.includes("#"))st++;st=((st%12)+12)%12;const nn=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];const root=nn[st]+"2";const fifth=nn[((st+7)%12)]+"2";// 3rd based on quality
const third=q.includes("m")?nn[((st+3)%12)]+"2":nn[((st+4)%12)]+"2";// approach to next root
let approach=null;if(nextCn){let nri=1;const nr=nextCn.trim();if(nri<nr.length&&(nr[nri]==="b"||nr[nri]==="#"))nri++;const nrs=nr.substring(0,nri);let nst=N2M[nrs[0].toUpperCase()]||0;if(nrs.includes("b"))nst--;if(nrs.includes("#"))nst++;nst=((nst%12)+12)%12;const apSt=((nst-1)%12+12)%12;approach=nn[apSt]+"2";}
return[root,fifth,third,approach||fifth];}

// BACKING STYLES
const BACKING_STYLES=[
{id:"piano",label:"Piano Only",emoji:"\uD83C\uDFB9"},
{id:"rhodes",label:"Rhodes Only",emoji:"\uD83C\uDF1F"},
{id:"jazz",label:"Jazz Trio",emoji:"\uD83C\uDFB7"},
{id:"bossa",label:"Bossa Nova",emoji:"\uD83C\uDF34"},
{id:"ballad",label:"Ballad",emoji:"\uD83C\uDF19"}
];

// ============================================================
// THEORY ANALYSIS ENGINE — X-Ray Mode
// ============================================================

// Interval names by semitone distance from root
var INTERVAL_LABELS=["R","b9","9","b3","3","11","b5","5","#5","6","b7","7"];
// Extended labels for >12 semitones
var INTERVAL_LABELS_EXT={0:"R",1:"b9",2:"9",3:"b3",4:"3",5:"11",6:"b5",7:"5",8:"#5",9:"6",10:"b7",11:"7",13:"b9",14:"9"};

// Chord quality → set of chord tone intervals (semitones from root)
var CHORD_TONE_MAP={
  "maj7":[0,4,7,11],"maj9":[0,4,7,11,14],"maj7#11":[0,4,6,7,11],"maj9#11":[0,4,6,7,11,14],
  "6":[0,4,7,9],"69":[0,4,7,9,14],
  "7":[0,4,7,10],"9":[0,4,7,10,14],"13":[0,4,7,10,14,21],
  "7b9":[0,4,7,10,13],"7#9":[0,4,7,10,15],"7#11":[0,4,6,7,10],"9#11":[0,4,6,7,10,14],"13#11":[0,4,6,7,10,14,21],
  "7b13":[0,4,7,10,20],"7#5":[0,4,8,10],"7alt":[0,4,6,10,13],"13b9":[0,4,7,10,13,21],
  "m7":[0,3,7,10],"m9":[0,3,7,10,14],"m6":[0,3,7,9],"m":[0,3,7],
  "mmaj7":[0,3,7,11],"m(maj7)":[0,3,7,11],
  "m7b5":[0,3,6,10],
  "dim":[0,3,6,9],"dim7":[0,3,6,9],
  "aug":[0,4,8],"aug7":[0,4,8,10],
  "sus4":[0,5,7],"sus2":[0,2,7],"7sus4":[0,5,7,10],
  "maj":[0,4,7],"":[0,4,7]
};

// Scale definitions: name → array of semitone intervals from root
var SCALE_DEFS=[
  {name:"Mixolydian",notes:[0,2,4,5,7,9,10],ctx:["7","9","13"]},
  {name:"Dorian",notes:[0,2,3,5,7,9,10],ctx:["m7","m9"]},
  {name:"Ionian",notes:[0,2,4,5,7,9,11],ctx:["maj7","maj9","6",""]},
  {name:"Aeolian",notes:[0,2,3,5,7,8,10],ctx:["m7","m"]},
  {name:"Lydian",notes:[0,2,4,6,7,9,11],ctx:["maj7","maj7#11"]},
  {name:"Lydian Dominant",notes:[0,2,4,6,7,9,10],ctx:["7","7#11"]},
  {name:"Altered",notes:[0,1,3,4,6,8,10],ctx:["7","7alt","7b9","7#9","7b13"]},
  {name:"HW Diminished",notes:[0,1,3,4,6,7,9,10],ctx:["7","7b9","dim"]},
  {name:"WH Diminished",notes:[0,2,3,5,6,8,9,11],ctx:["dim","dim7"]},
  {name:"Melodic Minor",notes:[0,2,3,5,7,9,11],ctx:["m6","mmaj7"]},
  {name:"Harmonic Minor",notes:[0,2,3,5,7,8,11],ctx:["mmaj7"]},
  {name:"Whole Tone",notes:[0,2,4,6,8,10],ctx:["aug","7#5"]},
  {name:"Blues",notes:[0,3,5,6,7,10],ctx:["7","m7"]},
  {name:"Minor Pentatonic",notes:[0,3,5,7,10],ctx:["m7","7"]},
  {name:"Major Pentatonic",notes:[0,2,4,7,9],ctx:["maj7","6","7"]},
  {name:"Bebop Dominant",notes:[0,2,4,5,7,9,10,11],ctx:["7","9","13"]},
  {name:"Bebop Major",notes:[0,2,4,5,7,8,9,11],ctx:["maj7","6"]},
  {name:"Phrygian",notes:[0,1,3,5,7,8,10],ctx:["m7"]},
  {name:"Locrian",notes:[0,1,3,5,6,8,10],ctx:["m7b5"]},
  {name:"Super Locrian",notes:[0,1,3,4,6,8,10],ctx:["7","7alt"]},
  {name:"Mixolydian b9 b13",notes:[0,1,4,5,7,8,10],ctx:["7","7b9"]},
];

// Parse chord name → {root (0-11), quality string, chordTones set}
function parseChordName(cn){
  if(!cn)return null;
  var r=cn.trim();if(!r)return null;
  var root=r[0].toUpperCase(),ri=1;
  if(ri<r.length&&(r[ri]==="b"||r[ri]==="#"))ri++;
  var rs=r.substring(0,ri),q=r.substring(ri);
  var st=N2M[rs[0]]||0;
  if(rs.includes("b"))st--;if(rs.includes("#"))st++;
  st=((st%12)+12)%12;
  // Normalize quality for lookup — order: most specific first
  var qlower=q.toLowerCase().replace(/[\s()]/g,"");
  var ctKey="";
  // Minor-major7: starts with m+maj (not just "maj7" which contains "m")
  if(qlower.startsWith("mmaj")||qlower.startsWith("minmaj"))ctKey="mmaj7";
  else if(qlower.includes("maj7#11")||qlower.includes("maj9#11"))ctKey=qlower.includes("9")?"maj9#11":"maj7#11";
  else if(qlower.includes("maj7")||qlower.includes("maj9"))ctKey=qlower.includes("9")?"maj9":"maj7";
  else if(qlower.includes("m7b5")||qlower.includes("min7b5")||qlower==="ø"||qlower.includes("halfdim"))ctKey="m7b5";
  else if(qlower.includes("dim7"))ctKey="dim7";
  else if(qlower.includes("dim"))ctKey="dim";
  else if(qlower.includes("aug7")||qlower.includes("7#5"))ctKey="7#5";
  else if(qlower.includes("aug")||qlower.includes("+"))ctKey="aug";
  else if(qlower.includes("m7")||qlower.includes("min7")||qlower.includes("-7"))ctKey="m7";
  else if(qlower.includes("m9")||qlower.includes("min9"))ctKey="m9";
  else if(qlower.includes("m6")||qlower.includes("min6"))ctKey="m6";
  else if(qlower.startsWith("m")||qlower.startsWith("min")||qlower.startsWith("-"))ctKey="m";
  else if(qlower.includes("sus4"))ctKey="sus4";
  else if(qlower.includes("sus2"))ctKey="sus2";
  else if(qlower.includes("7sus"))ctKey="7sus4";
  else if(qlower.includes("7alt"))ctKey="7alt";
  else if(qlower.includes("13b9"))ctKey="13b9";
  else if(qlower.includes("7b9"))ctKey="7b9";
  else if(qlower.includes("7#9"))ctKey="7#9";
  else if(qlower.includes("13#11"))ctKey="13#11";
  else if(qlower.includes("9#11"))ctKey="9#11";
  else if(qlower.includes("7#11"))ctKey="7#11";
  else if(qlower.includes("7b13"))ctKey="7b13";
  else if(qlower.includes("13"))ctKey="13";
  else if(qlower.includes("9"))ctKey="9";
  else if(qlower.includes("7"))ctKey="7";
  else if(qlower.includes("69"))ctKey="69";
  else if(qlower.includes("6"))ctKey="6";
  else ctKey="maj";
  var ct=new Set(CHORD_TONE_MAP[ctKey]||CHORD_TONE_MAP["maj"]);
  return{root:st,quality:ctKey,chordTones:ct,name:cn};
}

// Get interval label for a note relative to a chord
function getNoteInterval(noteName,chordParsed){
  if(!noteName||!chordParsed)return null;
  // Parse note to pitch class
  var n=noteName.replace(/\d+/g,"");
  var pc=N2M[n[0].toUpperCase()]||0;
  if(n.includes("#"))pc++;if(n.includes("b"))pc--;
  pc=((pc%12)+12)%12;
  var interval=((pc-chordParsed.root)%12+12)%12;
  return interval;
}

// Classify: chord-tone, tension, or chromatic/passing
function classifyInterval(semi,chordParsed,scaleTones){
  // Reduce to 0-11
  var iv=((semi%12)+12)%12;
  // Check if it's a chord tone
  if(chordParsed.chordTones.has(iv))return"chord-tone";
  if(chordParsed.chordTones.has(iv+12))return"chord-tone";
  // If a scale was detected, it is the sole authority for tension vs chromatic
  if(scaleTones){
    return scaleTones.has(iv)?"tension":"chromatic";
  }
  // No scale — fallback: natural tensions based on chord quality
  var q=chordParsed.quality;
  if(q==="7"||q==="9"||q==="13"){
    if(iv===2||iv===9||iv===6||iv===1||iv===3||iv===8)return"tension";// 9, 13, #11, b9, #9, b13
  }
  if(q==="m7"||q==="m9"){
    if(iv===2||iv===5||iv===9)return"tension";// 9, 11, 13
  }
  if(q==="maj7"||q==="maj9"){
    if(iv===2||iv===6||iv===9)return"tension";// 9, #11, 13
  }
  if(q==="m7b5"){
    if(iv===2||iv===5||iv===8)return"tension";// 9, 11, b13
  }
  if(iv===2||iv===5||iv===9)return"tension";
  return"chromatic";
}

// Full interval label (e.g. "b9", "3", "#11", etc.)
function getIntervalLabel(semi,chordParsed){
  var iv=((semi%12)+12)%12;
  if(chordParsed){
    var q=chordParsed.quality||"";
    var isMinor=q==="m"||q==="m7"||q==="m9"||q==="m6"||q==="m7b5"||q==="dim"||q==="dim7";
    // Over major/dom chords: b3→#9, #5→b13, b5→#11
    if(!isMinor){
      if(iv===3)return"#9";
      if(iv===8)return"b13";
      if(iv===6)return"#11";
    }
    // Over minor chords: #5→b6 (or b13), b5 stays b5
    if(isMinor){
      if(iv===8)return"b6";
    }
  }
  return INTERVAL_LABELS[iv]||"?";
}

// Detect scale from notes over a chord
function detectScale(noteSet,chordParsed){
  if(!chordParsed)return null;
  var DEFAULT_SCALES={
    "maj7":"Ionian","maj9":"Ionian","6":"Ionian","":"Ionian",
    "7":"Mixolydian","9":"Mixolydian","13":"Mixolydian",
    "m7":"Dorian","m9":"Dorian","m":"Aeolian","m6":"Dorian",
    "m7b5":"Locrian","dim":"WH Diminished","dim7":"WH Diminished",
    "aug":"Whole Tone","7#5":"Whole Tone",
    "7alt":"Altered","7b9":"Altered","7#9":"Altered","7b13":"Altered",
    "7#11":"Lydian Dominant","maj7#11":"Lydian","maj9#11":"Lydian",
    "mmaj7":"Melodic Minor","sus4":"Mixolydian","sus2":"Mixolydian","7sus4":"Mixolydian"
  };
  var defaultScale=DEFAULT_SCALES[chordParsed.quality]||DEFAULT_SCALES[chordParsed.quality.replace(/\d+$/,"")]||"Ionian";
  // No notes at all → return default
  if(!noteSet||noteSet.size===0)return defaultScale;
  // Chord tones (reduced to 0-11)
  var ctArr=CHORD_TONE_MAP[chordParsed.quality]||CHORD_TONE_MAP[""]||[0,4,7];
  var ctSet=new Set(ctArr.map(function(ct){return ct%12;}));
  // Separate played notes into chord tones vs color tones
  var colorNotes=[];var chordToneNotes=[];
  noteSet.forEach(function(n){if(ctSet.has(n))chordToneNotes.push(n);else colorNotes.push(n);});
  // 3rd/7th character of chord
  var hasMaj3=ctSet.has(4),hasMin3=ctSet.has(3);
  var hasb7=ctSet.has(10),hasMaj7=ctSet.has(11);
  var best=null,bestScore=-1;
  for(var si=0;si<SCALE_DEFS.length;si++){
    var sd=SCALE_DEFS[si];
    var scaleSet=new Set(sd.notes);
    // Color tones (tensions/chromatics) count DOUBLE — they reveal the scale
    var colorMatch=0,colorMiss=0;
    for(var ci2=0;ci2<colorNotes.length;ci2++){
      if(scaleSet.has(colorNotes[ci2]))colorMatch++;else colorMiss++;
    }
    // Chord tones: normal weight (most scales contain them anyway)
    var ctMatch=0,ctMiss=0;
    for(var ti=0;ti<chordToneNotes.length;ti++){
      if(scaleSet.has(chordToneNotes[ti]))ctMatch++;else ctMiss++;
    }
    // Weighted score: color tones 2x, chord tones 1x
    var matchScore=colorMatch*2+ctMatch;
    var missScore=colorMiss*2.5+ctMiss*1.5;
    // Context bonus (chord quality matches scale's typical usage)
    var ctxBonus=0;
    for(var ci=0;ci<sd.ctx.length;ci++){if(sd.ctx[ci]===chordParsed.quality){ctxBonus=3;break;}}
    // Quality conflict penalty: scale's 3rd/7th contradicts chord
    var conflictPenalty=0;
    if(hasMaj3&&!hasMin3&&scaleSet.has(3)&&!scaleSet.has(4))conflictPenalty+=5;
    if(hasMin3&&!hasMaj3&&scaleSet.has(4)&&!scaleSet.has(3))conflictPenalty+=5;
    if(hasb7&&!hasMaj7&&scaleSet.has(11)&&!scaleSet.has(10))conflictPenalty+=4;
    if(hasMaj7&&!hasb7&&scaleSet.has(10)&&!scaleSet.has(11))conflictPenalty+=4;
    var score=matchScore-missScore+ctxBonus-conflictPenalty;
    if(score>bestScore){bestScore=score;best=sd;}
  }
  if(best&&bestScore>0)return best.name;
  return defaultScale;
}

// Orientation lock helpers
function lockPortrait(){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock("portrait").catch(function(){});}catch(e){}}
function unlockOrientation(){try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}catch(e){}}

// Analyze a full ABC string: returns {noteAnalysis[], chordScales[]}
function analyzeTheory(abcStr){
  try{
    var p=parseAbc(abcStr);
    var events=p.events,chords=p.chords;
    if(!chords||chords.length===0)return{noteAnalysis:[],chordScales:[],hasChords:false};
    var regions=[];
    for(var ci=0;ci<chords.length;ci++){
      var start=chords[ci].pos;
      var end=ci+1<chords.length?chords[ci+1].pos:Infinity;
      regions.push({chord:chords[ci].name,start:start,end:end,parsed:parseChordName(chords[ci].name)});
    }
    // ── Pass 1: collect notes per chord region + detect scales ──
    var chordNotes={};for(var ri=0;ri<regions.length;ri++)chordNotes[ri]=new Set();
    var pos=0;
    for(var ei=0;ei<events.length;ei++){
      var ev=events[ei];
      if(ev.tn&&ev.tn.length>0){
        var activeIdx=-1;
        for(var ri2=regions.length-1;ri2>=0;ri2--){if(pos>=regions[ri2].start-0.001){activeIdx=ri2;break;}}
        if(activeIdx<0&&regions.length>0)activeIdx=0;
        if(activeIdx>=0&&regions[activeIdx].parsed){
          for(var ni=0;ni<ev.tn.length;ni++){
            var semi=getNoteInterval(ev.tn[ni],regions[activeIdx].parsed);
            chordNotes[activeIdx].add(semi);
          }
        }
      }
      pos+=ev.rL;
    }
    var chordScales=[];var regionScaleTones={};
    for(var ri3=0;ri3<regions.length;ri3++){
      var rg=regions[ri3];
      var scaleName=detectScale(chordNotes[ri3],rg.parsed);
      chordScales.push({chord:rg.chord,scale:scaleName,noteCount:chordNotes[ri3].size});
      // Build scale tone set for this region
      var st=null;
      if(scaleName){
        for(var si=0;si<SCALE_DEFS.length;si++){
          if(SCALE_DEFS[si].name===scaleName){st=new Set(SCALE_DEFS[si].notes);break;}
        }
      }
      regionScaleTones[ri3]=st;
    }
    // ── Pass 2: classify each note with scale awareness ──
    var noteAnalysis=[];var noteIdx=0;pos=0;
    for(var ei2=0;ei2<events.length;ei2++){
      var ev2=events[ei2];
      if(ev2.tn&&ev2.tn.length>0){
        var activeRegion=null;var aIdx=-1;
        for(var ri4=regions.length-1;ri4>=0;ri4--){if(pos>=regions[ri4].start-0.001){activeRegion=regions[ri4];aIdx=ri4;break;}}
        if(!activeRegion&&regions.length>0){activeRegion=regions[0];aIdx=0;}
        var entries=[];
        for(var ni2=0;ni2<ev2.tn.length;ni2++){
          var tn=ev2.tn[ni2];
          if(activeRegion&&activeRegion.parsed){
            var semi2=getNoteInterval(tn,activeRegion.parsed);
            var label=getIntervalLabel(semi2,activeRegion.parsed);
            var type=classifyInterval(semi2,activeRegion.parsed,regionScaleTones[aIdx]);
            entries.push({note:tn,interval:semi2,label:label,type:type,chord:activeRegion.chord});
          }else{
            entries.push({note:tn,interval:null,label:"",type:"unknown",chord:""});
          }
        }
        noteAnalysis.push({noteIdx:noteIdx,entries:entries,chordIdx:aIdx});
        noteIdx++;
      }
      pos+=ev2.rL;
    }
    return{noteAnalysis:noteAnalysis,chordScales:chordScales,hasChords:true};
  }catch(e){console.warn("analyzeTheory error:",e);return{noteAnalysis:[],chordScales:[],hasChords:false};}
}

// Color for theory labels — integrated with theme palette
var THEORY_COLORS={
  "chord-tone":{light:"#6366F1",dark:"#22D89E"},// accent color of each theme
  "tension":{light:"#C27B1A",dark:"#FBBF24"},// warm amber
  "chromatic":{light:"#C2185B",dark:"#F472B6"},// rose/pink
  "unknown":{light:"#8E8E93",dark:"#8888A0"}
};
function getTheoryColor(type,isStudio){return isStudio?(THEORY_COLORS[type]||THEORY_COLORS["unknown"]).dark:(THEORY_COLORS[type]||THEORY_COLORS["unknown"]).light;}

// ============================================================
// ENHARMONIC RESPELLING ENGINE
// ============================================================
// For each interval (semitones from chord root) → [degree_offset (0-based from root letter), acc_direction]
// degree_offset tells which letter to use; acc is computed from the actual PC
var IV_SPELL=[[0,0],[1,-1],[1,0],[2,-1],[2,0],[3,0],[3,1],[4,0],[5,-1],[5,0],[6,-1],[6,0]];
var LETTERS_ORD=["C","D","E","F","G","A","B"];

function getChordRootInfo(cn){
  if(!cn||cn.length===0)return null;
  var c=cn[0].toUpperCase();var li=LETTERS_ORD.indexOf(c);if(li<0)return null;
  var ri=1,ra=0;
  if(ri<cn.length&&cn[ri]==="b"){ra=-1;ri++;}
  else if(ri<cn.length&&cn[ri]==="#"){ra=1;ri++;}
  var pc=((N2M[c]||0)+ra+12)%12;
  return{letter:c,li:li,pc:pc,quality:cn.substring(ri).toLowerCase()};
}

// Get preferred {note,acc} for a pitch class over a chord
// prevPC/nextPC for chromatic passing detection (can be null)
function chordSpellPC(pc,chInfo,prevPC,nextPC){
  if(!chInfo)return null;
  // Only respell enharmonic pitch classes (those with sharp/flat options)
  var ENHARM={1:1,3:1,6:1,8:1,10:1};
  if(!ENHARM[pc])return null;
  var iv=(pc-chInfo.pc+12)%12;
  var sp=IV_SPELL[iv];
  var degOff=sp[0];
  var letter=LETTERS_ORD[(chInfo.li+degOff)%7];
  var natPC=N2M[letter]||0;
  var acc=pc-natPC;if(acc>6)acc-=12;if(acc<-6)acc+=12;
  // Reject double sharps/flats
  if(acc>1||acc<-1)return null;
  // Tritone: use b5 for diminished/half-dim chords instead of #4
  if(iv===6){var q=chInfo.quality;
    if(q.indexOf("dim")>=0||q.indexOf("m7b5")>=0||q.indexOf("ø")>=0||q.indexOf("halfdim")>=0){
      var l2=LETTERS_ORD[(chInfo.li+4)%7];var n2=N2M[l2]||0;
      var a2=pc-n2;if(a2>6)a2-=12;if(a2<-6)a2+=12;
      if(a2>=-1&&a2<=1){letter=l2;acc=a2;}
    }
  }
  // Dominant #9: over dom7/maj chords, 3 semitones = #9, not b3
  // (these chords have major 3rd, so the minor 3rd interval is always #9)
  if(iv===3){var qd=chInfo.quality;
    var isMinor=(/^m[^a]/.test(qd)||qd==="m"||qd.indexOf("dim")>=0);
    if(!isMinor){
      var l3=LETTERS_ORD[(chInfo.li+1)%7];var n3=N2M[l3]||0;
      var a3=pc-n3;if(a3>6)a3-=12;if(a3<-6)a3+=12;
      if(a3>=-1&&a3<=1){letter=l3;acc=a3;}
    }
  }
  // Chromatic passing tone override (needs both prev AND next)
  if(prevPC!==null&&nextPC!==null){
    var fromPrev=(pc-prevPC+12)%12;
    var toNext=(nextPC-pc+12)%12;
    // Ascending chromatic (prev 1 below, next 1 above) → prefer sharp
    if(fromPrev===1&&toNext===1&&acc<0){
      var aL=LETTERS_ORD[(LETTERS_ORD.indexOf(letter)+6)%7];
      var aN=N2M[aL]||0;var aA=pc-aN;if(aA>6)aA-=12;if(aA<-6)aA+=12;
      if(aA===1){letter=aL;acc=aA;}
    }
    // Descending chromatic (prev 1 above, next 1 below) → prefer flat
    if(fromPrev===11&&toNext===11&&acc>0){
      var aL2=LETTERS_ORD[(LETTERS_ORD.indexOf(letter)+1)%7];
      var aN2=N2M[aL2]||0;var aA2=pc-aN2;if(aA2>6)aA2-=12;if(aA2<-6)aA2+=12;
      if(aA2===-1){letter=aL2;acc=aA2;}
    }
  }
  return{note:letter,acc:acc};
}

// Build note names for a scale given chord name and scale name
function getScaleNotes(chordName,scaleName){
  var ci=getChordRootInfo(chordName);if(!ci)return null;
  var sd=null;for(var i=0;i<SCALE_DEFS.length;i++){if(SCALE_DEFS[i].name===scaleName){sd=SCALE_DEFS[i];break;}}
  if(!sd)return null;
  var KEY_NAMES_S=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  var KEY_NAMES_F=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
  var useFlat=chordName.length>1&&chordName[1]==="b";
  var names=useFlat?KEY_NAMES_F:KEY_NAMES_S;
  var notes=[];var abcNotes=[];
  // Start octave: root near middle C (octave 4)
  var rootMidi=ci.pc+48;// C4=48
  if(rootMidi<48)rootMidi+=12;
  for(var ni=0;ni<sd.notes.length;ni++){
    var pc=(ci.pc+sd.notes[ni])%12;
    var sp=chordSpellPC(pc,ci,null,null);
    if(sp){notes.push(sp.note+(sp.acc>0?"#":sp.acc<0?"b":""));}
    else{notes.push(names[pc]);}
    // Build ABC note
    var midi=rootMidi+sd.notes[ni];
    var letter=sp?sp.note:names[pc][0];
    var accVal=sp?sp.acc:(names[pc].length>1?(names[pc][1]==="#"?1:-1):0);
    var oct=Math.floor(midi/12)-1;// MIDI to octave
    // Determine if note letter+acc matches the midi
    var natMidi=(N2M[letter]||0)+accVal+oct*12+12;
    // Adjust octave if needed
    while(natMidi<midi-5)natMidi+=12;
    while(natMidi>midi+6)natMidi-=12;
    oct=Math.floor((natMidi-((N2M[letter]||0)+accVal))/12);
    var abcAcc=accVal>0?"^":accVal<0?"_":"=";
    var abcN="";
    if(oct>=5){abcN=abcAcc+letter.toLowerCase();for(var oi=6;oi<=oct;oi++)abcN+="'";}
    else{abcN=abcAcc+letter.toUpperCase();for(var oi2=3;oi2>=oct;oi2--)abcN+=",";}
    abcNotes.push(abcN);
  }
  // Add root an octave up — shift first ABC note up one octave
  var firstAbc=abcNotes[0];
  // Parse the first note: accidentals, letter, octave marks
  var topAcc="",topLet="",topOctMarks="";
  for(var fi=0;fi<firstAbc.length;fi++){
    var fc=firstAbc[fi];
    if(fc==="^"||fc==="_"||fc==="=")topAcc+=fc;
    else if((fc>="A"&&fc<="G")||(fc>="a"&&fc<="g"))topLet=fc;
    else if(fc==="'"||fc===",")topOctMarks+=fc;
  }
  // Shift up one octave: remove a comma, or switch case, or add tick
  if(topOctMarks.includes(",")){topOctMarks=topOctMarks.slice(0,-1);}
  else if(topLet>="A"&&topLet<="G"){topLet=topLet.toLowerCase();}
  else{topOctMarks+="'";}
  abcNotes.push(topAcc+topLet+topOctMarks);
  // Collect MIDI values for audio playback
  var midis=[];
  for(var mi=0;mi<sd.notes.length;mi++){midis.push(rootMidi+sd.notes[mi]);}
  midis.push(rootMidi+12);// octave root
  var abc="X:1\nM:free\nL:1\nK:C\n"+abcNotes.join(" ")+" |";
  return{notes:notes,intervals:sd.notes,root:names[ci.pc],name:scaleName,chord:chordName,abc:abc,midis:midis};
}
function makeBass(bag,dest){
  if(_bassSamplerReady&&_bassSampler){
    const rev=new Tone.Reverb({decay:0.8,wet:0.06}).connect(dest);
    const flt=new Tone.Filter({frequency:320,type:"lowpass",rolloff:-24}).connect(rev);
    const lowBoost=new Tone.Filter({frequency:120,type:"lowshelf",gain:8}).connect(flt);
    const comp=new Tone.Compressor({threshold:-20,ratio:5,attack:0.008,release:0.12}).connect(lowBoost);
    try{_bassSampler.disconnect();}catch(e){}
    _bassSampler.connect(comp);
    bag.push(rev,flt,lowBoost,comp);
    return{play:function(n,d,t,v){try{_bassSampler.triggerAttackRelease(n,d,t,v||0.7);}catch(e){}}};
  }
  // Fallback: layered triangle+sine for warm bass
  const rev=new Tone.Reverb({decay:0.8,wet:0.06}).connect(dest);
  const flt=new Tone.Filter({frequency:400,type:"lowpass",rolloff:-12}).connect(rev);
  const comp=new Tone.Compressor({threshold:-18,ratio:4,attack:0.01,release:0.15}).connect(flt);
  const gain=new Tone.Gain(0.85).connect(comp);
  const s=new Tone.MonoSynth({oscillator:{type:"triangle"},filter:{Q:1,type:"lowpass",rolloff:-12,frequency:500},filterEnvelope:{attack:0.01,decay:0.3,sustain:0.5,release:0.6,baseFrequency:80,octaves:1.2},envelope:{attack:0.008,decay:0.4,sustain:0.4,release:0.5},volume:-8}).connect(gain);
  bag.push(s,gain,comp,flt,rev);
  return{play:function(n,d,t,v){try{s.triggerAttackRelease(n,d,t);}catch(e){}}};
}

// Drums — carefully layered synthesis for natural jazz sound
function makeDrums(bag,dest){
  const master=new Tone.Gain(0.9).connect(dest);
  const roomRev=new Tone.Reverb({decay:1.5,wet:0.15}).connect(master);
  bag.push(master,roomRev);

  // --- KICK: sine with pitch sweep (natural feel) ---
  var kickOsc=null,kickGain=null;
  try{
    kickGain=new Tone.Gain(0.6).connect(master);
    var kickFlt=new Tone.Filter({frequency:200,type:"lowpass",rolloff:-12}).connect(kickGain);
    kickOsc=new Tone.MembraneSynth({pitchDecay:0.06,octaves:5,oscillator:{type:"sine"},envelope:{attack:0.002,decay:0.3,sustain:0,release:0.25},volume:-6}).connect(kickFlt);
    bag.push(kickOsc,kickFlt,kickGain);
  }catch(e){console.warn("kick init:",e);}

  // --- RIDE: the heart of jazz drums ---
  // Layered: band-limited noise wash + two sine partials for shimmer
  var rideNoiseNode=null,ridePing1=null,ridePing2=null,rideGain=null;
  try{
    rideGain=new Tone.Gain(0.65).connect(roomRev);
    // Noise wash through bandpass (3-10kHz = cymbal character)
    var rideBP=new Tone.Filter({frequency:5500,type:"bandpass",Q:0.7}).connect(rideGain);
    rideNoiseNode=new Tone.NoiseSynth({noise:{type:"white"},envelope:{attack:0.002,decay:0.6,sustain:0,release:0.3},volume:-8}).connect(rideBP);
    // Ping 1: stick attack ~392Hz (G4)
    ridePing1=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.001,decay:0.06,sustain:0,release:0.04},volume:-16}).connect(rideGain);
    // Ping 2: bell shimmer ~587Hz (D5)
    ridePing2=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.001,decay:0.12,sustain:0,release:0.06},volume:-20}).connect(rideGain);
    bag.push(rideNoiseNode,ridePing1,ridePing2,rideBP,rideGain);
  }catch(e){console.warn("ride init:",e);}

  // --- HI-HAT: tight, crisp ---
  var hhNode=null,hhGain=null;
  try{
    hhGain=new Tone.Gain(0.45).connect(roomRev);
    var hhHP=new Tone.Filter({frequency:7000,type:"highpass"}).connect(hhGain);
    hhNode=new Tone.NoiseSynth({noise:{type:"white"},envelope:{attack:0.001,decay:0.04,sustain:0,release:0.02},volume:-10}).connect(hhHP);
    bag.push(hhNode,hhHP,hhGain);
  }catch(e){console.warn("hh init:",e);}

  // --- SNARE (ghost notes / cross-stick) ---
  var snareNoise=null,snareBody=null,snareGain=null;
  try{
    snareGain=new Tone.Gain(0.5).connect(roomRev);
    var snareBP=new Tone.Filter({frequency:1200,type:"bandpass",Q:0.8}).connect(snareGain);
    snareNoise=new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.001,decay:0.12,sustain:0,release:0.08},volume:-8}).connect(snareBP);
    // Body thump
    snareBody=new Tone.MembraneSynth({pitchDecay:0.008,octaves:2,envelope:{attack:0.001,decay:0.08,sustain:0,release:0.05},volume:-14}).connect(snareGain);
    bag.push(snareNoise,snareBody,snareBP,snareGain);
  }catch(e){console.warn("snare init:",e);}

  // --- BRUSH: soft noise swish ---
  var brushNoise=null,brushGain=null;
  try{
    brushGain=new Tone.Gain(0.35).connect(roomRev);
    var brushBP=new Tone.Filter({frequency:2500,type:"bandpass",Q:0.5}).connect(brushGain);
    brushNoise=new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.02,decay:0.25,sustain:0,release:0.15},volume:-10}).connect(brushBP);
    bag.push(brushNoise,brushBP,brushGain);
  }catch(e){console.warn("brush init:",e);}

  return{
    kick:function(t,v){if(kickOsc)try{kickOsc.triggerAttackRelease("C1","8n",t,(v||0.5)*0.6);}catch(e){}},
    ride:function(t,v){
      var vel=(v||0.6);
      if(rideNoiseNode)try{rideNoiseNode.triggerAttackRelease("8n",t,vel*0.5);}catch(e){}
      if(ridePing1)try{ridePing1.triggerAttackRelease("G4","32n",t,vel*0.25);}catch(e){}
      if(ridePing2)try{ridePing2.triggerAttackRelease("D5","32n",t,vel*0.15);}catch(e){}
    },
    hh:function(t,v){if(hhNode)try{hhNode.triggerAttackRelease("32n",t,(v||0.4)*0.4);}catch(e){}},
    snare:function(t,v){
      if(snareNoise)try{snareNoise.triggerAttackRelease("16n",t,(v||0.4)*0.5);}catch(e){}
      if(snareBody)try{snareBody.triggerAttackRelease("E3","32n",t,(v||0.3)*0.25);}catch(e){}
    },
    brush:function(t,v){if(brushNoise)try{brushNoise.triggerAttackRelease("4n",t,(v||0.3)*0.3);}catch(e){}}
  };
}

// ============================================================
// TRANSPOSE
// ============================================================
function trKeyName(name,semi){let ri=1;if(ri<name.length&&(name[ri]==="b"||name[ri]==="#"))ri++;const rs=name.substring(0,ri),sfx=name.substring(ri);let s=N2M[rs[0].toUpperCase()]||0;if(rs.includes("#"))s++;if(rs.includes("b"))s--;s=((s+semi)%12+12)%12;return KEY_NAMES[s]+sfx;}
function trChord(ch,semi){if(!ch)return ch;let ri=1;if(ri<ch.length&&(ch[ri]==="b"||ch[ri]==="#"))ri++;const rs=ch.substring(0,ri),q=ch.substring(ri);let s=N2M[rs[0].toUpperCase()]||0;if(rs.includes("#"))s++;if(rs.includes("b"))s--;s=((s+semi)%12+12)%12;return KEY_NAMES[s]+q;}
function trMusic(line,semi,ks,useFlat,newKs){const nm=useFlat?FLAT_ABC:SHARP_ABC;let out="",i=0;var inBarAcc={};var outBarAcc={};var curChInfo=null;while(i<line.length){if(line[i]==='"'){out+='"';i++;let chN="";while(i<line.length&&line[i]!=='"'){chN+=line[i];i++;}var trCh=trChord(chN,semi);curChInfo=getChordRootInfo(trCh);out+=trCh;if(i<line.length){out+='"';i++;}continue;}if(line[i]==="|"||line[i]===":"){inBarAcc={};outBarAcc={};out+=line[i];i++;continue;}let acc=null,ai=i;while(i<line.length&&(line[i]==="^"||line[i]==="_"||line[i]==="=")){if(line[i]==="^")acc=(acc===null?1:acc+1);else if(line[i]==="_")acc=(acc===null?-1:acc-1);else acc=0;i++;}if(i<line.length&&((line[i]>="A"&&line[i]<="G")||(line[i]>="a"&&line[i]<="g"))){const nc=line[i];i++;const isLo=nc>="a";const nu=nc.toUpperCase();let om=0;while(i<line.length&&(line[i]==="'"||line[i]===",")){if(line[i]==="'")om++;else om--;i++;}let oct=(isLo?5:4)+om;let ns=N2M[nu]||0;var inKey=nu+oct;if(acc!==null){ns+=acc;inBarAcc[inKey]=acc;}else{if(inBarAcc[inKey]!==undefined){ns+=inBarAcc[inKey];}else{const ka=ks[nu.toLowerCase()];if(ka)ns+=ka;}}let ap=ns+oct*12+semi;let no=Math.floor(ap/12);let nsm=((ap%12)+12)%12;var ch;if(curChInfo){var csp=chordSpellPC(nsm,curChInfo,null,null);if(csp)ch={n:csp.note,a:csp.acc===1?"^":csp.acc===-1?"_":""};else ch=nm[nsm];}else ch=nm[nsm];const wantAcc=ch.a==="^"?1:ch.a==="_"?-1:0;const ksAcc=(newKs&&newKs[ch.n.toLowerCase()])||0;var outKey=ch.n+no;var prevOutAcc=outBarAcc.hasOwnProperty(outKey)?outBarAcc[outKey]:ksAcc;var needExplicit=false;if(wantAcc!==prevOutAcc)needExplicit=true;else if(wantAcc===ksAcc&&outBarAcc.hasOwnProperty(outKey)&&outBarAcc[outKey]!==ksAcc)needExplicit=true;if(needExplicit){if(wantAcc===0)out+="=";else if(wantAcc===1)out+="^";else out+="_";}outBarAcc[outKey]=wantAcc;if(no>=5){out+=ch.n.toLowerCase();for(let o=6;o<=no;o++)out+="'";}else{out+=ch.n;for(let o=3;o>=no;o--)out+=",";}continue;}if(acc!==null){out+=line.substring(ai,i);continue;}out+=line[i];i++;}return out;}
function transposeAbc(abc,semi){if(!semi)return abc;const lines=abc.split("\n");let out=[],ks={},nks={},nkr=0;for(const line of lines){const t=line.trim();if(t.startsWith("K:")){const k=t.slice(2).trim().split(/\s/)[0];ks=KEY_SIG[k]||{};const nk=trKeyName(k,semi);nks=KEY_SIG[nk]||{};let ri2=1;if(ri2<nk.length&&(nk[ri2]==="b"||nk[ri2]==="#"))ri2++;const nrs=nk.substring(0,ri2);nkr=N2M[nrs[0]]||0;if(nrs.includes("#"))nkr++;if(nrs.includes("b"))nkr--;nkr=((nkr%12)+12)%12;out.push("K:"+nk);}else if(/^[A-Z]:/.test(t)){out.push(line);}else{out.push(trMusic(line,semi,ks,FLAT_ROOTS.has(nkr),nks));}}return out.join("\n");}

// ============================================================
// ABC PARSER
// ============================================================
function parseAbc(abcStr,tOv){const lines=abcStr.split("\n");let dL=1/8,bpm=120,ks={},tsN=4;for(const l of lines){const t=l.trim();if(t.startsWith("L:")){const m=t.match(/(\d+)\/(\d+)/);if(m)dL=parseInt(m[1])/parseInt(m[2]);}else if(t.startsWith("Q:")){const m=t.match(/(\d+)$/);if(m)bpm=parseInt(m[1]);}else if(t.startsWith("K:")){ks=KEY_SIG[t.replace("K:","").trim().split(/\s/)[0]]||{};}else if(t.startsWith("M:")){const m=t.match(/(\d+)\/(\d+)/);if(m)tsN=parseInt(m[1]);}}if(tOv)bpm=tOv;const spb=60/bpm;let mu="";for(const l of lines){const t=l.trim();if(/^[A-Z]:/.test(t))continue;mu+=" "+t;}const ev=[],ch=[];let i=0;var tupRem=0,tupFac=1;var barAcc={};while(i<mu.length){const c=mu[i];if(c===" "||c==="\t"){i++;continue;}if(c==="|"||c===":"){barAcc={};i++;continue;}if(c==="]"){i++;continue;}if(c==='"'){i++;let cn="";while(i<mu.length&&mu[i]!=='"'){cn+=mu[i];i++;}if(i<mu.length)i++;let p=0;for(const e of ev)p+=e.rL;ch.push({name:cn,pos:p});continue;}if(c==="!"||c==="+"){i++;while(i<mu.length&&mu[i]!==c)i++;if(i<mu.length)i++;continue;}if(c==="("){i++;let tn="";while(i<mu.length&&mu[i]>="0"&&mu[i]<="9"){tn+=mu[i];i++;}var tp=parseInt(tn)||3;tupRem=tp;tupFac=tp===3?2/3:tp===5?4/5:tp===7?6/7:2/3;continue;}if(c==="~"||c==="."||c==="H"){i++;continue;}if(c==="-"){if(ev.length>0)ev[ev.length-1].tie=true;i++;continue;}if(c==="["){if(i+1<mu.length&&(mu[i+1]==="|"||mu[i+1]==="1"||mu[i+1]==="2")){i++;continue;}i++;const ct=[];while(i<mu.length&&mu[i]!=="]"){const nr=rN(mu,i,ks,barAcc);if(nr){ct.push(nr.t);if(nr.explicit)barAcc[nr.letter+nr.oct]=nr.acc;i=nr.n;}else i++;}if(i<mu.length)i++;const dr=rD(mu,i);i=dr.n;var rl3=dL*dr.m;if(tupRem>0){rl3*=tupFac;tupRem--;}ev.push({tn:ct.length?ct:null,rL:rl3});continue;}if(c==="z"||c==="x"){i++;const dr=rD(mu,i);i=dr.n;var rl=dL*dr.m;if(tupRem>0){rl*=tupFac;tupRem--;}ev.push({tn:null,rL:rl});continue;}const nr=rN(mu,i,ks,barAcc);if(nr){if(nr.explicit)barAcc[nr.letter+nr.oct]=nr.acc;i=nr.n;const dr=rD(mu,i);i=dr.n;var rl2=dL*dr.m;if(tupRem>0){rl2*=tupFac;tupRem--;}ev.push({tn:[nr.t],rL:rl2});continue;}i++;}// Merge tied notes: if event[i].tie && event[i+1] has same pitch, combine durations
  var merged=[];for(var mi=0;mi<ev.length;mi++){var me=ev[mi];if(merged.length>0&&merged[merged.length-1].tie&&me.tn&&merged[merged.length-1].tn){
    // Check same pitch
    var pt=merged[merged.length-1].tn.join(","),ct2=me.tn.join(",");
    if(pt===ct2){merged[merged.length-1].rL+=me.rL;merged[merged.length-1].tie=me.tie;continue;}}
    merged.push({tn:me.tn,rL:me.rL,tie:me.tie});}
  return{events:merged,chords:ch,bpm,spb,tsNum:tsN};}
function applyTiming(p,sw){const{events:ev,spb}=p;const eL=1/8;const r=[];let pos=0;const swShift=sw===1?0.08:sw>=2?0.167:0;const velDown=sw>0?1-(sw===1?0.06:0.1):1;const velUp=sw>0?1+(sw===1?0.08:0.12):1;for(const e of ev){let d=e.rL*4*spb;let st=pos*4*spb;let vel=1;if(sw>0&&Math.abs(e.rL-eL)<0.001){const bL=1/4;const pIB=((pos%bL)+bL)%bL;if(pIB<0.001){d=(1/4)*(0.5+swShift)*4*spb;vel=velDown;}else if(Math.abs(pIB-eL)<0.001){st+=swShift*(1/4)*4*spb;d=(1/4)*(0.5-swShift)*4*spb;vel=velUp;}}r.push({tones:e.tn,dur:Math.max(d,0.02),startTime:st,vel:vel});pos+=e.rL;}return{scheduled:r,totalDur:pos*4*spb,chordTimes:p.chords.map(c=>({name:c.name,time:c.pos*4*spb}))};}
function rN(s,i,ks,barAcc){let a=null;while(i<s.length&&(s[i]==="^"||s[i]==="_"||s[i]==="=")){if(s[i]==="^")a=(a===null?1:a+1);else if(s[i]==="_")a=(a===null?-1:a-1);else a=0;i++;}if(i>=s.length)return null;const c=s[i];if(!((c>="A"&&c<="G")||(c>="a"&&c<="g")))return null;const lo=c>="a",nl=c.toUpperCase();let o=lo?5:4;i++;while(i<s.length&&(s[i]==="'"||s[i]===",")){if(s[i]==="'")o++;else o--;i++;}let sa=0;var explicitAcc=a!==null;if(a!==null){sa=a;}else{var bk=nl+o;if(barAcc&&barAcc[bk]!==undefined){sa=barAcc[bk];}else{const ka=ks[nl.toLowerCase()];if(ka)sa=ka;}}let tn=nl;if(sa>0)tn+="#";else if(sa<0)tn+="b";tn+=o;return{t:tn,n:i,explicit:explicitAcc,letter:nl,oct:o,acc:sa};}
function rD(s,i){let nm="";while(i<s.length&&s[i]>="0"&&s[i]<="9"){nm+=s[i];i++;}let m=nm?parseInt(nm):1;if(i<s.length&&s[i]==="/"){i++;let dn="";while(i<s.length&&s[i]>="0"&&s[i]<="9"){dn+=s[i];i++;}m=m/(dn?parseInt(dn):2);}return{m:m||1,n:i};}

// ============================================================
// SYNTH ENGINE
// ============================================================
const SAL_BASE="https://tonejs.github.io/audio/salamander/";
const SAL_MAP={"C2":"C2.mp3","D#2":"Ds2.mp3","F#2":"Fs2.mp3","A2":"A2.mp3","C3":"C3.mp3","D#3":"Ds3.mp3","F#3":"Fs3.mp3","A3":"A3.mp3","C4":"C4.mp3","D#4":"Ds4.mp3","F#4":"Fs4.mp3","A4":"A4.mp3","C5":"C5.mp3","D#5":"Ds5.mp3","F#5":"Fs5.mp3","A5":"A5.mp3","C6":"C6.mp3","D#6":"Ds6.mp3","F#6":"Fs6.mp3","A6":"A6.mp3","C7":"C7.mp3"};
let _sampler=null,_samplerReady=false,_samplerPromise=null,_samplerFailed=false;
function preloadPiano(){if(_samplerPromise)return _samplerPromise;_samplerPromise=new Promise(res=>{try{_sampler=new Tone.Sampler({urls:SAL_MAP,baseUrl:SAL_BASE,release:1.5,onload:()=>{_samplerReady=true;res(true);},onerror:()=>{_samplerFailed=true;res(false);}});setTimeout(()=>{if(!_samplerReady){_samplerFailed=true;res(false);}},15000);}catch(e){_samplerFailed=true;res(false);}});return _samplerPromise;}
function makeSamplerPiano(bag,dest){const rev=new Tone.Reverb({decay:2.8,wet:0.18}).connect(dest);const comp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.005,release:0.12}).connect(rev);try{_sampler.disconnect();}catch(e){}_sampler.connect(comp);bag.push(rev,comp);return{play:(n,d,t,v)=>{try{_sampler.triggerAttackRelease(n,d,t,v);}catch(e){}}};}
function makeSamplerRhodes(bag,dest){const rev=new Tone.Reverb({decay:2.2,wet:0.18}).connect(dest);const ch=new Tone.Chorus({frequency:0.7,delayTime:4,depth:0.2,wet:0.2}).connect(rev);ch.start();const tr=new Tone.Tremolo({frequency:3,depth:0.22,wet:0.3}).connect(ch);tr.start();const flt=new Tone.Filter({frequency:3000,type:"lowpass",rolloff:-12}).connect(tr);try{_sampler.disconnect();}catch(e){}_sampler.connect(flt);bag.push(rev,ch,tr,flt);return{play:(n,d,t,v)=>{try{_sampler.triggerAttackRelease(n,d,t,v);}catch(e){}}};}
function makeSamplerSax(bag,dest){
  const rev=new Tone.Reverb({decay:1.6,wet:0.18}).connect(dest);
  const vib=new Tone.Vibrato({frequency:5,depth:0.08,wet:0.35}).connect(rev);
  const comp=new Tone.Compressor({threshold:-20,ratio:3,attack:0.005,release:0.1}).connect(vib);
  const flt=new Tone.Filter({frequency:5000,type:"lowpass",rolloff:-12}).connect(comp);
  try{_saxSampler.disconnect();}catch(e){}
  _saxSampler.connect(flt);
  bag.push(flt,comp,vib,rev);
  return{play:(n,d,t,v)=>{try{_saxSampler.triggerAttackRelease(n,d,t,v);}catch(e){}}};
}
function makeCustomPianoMel(bag,dest){
  const rev=new Tone.Reverb({decay:2.5,wet:0.16}).connect(dest);
  const comp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.005,release:0.12}).connect(rev);
  try{_pianoMelSampler.disconnect();}catch(e){}
  _pianoMelSampler.connect(comp);
  bag.push(comp,rev);
  return{play:(n,d,t,v)=>{try{var o=parseInt(n.slice(-1));var nn=n.slice(0,-1)+(o-1);_pianoMelSampler.triggerAttackRelease(nn,d,t,v);}catch(e){}}};
}
function makeCustomRhodesMel(bag,dest){
  const rev=new Tone.Reverb({decay:2.0,wet:0.16}).connect(dest);
  const ch=new Tone.Chorus({frequency:0.7,delayTime:4,depth:0.2,wet:0.18}).connect(rev);ch.start();
  const tr=new Tone.Tremolo({frequency:3,depth:0.2,wet:0.25}).connect(ch);tr.start();
  const flt=new Tone.Filter({frequency:3500,type:"lowpass",rolloff:-12}).connect(tr);
  try{_rhodesMelSampler.disconnect();}catch(e){}
  _rhodesMelSampler.connect(flt);
  bag.push(flt,tr,ch,rev);
  return{play:(n,d,t,v)=>{try{var o=parseInt(n.slice(-1));var nn=n.slice(0,-1)+(o-1);_rhodesMelSampler.triggerAttackRelease(nn,d,t,v);}catch(e){}}};
}function makeSynthPiano(bag,dest){
  // Rich piano: layered AMSynth + harmonic partials + reverb + compression
  const rev=new Tone.Reverb({decay:2.8,wet:0.2}).connect(dest);
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
function makeSax(bag,dest){
  // Sax: FM with breath noise, vibrato, formant-like filtering
  const rev=new Tone.Reverb({decay:1.8,wet:0.2}).connect(dest);
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
function makeTrumpet(bag,dest){
  // Trumpet: bright FM, muted high partials, controlled bite
  const rev=new Tone.Reverb({decay:1.5,wet:0.16}).connect(dest);
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
function makeGuitar(bag,dest){
  // Guitar: pluck-like with fast decay, chorus for width
  const rev=new Tone.Reverb({decay:1.2,wet:0.14}).connect(dest);
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
function makeFlute(bag,dest){
  // Flute: pure sine with breath noise, wide vibrato, airy reverb
  const rev=new Tone.Reverb({decay:3.2,wet:0.3}).connect(dest);
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
function makeVibes(bag,dest){
  // Vibes: metallic FM with tremolo, long decay
  const rev=new Tone.Reverb({decay:4,wet:0.3}).connect(dest);
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
function makeMelSynth(id,bag,dest){
  // Custom samplers first (from Supabase)
  if(id==="piano"&&_pianoMelReady&&_pianoMelSampler)return makeCustomPianoMel(bag,dest);
  if(id==="rhodes"&&_rhodesMelReady&&_rhodesMelSampler)return makeCustomRhodesMel(bag,dest);
  // Salamander fallback for piano/rhodes
  if((id==="piano"||id==="rhodes")&&_samplerReady&&_sampler)return id==="piano"?makeSamplerPiano(bag,dest):makeSamplerRhodes(bag,dest);
  // Sax sampler
  if(id==="sax"&&_saxSamplerReady&&_saxSampler)return makeSamplerSax(bag,dest);
  // Synth fallbacks
  switch(id){case"piano":case"rhodes":return makeSynthPiano(bag,dest);case"sax":return makeSax(bag,dest);case"trumpet":return makeTrumpet(bag,dest);case"guitar":return makeGuitar(bag,dest);case"flute":return makeFlute(bag,dest);case"vibes":return makeVibes(bag,dest);default:return makeSynthPiano(bag,dest);}
}
let _chordSampler=null,_chordSamplerReady=false,_chordSamplerPromise=null;
function preloadChordPiano(){if(_chordSamplerPromise)return _chordSamplerPromise;_chordSamplerPromise=new Promise(res=>{try{_chordSampler=new Tone.Sampler({urls:SAL_MAP,baseUrl:SAL_BASE,release:1.2,volume:-14,onload:()=>{_chordSamplerReady=true;res(true);},onerror:()=>{res(false);}});setTimeout(()=>{if(!_chordSamplerReady)res(false);},15000);}catch(e){res(false);}});return _chordSamplerPromise;}
// Bass sampler — Salamander piano pitched low + heavy filtering = upright bass
let _bassSampler=null,_bassSamplerReady=false,_bassSamplerPromise=null;
function preloadBassSampler(){if(_bassSamplerPromise)return _bassSamplerPromise;_bassSamplerPromise=new Promise(res=>{try{_bassSampler=new Tone.Sampler({urls:SAL_MAP,baseUrl:SAL_BASE,release:0.4,volume:-6,onload:()=>{_bassSamplerReady=true;res(true);},onerror:()=>{res(false);}});setTimeout(()=>{if(!_bassSamplerReady)res(false);},15000);}catch(e){res(false);}});return _bassSamplerPromise;}
// Rhodes sampler — real Rhodes samples from Supabase
const RHODES_BASE="https://edhsqycbglkaqbzzhcmp.supabase.co/storage/v1/object/public/Samples/rhodes/";
const RHODES_MAP={"C1":"C1.mp3","F1":"F1.mp3","C2":"C2.mp3","F2":"F2.mp3","C3":"C3.mp3","F3":"F3.mp3","C4":"C4.mp3","F4":"F4.mp3","C5":"C5.mp3"};
let _rhodesChordSampler=null,_rhodesChordReady=false,_rhodesChordPromise=null;
function preloadRhodesChord(){if(_rhodesChordPromise)return _rhodesChordPromise;_rhodesChordPromise=new Promise(res=>{try{console.log("[etudy] Loading Rhodes samples from:",RHODES_BASE);_rhodesChordSampler=new Tone.Sampler({urls:RHODES_MAP,baseUrl:RHODES_BASE,release:2.5,volume:-4,onload:()=>{_rhodesChordReady=true;console.log("[etudy] Rhodes samples loaded OK");res(true);},onerror:(e)=>{console.warn("[etudy] Rhodes samples FAILED:",e);res(false);}});setTimeout(()=>{if(!_rhodesChordReady){console.warn("[etudy] Rhodes samples timeout");res(false);}},20000);}catch(e){res(false);}});return _rhodesChordPromise;}
// Custom piano sampler — real piano samples from Supabase
const CPIANO_BASE="https://edhsqycbglkaqbzzhcmp.supabase.co/storage/v1/object/public/Samples/piano/";
const CPIANO_MAP={"C1":"C1.mp3","F1":"F1.mp3","C2":"C2.mp3","F2":"F2.mp3","C3":"C3.mp3","F3":"F3.mp3","C4":"C4.mp3","F4":"F4.mp3","C5":"C5.mp3"};
let _cPianoChordSampler=null,_cPianoChordReady=false,_cPianoChordPromise=null;
function preloadCustomPianoChord(){if(_cPianoChordPromise)return _cPianoChordPromise;_cPianoChordPromise=new Promise(res=>{try{console.log("[etudy] Loading custom piano samples from:",CPIANO_BASE);_cPianoChordSampler=new Tone.Sampler({urls:CPIANO_MAP,baseUrl:CPIANO_BASE,release:2.0,volume:-4,onload:()=>{_cPianoChordReady=true;console.log("[etudy] Custom piano samples loaded OK");res(true);},onerror:(e)=>{console.warn("[etudy] Custom piano samples FAILED:",e);res(false);}});setTimeout(()=>{if(!_cPianoChordReady){console.warn("[etudy] Custom piano samples timeout");res(false);}},20000);}catch(e){res(false);}});return _cPianoChordPromise;}
// Alto sax sampler — single C2 sample pitched across range
const SAX_BASE="https://edhsqycbglkaqbzzhcmp.supabase.co/storage/v1/object/public/Samples/altosax/";
const SAX_MAP={"C5":"C2.mp3"};
let _saxSampler=null,_saxSamplerReady=false,_saxSamplerPromise=null;
function preloadSaxSampler(){if(_saxSamplerPromise)return _saxSamplerPromise;_saxSamplerPromise=new Promise(res=>{try{console.log("[etudy] Loading alto sax sample from:",SAX_BASE);_saxSampler=new Tone.Sampler({urls:SAX_MAP,baseUrl:SAX_BASE,release:0.8,volume:-6,onload:()=>{_saxSamplerReady=true;console.log("[etudy] Alto sax sample loaded OK");res(true);},onerror:()=>{res(false);}});setTimeout(()=>{if(!_saxSamplerReady)res(false);},15000);}catch(e){res(false);}});return _saxSamplerPromise;}
// Melody-specific samplers (separate instances from backing to avoid connection conflicts)
let _pianoMelSampler=null,_pianoMelReady=false,_pianoMelPromise=null;
function preloadPianoMel(){if(_pianoMelPromise)return _pianoMelPromise;_pianoMelPromise=new Promise(res=>{try{_pianoMelSampler=new Tone.Sampler({urls:CPIANO_MAP,baseUrl:CPIANO_BASE,release:1.5,volume:-4,onload:()=>{_pianoMelReady=true;console.log("[etudy] Piano melody sampler loaded OK");res(true);},onerror:()=>{res(false);}});setTimeout(()=>{if(!_pianoMelReady)res(false);},20000);}catch(e){res(false);}});return _pianoMelPromise;}
let _rhodesMelSampler=null,_rhodesMelReady=false,_rhodesMelPromise=null;
function preloadRhodesMel(){if(_rhodesMelPromise)return _rhodesMelPromise;_rhodesMelPromise=new Promise(res=>{try{_rhodesMelSampler=new Tone.Sampler({urls:RHODES_MAP,baseUrl:RHODES_BASE,release:1.5,volume:-4,onload:()=>{_rhodesMelReady=true;console.log("[etudy] Rhodes melody sampler loaded OK");res(true);},onerror:()=>{res(false);}});setTimeout(()=>{if(!_rhodesMelReady)res(false);},20000);}catch(e){res(false);}});return _rhodesMelPromise;}
function makeChordSynth(bag){
  // Priority 1: Custom piano samples from Supabase
  if(_cPianoChordReady&&_cPianoChordSampler){
    console.log("[etudy] makeChordSynth → Using CUSTOM PIANO sampler");
    const rev=new Tone.Reverb({decay:2.5,wet:0.18}).toDestination();
    const comp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.008,release:0.12}).connect(rev);
    const flt=new Tone.Filter({frequency:2800,type:"lowpass",rolloff:-12}).connect(comp);
    try{_cPianoChordSampler.disconnect();}catch(e){}
    _cPianoChordSampler.connect(flt);
    bag.push(flt,comp,rev);
    return _cPianoChordSampler;
  }
  // Priority 2: Salamander piano sampler
  if(_chordSamplerReady&&_chordSampler){
    console.log("[etudy] makeChordSynth → Using SALAMANDER sampler");
    const rev=new Tone.Reverb({decay:2.5,wet:0.22}).toDestination();
    const comp=new Tone.Compressor({threshold:-24,ratio:4,attack:0.01,release:0.15}).connect(rev);
    const flt=new Tone.Filter({frequency:2200,type:"lowpass",rolloff:-12}).connect(comp);
    _chordSampler.disconnect();_chordSampler.connect(flt);
    bag.push(flt,comp,rev);
    return _chordSampler;
  }
  // Fallback: FM synth comping
  console.log("[etudy] makeChordSynth → Using FM SYNTH fallback");
  const rev=new Tone.Reverb({decay:3,wet:0.22}).toDestination();const ch=new Tone.Chorus({frequency:0.4,delayTime:6,depth:0.22,wet:0.22}).connect(rev);ch.start();const tr=new Tone.Tremolo({frequency:2.2,depth:0.12,wet:0.18}).connect(ch);tr.start();const flt=new Tone.Filter({frequency:1800,type:"lowpass",rolloff:-24}).connect(tr);const s=new Tone.PolySynth(Tone.FMSynth,{harmonicity:3,modulationIndex:0.6,oscillator:{type:"fatsine2",spread:15,count:3},modulation:{type:"sine"},envelope:{attack:0.015,decay:1.0,sustain:0.3,release:1.5},modulationEnvelope:{attack:0.008,decay:0.6,sustain:0,release:0.6},volume:-18}).connect(flt);bag.push(s,flt,tr,ch,rev);return s;
}
function makeClick(bag){const rev=new Tone.Reverb({decay:0.2,wet:0.06}).toDestination();const flt=new Tone.Filter({frequency:7000,type:"bandpass",Q:2}).connect(rev);const hi=new Tone.NoiseSynth({noise:{type:"white"},envelope:{attack:0.001,decay:0.035,sustain:0,release:0.015},volume:-10}).connect(flt);const lo=new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.001,decay:0.02,sustain:0,release:0.01},volume:-16}).connect(flt);bag.push(hi,lo,flt,rev);return{hi,lo};}
// Rhodes chord synth — uses real Rhodes samples with warm processing
function makeRhodesChordSynth(bag){
  console.log("[etudy] makeRhodesChordSynth called, ready?",_rhodesChordReady,"sampler?",!!_rhodesChordSampler);
  if(_rhodesChordReady&&_rhodesChordSampler){
    const rev=new Tone.Reverb({decay:2.2,wet:0.18}).toDestination();
    const ch=new Tone.Chorus({frequency:0.6,delayTime:4,depth:0.18,wet:0.15}).connect(rev);ch.start();
    const tr=new Tone.Tremolo({frequency:2.8,depth:0.15,wet:0.2}).connect(ch);tr.start();
    const comp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.008,release:0.12}).connect(tr);
    const flt=new Tone.Filter({frequency:3500,type:"lowpass",rolloff:-12}).connect(comp);
    try{_rhodesChordSampler.disconnect();}catch(e){}
    _rhodesChordSampler.connect(flt);
    bag.push(flt,comp,tr,ch,rev);
    console.log("[etudy] → Using RHODES sampler");
    return _rhodesChordSampler;
  }
  console.warn("[etudy] → Rhodes NOT ready, falling back to piano");
  return makeChordSynth(bag);
}
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
function prevNote(n,o,a,semi){
  try{
    Tone.start();
    var nm=n;if(a===1)nm+="#";else if(a===-1)nm+="b";nm+=o;
    // Transpose for concert pitch preview
    if(semi){var midi=Tone.Frequency(nm).toMidi()+semi;nm=Tone.Frequency(midi,"midi").toNote();}
    // Use sampler if available — reconnect to destination in case effects chain was disposed
    if(_samplerReady&&_sampler){try{_sampler.toDestination();}catch(e){}_sampler.triggerAttackRelease(nm,"4n");return;}
    // Fallback: persistent synth
    _ensurePreviewSynth();
    if(_pS)_pS.triggerAttackRelease(nm,"4n");
  }catch(e){}
}

// Theory mode: play a note together with its underlying chord
function playTheoryTap(tones,chordName){
  try{
    Tone.start();
    var now=Tone.now()+0.02;
    // Play melody note(s)
    if(_samplerReady&&_sampler){
      try{_sampler.toDestination();}catch(e){}
      for(var i=0;i<tones.length;i++){
        try{_sampler.triggerAttackRelease(tones[i],"2n",now,0.85);}catch(e){}
      }
    }else{
      _ensurePreviewSynth();
      if(_pS){for(var i2=0;i2<tones.length;i2++){try{_pS.triggerAttackRelease(tones[i2],"2n",now);}catch(e){}}}
    }
    // Play chord in octave 3 (comping range, below melody)
    if(chordName){
      var chordNotes=chordToNotes(chordName,3);
      if(chordNotes.length>0){
        if(_samplerReady&&_sampler){
          for(var ci=0;ci<chordNotes.length;ci++){
            try{_sampler.triggerAttackRelease(chordNotes[ci],"2n",now,0.3);}catch(e){}
          }
        }else{
          _ensurePreviewSynth();
          if(_pS){for(var ci2=0;ci2<chordNotes.length;ci2++){try{_pS.triggerAttackRelease(chordNotes[ci2],"2n",now,0.25);}catch(e){}}}
        }
      }
    }
  }catch(e){}
}

// ============================================================
// CARD PREVIEW PLAYER — lightweight, global singleton
// ============================================================
var _preview={id:null,stop:null,subs:new Set(),gen:0,curNote:-1,noteTimers:[]};
// Global coordinator for YTCardBtn instances — ensures only one plays at a time
var _ytCard={subs:new Set()};
function ytCardSubscribe(fn){_ytCard.subs.add(fn);return function(){_ytCard.subs.delete(fn);};}
function ytCardCollapseAll(){_ytCard.subs.forEach(function(fn){fn();});}
function previewSubscribe(fn){_preview.subs.add(fn);return function(){_preview.subs.delete(fn);};}
function previewNotify(){_preview.subs.forEach(function(fn){fn(_preview.id);});}
function previewStop(){if(_preview.stop){try{_preview.stop();}catch(e){}_preview.stop=null;}_preview.id=null;_preview.gen++;for(var i=0;i<_preview.noteTimers.length;i++)clearTimeout(_preview.noteTimers[i]);_preview.noteTimers=[];_preview.curNote=-1;previewNotify();}
async function previewPlay(lickId,abc,tempo,feel){
  previewStop();
  var myGen=_preview.gen;
  try{await Tone.start();}catch(e){}
  if(myGen!==_preview.gen)return;
  if(!_samplerReady&&!_samplerFailed){await preloadPiano();}
  // Load custom piano (same as detail view) + Salamander fallback
  if(!_cPianoChordReady){await preloadCustomPianoChord();}
  if(!_chordSamplerReady){await preloadChordPiano();}
  if(myGen!==_preview.gen)return;
  var sw=feel==="swing"?1:feel==="hard-swing"?2:0;
  var parsed=parseAbc(abc,tempo);
  var result=applyTiming(parsed,sw);
  var notes=result.scheduled;var totalDur=result.totalDur;var chordTimes=result.chordTimes||[];
  var timers=[];
  // Schedule curNote tracking
  var noteIdx=0;
  for(var ni=0;ni<notes.length;ni++){if(notes[ni].tones){
    (function(idx,st){_preview.noteTimers.push(setTimeout(function(){if(_preview.gen!==myGen)return;_preview.curNote=idx;previewNotify();},st*1000));})(noteIdx,notes[ni].startTime);noteIdx++;}}
  _preview.noteTimers.push(setTimeout(function(){if(_preview.gen!==myGen)return;_preview.curNote=-1;previewNotify();},totalDur*1000));
  // Pick chord sampler: custom piano first, Salamander fallback
  var prevChordSampler=(_cPianoChordReady&&_cPianoChordSampler)?_cPianoChordSampler:(_chordSamplerReady&&_chordSampler)?_chordSampler:null;
  // Schedule chord accompaniment — same chain as detail view piano
  var chordCleanup=null;
  if(prevChordSampler&&chordTimes.length>0){
    var cRev=new Tone.Reverb({decay:2.5,wet:0.18}).toDestination();
    var cComp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.008,release:0.12}).connect(cRev);
    var cFlt=new Tone.Filter({frequency:2800,type:"lowpass",rolloff:-12}).connect(cComp);
    prevChordSampler.disconnect();prevChordSampler.connect(cFlt);
    var _pcs=prevChordSampler;
    chordCleanup=function(){try{_pcs.releaseAll();_pcs.disconnect();_pcs.toDestination();}catch(e){}try{cFlt.dispose();}catch(e){}try{cComp.dispose();}catch(e){}try{cRev.dispose();}catch(e){}};
  }
  if(_samplerReady&&_sampler){
    // Use piano sampler with dedicated effects chain
    var rev=new Tone.Reverb({decay:2.2,wet:0.16}).toDestination();
    var comp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.005,release:0.12}).connect(rev);
    _sampler.disconnect();_sampler.connect(comp);
    // Single shared time reference for melody + chords
    var now=Tone.now();var LA=0.04;
    // Schedule melody
    for(var i=0;i<notes.length;i++){var n=notes[i];if(!n.tones)continue;
      (function(_n){var fireMs=Math.max(0,_n.startTime*1000-LA*1000);timers.push(setTimeout(function(){if(_preview.gen!==myGen)return;for(var j=0;j<_n.tones.length;j++){try{_sampler.triggerAttackRelease(_n.tones[j],Math.min(_n.dur*0.85,1.5),now+_n.startTime,_n.vel);}catch(e){}}},fireMs));})(n);}
    // Schedule chords on same time base — matches detail view piano style
    if(prevChordSampler&&chordTimes.length>0){
      var SAMPLE_PRE=0.04;
      for(var ci=0;ci<chordTimes.length;ci++){var ch=chordTimes[ci];var cn=chordToNotes(ch.name,2);if(!cn.length)continue;
        var nextT=ci<chordTimes.length-1?chordTimes[ci+1].time:totalDur;var cDur=Math.max(0.5,nextT-ch.time);
        for(var cni=0;cni<cn.length;cni++){(function(_note,_time,_dur){
          var fireMs=Math.max(0,(_time-SAMPLE_PRE)*1000-LA*1000);
          timers.push(setTimeout(function(){if(_preview.gen!==myGen)return;try{prevChordSampler.triggerAttackRelease(_note,_dur,now+_time-SAMPLE_PRE,0.5);}catch(e){}},fireMs));
        })(cn[cni],ch.time,cDur);}}
    }
    if(myGen!==_preview.gen){for(var k=0;k<timers.length;k++)clearTimeout(timers[k]);try{_sampler.disconnect();_sampler.toDestination();}catch(e){}try{rev.dispose();}catch(e){}try{comp.dispose();}catch(e){}if(chordCleanup)chordCleanup();return;}
    _preview.id=lickId;
    var tid=setTimeout(function(){if(_preview.id===lickId)previewStop();},totalDur*1000+300);
    _preview.stop=function(){clearTimeout(tid);for(var k=0;k<timers.length;k++)clearTimeout(timers[k]);try{_sampler.releaseAll();_sampler.disconnect();_sampler.toDestination();}catch(e){}try{comp.dispose();}catch(e){}try{rev.dispose();}catch(e){}if(chordCleanup)chordCleanup();};
  } else {
    // Fallback: dedicated synth
    var rev2=new Tone.Reverb({decay:1.8,wet:0.16}).toDestination();
    var syn=new Tone.PolySynth(Tone.FMSynth,{harmonicity:2,modulationIndex:0.8,oscillator:{type:"fatsine2",spread:12,count:3},modulation:{type:"sine"},envelope:{attack:0.005,decay:0.5,sustain:0.15,release:0.8},modulationEnvelope:{attack:0.005,decay:0.4,sustain:0,release:0.4},volume:-10}).connect(rev2);
    if(myGen!==_preview.gen){try{syn.dispose();}catch(e){}try{rev2.dispose();}catch(e){}if(chordCleanup)chordCleanup();return;}
    var now2=Tone.now();
    for(var i2=0;i2<notes.length;i2++){var n2=notes[i2];if(!n2.tones)continue;
      (function(_n){var fireMs=Math.max(0,_n.startTime*1000-40);timers.push(setTimeout(function(){if(_preview.gen!==myGen)return;for(var j=0;j<_n.tones.length;j++){try{syn.triggerAttackRelease(_n.tones[j],Math.min(_n.dur*0.85,1.5),now2+_n.startTime);}catch(e){}}},fireMs));})(n2);}
    // Schedule chords in fallback too — same params as detail view
    if(prevChordSampler&&chordTimes.length>0){
      var SAMPLE_PRE2=0.04;
      for(var ci2=0;ci2<chordTimes.length;ci2++){var ch2=chordTimes[ci2];var cn2=chordToNotes(ch2.name,2);if(!cn2.length)continue;
        var nextT2=ci2<chordTimes.length-1?chordTimes[ci2+1].time:totalDur;var cDur2=Math.max(0.5,nextT2-ch2.time);
        for(var cni2=0;cni2<cn2.length;cni2++){(function(_note,_time,_dur){
          var fireMs=Math.max(0,(_time-SAMPLE_PRE2)*1000-40);
          timers.push(setTimeout(function(){if(_preview.gen!==myGen)return;try{prevChordSampler.triggerAttackRelease(_note,_dur,now2+_time-SAMPLE_PRE2,0.5);}catch(e){}},fireMs));
        })(cn2[cni2],ch2.time,cDur2);}}
    }
    _preview.id=lickId;
    var tid2=setTimeout(function(){if(_preview.id===lickId)previewStop();},totalDur*1000+300);
    _preview.stop=function(){clearTimeout(tid2);for(var k=0;k<timers.length;k++)clearTimeout(timers[k]);try{syn.releaseAll();}catch(e){}try{syn.dispose();}catch(e){}try{rev2.dispose();}catch(e){}if(chordCleanup)chordCleanup();};
  }
  previewNotify();
}
function usePreviewState(lickId){
  var ref=useRef(false);var _=useState(0);var force=_[1];
  useEffect(function(){return previewSubscribe(function(activeId){var now=activeId===lickId;if(now!==ref.current){ref.current=now;force(function(c){return c+1;});}});},[lickId]);
  return ref.current;
}
function usePreviewCurNote(lickId){
  var cnRef=useRef(-1);
  useEffect(function(){return previewSubscribe(function(activeId){cnRef.current=activeId===lickId?_preview.curNote:-1;});},[lickId]);
  return cnRef;
}
function PreviewBtn({lickId,abc,tempo,feel,th,size}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var playing=usePreviewState(lickId);var sz=size||28;
  var handleClick=function(e){e.stopPropagation();if(playing){previewStop();}else{previewPlay(lickId,abc,tempo,feel);}};
  return React.createElement("button",{onClick:handleClick,style:{width:sz,height:sz,borderRadius:sz/2,border:"none",background:playing?(isStudio?"#22D89E":"#6366F1"):(isStudio?"rgba(34,216,158,0.12)":"rgba(99,102,241,0.08)"),cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",boxShadow:playing?"0 2px 10px "+(isStudio?"rgba(34,216,158,0.3)":"rgba(99,102,241,0.25)"):"none"}},
    playing?React.createElement("div",{style:{width:sz*0.28,height:sz*0.28,borderRadius:2,background:isStudio?"#fff":"#fff"}}):
    React.createElement("div",{style:{width:0,height:0,borderTop:(sz*0.2)+"px solid transparent",borderBottom:(sz*0.2)+"px solid transparent",borderLeft:(sz*0.3)+"px solid "+(isStudio?"#22D89E":"#6366F1"),marginLeft:sz*0.06}}));
}

// ============================================================
// ABCjs
// ============================================================
function useAbcjs(){const[ok,s]=useState(false);useEffect(()=>{if(window.ABCJS){s(true);return;}const sc=document.createElement("script");sc.src=ABCJS_CDN;sc.onload=()=>s(true);document.head.appendChild(sc);},[]);return ok;}

// ============================================================
// VEXFLOW — professional notation rendering
// ============================================================
var _vexLoading=false,_vexReady=false;
function useVexflow(){
  var _s=useState(_vexReady),ok=_s[0],setOk=_s[1];
  useEffect(function(){
    if(window.Vex){setOk(true);return;}
    if(_vexLoading){var iv=setInterval(function(){if(window.Vex){_vexReady=true;setOk(true);clearInterval(iv);}},100);return function(){clearInterval(iv);};}
    _vexLoading=true;
    var sc=document.createElement("script");sc.src=VEXFLOW_CDN;
    sc.onload=function(){_vexReady=true;_vexLoading=false;setOk(true);};
    sc.onerror=function(){_vexLoading=false;};
    document.head.appendChild(sc);
  },[]);
  return ok;
}

// Parse tone string "C#4" → {note:"c",acc:"#",oct:4} or "Eb5" → {note:"e",acc:"b",oct:5}
function parseToneForVex(t){
  if(!t)return null;
  var note=t[0].toLowerCase(),acc=null,rest=t.substring(1);
  if(rest[0]==="#"||rest[0]==="b"){acc=rest[0];if(rest[1]==="#"||rest[1]==="b"){acc+=rest[1];rest=rest.substring(2);}else rest=rest.substring(1);}
  return{note:note,acc:acc,oct:parseInt(rest)||4};
}

// Map rL (fraction of whole note) → VexFlow duration string
function rlToVexDur(rL){
  var r=Math.round(rL*10000)/10000;
  if(r>=0.9375)return"w";if(r>=0.7)return"hd";if(r>=0.46)return"h";
  if(r>=0.34)return"qd";if(r>=0.23)return"q";
  if(r>=0.17)return"8d";if(r>=0.11)return"8";
  if(r>=0.085)return"16d";if(r>=0.055)return"16";
  return"32";
}

// Split parseAbc events into measures for VexFlow
function abcToVexMeasures(abc,bassClef){
  var parsed=parseAbc(abc);
  var ev=parsed.events;var chords=parsed.chords;var tsN=parsed.tsNum||4;
  // Parse time sig denominator
  var tsD=4;var tmMatch=abc.match(/M:(\d+)\/(\d+)/);if(tmMatch)tsD=parseInt(tmMatch[2]);
  var barRL=tsN/tsD;// bar length in whole-note fractions

  // Split events into measures
  var measures=[];var curMeasure=[];var curRL=0;var evIdx=0;
  var chordIdx=0;var totalRL=0;var curChords=[];

  for(var i=0;i<ev.length;i++){
    var e=ev[i];
    // Collect chords at this position
    while(chordIdx<chords.length&&chords[chordIdx].pos<=totalRL+0.001){
      curChords.push({name:chords[chordIdx].name,beatPos:curRL});
      chordIdx++;
    }

    curMeasure.push(e);
    curRL+=e.rL;
    totalRL+=e.rL;

    // Check if measure is full
    if(curRL>=barRL-0.001){
      measures.push({events:curMeasure,chords:curChords});
      curMeasure=[];curChords=[];curRL=curRL-barRL;
      // Carry over remaining chords
      while(chordIdx<chords.length&&chords[chordIdx].pos<=totalRL+0.001){
        curChords.push({name:chords[chordIdx].name,beatPos:0});
        chordIdx++;
      }
    }
  }
  // Remaining partial measure
  if(curMeasure.length>0){
    while(chordIdx<chords.length){curChords.push({name:chords[chordIdx].name,beatPos:curRL-(chords[chordIdx].pos-totalRL+curRL)});chordIdx++;}
    measures.push({events:curMeasure,chords:curChords});
  }

  return{measures:measures,tsN:tsN,tsD:tsD,clef:bassClef?"bass":"treble"};
}

function VexNotation({abc,compact,th,bassClef,curNoteRef,onReady}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var ref=useRef(null);
  var vexOk=useVexflow();
  var onReadyRef=useRef(onReady);onReadyRef.current=onReady;

  useEffect(function(){
    if(!vexOk||!ref.current||!window.Vex||!abc)return;
    ref.current.innerHTML="";
    try{
      var VF=Vex.Flow;
      var data=abcToVexMeasures(abc,bassClef);
      if(!data.measures.length)return;

      var renderer=new VF.Renderer(ref.current,VF.Renderer.Backends.SVG);
      var measPerLine=compact?4:2;
      var staveWidth=compact?92:200;
      var staveH=compact?70:90;
      var leftPad=compact?32:40;
      var topPad=compact?8:14;
      var nMeasures=data.measures.length;
      var nLines=Math.ceil(nMeasures/measPerLine);
      var totalW=leftPad+staveWidth*Math.min(nMeasures,measPerLine)+10;
      var totalH=topPad+nLines*staveH+10;

      renderer.resize(totalW,totalH);
      var ctx=renderer.getContext();
      ctx.scale(compact?0.85:1.0,compact?0.85:1.0);

      var globalNoteIdx=0;
      for(var li=0;li<nLines;li++){
        var measStart=li*measPerLine;
        var measEnd=Math.min(measStart+measPerLine,nMeasures);
        var x=leftPad;
        var y=topPad+li*staveH;

        for(var mi=measStart;mi<measEnd;mi++){
          var meas=data.measures[mi];
          var w=staveWidth;
          var stave=new VF.Stave(x,y,w);
          if(mi===0){stave.addClef(data.clef).addTimeSignature(data.tsN+"/"+data.tsD);}
          if(mi===nMeasures-1)stave.setEndBarType(VF.Barline.type.END);
          stave.setContext(ctx).draw();

          // Build VexFlow notes
          var vNotes=[];
          for(var ei=0;ei<meas.events.length;ei++){
            var ev=meas.events[ei];
            var dur=rlToVexDur(ev.rL);
            var isDot=dur.endsWith("d");
            var baseDur=isDot?dur.slice(0,-1):dur;

            if(!ev.tn){
              // Rest
              var rn=new VF.StaveNote({keys:[data.clef==="bass"?"d/3":"b/4"],duration:baseDur+"r"});
              if(isDot)try{rn.addDotToAll();}catch(e){try{rn.addModifier(new VF.Dot());}catch(e2){}}
              rn._etuIdx=globalNoteIdx++;
              vNotes.push(rn);
            }else{
              // Note(s)
              var keys=[];var accs=[];
              for(var ti=0;ti<ev.tn.length;ti++){
                var p=parseToneForVex(ev.tn[ti]);
                if(!p)continue;
                var key=p.note+(p.acc||"")+"/"+p.oct;
                keys.push(key);
                if(p.acc)accs.push({idx:ti,acc:p.acc});
              }
              if(!keys.length){globalNoteIdx++;continue;}
              var sn=new VF.StaveNote({keys:keys,duration:baseDur,auto_stem:true});
              for(var ai=0;ai<accs.length;ai++){
                try{sn.addModifier(new VF.Accidental(accs[ai].acc),accs[ai].idx);}catch(e){}
              }
              if(isDot)try{sn.addDotToAll();}catch(e){try{sn.addModifier(new VF.Dot());}catch(e2){}}
              sn._etuIdx=globalNoteIdx++;
              vNotes.push(sn);
            }
          }

          if(!vNotes.length){x+=w;continue;}

          // Add chord symbols as annotations on first note of chord
          for(var ci=0;ci<meas.chords.length;ci++){
            var ch=meas.chords[ci];
            // Find nearest note
            var nearIdx=0;var nearDist=Infinity;var pos=0;
            for(var ni=0;ni<meas.events.length;ni++){
              var d=Math.abs(pos-ch.beatPos);
              if(d<nearDist){nearDist=d;nearIdx=ni;}
              pos+=meas.events[ni].rL;
            }
            if(nearIdx<vNotes.length){
              try{
                var ann=new VF.Annotation(ch.name).setFont("JetBrains Mono",compact?9:12,"bold").setVerticalJustification(VF.Annotation.VerticalJustify.TOP);
                vNotes[nearIdx].addModifier(ann);
              }catch(e){}
            }
          }

          // Voice + format
          try{
            var voice=new VF.Voice({num_beats:data.tsN,beat_value:data.tsD}).setStrict(false);
            voice.addTickables(vNotes);
            new VF.Formatter().joinVoices([voice]).format([voice],w-20);
            voice.draw(ctx,stave);

            // Auto-beam eighth notes and shorter
            try{
              var beamable=vNotes.filter(function(n){return!n.isRest()&&n.getDuration()!=="w"&&n.getDuration()!=="h"&&n.getDuration()!=="q";});
              if(beamable.length>=2){
                var beams=VF.Beam.generateBeams(beamable,{groups:[new VF.Fraction(2,8)]});
                beams.forEach(function(b){b.setContext(ctx).draw();});
              }
            }catch(e){}
          }catch(e){console.warn("[etudy] VexFlow voice error:",e);}

          x+=w;
        }
      }

      // Style the SVG to match theme
      var svg=ref.current.querySelector("svg");
      if(svg){
        svg.style.maxWidth="100%";svg.style.height="auto";
        var noteCol=isStudio?"#E8E8F0":"#1A1A1A";
        var staffCol=isStudio?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)";
        svg.querySelectorAll(".vf-stave path,.vf-stave line").forEach(function(p){
          p.setAttribute("stroke",staffCol);p.setAttribute("fill","none");
        });
        svg.querySelectorAll(".vf-stavenote path,.vf-stem path,.vf-beam path,.vf-flag path").forEach(function(p){
          p.setAttribute("stroke",noteCol);p.setAttribute("fill",noteCol);
        });
        svg.querySelectorAll("text").forEach(function(t2){t2.setAttribute("fill",noteCol);});
        // Chord text styling
        svg.querySelectorAll(".vf-annotation text").forEach(function(t2){
          t2.setAttribute("fill",isStudio?"#A0A0CC":"#555");
        });
      }
    }catch(e){console.warn("[etudy] VexNotation render error:",e);}
    if(onReadyRef.current)requestAnimationFrame(function(){if(onReadyRef.current)onReadyRef.current();});
  },[abc,vexOk,compact,bassClef,th]);

  return React.createElement("div",{ref:ref,style:{minHeight:compact?50:80}});
}
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

// Truncate ABC to first N bars
function truncateAbcBars(abc,maxBars){
  var lines=abc.split("\n");var headers=[];var music="";
  for(var i=0;i<lines.length;i++){var l=lines[i].trim();if(/^[A-Za-z]:/.test(l)||l.startsWith("%%"))headers.push(lines[i]);else music+=lines[i]+" ";}
  var parts=music.split("|");var kept=[];var barCount=0;
  for(var j=0;j<parts.length;j++){
    var seg=parts[j].trim();
    if(seg.length>0&&!/^[:\[\]12\s]+$/.test(seg)){barCount++;if(barCount>maxBars)break;}
    kept.push(parts[j]);
  }
  return headers.join("\n")+"\n"+kept.join("|")+(barCount>maxBars?" |":"");
}

// ============================================================
// NOTATION — light theme, black notes, coral cursor
// ============================================================

// ============================================================
// NOTATION — theme-aware
// ============================================================
function Notation({abc,compact,abRange,curNoteRef,curProgressRef,focus,th,onNoteClick,selNoteIdx,onDeselect,theoryMode,theoryAnalysis,onReady,soundAbc,bassClef}){
  const ref=useRef(null);const ok=useAbcjs();const prevNoteRef=useRef(-1);const rafRef=useRef(null);
  const onReadyRef=useRef(onReady);useEffect(()=>{onReadyRef.current=onReady;},[onReady]);
  const t=th||TH.classic;
  var cursorDivRef=useRef(null);
  var wrapRef=useRef(null);
  useEffect(()=>{if(!ok||!ref.current||!window.ABCJS)return;
    prevNoteRef.current=-1;
    var el=ref.current;var prevH=el.offsetHeight;if(prevH>0)el.style.minHeight=prevH+"px";
    var barInfo=getBarInfo(abc);var nBars=barInfo.nBars;
    var mpl=nBars<=4?nBars:4;
    var editorMode=!!onNoteClick;
    var hasContent=abc.includes("|");
    // Inject barsperstaff directive for editor mode (only when there's music content)
    var renderAbc=bassClef?injectBassClef(abc):abc;
    // Hide tempo marking on compact cards
    if(compact)renderAbc=renderAbc.replace(/Q:[^\n]*\n?/,"");
    if(editorMode&&hasContent){
      renderAbc=renderAbc.replace(/(K:[^\n]*)/,"%%barsperstaff 2\n$1");
    }
    var fmtObj={notespacingfactor:1.4};
    const opts={responsive:"resize",paddingtop:editorMode?28:(focus?16:theoryMode?20:compact?2:6),paddingbottom:theoryMode?76:(focus?16:compact?2:6),paddingleft:0,paddingright:0,add_classes:true,format:fmtObj};
    if(compact){opts.staffwidth=420;opts.scale=0.85;var cBars=barInfo.nBars;if(cBars>4)opts.wrap={minSpacing:1.2,maxSpacing:2.2,preferredMeasuresPerLine:4};}
    else if(editorMode&&hasContent){opts.staffwidth=460;opts.scale=1.1;opts.wrap={minSpacing:1.0,maxSpacing:2.8,preferredMeasuresPerLine:2};}
    else if(editorMode){opts.staffwidth=460;opts.scale=1.1;}
    else if(focus){var isWide=ref.current&&ref.current.offsetWidth>600;opts.staffwidth=isWide?700:500;opts.scale=isWide?1.1:1.5;opts.wrap={minSpacing:1.0,maxSpacing:2.0,preferredMeasuresPerLine:isWide?4:2};}
    else{opts.staffwidth=420;opts.scale=1.0;opts.wrap={minSpacing:1.0,maxSpacing:1.8,preferredMeasuresPerLine:mpl};}
    try{window.ABCJS.renderAbc(ref.current,renderAbc,opts);}catch(e){}
    // Release height lock after paint
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      if(el)el.style.minHeight="";
      if(onReadyRef.current)onReadyRef.current();
    });});
    // Invalidate cursor position cache for smooth cursor
    posMapRef.current=null;
    if(!ref.current)return;const svg=ref.current.querySelector("svg");if(!svg)return;
    const isStudio=t===TH.studio;
    svg.querySelectorAll("path").forEach(p=>{p.setAttribute("stroke",t.noteStroke);p.setAttribute("fill",t.noteStroke);});
    // Staff lines — very thin, like professional engraving
    svg.querySelectorAll(".abcjs-staff path").forEach(p=>{p.setAttribute("stroke",t.staffStroke);p.setAttribute("fill","none");p.setAttribute("stroke-width","0.4");});
    // Clef, key sig, time sig — slightly lighter
    svg.querySelectorAll(".abcjs-staff-extra path").forEach(p=>{p.setAttribute("stroke",isStudio?t.staffStroke:t.muted);p.setAttribute("fill",isStudio?t.staffStroke:t.muted);p.setAttribute("stroke-width","0.5");});
    // Bar lines — thin and elegant
    svg.querySelectorAll(".abcjs-bar path").forEach(p=>{p.setAttribute("stroke",t.barStroke);p.setAttribute("stroke-width","0.4");});
    // Ledger lines — thinner than staff, shorter
    svg.querySelectorAll(".abcjs-ledger path").forEach(p=>{p.setAttribute("stroke",t.staffStroke);p.setAttribute("stroke-width","0.35");});
    // Stems — slightly thinner than noteheads for classical proportion
    svg.querySelectorAll(".abcjs-note path").forEach(function(p){
      try{var bb=p.getBBox();if(bb.width<1.5&&bb.height>5){p.setAttribute("stroke-width","0.7");}}catch(e){}
    });
    // Text styling
    svg.querySelectorAll("text").forEach(p=>p.setAttribute("fill",t.metaFill));
    // Chord symbols — jazz fake-book style
    svg.querySelectorAll("text.abcjs-chord").forEach(p=>{
      p.setAttribute("fill",t.chordFill);
      p.style.fontSize=editorMode?"15px":(isStudio?"13px":"12px");
      p.style.fontWeight=editorMode?"700":"600";
      p.style.fontFamily="'Inter',sans-serif";
      p.style.letterSpacing="-0.3px";
      if(isStudio)p.style.filter="drop-shadow(0 0 3px "+t.chordFill+"40)";
    });
    svg.querySelectorAll(".abcjs-title,.abcjs-meta-top").forEach(el=>el.style.display="none");
    const noteEls=svg.querySelectorAll(".abcjs-note");if(!noteEls.length)return;
    const fracs=getNoteTimeFracs(abc);
    // ── THEORY MODE: clean interval labels below each staff ──
    if(theoryMode&&theoryAnalysis&&theoryAnalysis.noteAnalysis&&theoryAnalysis.noteAnalysis.length>0){
      svg.querySelectorAll(".theory-label,.theory-pill,.theory-region,.theory-badge,.theory-lane").forEach(function(el){el.remove();});
      var na=theoryAnalysis.noteAnalysis;
      // Detect staves and their parent line-groups
      var staffEls=svg.querySelectorAll(".abcjs-staff");
      var staves=[];
      staffEls.forEach(function(s){
        try{
          var sb=s.getBBox();
          // Walk up to find the top-level <g> (direct child of svg)
          var lineGroup=s;
          while(lineGroup.parentNode&&lineGroup.parentNode!==svg)lineGroup=lineGroup.parentNode;
          staves.push({cy:sb.y+sb.height/2,bottom:sb.y+sb.height,lowestY:sb.y+sb.height,lineGroup:lineGroup});
        }catch(e){}
      });
      if(!staves.length)staves.push({cy:50,bottom:100,lowestY:100,lineGroup:svg});
      // Pass 1: color noteheads, assign to nearest staff, track lowest Y
      var labelData=[];
      noteEls.forEach(function(noteEl,idx){
        if(idx>=na.length)return;
        var info=na[idx];if(!info||!info.entries||!info.entries.length)return;
        var entry=info.entries[0];if(!entry.label)return;
        try{
          var bb=noteEl.getBBox();
          var col=getTheoryColor(entry.type,isStudio);
          var op=entry.type==="chord-tone"?"1":(entry.type==="tension"?"0.8":"0.5");
          noteEl.querySelectorAll("path,circle,ellipse").forEach(function(p){
            p.setAttribute("fill",col);p.setAttribute("stroke",col);
            p.setAttribute("fill-opacity",op);p.setAttribute("stroke-opacity",op);
          });
          noteEl._theoryInfo={idx:idx,bb:bb,entry:entry,col:col};
          // Nearest staff
          var nCy=bb.y+bb.height/2;var si=0;var best=Infinity;
          for(var j=0;j<staves.length;j++){var d=Math.abs(nCy-staves[j].cy);if(d<best){best=d;si=j;}}
          var noteBot=bb.y+bb.height;
          if(noteBot>staves[si].lowestY)staves[si].lowestY=noteBot;
          labelData.push({cx:bb.x+bb.width/2,si:si,entry:entry,col:col,op:op});
        }catch(e){}
      });
      // Pass 2: render labels inside their line group
      var LANE_GAP=10;
      var laneYPerStaff=[];
      for(var si2=0;si2<staves.length;si2++){
        var laneY=staves[si2].lowestY+LANE_GAP;
        laneYPerStaff.push(laneY);
        var myLabels=labelData.filter(function(d){return d.si===si2;});
        myLabels.forEach(function(ld){
          var lbl=document.createElementNS("http://www.w3.org/2000/svg","text");
          lbl.setAttribute("class","theory-label");
          lbl.setAttribute("x",ld.cx);
          lbl.setAttribute("y",laneY);
          lbl.setAttribute("text-anchor","middle");
          lbl.setAttribute("dominant-baseline","hanging");
          lbl.setAttribute("fill",ld.col);
          lbl.setAttribute("fill-opacity",ld.op);
          lbl.style.fontSize="14px";
          lbl.style.fontFamily="'Inter','Helvetica Neue',sans-serif";
          lbl.style.fontWeight="300";
          lbl.style.pointerEvents="none";
          lbl.textContent=ld.entry.label;
          staves[si2].lineGroup.appendChild(lbl);
        });
      }
      // Pass 3: shift line groups apart to prevent label/chord overlap
      if(staves.length>1){
        var cumulativePush=0;
        for(var gi=1;gi<staves.length;gi++){
          // Measure bottom of previous group (including its labels)
          var prevGroup=staves[gi-1].lineGroup;
          var nextGroup=staves[gi].lineGroup;
          if(prevGroup===nextGroup||prevGroup===svg||nextGroup===svg)continue;
          try{
            var prevBB=prevGroup.getBBox();
            var nextBB=nextGroup.getBBox();
            var gap=nextBB.y-(prevBB.y+prevBB.height);
            var minGap=8;
            if(gap<minGap){
              var push=minGap-gap;
              cumulativePush+=push;
            }
            if(cumulativePush>0){
              var existing=nextGroup.getAttribute("transform")||"";
              nextGroup.setAttribute("transform",existing+" translate(0,"+cumulativePush+")");
            }
          }catch(e){}
        }
        // Expand viewBox for shifted content
        if(cumulativePush>0){
          try{
            var vb=svg.viewBox.baseVal;
            if(vb)svg.setAttribute("viewBox",vb.x+" "+vb.y+" "+vb.width+" "+(vb.height+cumulativePush));
          }catch(e){}
        }
      }
      // Expand viewBox to include any labels that extend past
      try{
        var vb2=svg.viewBox.baseVal;
        if(vb2&&vb2.width>0){
          var maxY=vb2.y+vb2.height;
          svg.querySelectorAll(".theory-label").forEach(function(l){try{var lb=l.getBoundingClientRect();var svgRect=svg.getBoundingClientRect();var scale=vb2.width/svgRect.width;var bot=vb2.y+(lb.bottom-svgRect.top)*scale;if(bot>maxY)maxY=bot;}catch(e){}});
          if(maxY>vb2.y+vb2.height)svg.setAttribute("viewBox",vb2.x+" "+vb2.y+" "+vb2.width+" "+(maxY-vb2.y));
        }
      }catch(e){}
      // ── Theory tap: invisible hit-area columns from chord symbol to label ──
      var tapAbc=soundAbc||abc;
      var tapParsed=null;try{tapParsed=parseAbc(tapAbc);}catch(e){}
      if(tapParsed){
        var noteTones=[];
        for(var ei=0;ei<tapParsed.events.length;ei++){
          if(tapParsed.events[ei].tn&&tapParsed.events[ei].tn.length>0)noteTones.push(tapParsed.events[ei].tn);
        }
        var tapChords=tapParsed.chords||[];
        var tapChordAtNote=[];
        var notePos=0;
        for(var tei=0;tei<tapParsed.events.length;tei++){
          if(tapParsed.events[tei].tn&&tapParsed.events[tei].tn.length>0){
            var activeChord=null;
            for(var tci2=tapChords.length-1;tci2>=0;tci2--){
              if(notePos>=tapChords[tci2].pos-0.001){activeChord=tapChords[tci2].name;break;}
            }
            tapChordAtNote.push(activeChord);
          }
          notePos+=tapParsed.events[tei].rL;
        }
        // Build hit-area rects per note — full column from staff top to below label
        var HIT_W=24;var LABEL_H=16;
        noteEls.forEach(function(noteEl,idx){
          var ti=noteEl._theoryInfo;if(!ti)return;
          var bb=ti.bb;var cx=bb.x+bb.width/2;
          // Find this note's staff
          var nCy=bb.y+bb.height/2;var bestSi=0;var bestD=Infinity;
          for(var sj=0;sj<staves.length;sj++){var dd=Math.abs(nCy-staves[sj].cy);if(dd<bestD){bestD=dd;bestSi=sj;}}
          // Hit area: from above staff to below label
          var staffHalf=staves[bestSi].bottom-staves[bestSi].cy;
          var hitTop=Math.min(staves[bestSi].cy-staffHalf-6,bb.y-8);
          var hitBot=(laneYPerStaff[bestSi]||bb.y+bb.height+20)+LABEL_H;
          var hitH=hitBot-hitTop;
          // Invisible hit-area rect — must be truly invisible
          var hit=document.createElementNS("http://www.w3.org/2000/svg","rect");
          hit.setAttribute("class","theory-lane");
          hit.setAttribute("x",cx-HIT_W/2);hit.setAttribute("y",hitTop);
          hit.setAttribute("width",HIT_W);hit.setAttribute("height",hitH);
          hit.setAttribute("fill","none");hit.setAttribute("stroke","none");
          hit.setAttribute("pointer-events","visible");
          hit.style.cursor="pointer";hit.style.opacity="0";
          hit.addEventListener("click",function(theIdx,theNoteEl,theCol){return function(e){
            e.stopPropagation();
            var tones=theIdx<noteTones.length?noteTones[theIdx]:null;
            var chordName=theIdx<tapChordAtNote.length?tapChordAtNote[theIdx]:null;
            if(tones)playTheoryTap(tones,chordName);
            // Find notehead: the most compact (width/height ratio) path in the group
            var headCx,headCy;
            var paths=theNoteEl.querySelectorAll("path");
            var bestRatio=0;
            paths.forEach(function(p){
              try{
                var pb=p.getBBox();
                if(pb.width<1||pb.height<1)return;
                var ratio=Math.min(pb.width,pb.height)/Math.max(pb.width,pb.height);
                if(ratio>bestRatio){bestRatio=ratio;headCx=pb.x+pb.width/2;headCy=pb.y+pb.height/2;}
              }catch(e2){}
            });
            if(!headCx){try{var fb=theNoteEl.getBBox();headCx=fb.x+fb.width/2;headCy=fb.y+fb.height/2;}catch(e2){return;}}
            // Glow circle at notehead
            var glow=document.createElementNS("http://www.w3.org/2000/svg","circle");
            glow.setAttribute("cx",headCx);
            glow.setAttribute("cy",headCy);
            glow.setAttribute("r","14");
            glow.setAttribute("fill",theCol);glow.setAttribute("fill-opacity","0.4");
            glow.setAttribute("stroke","none");
            glow.style.pointerEvents="none";
            theNoteEl.parentNode.insertBefore(glow,theNoteEl);
            setTimeout(function(){glow.setAttribute("fill-opacity","0.25");},150);
            setTimeout(function(){glow.setAttribute("fill-opacity","0.1");},400);
            setTimeout(function(){try{glow.remove();}catch(e2){}},650);
          };}(idx,noteEl,ti.col));
          svg.appendChild(hit);
          svg.appendChild(hit);
        });
      }
    }
    // Clickable notes for editor
    if(onNoteClick){
      // Click on SVG background = deselect
      if(onDeselect)svg.addEventListener("click",function(e){if(e.target===svg||e.target.closest(".abcjs-staff")||e.target.closest(".abcjs-staff-extra"))onDeselect();});
      noteEls.forEach(function(el,idx){el.style.cursor="pointer";el.addEventListener("click",function(e){e.stopPropagation();onNoteClick(idx);});});}
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
  },[abc,ok,compact,abRange,focus,th,theoryMode,theoryAnalysis,soundAbc,bassClef]);
  // Cursor: smooth continuous playhead + note highlighting
  // Uses curProgressRef (0-1 fraction) for smooth cursor, curNoteRef for note highlighting
  var posMapRef=useRef(null);
  useEffect(()=>{if(!curNoteRef&&!curProgressRef)return;
    // Build position map: note positions + staff lines
    var buildPosMap=function(){
      if(posMapRef.current)return posMapRef.current;
      if(!ref.current)return null;
      var svg=ref.current.querySelector("svg");if(!svg)return null;
      var noteEls=svg.querySelectorAll(".abcjs-note");
      if(!noteEls.length)return null;
      var fracs=getNoteTimeFracs(abc);
      // Get individual staff systems — each .abcjs-staff is one 5-line staff
      var staffEls=svg.querySelectorAll(".abcjs-staff");
      var staves=[];
      staffEls.forEach(function(s){
        try{var sb=s.getBBox();staves.push({y:sb.y,y2:sb.y+sb.height,cy:sb.y+sb.height/2,h:sb.height,el:s});}catch(e){}
      });
      // Fixed cursor height from first staff (all staves have same 5-line height)
      var cursorH=staves.length>0?staves[0].h:30;
      // Map each note to x position + which staff it belongs to
      // Get Y offset from transform="... translate(0,N)" on a group element
      var getGroupYOffset=function(el){
        var g=el;
        while(g&&g!==svg){
          var tr=g.getAttribute&&g.getAttribute("transform");
          if(tr){var m=tr.match(/translate\(\s*[\d.+-]+\s*,\s*([\d.+-]+)\s*\)/);if(m)return parseFloat(m[1]);}
          g=g.parentNode;
        }
        return 0;
      };
      var positions=[];
      noteEls.forEach(function(el,idx){
        try{
          var head=el.querySelector("ellipse")||el.querySelector("circle");
          var bb=head?head.getBBox():el.getBBox();
          var yOff=getGroupYOffset(el);
          var lx=bb.x;// left edge of notehead
          var cy=bb.y+bb.height/2+yOff;
          // Find nearest staff by center Y distance (also offset)
          var staffIdx=0;var bestDist=Infinity;
          for(var si=0;si<staves.length;si++){
            var sOff=getGroupYOffset(staves[si].el||svg);
            var d=Math.abs(cy-(staves[si].cy+sOff));
            if(d<bestDist){bestDist=d;staffIdx=si;}
          }
          positions.push({
            lx:lx,staffIdx:staffIdx,yOff:yOff,
            frac:idx<fracs.length?fracs[idx].frac:1,
            endFrac:idx<fracs.length?fracs[idx].endFrac:1
          });
        }catch(e){positions.push(null);}
      });
      // Add virtual start position (frac=0) and end position (frac=1) for rests at edges
      // Start: right edge of clef/key/time area (= where music begins)
      var startX=null,endX=null;
      var firstStaff=staves.length>0?staves[0]:null;
      var lastStaff=staves.length>0?staves[staves.length-1]:null;
      // Use staff-extra (clef+key+time) right edge as music start
      var extras=svg.querySelectorAll(".abcjs-staff-extra");
      if(extras.length>0){try{var eb=extras[0].getBBox();startX=eb.x+eb.width+6;}catch(e){}}
      // Fallback: first note minus offset
      if(startX===null&&positions.length>0&&positions[0])startX=positions[0].lx-16;
      // End: last barline position
      var barEls=svg.querySelectorAll(".abcjs-bar");
      if(barEls.length>0){
        try{var lb=barEls[barEls.length-1].getBBox();endX=lb.x;}catch(e){}
      }
      if(endX===null&&positions.length>0){var lp2=positions[positions.length-1];if(lp2)endX=lp2.lx+20;}
      // Insert virtual start if first note isn't at frac~0
      if(positions.length>0&&positions[0]&&positions[0].frac>0.005&&startX!==null&&firstStaff){
        positions.unshift({lx:startX,staffIdx:0,frac:0,endFrac:0});
      }
      // Append virtual end if last note isn't at frac~1
      if(positions.length>0){var lastP=positions[positions.length-1];
        if(lastP&&lastP.endFrac<0.995&&endX!==null&&lastStaff){
          positions.push({lx:endX,staffIdx:lastP.staffIdx,frac:1,endFrac:1});
        }
      }
      posMapRef.current={positions:positions,staves:staves,cursorH:cursorH};
      return posMapRef.current;
    };
    // Get cursor x,y for a given progress fraction by interpolating between notes
    var getCursorPos=function(progress,map){
      if(!map||!map.positions.length)return null;
      var pos=map.positions;
      var prevP=null,nextP=null;
      for(var i=0;i<pos.length;i++){
        if(!pos[i])continue;
        if(pos[i].frac<=progress+0.001)prevP=pos[i];
        if(pos[i].frac>progress-0.001&&!nextP)nextP=pos[i];
      }
      if(!prevP&&nextP)prevP=nextP;
      if(!nextP&&prevP)nextP=prevP;
      if(!prevP)return null;
      // Same staff: interpolate x
      if(prevP.staffIdx===nextP.staffIdx){
        var segLen=nextP.frac-prevP.frac;
        var t2=segLen>0.001?(progress-prevP.frac)/segLen:0;
        t2=Math.max(0,Math.min(1,t2));
        return{x:prevP.lx+(nextP.lx-prevP.lx)*t2,staffIdx:prevP.staffIdx};
      }else{
        // Line break: jump at midpoint
        var midFrac=(prevP.endFrac+nextP.frac)/2;
        if(progress>=midFrac){
          return{x:nextP.lx,staffIdx:nextP.staffIdx};
        }else{
          return{x:prevP.lx,staffIdx:prevP.staffIdx};
        }
      }
    };
    // SVG-to-pixel mapping for HTML cursor overlay
    var svgRatio={ratio:0,offX:0,offY:0,ok:false};
    var computeRatio=function(){
      if(!ref.current)return;var svg=ref.current.querySelector("svg");if(!svg)return;
      var vb=svg.viewBox.baseVal;if(!vb||vb.width<=0)return;
      var sr=svg.getBoundingClientRect();var cr=wrapRef.current?wrapRef.current.getBoundingClientRect():ref.current.getBoundingClientRect();
      svgRatio.ratio=sr.width/vb.width;
      svgRatio.offX=sr.left-cr.left-vb.x*svgRatio.ratio;
      svgRatio.offY=sr.top-cr.top-vb.y*svgRatio.ratio;
      svgRatio.ok=true;
    };
    computeRatio();
    var _prevLineIdx=-1;var _lastCurTr="";
    const tick=()=>{
      var cn=curNoteRef?curNoteRef.current:-1;
      var progress=curProgressRef?curProgressRef.current:-1;
      // --- Note highlighting (discrete, uses setAttribute not style) ---
      if(cn!==prevNoteRef.current&&ref.current){
        const svg=ref.current.querySelector("svg");if(svg){
          const noteEls=svg.querySelectorAll(".abcjs-note");
          const fracs=getNoteTimeFracs(abc);const hasRange=abRange&&(abRange[0]>0.001||abRange[1]<0.999);
          if(prevNoteRef.current>=0&&prevNoteRef.current<noteEls.length){
            const el=noteEls[prevNoteRef.current];
            var restoreCol=t.noteStroke;var restoreOp="1";
            if(el._theoryInfo){restoreCol=el._theoryInfo.col;restoreOp=el._theoryInfo.entry.type==="chord-tone"?"1":(el._theoryInfo.entry.type==="tension"?"0.8":"0.5");}
            el.querySelectorAll("path,circle,ellipse").forEach(p=>{
              p.setAttribute("fill",restoreCol);p.setAttribute("stroke",restoreCol);
              if(hasRange&&prevNoteRef.current<fracs.length){const f=fracs[prevNoteRef.current];const inR=f.frac>=abRange[0]-0.001&&f.endFrac<=abRange[1]+0.001;
                p.setAttribute("fill-opacity",inR?restoreOp:"0.12");p.setAttribute("stroke-opacity",inR?restoreOp:"0.12");
              }else{p.setAttribute("fill-opacity",restoreOp);p.setAttribute("stroke-opacity",restoreOp);}});}
          if(cn>=0&&cn<noteEls.length){
            const el=noteEls[cn];
            var curCol=theoryMode?(t===TH.studio?"#FFFFFF":"#1A1A1A"):t.accent;
            el.querySelectorAll("path,circle,ellipse").forEach(p=>{
              p.setAttribute("fill",curCol);p.setAttribute("stroke",curCol);
              p.setAttribute("fill-opacity","1");p.setAttribute("stroke-opacity","1");});
          }
        }prevNoteRef.current=cn;}
      // --- HTML cursor overlay (zero SVG DOM mutations) ---
      var cDiv=cursorDivRef.current;
      if(!compact&&progress>=0&&cDiv){
        if(!svgRatio.ok)computeRatio();// lazy init — SVG might not be laid out on first tick
        var map=buildPosMap();
        if(map&&svgRatio.ok){
          var cPos=getCursorPos(progress,map);
          if(cPos&&cPos.staffIdx<map.staves.length){
            var staff=map.staves[cPos.staffIdx];
            var ch=map.cursorH;var overhang=ch*0.15;
            var staffYOff=0;
            if(staff.el){var g=staff.el;while(g&&g.tagName!=="svg"){var tr2=g.getAttribute&&g.getAttribute("transform");if(tr2){var m3=tr2.match(/translate\(\s*[\d.+-]+\s*,\s*([\d.+-]+)\s*\)/);if(m3)staffYOff+=parseFloat(m3[1]);}g=g.parentNode;}}
            var r=svgRatio.ratio;
            var px=Math.round(((cPos.x-3)*r+svgRatio.offX)*2)/2;
            var py=Math.round(((staff.cy-ch/2-overhang+staffYOff)*r+svgRatio.offY)*2)/2;
            var ph=Math.round((ch+overhang*2)*r*2)/2;
            var newTr="translate3d("+px+"px,"+py+"px,0)";
            if(_lastCurTr!==newTr){cDiv.style.transform=newTr;_lastCurTr=newTr;}
            if(cDiv._lastH!==ph){cDiv.style.height=ph+"px";cDiv._lastH=ph;}
            if(cDiv.style.display!=="block")cDiv.style.display="block";
          }
        }
      }else if(cDiv&&cDiv.style.display!=="none"){
        cDiv.style.display="none";_lastCurTr="";
      }
      rafRef.current=requestAnimationFrame(tick);};
    rafRef.current=requestAnimationFrame(tick);
    return()=>{
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
      posMapRef.current=null;
    };
  },[abc,abRange,th,compact,curNoteRef,curProgressRef,theoryMode]);
  // Selection highlight (editor) — rounded box around selected note
  var prevSelRef=useRef(-1);var selBoxRef=useRef(null);
  useEffect(function(){
    // Remove old box
    if(selBoxRef.current){try{selBoxRef.current.remove();}catch(e){}selBoxRef.current=null;}
    if(!ref.current)return;
    var svg=ref.current.querySelector("svg");if(!svg)return;
    var noteEls=svg.querySelectorAll(".abcjs-note");
    var selC=t.accent||"#6366F1";
    // Clear previous selection styling
    if(prevSelRef.current>=0&&prevSelRef.current<noteEls.length){
      var pel=noteEls[prevSelRef.current];
      pel.querySelectorAll("path,circle,ellipse").forEach(function(p){p.style.fill=t.noteStroke;p.style.stroke=t.noteStroke;p.style.fillOpacity="1";p.style.strokeOpacity="1";});
      pel.style.filter="none";}
    // Apply new selection
    if(selNoteIdx!==null&&selNoteIdx!==undefined&&selNoteIdx>=0&&selNoteIdx<noteEls.length){
      var sel=noteEls[selNoteIdx];
      // Color the note
      sel.querySelectorAll("path,circle,ellipse").forEach(function(p){p.style.fill=selC;p.style.stroke=selC;p.style.fillOpacity="1";p.style.strokeOpacity="1";});
      // Draw a rounded rect behind
      try{var box=sel.getBBox();var pad=4;
        var rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
        rect.setAttribute("x",box.x-pad);rect.setAttribute("y",box.y-pad);
        rect.setAttribute("width",box.width+pad*2);rect.setAttribute("height",box.height+pad*2);
        rect.setAttribute("rx","4");rect.setAttribute("ry","4");
        rect.setAttribute("fill",selC);rect.setAttribute("fill-opacity","0.08");
        rect.setAttribute("stroke",selC);rect.setAttribute("stroke-opacity","0.35");
        rect.setAttribute("stroke-width","1.5");
        svg.insertBefore(rect,svg.firstChild);selBoxRef.current=rect;
      }catch(e){}
      // scroll into view
      try{var box2=sel.getBBox();var vb=svg.viewBox.baseVal;
        var parent=ref.current;if(parent&&box2.x>0){var ratio=parent.clientWidth/(vb.width||1);var noteX=box2.x*ratio;
          if(noteX<parent.scrollLeft||noteX>parent.scrollLeft+parent.clientWidth-40){parent.scrollTo({left:Math.max(0,noteX-parent.clientWidth/2),behavior:"smooth"});}}}catch(e){}}
    prevSelRef.current=selNoteIdx!==null&&selNoteIdx!==undefined?selNoteIdx:-1;
  },[selNoteIdx,abc,th]);
  if(!ok)return React.createElement("div",{style:{height:compact?50:80,display:"flex",alignItems:"center",justifyContent:"center",color:t.subtle,fontSize:12,fontFamily:"'Inter',sans-serif"}},"Loading...");
  const isStudio=t===TH.studio;
  // Compact (explore cards): simple, ref directly on container — no cursor needed
  if(compact) return React.createElement("div",{ref:ref,style:{borderRadius:isStudio?12:10,background:"transparent",padding:"6px 10px",overflow:"hidden"}});
  // Non-compact (detail/editor/focus): wrapper with cursor overlay
  return React.createElement("div",{ref:wrapRef,style:{position:"relative",borderRadius:focus?0:isStudio?12:10,background:focus?"transparent":t.noteBg,padding:focus?"0":(isStudio?"14px 16px":"12px 14px"),border:focus?"none":"1px solid "+(isStudio?t.border:t.borderSub),overflow:"visible"}},
    React.createElement("div",{ref:ref,style:{width:"100%"}}),
    React.createElement("div",{ref:cursorDivRef,style:{position:"absolute",top:0,left:0,width:1.5,borderRadius:1,background:t.accent,opacity:isStudio?0.5:0.35,pointerEvents:"none",display:"none",willChange:"transform",zIndex:5}}));}

// ============================================================
// A/B RANGE BAR — themed
// ============================================================
function ABRangeBar({abc,abA,abB,setAbA,setAbB,onReset,th,compact}){
  const t=th||TH.classic;const barRef=useRef(null);const dragRef=useRef(null);
  const info=getBarInfo(abc);const{nBars,beatsPerBar}=info;
  const onStart=which=>e=>{e.preventDefault();e.stopPropagation();dragRef.current=which;
    const onMove=ev=>{if(!barRef.current||!dragRef.current)return;const rect=barRef.current.getBoundingClientRect();const raw=(ev.touches?ev.touches[0]:ev).clientX;let pct=Math.max(0,Math.min(1,(raw-rect.left)/rect.width));const snap=1/(nBars*beatsPerBar);pct=Math.round(pct/snap)*snap;if(dragRef.current==="a"){setAbA(Math.min(pct,abB-snap));}else{setAbB(Math.max(pct,abA+snap));}};
    const onEnd=()=>{dragRef.current=null;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onEnd);window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onEnd);};
    window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onEnd);window.addEventListener("touchmove",onMove,{passive:false});window.addEventListener("touchend",onEnd);};
  const ticks=[];for(let b=0;b<=nBars;b++){ticks.push(React.createElement("div",{key:"b"+b,style:{position:"absolute",left:(b/nBars*100)+"%",top:0,bottom:0,width:1,background:b===0||b===nBars?t.dimBorder:t.border}}));if(b<nBars)for(let bt=1;bt<beatsPerBar;bt++){ticks.push(React.createElement("div",{key:"t"+b+"-"+bt,style:{position:"absolute",left:((b+bt/beatsPerBar)/nBars*100)+"%",top:"60%",bottom:0,width:1,background:t.border,opacity:0.5}}));}}
  var barH=compact?24:32;var handleSz=compact?22:28;var handleRad=compact?6:8;var handleFnt=compact?9:10;
  return React.createElement("div",{style:{marginTop:compact?2:8,marginBottom:compact?0:4}},
    !compact&&React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}},
      React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},nBars+" bars"),
      (abA>0.001||abB<0.999)&&React.createElement("button",{onClick:e=>{e.stopPropagation();onReset();},style:{fontSize:9,color:t.muted,background:t.filterBg,border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"'Inter',sans-serif"}},"Reset")),
    React.createElement("div",{ref:barRef,style:{position:"relative",height:barH,margin:"0 "+((handleSz/2)+2)+"px",touchAction:"none"}},
      React.createElement("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,background:t.noteBg,borderRadius:compact?6:8,border:"1px solid "+t.border,overflow:"hidden"}},
        ticks,
        React.createElement("div",{style:{position:"absolute",left:(abA*100)+"%",width:((abB-abA)*100)+"%",top:0,height:"100%",background:t.accentBg,borderLeft:"2px solid "+t.accent,borderRight:"2px solid "+t.accent}})),
      React.createElement("div",{onMouseDown:onStart("a"),onTouchStart:onStart("a"),style:{position:"absolute",left:"calc("+(abA*100)+"% - "+(handleSz/2)+"px)",top:"50%",transform:"translateY(-50%)",width:handleSz,height:handleSz,borderRadius:handleRad,background:t.card,border:"2px solid "+t.accent,cursor:"grab",touchAction:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}},
        React.createElement("span",{style:{fontSize:handleFnt,fontWeight:700,color:t.accent,fontFamily:"monospace"}},"A")),
      React.createElement("div",{onMouseDown:onStart("b"),onTouchStart:onStart("b"),style:{position:"absolute",left:"calc("+(abB*100)+"% - "+(handleSz/2)+"px)",top:"50%",transform:"translateY(-50%)",width:handleSz,height:handleSz,borderRadius:handleRad,background:t.card,border:"2px solid "+t.accent,cursor:"grab",touchAction:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}},
        React.createElement("span",{style:{fontSize:handleFnt,fontWeight:700,color:t.accent,fontFamily:"monospace"}},"B"))));}


// ============================================================
// PLAYER — themed, 3-tier
// ============================================================
function Player({abc,tempo,abOn,abA,abB,setAbOn,setAbA,setAbB,pT,sPT,lickTempo,trInst,setTrInst,trMan,setTrMan,onCurNote,th,onLoopComplete,forceLoop,autoPlay,hideControls,ctrlRef,initFeel,editorMode,headless,onStateChange,progressRef}){
  const t=th||TH.classic;
  const[pl,sPl]=useState(false);const[lp,sLp]=useState(forceLoop||editorMode||false);const[bk,sBk]=useState(true);const[ml,sMl]=useState(true);const[fl,sFl]=useState(initFeel||"straight");
  const[backingStyle,setBackingStyle]=useState("piano");const[muteKeys,setMuteKeys]=useState(false);const[muteBass,setMuteBass]=useState(false);const[muteDrums,setMuteDrums]=useState(false);
  const[sound,setSound]=useState("piano");const[loading,setLoading]=useState(false);const[samplesOk,setSamplesOk]=useState(_samplerReady);
  const[ci,setCi]=useState(true);const lcDispRef=useRef(null);const[settingsOpen,setSettingsOpen]=useState(false);
  const[soundDdOpen,setSoundDdOpen]=useState(false);const[backDdOpen,setBackDdOpen]=useState(false);const[metroExpand,setMetroExpand]=useState(false);const[feelDdOpen,setFeelDdOpen]=useState(false);
  const prBarRef=useRef(null);
  const bagRef=useRef([]);const aR=useRef(null);const tR=useRef(0);const dR=useRef(0);const sT=useRef(true);
  const lR=useRef(false);const mR=useRef(false);const bR=useRef(true);const mlR=useRef(true);const fR=useRef(initFeel||"straight");const soR=useRef("piano");const ciR=useRef(true);
  const bStyleR=useRef("piano");const muteKeysR=useRef(false);const muteBassR=useRef(false);const muteDrumsR=useRef(false);
  const abOnR=useRef(false);const abAR=useRef(0);const abBR=useRef(1);const lcR=useRef(0);
  const noteFracsR=useRef(null);const curNoteR=useRef(-1);const onCurNoteR=useRef(null);const onLoopCompleteR=useRef(null);
  const pTR=useRef(pT||tempo);
  const abcR=useRef(abc);const toneStartR=useRef(0);
  const lickTS=useMemo(function(){var m=abc.match(/M:(\d+)\/(\d+)/);return m?[parseInt(m[1]),parseInt(m[2])]:null;},[abc]);
  useEffect(()=>{abcR.current=abc;},[abc]);
  useEffect(()=>{lR.current=lp;},[lp]);useEffect(()=>{bR.current=bk;},[bk]);
  useEffect(()=>{bStyleR.current=backingStyle;},[backingStyle]);useEffect(()=>{muteKeysR.current=muteKeys;},[muteKeys]);useEffect(()=>{muteBassR.current=muteBass;},[muteBass]);useEffect(()=>{muteDrumsR.current=muteDrums;},[muteDrums]);
  useEffect(()=>{mlR.current=ml;},[ml]);useEffect(()=>{fR.current=fl;},[fl]);useEffect(()=>{soR.current=sound;},[sound]);
  useEffect(()=>{if(initFeel&&initFeel!==fl){sFl(initFeel);fR.current=initFeel;}},[initFeel]);
  useEffect(()=>{ciR.current=ci;},[ci]);
  useEffect(()=>{abOnR.current=abOn;abAR.current=abA;abBR.current=abB;},[abOn,abA,abB]);
  useEffect(()=>{onCurNoteR.current=onCurNote;},[onCurNote]);
  useEffect(()=>{onLoopCompleteR.current=onLoopComplete;},[onLoopComplete]);
  useEffect(()=>{pTR.current=pT||tempo;},[pT,tempo]);
  useEffect(()=>{if(!samplesOk&&_samplerReady)setSamplesOk(true);},[]);
  const setPr=v=>{if(prBarRef.current)prBarRef.current.style.width=(v*100)+"%";};
  const setLc=v=>{if(lcDispRef.current){lcDispRef.current.textContent=v;lcDispRef.current.parentElement.style.display=v>1?"flex":"none";}};
  const scheduledTimers=useRef([]);
  const playGenRef=useRef(0);// generation counter — prevents stale async tg from continuing
  const masterGateRef=useRef(null);// per-session gain gate — silences ALL audio on stop
  const clearScheduled=()=>{for(const tid of scheduledTimers.current)clearTimeout(tid);scheduledTimers.current=[];};
  const disposeBag=()=>{clearScheduled();
    // Instantly silence via master gate BEFORE disconnecting anything
    if(masterGateRef.current){try{masterGateRef.current.gain.cancelScheduledValues(0);masterGateRef.current.gain.setValueAtTime(0,0);}catch(e){}}
    // Release all held notes on shared samplers
    var samplers=[_sampler,_chordSampler,_bassSampler,_rhodesChordSampler,_cPianoChordSampler,_saxSampler,_pianoMelSampler,_rhodesMelSampler];
    for(var si=0;si<samplers.length;si++){if(samplers[si])try{samplers[si].releaseAll(0);}catch(e){}}
    // Disconnect shared samplers from effect chains (don't dispose samplers!)
    for(var si2=0;si2<samplers.length;si2++){if(samplers[si2])try{samplers[si2].disconnect();}catch(e){}}
    // Dispose per-session effect nodes
    for(const n of bagRef.current){try{if(n.releaseAll)n.releaseAll();}catch(e){}try{if(n.stop)n.stop();}catch(e){}try{n.dispose();}catch(e){}}
    bagRef.current=[];masterGateRef.current=null;};
  const metroCtrlRef=useRef({});// MiniMetronome writes start/stop here
  const tapTimesRef=useRef([]);
  const parentTapTempo=()=>{const now=performance.now();const taps=tapTimesRef.current;taps.push(now);if(taps.length>5)taps.shift();if(taps.length>=2){const ivs=[];for(let i=1;i<taps.length;i++)ivs.push(taps[i]-taps[i-1]);if(ivs.some(iv=>iv>2000)){tapTimesRef.current=[now];return;}const avg=ivs.reduce((a,b)=>a+b,0)/ivs.length;const nb=Math.round(60000/avg);if(nb>=30&&nb<=300){if(sPT)sPT(nb);pTR.current=nb;if(metroCtrlRef.current.setBpmLive)metroCtrlRef.current.setBpmLive(nb);if(!sT.current)liveRestart(nb);}}};
  const parentChangeBpm=delta=>{const cur=pTR.current||tempo;const nv=Math.max(30,Math.min(300,cur+delta));if(sPT)sPT(nv);pTR.current=nv;if(metroCtrlRef.current.setBpmLive)metroCtrlRef.current.setBpmLive(nv);if(!sT.current)liveRestart(nv);};
  const clr=useCallback(()=>{sT.current=true;playGenRef.current++;if(aR.current)cancelAnimationFrame(aR.current);disposeBag();sPl(false);setPr(0);setLc(0);setLoading(false);lcR.current=0;curNoteR.current=-1;if(onCurNoteR.current)onCurNoteR.current(-1);if(progressRef)progressRef.current=-1;try{metroCtrlRef.current.stop&&metroCtrlRef.current.stop();}catch(e){}},[]);
  // Live restart at new BPM (called when user changes BPM during playback)
  var liveRestartTimer=useRef(null);
  const liveRestart=useCallback((newBpm)=>{
    if(sT.current)return;// not playing
    // Debounce rapid changes to avoid double-dispose crash
    if(liveRestartTimer.current)clearTimeout(liveRestartTimer.current);
    liveRestartTimer.current=setTimeout(function(){
      if(sT.current)return;
      sT.current=true;if(aR.current)cancelAnimationFrame(aR.current);try{disposeBag();}catch(e){}
      pTR.current=newBpm;
      const p=parseAbc(abcR.current,newBpm);sT.current=false;
      var t0=Tone.now();toneStartR.current=t0;
      ciOffR.current=0;sch(p,false,t0);
      try{metroCtrlRef.current.start&&metroCtrlRef.current.start(t0);}catch(e){}
    const an=()=>{if(sT.current)return;const el=Tone.now()-toneStartR.current;const dur=dR.current;if(dur<=0)return;
      const cOff=ciOffR.current;const musicEl=el-cOff;
      if(musicEl<0){setPr(0);if(progressRef)progressRef.current=0;aR.current=requestAnimationFrame(an);return;}
      if(abOnR.current){
        const abStart=abAR.current;const abEnd=abBR.current;const segDur=dur*(abEnd-abStart);
        if(segDur<=0){aR.current=requestAnimationFrame(an);return;}
        const segP=musicEl/segDur;
        if(segP>=1&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm){pTR.current=metroCtrlRef.current.getBpm();if(sPT)sPT(pTR.current);}var lt0=toneStartR.current+ciOffR.current+segDur;toneStartR.current=lt0;lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);return;}
        const effP=abStart+(musicEl%segDur)/dur;
        setPr(Math.min(effP,1));if(progressRef)progressRef.current=Math.min(effP,1);
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(effP>=fracs[i].frac-0.001&&effP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
      }else{
        const rawP=musicEl/dur;
        setPr(Math.min(rawP,1));if(progressRef)progressRef.current=Math.min(rawP,1);
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(rawP>=fracs[i].frac-0.001&&rawP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
        if(rawP>=1){if(lR.current&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm){pTR.current=metroCtrlRef.current.getBpm();if(sPT)sPT(pTR.current);}var lt0=toneStartR.current+ciOffR.current+dR.current;toneStartR.current=lt0;lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);}else{clr();}return;}
      }
      aR.current=requestAnimationFrame(an);};aR.current=requestAnimationFrame(an);
    },80);// debounce 80ms
  },[]);
  // Auto-sync metronome + restart when tempo prop changes (editor BPM input)
  var prevTempoRef=useRef(tempo);
  useEffect(function(){var newT=pT||tempo;if(newT!==prevTempoRef.current){pTR.current=newT;if(metroCtrlRef.current&&metroCtrlRef.current.setBpmLive)metroCtrlRef.current.setBpmLive(newT);if(!sT.current)liveRestart(newT);}prevTempoRef.current=newT;},[pT,tempo]);
  useEffect(()=>()=>clr(),[]);
  const sch=(parsed,doCi,refNow)=>{disposeBag();const bag=[];const gen=playGenRef.current;const sw=fR.current==="straight"?0:fR.current==="swing"?1:2;
    // Master gate — ALL audio routes through this. disposeBag() sets gain=0 for instant silence.
    var masterGate=new Tone.Gain(1).toDestination();masterGateRef.current=masterGate;bag.push(masterGate);
    const{scheduled:notes,totalDur,chordTimes}=applyTiming(parsed,sw);dR.current=totalDur;
    const mel=makeMelSynth(soR.current,bag,masterGate);
    // cs = Salamander-only fallback (for jazz/bossa or if custom samplers fail)
    var cs;
    if(_chordSamplerReady&&_chordSampler){
      var _fRev=new Tone.Reverb({decay:2.5,wet:0.22}).connect(masterGate);var _fComp=new Tone.Compressor({threshold:-24,ratio:4,attack:0.01,release:0.15}).connect(_fRev);var _fFlt=new Tone.Filter({frequency:2200,type:"lowpass",rolloff:-12}).connect(_fComp);
      try{_chordSampler.disconnect();}catch(e){}_chordSampler.connect(_fFlt);bag.push(_fFlt,_fComp,_fRev);cs=_chordSampler;
    }else{
      var _fRev2=new Tone.Reverb({decay:3,wet:0.22}).connect(masterGate);var _fCh=new Tone.Chorus({frequency:0.4,delayTime:6,depth:0.22,wet:0.22}).connect(_fRev2);_fCh.start();var _fTr=new Tone.Tremolo({frequency:2.2,depth:0.12,wet:0.18}).connect(_fCh);_fTr.start();var _fFlt2=new Tone.Filter({frequency:1800,type:"lowpass",rolloff:-24}).connect(_fTr);var _fS=new Tone.PolySynth(Tone.FMSynth,{harmonicity:3,modulationIndex:0.6,oscillator:{type:"fatsine2",spread:15,count:3},modulation:{type:"sine"},envelope:{attack:0.015,decay:1.0,sustain:0.3,release:1.5},modulationEnvelope:{attack:0.008,decay:0.6,sustain:0,release:0.6},volume:-18}).connect(_fFlt2);bag.push(_fS,_fFlt2,_fTr,_fCh,_fRev2);cs=_fS;
    }
    // For backing, create a SECOND chord synth if needed (so piano backing and rhodes backing don't share)
    var backingCs=null;
    if(bR.current){
      var _bs=bStyleR.current;
      if(_bs==="rhodes"){
        if(_rhodesChordReady&&_rhodesChordSampler){
          // Connect rhodes directly — fresh effect chain
          var rRev=new Tone.Reverb({decay:2.2,wet:0.18}).connect(masterGate);
          var rCh=new Tone.Chorus({frequency:0.6,delayTime:4,depth:0.18,wet:0.15}).connect(rRev);rCh.start();
          var rTr=new Tone.Tremolo({frequency:2.8,depth:0.15,wet:0.2}).connect(rCh);rTr.start();
          var rComp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.008,release:0.12}).connect(rTr);
          var rFlt=new Tone.Filter({frequency:3500,type:"lowpass",rolloff:-12}).connect(rComp);
          try{_rhodesChordSampler.disconnect();}catch(e){}
          _rhodesChordSampler.connect(rFlt);
          bag.push(rFlt,rComp,rTr,rCh,rRev);
          backingCs=_rhodesChordSampler;
          console.log("[etudy] Backing: RHODES sampler ✓");
        }else{
          console.warn("[etudy] Backing: Rhodes NOT loaded! ready=",_rhodesChordReady);
          backingCs=cs; // fallback
        }
      }else if(_bs==="piano"||_bs==="ballad"){
        if(_cPianoChordReady&&_cPianoChordSampler){
          var pRev=new Tone.Reverb({decay:2.5,wet:0.18}).connect(masterGate);
          var pComp=new Tone.Compressor({threshold:-22,ratio:3,attack:0.008,release:0.12}).connect(pRev);
          var pFlt=new Tone.Filter({frequency:2800,type:"lowpass",rolloff:-12}).connect(pComp);
          try{_cPianoChordSampler.disconnect();}catch(e){}
          _cPianoChordSampler.connect(pFlt);
          bag.push(pFlt,pComp,pRev);
          backingCs=_cPianoChordSampler;
          console.log("[etudy] Backing: CUSTOM PIANO sampler ✓");
        }else{
          console.log("[etudy] Backing: Custom piano not loaded, using Salamander. ready=",_cPianoChordReady);
          backingCs=cs; // Salamander fallback
        }
      }else{
        backingCs=cs; // jazz/bossa use whatever cs is
        console.log("[etudy] Backing: using default chord synth for style",_bs);
      }
    }
    bagRef.current=bag;const now=refNow||Tone.now();
    let cOff=doCi?parsed.spb*parsed.tsNum:0;
    const abActive=abOnR.current;const abS=abActive?abAR.current*totalDur:0;const abE=abActive?abBR.current*totalDur:totalDur;
    const timers=[];const LA=0.04;
    const baseTime=now+cOff;
    // Schedule dedicated count-in clicks (only when metronome is silent — otherwise MiniMetronome handles it)
    if(doCi&&cOff>0){
      var metroSnd="click";try{if(metroCtrlRef.current&&metroCtrlRef.current.getSound)metroSnd=metroCtrlRef.current.getSound();}catch(e){}
      if(metroSnd==="silent"){
        var ciBeats=parsed.tsNum;var ciSpb=parsed.spb;
        for(var cci=0;cci<ciBeats;cci++){
          var ciTime=now+cci*ciSpb;var ciIsFirst=cci===0;
          var ciMs=Math.max(0,(cci*ciSpb)*1000-LA*1000);
          (function(t,accent){timers.push(setTimeout(function(){if(sT.current)return;try{
            var actx=Tone.context.rawContext||Tone.context._context||Tone.context;
            var osc=actx.createOscillator();var g=actx.createGain();osc.connect(g);g.connect(actx.destination);
            osc.type="triangle";osc.frequency.value=accent?1400:1000;
            g.gain.setValueAtTime(accent?0.7:0.35,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.03);
            osc.start(t);osc.stop(t+0.035);
          }catch(e){}},ciMs));})(ciTime,ciIsFirst);
        }
      }
    }
    // Schedule melody — pre-fire compensation for sampler-based sounds
    var _melPre=(soR.current==="piano"||soR.current==="rhodes"||soR.current==="sax")?0.04:0;
    for(const n of notes){if(!n.tones)continue;if(abActive&&(n.startTime<abS-0.001||n.startTime>=abE-0.001))continue;const noteTime=abActive?n.startTime-abS:n.startTime;
      if(mlR.current){const _n=n;const fireMs=Math.max(0,(noteTime-_melPre)*1000-LA*1000);timers.push(setTimeout(()=>{if(sT.current)return;const t=baseTime+noteTime-_melPre;_n.tones.forEach(tn=>mel.play(tn,Math.min(_n.dur*0.9,2),t,_n.vel));},fireMs));}}
    // Schedule backing — style-aware: piano comping + bass + drums
    if(bR.current){
      var _bStyle=bStyleR.current;var _muteK=muteKeysR.current;var _muteB=muteBassR.current;var _muteD=muteDrumsR.current;
      var hasBass=_bStyle!=="piano"&&_bStyle!=="rhodes"&&!_muteB;var hasDrums=(_bStyle==="jazz"||_bStyle==="bossa")&&!_muteD;var hasKeys=!_muteK;
      // Create instruments
      var bassInst=null;var drumsInst=null;
      if(hasBass){try{bassInst=makeBass(bag,masterGate);}catch(e){console.warn("Bass init:",e);}}
      if(hasDrums){try{drumsInst=makeDrums(bag,masterGate);}catch(e){console.warn("Drums init:",e);}}
      var spb=parsed.spb;var tsN=parsed.tsNum;
      // --- PIANO COMPING ---
      if(hasKeys){var _chordOct=(_bStyle==="jazz"||_bStyle==="bossa")?4:2;for(let ci=0;ci<chordTimes.length;ci++){const c=chordTimes[ci];if(abActive&&(c.time<abS-0.001||c.time>=abE-0.001))continue;const cn=chordToNotes(c.name,_chordOct);if(!cn.length)continue;const ct=abActive?c.time-abS:c.time;const nextTime=ci<chordTimes.length-1?chordTimes[ci+1].time:totalDur;const chordDur=abActive?Math.min(nextTime,abE)-c.time:nextTime-c.time;
        if(_bStyle==="piano"||_bStyle==="rhodes"||_bStyle==="ballad"){
          // Sustained chord — single triggerAttackRelease to prevent ghost notes on stop
          var SAMPLE_PRE=0.04;
          const dur=Math.max(0.5,chordDur);const fireMs=Math.max(0,(ct-SAMPLE_PRE)*1000-LA*1000);
          const vel=_bStyle==="rhodes"?0.5:0.5;
          for(let ni=0;ni<cn.length;ni++){const _note=cn[ni];
            timers.push(setTimeout(()=>{if(sT.current)return;try{backingCs.triggerAttackRelease(_note,dur,baseTime+ct-SAMPLE_PRE,vel);}catch(e){}},fireMs));
          }
        }else if(_bStyle==="jazz"){
          // Rhythmic comping — hits on beat 2 and beat 4 (classic Freddie Green)
          var compBeats=[];var barStart=Math.floor(c.time/spb/tsN)*spb*tsN;
          for(var cb=0;cb<Math.ceil(chordDur/spb);cb++){var bt=cb*spb;if(bt>=chordDur)break;var beatInBar=Math.round(((c.time+bt)-barStart)/spb)%tsN;
            if(beatInBar===1||beatInBar===3)compBeats.push(bt);// beats 2 and 4
            else if(cb===0)compBeats.push(bt);// also hit on chord change
          }
          for(var cbi=0;cbi<compBeats.length;cbi++){const _ct=ct+compBeats[cbi];const _cn=cn;const hum=(Math.random()-0.5)*0.012;
            const fireMs=Math.max(0,_ct*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;backingCs.triggerAttackRelease(_cn,spb*1.5,baseTime+_ct+hum,0.3);},fireMs));}
        }else if(_bStyle==="bossa"){
          // Bossa comping — anticipation on "and of 2", "and of 4"
          var bossaHits=[0,spb*1.5,spb*3,spb*3.5];
          for(var bhi=0;bhi<bossaHits.length;bhi++){var bht=bossaHits[bhi];if(bht>=chordDur)break;const _ct=ct+bht;const _cn=cn;const hum=(Math.random()-0.5)*0.008;
            const fireMs=Math.max(0,_ct*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;backingCs.triggerAttackRelease(_cn,spb*0.8,baseTime+_ct+hum,0.28);},fireMs));}
        }
      }}
      // --- BASS ---
      if(bassInst){for(let ci=0;ci<chordTimes.length;ci++){const c=chordTimes[ci];if(abActive&&(c.time<abS-0.001||c.time>=abE-0.001))continue;const ct=abActive?c.time-abS:c.time;const nextCn=ci<chordTimes.length-1?chordTimes[ci+1].name:null;const chordDur=abActive?(ci<chordTimes.length-1?Math.min(chordTimes[ci+1].time,abE):abE)-c.time:(ci<chordTimes.length-1?chordTimes[ci+1].time:totalDur)-c.time;
        if(_bStyle==="jazz"){
          // Walking bass — 4 notes per bar
          var wNotes=walkingBassNotes(c.name,nextCn);var nBeats=Math.round(chordDur/spb);
          for(var wb=0;wb<nBeats&&wb<4;wb++){const _ct=ct+wb*spb;const _n=wNotes[Math.min(wb,wNotes.length-1)];const hum=(Math.random()-0.5)*0.01;
            const fireMs=Math.max(0,_ct*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;try{bassInst.play(_n,spb*0.85,baseTime+_ct+hum,0.7);}catch(e){}},fireMs));}
        }else if(_bStyle==="bossa"){
          // Bossa bass — root on 1, fifth on 3
          var bRoot=chordBassNote(c.name);var bq=c.name.substring(c.name.match(/^[A-G][b#]?/)?.[0]?.length||1).toLowerCase();var fifthSt=(N2M[c.name[0].toUpperCase()]||0)+(c.name[1]==="#"?1:c.name[1]==="b"?-1:0)+7;var bFifth=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"][((fifthSt%12)+12)%12]+"2";
          if(bRoot){const _ct1=ct;const hum1=(Math.random()-0.5)*0.008;const fireMs1=Math.max(0,_ct1*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;try{bassInst.play(bRoot,spb*1.8,baseTime+_ct1+hum1,0.65);}catch(e){}},fireMs1));}
          if(chordDur>spb*2){const _ct2=ct+spb*2;const hum2=(Math.random()-0.5)*0.008;const fireMs2=Math.max(0,_ct2*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;try{bassInst.play(bFifth,spb*1.8,baseTime+_ct2+hum2,0.6);}catch(e){}},fireMs2));}
        }else if(_bStyle==="ballad"){
          // Ballad bass — whole note root, occasional 5th
          var bRoot2=chordBassNote(c.name);if(bRoot2){const _ct=ct;const hum=(Math.random()-0.5)*0.01;const dur=Math.min(chordDur*0.9,spb*4);const fireMs=Math.max(0,_ct*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;try{bassInst.play(bRoot2,dur,baseTime+_ct+hum,0.55);}catch(e){}},fireMs));}
        }
      }}
      // --- DRUMS ---
      if(drumsInst){
        var drumStart=abActive?0:0;var drumEnd=abActive?(abE-abS):totalDur;
        if(_bStyle==="jazz"){
          // Jazz ride pattern — ride on every beat, kick on 1, snare ghost on 2&4
          for(var dt=0;dt<drumEnd;dt+=spb){var beatInBar2=Math.round(dt/spb)%tsN;var hum=(Math.random()-0.5)*0.012;
            const _dt=dt;const _bib=beatInBar2;const fireMs=Math.max(0,_dt*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;
              drumsInst.ride(baseTime+_dt+hum,0.6+Math.random()*0.15);
              if(_bib===0)drumsInst.kick(baseTime+_dt+hum,0.5);
              if(_bib===2&&tsN===4)drumsInst.kick(baseTime+_dt+hum,0.3);
              if(_bib===1||_bib===3)drumsInst.brush(baseTime+_dt+hum,0.35);
            },fireMs));}
          // Jazz hi-hat on 2 and 4
          for(var ht=spb;ht<drumEnd;ht+=spb){var hhBeat=Math.round(ht/spb)%tsN;if(hhBeat===1||hhBeat===3){const _ht=ht;const hum2=(Math.random()-0.5)*0.008;const fireMs=Math.max(0,_ht*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;drumsInst.hh(baseTime+_ht+hum2,0.5);},fireMs));}}
        }else if(_bStyle==="bossa"){
          // Bossa — cross-stick on 2&4 (rim click), kick on 1&3 soft
          for(var dt2=0;dt2<drumEnd;dt2+=spb){var bib3=Math.round(dt2/spb)%tsN;var hum3=(Math.random()-0.5)*0.008;
            const _dt2=dt2;const _bib3=bib3;const fireMs=Math.max(0,_dt2*1000-LA*1000);
            timers.push(setTimeout(()=>{if(sT.current)return;
              if(_bib3===0||_bib3===2)drumsInst.kick(baseTime+_dt2+hum3,0.35);
              if(_bib3===1||_bib3===3)drumsInst.snare(baseTime+_dt2+hum3,0.3);
              drumsInst.hh(baseTime+_dt2+hum3,0.3+(_bib3%2===0?0.1:0));
            },fireMs));}
        }
      }
    }
    // Schedule metronome clicks
    // Metronome clicks handled by MiniMetronome component — not scheduled here
    scheduledTimers.current=timers;
    noteFracsR.current=getNoteTimeFracs(abcR.current);dR.current=totalDur;return cOff;};
  const ciOffR=useRef(0);
  const tg=async()=>{if(pl){clr();return;}
    if(!sT.current){
      // Already loading — treat second press as cancel
      sT.current=true;setLoading(false);return;
    }
    var gen=++playGenRef.current;// unique generation for this play attempt
    var isStale=function(){return gen!==playGenRef.current||sT.current;};
    sT.current=false;try{await Tone.start();}catch(e){}
    if(isStale()){setLoading(false);sT.current=true;return;}
    // Ensure AudioContext is running
    try{if(Tone.context.state!=="running")await Tone.context.resume();}catch(e){}
    // Read BPM from metronome (single source of truth)
    if(metroCtrlRef.current.getBpm){pTR.current=metroCtrlRef.current.getBpm();}
    setLoading(true);
    if(!_samplerReady&&!_samplerFailed){await preloadPiano();setSamplesOk(_samplerReady);}
    if(isStale()){setLoading(false);sT.current=true;return;}
    if(!_chordSamplerReady)await preloadChordPiano();
    if(isStale()){setLoading(false);sT.current=true;return;}
    // Only preload the sampler we actually need for current backing style
    var _curStyle=bR.current?bStyleR.current:"piano";
    console.log("[etudy] Preloading for style:",_curStyle);
    if(_curStyle==="rhodes"&&!_rhodesChordReady){
      try{var testUrl=RHODES_BASE+"C3.mp3";var r=await fetch(testUrl,{method:"HEAD"});console.log("[etudy] Rhodes URL test:",testUrl,"→",r.status,r.ok?"OK":"FAIL");}catch(e){console.warn("[etudy] Rhodes URL unreachable:",e.message);}
      await preloadRhodesChord();
    }
    if(isStale()){setLoading(false);sT.current=true;return;}
    if((_curStyle==="piano"||_curStyle==="ballad")&&!_cPianoChordReady){
      try{var testUrl2=CPIANO_BASE+"C3.mp3";var r2=await fetch(testUrl2,{method:"HEAD"});console.log("[etudy] Piano URL test:",testUrl2,"→",r2.status,r2.ok?"OK":"FAIL");}catch(e){console.warn("[etudy] Piano URL unreachable:",e.message);}
      await preloadCustomPianoChord();
    }
    if(isStale()){setLoading(false);sT.current=true;return;}
    if(!_bassSamplerReady)preloadBassSampler();
    // Preload sax sampler if sax sound is selected
    if(soR.current==="sax"&&!_saxSamplerReady)await preloadSaxSampler();
    if(soR.current==="piano"&&!_pianoMelReady)await preloadPianoMel();
    if(soR.current==="rhodes"&&!_rhodesMelReady)await preloadRhodesMel();
    if(isStale()){setLoading(false);sT.current=true;return;}// final stale check
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
      if(musicEl<0){setPr(0);if(progressRef)progressRef.current=0;aR.current=requestAnimationFrame(an);return;}
      if(abOnR.current){
        const abStart=abAR.current;const abEnd=abBR.current;const segDur=dur*(abEnd-abStart);
        if(segDur<=0){aR.current=requestAnimationFrame(an);return;}
        const segP=musicEl/segDur;
        if(segP>=1&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm){pTR.current=metroCtrlRef.current.getBpm();if(sPT)sPT(pTR.current);}lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}var lt0=toneStartR.current+ciOffR.current+segDur;toneStartR.current=lt0;ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);return;}
        const effP=abStart+(musicEl%segDur)/dur;
        setPr(Math.min(effP,1));if(progressRef)progressRef.current=Math.min(effP,1);
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(effP>=fracs[i].frac-0.001&&effP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
      }else{
        const rawP=musicEl/dur;
        setPr(Math.min(rawP,1));if(progressRef)progressRef.current=Math.min(rawP,1);
        if(noteFracsR.current){const fracs=noteFracsR.current;let ci2=-1;for(let i=0;i<fracs.length;i++){if(rawP>=fracs[i].frac-0.001&&rawP<fracs[i].endFrac+0.001){ci2=i;break;}}if(ci2!==curNoteR.current){curNoteR.current=ci2;if(onCurNoteR.current)onCurNoteR.current(ci2);}}
        if(rawP>=1){if(lR.current&&!sT.current){try{metroCtrlRef.current.notifyLoop&&metroCtrlRef.current.notifyLoop();}catch(e){}if(metroCtrlRef.current.getBpm){pTR.current=metroCtrlRef.current.getBpm();if(sPT)sPT(pTR.current);}var lt0=toneStartR.current+ciOffR.current+dR.current;toneStartR.current=lt0;lcR.current++;setLc(lcR.current);var _lr=onLoopCompleteR.current?onLoopCompleteR.current(lcR.current):null;if(_lr&&_lr.abc){abcR.current=_lr.abc;}if(_lr&&_lr.stop){clr();return;}ciOffR.current=sch(parseAbc(abcR.current,pTR.current),_lr&&_lr.countIn,lt0);noteFracsR.current=getNoteTimeFracs(abcR.current);try{metroCtrlRef.current.start&&metroCtrlRef.current.start(lt0);}catch(e){}aR.current=requestAnimationFrame(an);}else{clr();}return;}
      }
      aR.current=requestAnimationFrame(an);};aR.current=requestAnimationFrame(an);};
  const tgRef=useRef(null);tgRef.current=tg;
  useEffect(function(){if(ctrlRef)ctrlRef.current={toggle:function(){tgRef.current&&tgRef.current();},playing:pl,loading:loading,
    looping:lp,setLooping:sLp,melody:ml,setMelody:sMl,backing:bk,setBacking:sBk,
    sound:sound,setSound:setSound,backingStyle:backingStyle,setBackingStyle:setBackingStyle,
    feel:fl,setFeel:sFl,ci:ci,setCi:setCi,muteKeys:muteKeys,setMuteKeys:setMuteKeys,
    muteBass:muteBass,setMuteBass:setMuteBass,muteDrums:muteDrums,setMuteDrums:setMuteDrums,
    metroCtrlRef:metroCtrlRef,prBarRef:prBarRef,changeBpm:parentChangeBpm,tapTempo:parentTapTempo,
    liveRestart:liveRestart,setPr:setPr};},[pl,loading,lp,ml,bk,sound,backingStyle,fl,ci,muteKeys,muteBass,muteDrums]);
  useEffect(function(){if(onStateChange)onStateChange({playing:pl,loading:loading,looping:lp,melody:ml,backing:bk,sound:sound,backingStyle:backingStyle,feel:fl,ci:ci,muteKeys:muteKeys,muteBass:muteBass,muteDrums:muteDrums});},[pl,loading,lp,ml,bk,sound,backingStyle,fl,ci,muteKeys,muteBass,muteDrums]);
  const autoPlayPrev=useRef(false);
  useEffect(function(){if(autoPlay&&!autoPlayPrev.current&&tgRef.current){var t2=setTimeout(function(){tgRef.current();},50);autoPlayPrev.current=true;return function(){clearTimeout(t2);};}
    if(!autoPlay&&autoPlayPrev.current){autoPlayPrev.current=false;clr();}},[autoPlay]);
  // HEADLESS MODE: render only hidden MiniMetronome for audio sync, no visible UI
  if(headless)return React.createElement("div",{style:{position:"absolute",width:0,height:0,overflow:"hidden",pointerEvents:"none"}},
    React.createElement(MiniMetronome,{th:t,initBpm:pT||tempo,syncPlaying:pl,ctrlRef:metroCtrlRef,onBpmChange:function(v){pTR.current=v;if(sPT)sPT(v);if(!sT.current)liveRestart(v);},lickTempo:lickTempo||tempo,onSetLoop:function(v){if(v)sLp(true);},lickTimeSig:lickTS,headless:true,expandOpen:false,ciProp:ci,setCiProp:setCi}));
  const bb={border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",fontFamily:"'Inter',sans-serif"};
  const pill=(a,ic,fn,label)=>React.createElement("button",{onClick:e=>{e.stopPropagation();fn();},style:{...bb,gap:4,padding:"5px 12px",fontSize:11,fontWeight:a?600:500,borderRadius:20,background:a?t.accentBg:t.pillBg,color:a?t.accent:t.subtle,border:a?"1.5px solid "+t.accentBorder:"1.5px solid "+t.pillBorder,boxShadow:a?"0 0 8px "+t.accentGlow:"none",letterSpacing:0.2}},ic,label?" "+label:"");
  const sBtn=(a,l,fn)=>React.createElement("button",{onClick:e=>{e.stopPropagation();fn();},style:{...bb,gap:4,padding:"6px 12px",fontSize:11,fontWeight:500,borderRadius:8,background:a?t.accentBg:t.filterBg,color:a?t.accent:t.muted}},l);
  const nonDefaults=[!ml&&"mute",fl!=="straight"&&"feel",ci===false&&"no-ci",sound!=="piano"&&"sound",!bk&&"no-back",muteKeys&&"mute-k",muteBass&&"mute-b",muteDrums&&"mute-d"].filter(Boolean);

  if(hideControls)return React.createElement("div",{style:{marginTop:8}},
    // Progress bar only (thin)
    React.createElement("div",{style:{height:3,background:t.progressBg,borderRadius:3,overflow:"hidden",marginBottom:8}},
      React.createElement("div",{ref:prBarRef,style:{width:"0%",height:"100%",background:t.accent,borderRadius:3}})),
    // Melody + Backing toggles
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6}},
      pill(ml,ml?"\u266B":"\u2715",()=>sMl(!ml),ml?"Melody":"Melody off"),
      pill(bk,bk?"\uD83C\uDFB9":"\uD83C\uDFB9",()=>sBk(!bk),bk?"Backing":"Backing off")),
    // Backing style selector (only when backing on)
    bk&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,marginBottom:6,flexWrap:"wrap"}},
      BACKING_STYLES.map(s=>React.createElement("button",{key:s.id,onClick:e=>{e.stopPropagation();setBackingStyle(s.id);},style:{...bb,gap:2,padding:"4px 8px",fontSize:10,borderRadius:6,whiteSpace:"nowrap",background:backingStyle===s.id?t.accentBg:t.filterBg,color:backingStyle===s.id?t.accent:t.muted}},s.emoji+" "+s.label)),
      // Mute controls — only show for styles with bass/drums
      backingStyle!=="piano"&&backingStyle!=="rhodes"&&React.createElement("span",{style:{display:"flex",gap:3,marginLeft:4}},
        React.createElement("button",{onClick:e=>{e.stopPropagation();setMuteKeys(!muteKeys);},style:{...bb,padding:"4px 7px",fontSize:9,borderRadius:5,background:muteKeys?t.filterBg:t.accentBg,color:muteKeys?t.muted:t.accent,textDecoration:muteKeys?"line-through":"none"}},"Keys"),
        React.createElement("button",{onClick:e=>{e.stopPropagation();setMuteBass(!muteBass);},style:{...bb,padding:"4px 7px",fontSize:9,borderRadius:5,background:muteBass?t.filterBg:t.accentBg,color:muteBass?t.muted:t.accent,textDecoration:muteBass?"line-through":"none"}},"Bass"),
        (backingStyle==="jazz"||backingStyle==="bossa")&&React.createElement("button",{onClick:e=>{e.stopPropagation();setMuteDrums(!muteDrums);},style:{...bb,padding:"4px 7px",fontSize:9,borderRadius:5,background:muteDrums?t.filterBg:t.accentBg,color:muteDrums?t.muted:t.accent,textDecoration:muteDrums?"line-through":"none"}},"Drums"))),
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
        sBtn(ci,"Count-in "+(ci?"\u2713":"\u2717"),()=>setCi(!ci)))));

  // EDITOR MODE: minimal player — Play + progress + loop only
  if(editorMode)return React.createElement("div",{style:{marginTop:6}},
    // Hidden metronome — provides click audio via metroCtrlRef
    React.createElement("div",{style:{position:"absolute",width:0,height:0,overflow:"hidden",pointerEvents:"none"}},
      React.createElement(MiniMetronome,{th:t,initBpm:pT||tempo,syncPlaying:pl,ctrlRef:metroCtrlRef,onBpmChange:function(v){pTR.current=v;},lickTempo:lickTempo||tempo,lickTimeSig:lickTS})),
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
      React.createElement("button",{onClick:e=>{e.stopPropagation();tg();},style:{...bb,width:36,height:36,borderRadius:"50%",flexShrink:0,background:pl?t.filterBg:loading?t.filterBg:t.playBg,boxShadow:pl||loading?"none":"0 4px 14px "+(t.accentGlow||"rgba(0,0,0,0.1)")}},
        loading?React.createElement("div",{style:{width:12,height:12,border:"2px solid "+t.accentBg,borderTopColor:t.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}):
        pl?React.createElement("div",{style:{display:"flex",gap:2}},React.createElement("div",{style:{width:3,height:11,background:t.muted,borderRadius:1}}),React.createElement("div",{style:{width:3,height:11,background:t.muted,borderRadius:1}})):
        React.createElement("div",{style:{width:0,height:0,borderTop:"6px solid transparent",borderBottom:"6px solid transparent",borderLeft:"10px solid #fff",marginLeft:2}})),
      React.createElement("div",{style:{flex:1,height:3,background:t.progressBg,borderRadius:3,overflow:"hidden"}},
        React.createElement("div",{ref:prBarRef,style:{width:"0%",height:"100%",background:t.accent,borderRadius:3}})),
      pill(lp,"\u221E",()=>sLp(!lp))));

  const curSoundLabel=(SOUND_PRESETS.find(p=>p.id===sound)||{}).label||"Piano";
  const curBackObj=BACKING_STYLES.find(s=>s.id===backingStyle)||BACKING_STYLES[0];
  const curFeelLabel=fl==="straight"?"Straight":fl==="swing"?"Swing":"Hard Swing";
  return React.createElement("div",{style:{marginTop:12}},
    // ROW 1: Play + progress + Loop + AB
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
      React.createElement("button",{onClick:e=>{e.stopPropagation();tg();},style:{...bb,width:t===TH.studio?44:40,height:t===TH.studio?44:40,borderRadius:"50%",flexShrink:0,background:pl?t.filterBg:loading?t.filterBg:t.playBg,boxShadow:pl||loading?"none":"0 4px 18px "+(t.accentGlow||"rgba(0,0,0,0.1)"),animation:!pl&&!loading&&t===TH.studio?"playPulse 2.5s ease-in-out infinite":"none"}},
        loading?React.createElement("div",{style:{width:14,height:14,border:"2px solid "+t.accentBg,borderTopColor:t.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}):
        pl?React.createElement("div",{style:{display:"flex",gap:2.5}},React.createElement("div",{style:{width:3,height:13,background:t.muted,borderRadius:1}}),React.createElement("div",{style:{width:3,height:13,background:t.muted,borderRadius:1}})):
        React.createElement("div",{style:{width:0,height:0,borderTop:"7px solid transparent",borderBottom:"7px solid transparent",borderLeft:"12px solid #fff",marginLeft:2}})),
      React.createElement("div",{style:{flex:1,height:4,background:t.progressBg,borderRadius:4,overflow:"hidden",position:"relative",minWidth:30}},
        abOn&&React.createElement("div",{style:{position:"absolute",left:((abA||0)*100)+"%",width:(((abB||1)-(abA||0))*100)+"%",height:"100%",background:t.accentBg}}),
        React.createElement("div",{ref:prBarRef,style:{position:"absolute",left:0,width:"0%",height:"100%",background:t.accent,borderRadius:4}})),
      pill(lp,"\u221E",()=>sLp(!lp),"Loop"),
      setAbOn&&React.createElement("span",{"data-coach":"ab-loop"},pill(abOn,"\u2759\u2759",()=>{setAbOn(!abOn);if(!abOn){setAbA(0);setAbB(1);}},"A\u2009\u00B7\u2009B"))),

    // ROW 2: Metronome bar
    React.createElement("div",{style:{marginTop:8}},
      React.createElement(MiniMetronome,{th:t,initBpm:pT||tempo,syncPlaying:pl,ctrlRef:metroCtrlRef,onBpmChange:function(v){pTR.current=v;if(sPT)sPT(v);if(!sT.current)liveRestart(v);},lickTempo:lickTempo||tempo,onSetLoop:function(v){if(v)sLp(true);},lickTimeSig:lickTS,headless:true,expandOpen:metroExpand,onExpandToggle:editorMode?null:function(){setMetroExpand(!metroExpand);},ciProp:ci,setCiProp:setCi,editorMode:editorMode})),

    // ROW 3: Melody [Sound▾] | Backing [Style▾]
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginTop:8,position:"relative"}},
      pill(ml,ml?"\u266B":"\u2715",()=>sMl(!ml),ml?"Melody":"Melody off"),
      ml&&React.createElement("div",{style:{position:"relative"}},
        React.createElement("button",{onClick:e=>{e.stopPropagation();setSoundDdOpen(!soundDdOpen);setBackDdOpen(false);setFeelDdOpen(false);},style:{...bb,padding:"4px 8px",fontSize:10,borderRadius:6,background:soundDdOpen?t.accentBg:t.filterBg,color:soundDdOpen?t.accent:t.muted,gap:3}},curSoundLabel," ",soundDdOpen?"\u25B4":"\u25BE"),
        soundDdOpen&&React.createElement("div",{style:{position:"absolute",top:"100%",left:0,marginTop:4,background:t.card,border:"1px solid "+t.border,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",zIndex:50,minWidth:110,padding:4,display:"flex",flexDirection:"column",gap:2}},
          SOUND_PRESETS.map(p=>React.createElement("button",{key:p.id,onClick:e=>{e.stopPropagation();setSound(p.id);setSoundDdOpen(false);},style:{...bb,padding:"6px 10px",fontSize:11,borderRadius:6,background:sound===p.id?t.accentBg:"transparent",color:sound===p.id?t.accent:t.text,justifyContent:"flex-start",width:"100%"}},p.label)))),
      React.createElement("div",{style:{width:1,height:20,background:t.border,flexShrink:0}}),
      pill(bk,bk?"\uD83C\uDFB9":"\uD83C\uDFB9",()=>sBk(!bk),bk?"Backing":"Backing off"),
      bk&&React.createElement("div",{style:{position:"relative"}},
        React.createElement("button",{onClick:e=>{e.stopPropagation();setBackDdOpen(!backDdOpen);setSoundDdOpen(false);setFeelDdOpen(false);},style:{...bb,padding:"4px 8px",fontSize:10,borderRadius:6,background:backDdOpen?t.accentBg:t.filterBg,color:backDdOpen?t.accent:t.muted,gap:3}},curBackObj.emoji+" "+curBackObj.label," ",backDdOpen?"\u25B4":"\u25BE"),
        backDdOpen&&React.createElement("div",{style:{position:"absolute",top:"100%",left:0,marginTop:4,background:t.card,border:"1px solid "+t.border,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",zIndex:50,minWidth:140,padding:4,display:"flex",flexDirection:"column",gap:2}},
          BACKING_STYLES.map(s=>React.createElement("button",{key:s.id,onClick:e=>{e.stopPropagation();setBackingStyle(s.id);},style:{...bb,padding:"6px 10px",fontSize:11,borderRadius:6,background:backingStyle===s.id?t.accentBg:"transparent",color:backingStyle===s.id?t.accent:t.text,justifyContent:"flex-start",width:"100%"}},s.emoji+" "+s.label)),
          backingStyle!=="piano"&&backingStyle!=="rhodes"&&React.createElement("div",{style:{borderTop:"1px solid "+t.border,marginTop:2,paddingTop:4,display:"flex",gap:4,padding:"4px 6px"}},
            React.createElement("button",{onClick:e=>{e.stopPropagation();setMuteKeys(!muteKeys);},style:{...bb,padding:"4px 7px",fontSize:9,borderRadius:5,background:muteKeys?t.filterBg:t.accentBg,color:muteKeys?t.muted:t.accent,textDecoration:muteKeys?"line-through":"none"}},"Keys"),
            React.createElement("button",{onClick:e=>{e.stopPropagation();setMuteBass(!muteBass);},style:{...bb,padding:"4px 7px",fontSize:9,borderRadius:5,background:muteBass?t.filterBg:t.accentBg,color:muteBass?t.muted:t.accent,textDecoration:muteBass?"line-through":"none"}},"Bass"),
            (backingStyle==="jazz"||backingStyle==="bossa")&&React.createElement("button",{onClick:e=>{e.stopPropagation();setMuteDrums(!muteDrums);},style:{...bb,padding:"4px 7px",fontSize:9,borderRadius:5,background:muteDrums?t.filterBg:t.accentBg,color:muteDrums?t.muted:t.accent,textDecoration:muteDrums?"line-through":"none"}},"Drums"))))),

    // ROW 4: Feel dropdown (hidden in editor mode — feel set in form)
    !editorMode&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginTop:8,position:"relative"}},
      React.createElement("div",{style:{position:"relative"}},
        React.createElement("button",{onClick:e=>{e.stopPropagation();setFeelDdOpen(!feelDdOpen);setSoundDdOpen(false);setBackDdOpen(false);},style:{...bb,padding:"5px 10px",fontSize:11,fontWeight:400,borderRadius:8,background:feelDdOpen?t.filterBg:"transparent",color:feelDdOpen?t.text:t.muted,gap:4}},"Feel: "+curFeelLabel," ",feelDdOpen?"\u25B4":"\u25BE"),
        feelDdOpen&&React.createElement("div",{style:{position:"absolute",bottom:"100%",left:0,marginBottom:4,background:t.card,border:"1px solid "+t.border,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",zIndex:50,minWidth:120,padding:4,display:"flex",flexDirection:"column",gap:2}},
          ["straight","swing","hard-swing"].map(v=>React.createElement("button",{key:v,onClick:e=>{e.stopPropagation();sFl(v);setFeelDdOpen(false);},style:{...bb,padding:"6px 10px",fontSize:11,borderRadius:6,background:fl===v?t.accentBg:"transparent",color:fl===v?t.accent:t.text,justifyContent:"flex-start",width:"100%"}},v==="straight"?"Straight":v==="swing"?"Swing":"Hard Swing"))))));
}

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
const NOTE_NMS=["C","D","E","F","G","A","B"];
// ── Enharmonic key/root helpers ──
var ROOTS_FLAT=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
var ROOTS_SHARP=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var SHARP_KEYS={"C":1,"G":1,"D":1,"A":1,"E":1,"B":1,"F#":1,"C#":1};
function isSharpKey(k){return !!SHARP_KEYS[k];}
var ENHAR_TO_SHARP={"Db":"C#","Eb":"D#","Gb":"F#","Ab":"G#","Bb":"A#"};
var ENHAR_TO_FLAT={"C#":"Db","D#":"Eb","F#":"F#","G#":"Ab","A#":"Bb"};// F# stays F#
function enharmonicRoot(root,toSharp){
  if(toSharp)return ENHAR_TO_SHARP[root]||root;
  return ENHAR_TO_FLAT[root]||root;
}
function enharmonicChord(name,toSharp){
  if(!name)return name;
  var ps=name.match(/^([A-G][b#]?)(.*)/);
  if(!ps)return name;
  return enharmonicRoot(ps[1],toSharp)+ps[2];
}
function enharmonicChords(chords,toSharp){
  var nc={};var keys=Object.keys(chords);
  for(var i=0;i<keys.length;i++)nc[keys[i]]=enharmonicChord(chords[keys[i]],toSharp);
  return nc;
}
// Hierarchical chord quality picker: Category → qualities
var CHORD_HIER=[
  {id:"dur",label:"Maj",quals:[
    {q:"",l:"triad"},{q:"6",l:"6"},{q:"69",l:"69"},
    {q:"maj7",l:"maj7"},{q:"maj9",l:"maj9"},{q:"maj7#11",l:"\u0394#11"}
  ],def:"maj7"},
  {id:"dom",label:"Dom",quals:[
    {q:"7",l:"7"},{q:"9",l:"9"},{q:"13",l:"13"},
    {q:"7b9",l:"7b9"},{q:"7#9",l:"7#9"},{q:"7#11",l:"7#11"},
    {q:"7b13",l:"7b13"},{q:"7alt",l:"7alt"},{q:"13b9",l:"13b9"},{q:"7#5",l:"7#5"}
  ],def:"7"},
  {id:"moll",label:"Min",quals:[
    {q:"m",l:"m"},{q:"m6",l:"m6"},
    {q:"m7",l:"m7"},{q:"m9",l:"m9"},{q:"m(maj7)",l:"m\u03947"}
  ],def:"m7"},
  {id:"dim",label:"Dim",quals:[
    {q:"dim",l:"dim"},{q:"dim7",l:"dim7"},{q:"m7b5",l:"\u00F8"}
  ],def:"m7b5"},
  {id:"aug",label:"Aug",quals:[
    {q:"aug",l:"aug"},{q:"7#5",l:"7#5"}
  ],def:"aug"},
  {id:"sus",label:"Sus",quals:[
    {q:"sus4",l:"sus4"},{q:"sus2",l:"sus2"},{q:"7sus4",l:"7sus"}
  ],def:"sus4"}
];
// Find category for a quality string
function findChordCat(q){
  for(var i=0;i<CHORD_HIER.length;i++){
    for(var j=0;j<CHORD_HIER[i].quals.length;j++){
      if(CHORD_HIER[i].quals[j].q===q)return CHORD_HIER[i].id;
    }
  }
  return"dom";
}
// ── CHORD BLOCK HELPERS ──
var CH_CAT_COL={dur:"#22D89E",dom:"#F59E0B",moll:"#818CF8",dim:"#EF4444",aug:"#EC4899",sus:"#06B6D4"};
function chordBlockColor(name){
  if(!name)return"#666";var ps=name.match(/^[A-G][b#]?(.*)/);
  if(!ps)return"#666";return CH_CAT_COL[findChordCat(ps[1]||"")]||"#666";
}
function ChordTimeline(props){
  var chords=props.chords,onChordsChange=props.onChordsChange,totalBeats=props.totalBeats,tsN=props.tsN,th=props.th,keySig=props.keySig||"C",forceOpen=props.forceOpen;
  var t=th;var isStudio=t===TH.studio;
  var ac=isStudio?"#22D89E":"#6366F1";
  var totalBars=Math.max(1,Math.ceil(totalBeats/tsN));
  var endBeat=totalBars*tsN;
  var cBeats=Object.keys(chords).map(Number);
  for(var ci=0;ci<cBeats.length;ci++){if(cBeats[ci]>=endBeat)endBeat=Math.ceil((cBeats[ci]+1)/tsN)*tsN;}
  var effBars=Math.max(1,endBeat/tsN);
  endBeat=effBars*tsN;

  var ST=useState;
  var s1=ST(-1),editBeat=s1[0],setEditBeat=s1[1];
  var s2=ST(false),editIsNew=s2[0],setEditIsNew=s2[1];
  var s3=ST(0),pStep=s3[0],setPStep=s3[1];
  var s4=ST("C"),pRoot=s4[0],setPRoot=s4[1];
  var s5=ST("dom"),pCat=s5[0],setPCat=s5[1];
  var s6=ST("7"),pQual=s6[0],setPQual=s6[1];
  var s7=ST([]),pTens=s7[0],setPTens=s7[1];
  var s8=ST(false),expanded=s8[0],setExpanded=s8[1];
  // Auto-expand when forceOpen becomes true
  useEffect(function(){if(forceOpen)setExpanded(true);},[forceOpen]);

  var barsPerRow=2;var beatsPerRow=barsPerRow*tsN;
  var numRows=Math.ceil(effBars/barsPerRow);
  var useSharp=isSharpKey(keySig);
  var ROOTS=useSharp?ROOTS_SHARP:ROOTS_FLAT;
  var TENSIONS=["b9","9","#9","11","#11","b13","13"];

  // Close picker if chord removed externally (undo)
  useEffect(function(){
    if(editBeat>=0&&!editIsNew&&!chords.hasOwnProperty(editBeat)){setEditBeat(-1);}
  },[chords,editBeat,editIsNew]);

  // Build name based on how far user has progressed
  var buildName=function(){
    if(editIsNew&&pStep===0)return pRoot;
    var name=pRoot+pQual;
    var ts=pTens.filter(function(x){return name.indexOf(x)===-1;});
    if(ts.length>0)name+="("+ts.join(",")+")";
    return name;
  };
  // Parse existing chord name into picker state
  var parseName=function(name){
    var ps=name.match(/^([A-G][b#]?)(.*)/);
    if(!ps)return;
    setPRoot(ps[1]);
    var rest=ps[2]||"";var tens=[];
    var pIdx=rest.indexOf("(");
    if(pIdx>=0){var inner=rest.slice(pIdx+1,rest.length-1);rest=rest.slice(0,pIdx);tens=inner.split(",");}
    setPQual(rest||"");setPCat(rest?findChordCat(rest):"dur");setPTens(tens);
  };

  // === CRUD ===
  var addChordAt=function(beat){
    setPRoot("C");setPCat("dur");setPQual("");setPTens([]);setPStep(0);
    setEditIsNew(true);setEditBeat(beat);setExpanded(true);
  };
  var openEdit=function(beat){
    if(editBeat===beat){cancelEdit();return;}
    var name=chords[beat]||"";
    parseName(name);setPStep(0);
    setEditIsNew(false);setEditBeat(beat);setExpanded(true);
  };
  var confirmChord=function(){
    if(editBeat<0)return;
    var name=buildName();
    if(!name)return;
    var nc=Object.assign({},chords);nc[editBeat]=name;
    onChordsChange(nc);setEditBeat(-1);setEditIsNew(false);
  };
  var deleteChord=function(){
    if(editBeat<0||editIsNew)return;
    var nc=Object.assign({},chords);delete nc[editBeat];
    onChordsChange(nc);setEditBeat(-1);setEditIsNew(false);
  };
  var cancelEdit=function(){setEditBeat(-1);setEditIsNew(false);};

  // === Render rows ===
  var pickerOpen=editBeat>=0;
  var editRowIdx=pickerOpen?Math.floor(editBeat/beatsPerRow):-1;
  var rows=[];
  for(var r=0;r<numRows;r++){
    var rowStart=r*beatsPerRow;
    // Bar labels
    var barLabels=[];
    for(var bi=0;bi<barsPerRow;bi++){
      var barNum=r*barsPerRow+bi+1;
      if(barNum<=effBars)barLabels.push(React.createElement("div",{key:"bl"+bi,
        style:{flex:1,fontSize:8,color:isStudio?"#666":t.muted,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,paddingLeft:4}},barNum));
    }
    // Beat cells
    var cells=[];
    for(var gi=0;gi<beatsPerRow;gi++){
      var beatIdx=rowStart+gi;if(beatIdx>=endBeat)break;
      var isBarStart=gi%tsN===0;
      var chordName=chords[beatIdx];
      var isEd=editBeat===beatIdx;
      if(chordName){
        var col=chordBlockColor(chordName);
        (function(bIdx,nm,cl,ed){
          cells.push(React.createElement("div",{key:"c"+gi,onClick:function(){openEdit(bIdx);},
            style:{position:"absolute",left:((gi/beatsPerRow)*100)+"%",width:((1/beatsPerRow)*100)+"%",top:0,bottom:0,
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
              borderLeft:"1px solid "+(isBarStart?(isStudio?"#ffffff28":"#B5B4AD"):(isStudio?"#ffffff14":"#D8D7D0")),
              background:ed?cl+"20":cl+"0C",transition:"background 0.15s",zIndex:2}},
            React.createElement("span",{style:{fontSize:nm.length>4?9:11,fontWeight:700,color:cl,
              fontFamily:"'JetBrains Mono',monospace",letterSpacing:-0.3,
              textShadow:isStudio?"0 0 10px "+cl+"30":"none"}},nm)));
        })(beatIdx,chordName,col,isEd);
      }else{
        (function(bIdx,isB){
          cells.push(React.createElement("div",{key:"c"+gi,onClick:function(){addChordAt(bIdx);},
            style:{position:"absolute",left:((gi/beatsPerRow)*100)+"%",width:((1/beatsPerRow)*100)+"%",top:0,bottom:0,
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
              borderLeft:"1px solid "+(isB?(isStudio?"#ffffff28":"#B5B4AD"):(isStudio?"#ffffff14":"#D8D7D0")),zIndex:1}},
            React.createElement("span",{style:{fontSize:14,color:isStudio?"#4A4A68":"#AAA9A2",fontWeight:300}},"+"))); 
        })(beatIdx,isBarStart);
      }
    }
    var rowBeats=Math.min(beatsPerRow,endBeat-rowStart);
    cells.push(React.createElement("div",{key:"ge",style:{position:"absolute",left:((rowBeats/beatsPerRow)*100)+"%",top:0,bottom:0,width:1,background:isStudio?"#ffffff28":"#B5B4AD"}}));

    rows.push(React.createElement("div",{key:"row"+r},
      React.createElement("div",{style:{display:"flex",marginBottom:1}},barLabels),
      React.createElement("div",{style:{position:"relative",height:36,marginBottom:r<numRows-1?4:0,
        borderRadius:6,overflow:"hidden",background:isStudio?"#ffffff05":"#F2F1EC",
        border:"1px solid "+(isStudio?"#ffffff10":"#D8D7D0")}},cells)));

    // Speech bubble picker after the row containing editBeat
    if(pickerOpen&&editRowIdx===r){
      var arrowBeat=editBeat%beatsPerRow;
      var arrowPct=((arrowBeat+0.5)/beatsPerRow)*100;
      arrowPct=Math.max(8,Math.min(92,arrowPct));
      var previewName=buildName();
      var previewCol=previewName?chordBlockColor(previewName):ac;
      var curCatObj=null;
      for(var hi=0;hi<CHORD_HIER.length;hi++){if(CHORD_HIER[hi].id===pCat){curCatObj=CHORD_HIER[hi];break;}}

      var stepEls=[];
      // Step 0: Root
      if(pStep===0){
        stepEls.push(React.createElement("div",{key:"s0",style:{display:"flex",gap:3,flexWrap:"wrap"}},
          ROOTS.map(function(r2){
            var isSel=pRoot===r2;
            return React.createElement("button",{key:r2,onClick:function(){setPRoot(r2);},
              style:{padding:"4px 7px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,
                fontFamily:"'JetBrains Mono',monospace",fontWeight:700,
                background:isSel?ac+"15":(isStudio?"#ffffff06":"#F0EFE8"),
                color:isSel?ac:(isStudio?"#aaa":"#666"),
                outline:isSel?"1.5px solid "+ac+"40":"1px solid "+(isStudio?"#ffffff08":"#E8E7E3")}},r2);
          })));
      }
      // Step 1: Category + Quality
      if(pStep===1){
        stepEls.push(React.createElement("div",{key:"s1"},
          React.createElement("div",{style:{display:"flex",gap:3,marginBottom:5}},
            CHORD_HIER.map(function(cat){
              var catCol=CH_CAT_COL[cat.id]||ac;var isSel=pCat===cat.id;
              return React.createElement("button",{key:cat.id,onClick:function(){setPCat(cat.id);setPQual(cat.def);},
                style:{flex:1,padding:"4px 2px",borderRadius:7,border:"none",cursor:"pointer",fontSize:9,
                  fontWeight:isSel?700:500,fontFamily:"'Inter',sans-serif",
                  background:isSel?catCol+"18":(isStudio?"#ffffff06":"#F5F4F0"),
                  color:isSel?catCol:(isStudio?"#666":"#888"),
                  outline:isSel?"1.5px solid "+catCol+"30":"1px solid "+(isStudio?"#ffffff08":"#E8E7E3")}},cat.label);
            })),
          curCatObj?React.createElement("div",{style:{display:"flex",gap:3,flexWrap:"wrap"}},
            curCatObj.quals.map(function(qo){
              var isSel=pQual===qo.q;var catCol=CH_CAT_COL[pCat]||ac;
              return React.createElement("button",{key:qo.q||"_",onClick:function(){setPQual(qo.q);},
                style:{padding:"4px 9px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,
                  fontFamily:"'JetBrains Mono',monospace",fontWeight:isSel?700:500,
                  background:isSel?catCol+"15":(isStudio?"#ffffff04":"#FAFAF8"),
                  color:isSel?catCol:(isStudio?"#888":"#666"),
                  outline:isSel?"1.5px solid "+catCol+"30":"1px solid "+(isStudio?"#ffffff08":"#E8E7E3")}},qo.l);
            })):null));
      }
      // Step 2: Tensions
      if(pStep===2){
        stepEls.push(React.createElement("div",{key:"s2",style:{display:"flex",gap:3,flexWrap:"wrap"}},
          TENSIONS.map(function(tn){
            var isSel=pTens.indexOf(tn)>=0;
            return React.createElement("button",{key:tn,onClick:function(){
                setPTens(function(prev){return isSel?prev.filter(function(x){return x!==tn;}):prev.concat(tn);});
              },
              style:{padding:"4px 8px",borderRadius:7,border:"none",cursor:"pointer",fontSize:11,
                fontFamily:"'JetBrains Mono',monospace",fontWeight:isSel?700:500,
                background:isSel?ac+"15":(isStudio?"#ffffff04":"#FAFAF8"),
                color:isSel?ac:(isStudio?"#888":"#666"),
                outline:isSel?"1.5px solid "+ac+"30":"1px solid "+(isStudio?"#ffffff08":"#E8E7E3")}},tn);
          })));
      }

      // Action row
      var canBack=pStep>0;var canFwd=pStep<2;
      stepEls.push(React.createElement("div",{key:"act",style:{display:"flex",alignItems:"center",gap:5,marginTop:6}},
        React.createElement("span",{style:{fontSize:14,color:previewCol,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,minWidth:40}},previewName||"\u2026"),
        React.createElement("div",{style:{flex:1}}),
        canBack?React.createElement("button",{onClick:function(){setPStep(pStep-1);},
          style:{padding:"3px 10px",borderRadius:7,border:"1px solid "+(isStudio?"#ffffff12":t.border),
            background:isStudio?"#ffffff06":"#F5F4F0",color:t.muted,fontSize:12,cursor:"pointer",fontWeight:600}},"\u2190"):null,
        canFwd?React.createElement("button",{onClick:function(){setPStep(pStep+1);},
          style:{padding:"3px 10px",borderRadius:7,border:"1px solid "+(isStudio?"#ffffff12":t.border),
            background:isStudio?"#ffffff06":"#F5F4F0",color:t.muted,fontSize:12,cursor:"pointer",fontWeight:600}},"\u2192"):null,
        (pStep>=1||!editIsNew)?React.createElement("button",{onClick:confirmChord,
          style:{padding:"3px 12px",borderRadius:8,border:"none",background:ac,
            color:isStudio?"#08080F":"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}},"Set"):null,
        !editIsNew?React.createElement("button",{onClick:deleteChord,
          style:{padding:"3px 8px",borderRadius:8,border:"1px solid "+(isStudio?"#EF444430":"#E0DFD8"),
            background:isStudio?"#EF444408":"#FFF5F5",color:"#EF4444",fontSize:11,fontWeight:600,cursor:"pointer"}},"\u2715"):null,
        React.createElement("button",{onClick:cancelEdit,
          style:{padding:"3px 8px",borderRadius:8,border:"1px solid "+(isStudio?"#ffffff10":t.border),
            background:isStudio?"#ffffff04":"#F5F4F0",color:t.muted,fontSize:11,cursor:"pointer"}},editIsNew?"\u2715":"Cancel")));
      // Step dots
      stepEls.push(React.createElement("div",{key:"dots",style:{display:"flex",justifyContent:"center",gap:4,marginTop:4}},
        [0,1,2].map(function(si){
          return React.createElement("div",{key:si,onClick:function(){setPStep(si);},
            style:{width:6,height:6,borderRadius:3,cursor:"pointer",
              background:si===pStep?ac:si<pStep?ac+"50":(isStudio?"#ffffff15":"#DDD"),
              transition:"background 0.15s"}});
        })));

      rows.push(React.createElement("div",{key:"picker",style:{position:"relative",marginTop:2,marginBottom:4}},
        React.createElement("div",{style:{position:"absolute",top:-6,left:arrowPct+"%",transform:"translateX(-50%)",width:0,height:0,
          borderLeft:"7px solid transparent",borderRight:"7px solid transparent",
          borderBottom:"7px solid "+(isStudio?"#1C1C30":"#E0DFD8"),zIndex:5}}),
        React.createElement("div",{style:{background:isStudio?"#0E0E18":"#FAFAF8",border:"1px solid "+(isStudio?"#1C1C30":"#E0DFD8"),
          borderRadius:12,padding:"10px 10px 8px",boxShadow:"0 6px 24px rgba(0,0,0,"+(isStudio?"0.5":"0.08")+")"}},stepEls)));
    }
  }

  // === Compact collapsed view ===
  var sortedBeats=cBeats.slice().sort(function(a,b){return a-b;});
  var compactEl=React.createElement("div",{onClick:function(){setExpanded(true);},
    style:{display:"flex",alignItems:"center",gap:0,cursor:"pointer",height:24,
      borderRadius:6,overflow:"hidden",background:isStudio?"#ffffff05":"#F2F1EC",
      border:"1px solid "+(isStudio?"#ffffff10":"#D8D7D0")}},
    // Render beat slots compactly
    (function(){
      var chips=[];
      for(var bi2=0;bi2<endBeat;bi2++){
        var nm2=chords[bi2];var isBar2=bi2%tsN===0;
        if(nm2){
          var cl2=chordBlockColor(nm2);
          chips.push(React.createElement("div",{key:bi2,style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
            height:"100%",background:cl2+"0C",
            borderLeft:bi2>0?"1px solid "+(isBar2?(isStudio?"#ffffff20":"#C5C4BE"):(isStudio?"#ffffff0C":"#E0DFD8")):"none"}},
            React.createElement("span",{style:{fontSize:nm2.length>4?8:10,fontWeight:700,color:cl2,
              fontFamily:"'JetBrains Mono',monospace",letterSpacing:-0.3}},nm2)));
        }else{
          chips.push(React.createElement("div",{key:bi2,style:{flex:1,height:"100%",
            borderLeft:bi2>0?"1px solid "+(isBar2?(isStudio?"#ffffff20":"#C5C4BE"):(isStudio?"#ffffff0C":"#E0DFD8")):"none"}}));
        }
      }
      return chips;
    })());

  var isOpen=expanded||editBeat>=0;

  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:2}},
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:1}},
      React.createElement("span",{onClick:function(){setExpanded(!isOpen);if(isOpen&&editBeat>=0){setEditBeat(-1);setEditIsNew(false);}},
        style:{fontSize:9,color:isStudio?"#777":"#666",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,fontWeight:600,cursor:"pointer",userSelect:"none"}},"CHORDS"),
      React.createElement("span",{onClick:function(){setExpanded(!isOpen);if(isOpen&&editBeat>=0){setEditBeat(-1);setEditIsNew(false);}},
        style:{cursor:"pointer",userSelect:"none",display:"flex",alignItems:"center",transition:"transform 0.2s",
          transform:isOpen?"rotate(90deg)":"rotate(0deg)"}},
        S("svg",{width:10,height:10,viewBox:"0 0 24 24",fill:"none",style:{display:"block"}},
          S("path",{d:"M9 6l6 6-6 6",stroke:isStudio?"#666":"#888",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round"}))),
      isOpen&&cBeats.length>0?React.createElement("span",{style:{fontSize:8,color:isStudio?"#555":"#999",fontFamily:"'Inter',sans-serif"}},"tap beat to add \u00B7 tap chord to edit"):null),
    isOpen?rows:compactEl);
}


function e2s(e){if(e===1)return"";if(e===0.5)return"/2";if(e===0.75)return"3/4";if(e===1.5)return"3/2";if(e===3)return"3";if(e===6)return"6";if(e===12)return"12";if(Number.isInteger(e))return String(e);return String(Math.round(e*2))+"/2";}
// Map user-facing key to ABC-compatible key (ABC doesn't support C#, D#, G#, A#)
var ABC_KEY_MAP={"D#":"Eb","G#":"Ab","A#":"Bb"};// C# is valid ABC (7 sharps)
function abcKeySig(k){return ABC_KEY_MAP[k]||k;}
var KEY_SIG_ACC={"C":{},"G":{F:1},"D":{F:1,C:1},"A":{F:1,C:1,G:1},"E":{F:1,C:1,G:1,D:1},"B":{F:1,C:1,G:1,D:1,A:1},"F#":{F:1,C:1,G:1,D:1,A:1,E:1},"C#":{F:1,C:1,G:1,D:1,A:1,E:1,B:1},"Gb":{B:-1,E:-1,A:-1,D:-1,G:-1,C:-1},"F":{B:-1},"Bb":{B:-1,E:-1},"Eb":{B:-1,E:-1,A:-1},"Ab":{B:-1,E:-1,A:-1,D:-1},"Db":{B:-1,E:-1,A:-1,D:-1,G:-1},
// Minor keys (same accidentals as relative major)
"Am":{},"Em":{F:1},"Bm":{F:1,C:1},"F#m":{F:1,C:1,G:1},"C#m":{F:1,C:1,G:1,D:1},"G#m":{F:1,C:1,G:1,D:1,A:1},"Dm":{B:-1},"Gm":{B:-1,E:-1},"Cm":{B:-1,E:-1,A:-1},"Fm":{B:-1,E:-1,A:-1,D:-1},"Bbm":{B:-1,E:-1,A:-1,D:-1,G:-1},"Ebm":{B:-1,E:-1,A:-1,D:-1,G:-1,C:-1}};
function chN(ch){return ch&&typeof ch==="object"?ch.n:ch||"";}
function buildAbc(items,keySig,timeSig,tempo,chords,minBars,keyQual){const[tsN,tsD]=timeSig.split("/").map(Number);const bE=tsN*(8/tsD);const beatE=8/tsD;
  // Beam break positions within a bar (in eighths)
  // 4/4: break at half-bar (beat 3) = position 4
  // 3/4: break at each beat = 2, 4
  // 2/4: break at beat 2 = 2
  // 6/8: break at dotted quarter = 3
  // 5/4: break at 3+2 = 4 (or could be 2+3 = 6)
  var beamBreaks=[];// positions where 8ths break beams (in eighths within bar)
  var beamBreaks16=[];// additional positions where 16ths break (but 8ths don't)
  if(tsD===8){for(var g=0;g<tsN;g+=3)if(g+3<tsN)beamBreaks.push(g+3);}
  else if(tsN===4&&tsD===4){beamBreaks.push(4);beamBreaks16.push(2);beamBreaks16.push(4);beamBreaks16.push(6);}// 4/4: 8ths at half-bar, 16ths per beat
  else if(tsN===2&&tsD===4){beamBreaks16.push(2);}// 2/4: 16ths per beat
  else if(tsN===3&&tsD===4){beamBreaks.push(2);beamBreaks.push(4);beamBreaks16.push(2);beamBreaks16.push(4);}
  else if(tsN===5&&tsD===4){beamBreaks.push(4);beamBreaks.push(6);beamBreaks16.push(2);beamBreaks16.push(4);beamBreaks16.push(6);beamBreaks16.push(8);}
  else{for(var g2=1;g2<tsN;g2++){beamBreaks.push(g2*beatE);beamBreaks16.push(g2*beatE);}}

  // Helper: emit note name in ABC
  var isMinor=(keyQual==="Minor");
  var abcKBase=abcKeySig(keySig);
  var abcKFull=isMinor?abcKBase+"m":abcKBase;
  var ksMap=KEY_SIG_ACC[abcKFull]||KEY_SIG_ACC[abcKBase]||{};
  // Determine if ABC key uses flats
  var abcK2=abcKBase;var abcUsesFlats=["F","Bb","Eb","Ab","Db","Gb"].indexOf(abcK2)>=0;
  var NEXT_LET={C:"D",D:"E",E:"F",F:"G",G:"A",A:"B",B:"C"};
  var PREV_LET={D:"C",E:"D",F:"E",G:"F",A:"G",B:"A",C:"B"};
  var emitNote=function(item,ei,barAlts,addTie){
    var s="";
    if(item.type==="rest")return "z"+e2s(ei);
    // Normalize spelling to match ABC key convention
    var n=item.note,a=item.acc||0,o=item.oct;
    if(abcUsesFlats&&a===1){
      var nn=NEXT_LET[n];a=(nn==="F"||nn==="C")?0:-1;if(n==="B")o++;n=nn;
    }else if(!abcUsesFlats&&a===-1){
      var pn=PREV_LET[n];a=(pn==="E"||pn==="B")?0:1;if(n==="C")o--;n=pn;
    }
    var ksA=ksMap[n]||0;var prevA=barAlts.hasOwnProperty(n)?barAlts[n]:ksA;
    var needsAcc=false;if(a!==prevA)needsAcc=true;
    else if(a===ksA&&barAlts.hasOwnProperty(n)&&barAlts[n]!==ksA)needsAcc=true;
    if(needsAcc){if(a===1)s+="^";else if(a===-1)s+="_";else s+="=";}
    barAlts[n]=a;
    if(o>=5){s+=n.toLowerCase();for(var oi=6;oi<=o;oi++)s+="'";}
    else{s+=n.toUpperCase();for(var o2=3;o2>=o;o2--)s+=",";}
    s+=e2s(ei);
    if(addTie)s+="-";
    return s;
  };

  let abc="X:1\nT:My Lick\nM:"+timeSig+"\nL:1/8\nQ:1/4="+tempo+"\nK:"+abcKFull+"\n";
  let pos=0,nc=0;var barAlts={};var triCount=0;var chObj=chords||{};var emittedCh={};var lastBarEmitted=0;

  // ── Enharmonic respelling pre-pass ──
  var chordBeats=Object.keys(chObj).map(Number).sort(function(a,b){return a-b;});
  var spItems=items;
  if(chordBeats.length>0){
    spItems=[];var spPos=0;
    for(var si=0;si<items.length;si++){var sIt=items[si];
      if(sIt.type!=="note"){spItems.push(sIt);
        if(sIt.type==="rest")spPos+=DURS[sIt.dur].eighths*(sIt.dotted?1.5:1)*(sIt.tri?2/3:1);
        continue;}
      var sPC=((N2M[sIt.note]||0)+(sIt.acc||0)+120)%12;
      var sBeat=Math.floor(spPos/beatE+0.01);
      var sCh=null;for(var ci2=chordBeats.length-1;ci2>=0;ci2--)if(chordBeats[ci2]<=sBeat){sCh=chN(chObj[chordBeats[ci2]]);break;}
      if(sCh){
        var sCI=getChordRootInfo(sCh);
        var sPrev=null,sNext=null;
        for(var pi=si-1;pi>=0;pi--)if(items[pi].type==="note"){sPrev=((N2M[items[pi].note]||0)+(items[pi].acc||0)+120)%12;break;}
        for(var ni=si+1;ni<items.length;ni++)if(items[ni].type==="note"){sNext=((N2M[items[ni].note]||0)+(items[ni].acc||0)+120)%12;break;}
        var sR=chordSpellPC(sPC,sCI,sPrev,sNext);
        if(sR&&(sR.note!==sIt.note||sR.acc!==(sIt.acc||0))){
          // Compute new octave: same MIDI pitch, different letter
          var oldMidi=(N2M[sIt.note]||0)+(sIt.acc||0)+sIt.oct*12;
          var newNat=(N2M[sR.note]||0)+sR.acc;
          var newOct=Math.round((oldMidi-newNat)/12);
          spItems.push(Object.assign({},sIt,{note:sR.note,acc:sR.acc,oct:newOct}));
        }else spItems.push(sIt);
      }else spItems.push(sIt);
      spPos+=DURS[sIt.dur].eighths*(sIt.dotted?1.5:1)*(sIt.tri?2/3:1);
    }
  }

  for(var ii=0;ii<spItems.length;ii++){var item=spItems[ii];if(item.type==="chord")continue;
    const ei=DURS[item.dur].eighths*(item.dotted?1.5:1);var effEi=item.tri?ei*(2/3):ei;
    var hasTie=!!item.tie;

    // Round pos to avoid float accumulation drift (1/1200 precision covers all tuplets)
    pos=Math.round(pos*1200)/1200;

    // Check if note crosses barline → split with tie
    var posInBar=pos%bE;
    if(Math.abs(posInBar)<0.01)posInBar=0;
    var remaining=Math.round((bE-posInBar)*1200)/1200;
    if(remaining<bE-0.01&&effEi>remaining+0.01&&item.type==="note"&&!item.tri){
      // Split: first part fills the bar, second part goes into next bar
      var firstEi=remaining;var secondEi=Math.round((effEi-remaining)*1200)/1200;

      // Emit first part
      // Beam break check
      if(nc>0){var ns=false;if(firstEi>=2)ns=true;else{var brks=firstEi<1?beamBreaks16:beamBreaks;for(var bb=0;bb<brks.length;bb++)if(Math.abs(posInBar-brks[bb])<0.05){ns=true;break;}}if(ns)abc+=" ";}
      var beatIdx=Math.floor(pos/beatE+0.01);if(chObj[beatIdx]&&!emittedCh[beatIdx]){abc+='"'+chN(chObj[beatIdx])+'"';emittedCh[beatIdx]=true;}
      if(item.tri&&triCount%3===0)abc+="(3";if(item.tri)triCount++;else triCount=0;
      abc+=emitNote(item,firstEi,barAlts,true);nc++;pos+=firstEi;

      // Barline
      abc+=" | ";barAlts={};lastBarEmitted=Math.floor(pos/bE+0.001);

      // Chord on beat 1 of new bar?
      var newBarStart=pos;var beatIdx2=Math.floor(newBarStart/beatE+0.01);if(chObj[beatIdx2]&&!emittedCh[beatIdx2]){abc+='"'+chN(chObj[beatIdx2])+'"';emittedCh[beatIdx2]=true;}
      abc+=emitNote(item,secondEi,barAlts,hasTie);nc++;pos+=secondEi;
      continue;
    }

    // Normal note (no barline crossing)
    // Barline — always emit when we've crossed a bar boundary
    if(pos>0){
      var curBar=Math.floor(pos/bE+0.001);
      if(curBar>lastBarEmitted){abc+=" | ";barAlts={};lastBarEmitted=curBar;}
    }
    // Beam break — use base duration (ei) for threshold, not triplet-adjusted effEi
    if(nc>0){
      posInBar=Math.round((pos%bE)*1200)/1200;if(Math.abs(posInBar)<0.01&&pos>0)posInBar=0;
      var needSpace=false;
      // Never break beam inside a triplet group
      var midTriplet=item.tri&&(triCount%3!==0);
      if(!midTriplet){
        if(ei>=2)needSpace=true;
        else{var breaks=ei<1?beamBreaks16:beamBreaks;for(var bb2=0;bb2<breaks.length;bb2++)if(Math.abs(posInBar-breaks[bb2])<0.05){needSpace=true;break;}}
      }
      if(needSpace)abc+=" ";
    }
    // Chord
    var beatIdx3=Math.floor(pos/beatE+0.01);if(chObj[beatIdx3]&&!emittedCh[beatIdx3]){abc+='"'+chN(chObj[beatIdx3])+'"';emittedCh[beatIdx3]=true;}
    // Triplet
    if(item.tri&&triCount%3===0){if(nc>0&&abc.length>0&&abc[abc.length-1]!==" ")abc+=" ";abc+="(3";}if(item.tri)triCount++;else triCount=0;
    // Note
    if(item.type==="rest")abc+="z"+e2s(ei);
    else abc+=emitNote(item,ei,barAlts,hasTie);
    pos+=effEi;nc++;}
  if(nc>0)abc+=" |";
  if(items.some(function(it){return it.tri;})){
    console.log("[etudy] Triplet ABC:",abc.split("\n").pop());
    console.log("[etudy] Final pos:",pos,"bE:",bE,"items:",spItems.length,"triItems:",spItems.filter(function(x){return x.tri;}).length);
    var itemDump=spItems.map(function(it,i){return i+":"+(it.tri?"TRI":"REG")+"-"+DURS[it.dur].name+(it.dotted?".":"");}).join(" ");
    console.log("[etudy] Items:",itemDump);
  }
  // Pad to minBars with full-bar rests
  if(minBars&&minBars>0){
    var currentBars=0;
    if(nc>0){currentBars=Math.ceil(pos/bE);if(pos>0&&pos%bE<0.01)currentBars=Math.round(pos/bE);if(currentBars<1)currentBars=1;}
    var restStr="x"+String(bE);// invisible rest (no symbol)
    while(currentBars<minBars){
      var barStart=currentBars*tsN;
      var barChord="";
      for(var cb=0;cb<tsN;cb++){if(chObj[barStart+cb]&&!emittedCh[barStart+cb]){barChord+='"'+chN(chObj[barStart+cb])+'"';emittedCh[barStart+cb]=true;}}
      abc+=" "+barChord+restStr+" |";
      currentBars++;
    }
  }
  return abc;}
function NoteBuilder({onAbcChange,keySig,keyQual,timeSig,tempo,previewEl,playerEl,noteClickRef,onSelChange,deselectRef,previewOffset,th,chordsRef,barInfoRef,fillBarRef,visible,highlightChords,onChordHintDismiss,onChordHintSkip}){
  const[items,sIt]=useState([]);const[cO,sCO]=useState(4);const[cD,sCD]=useState(2);const[dt,sDt]=useState(false);const[tri,sTri]=useState(false);
  const[chords,sChords]=useState({});
  var chordHintRef=useRef(null);
  useEffect(function(){if(highlightChords&&chordHintRef.current)chordHintRef.current.scrollIntoView({behavior:"smooth",block:"center"});},[highlightChords]);
  useEffect(function(){if(chordsRef)chordsRef.current=chords;},[chords]);
  // Auto-rename chord roots when keySig changes between sharp/flat
  var prevKeyRef=useRef(keySig);
  useEffect(function(){
    var prev=prevKeyRef.current;prevKeyRef.current=keySig;
    if(prev===keySig)return;
    var wasSharp=isSharpKey(prev);var nowSharp=isSharpKey(keySig);
    if(wasSharp===nowSharp)return;
    var keys=Object.keys(chords);if(keys.length===0)return;
    var nc=enharmonicChords(chords,nowSharp);
    sChords(nc);pushHist(items,nc);
  },[keySig]);
  const[selIdx,setSelIdx]=useState(null);
  // Compute note mapping for current items
  var noteToItemSel=[];var itemToNoteSel={};
  for(var si=0;si<items.length;si++){if(items[si].type==="note"){itemToNoteSel[si]=noteToItemSel.length;noteToItemSel.push(si);}}
  var selNotationIdx=selIdx!==null&&itemToNoteSel[selIdx]!==undefined?itemToNoteSel[selIdx]:null;
  useEffect(function(){if(onSelChange)onSelChange(selNotationIdx);},[selIdx,items.length]);
  const histRef=useRef([{items:[],chords:{}}]);const histIdxRef=useRef(0);
  const sR=useRef(null);
  const pianoRef=useRef(null);
  var t=th||TH.classic;var isS=t===TH.studio;
  const ac=t.accent,mu=t.muted;
  var btnBg=isS?t.card:"#fff";var btnBd=t.border;var btnDis=isS?t.filterBg:"#F5F4F0";var btnDisTx=t.subtle;
  var chipBg=isS?t.filterBg:"#F5F4F0";var chipTx=t.text;

  // Push history snapshot
  const pushHist=function(ni,nc){
    var h=histRef.current.slice(0,histIdxRef.current+1);
    h.push({items:ni.map(function(x){return Object.assign({},x);}),chords:Object.assign({},nc)});
    if(h.length>50)h.shift();
    histRef.current=h;histIdxRef.current=h.length-1;
  };
  const mutate=function(ni,nc){
    var newC=nc!==undefined?nc:chords;
    sIt(ni);if(nc!==undefined)sChords(nc);pushHist(ni,newC);
  };
  const undo=function(){
    if(histIdxRef.current<=0)return;histIdxRef.current--;
    var s=histRef.current[histIdxRef.current];
    sIt(s.items.map(function(x){return Object.assign({},x);}));sChords(Object.assign({},s.chords));setSelIdx(null);
  };
  const redo=function(){
    if(histIdxRef.current>=histRef.current.length-1)return;histIdxRef.current++;
    var s=histRef.current[histIdxRef.current];
    sIt(s.items.map(function(x){return Object.assign({},x);}));sChords(Object.assign({},s.chords));setSelIdx(null);
  };
  const canUndo=histIdxRef.current>0;const canRedo=histIdxRef.current<histRef.current.length-1;

  // Smart octave: pick nearest octave to previous note
  const smartOct=function(noteName,prevItems){
    var semiMap={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    for(var i=prevItems.length-1;i>=0;i--){
      if(prevItems[i].type==="note"){var pn=prevItems[i];var ps=semiMap[pn.note]+pn.oct*12;
        var best=cO,bd=999;
        for(var o=Math.max(2,pn.oct-1);o<=Math.min(7,pn.oct+1);o++){
          var d=Math.abs((semiMap[noteName]+o*12)-ps);if(d<bd){bd=d;best=o;}}
        return best;}}
    return cO;
  };

  // ABC generation & auto-scroll
  // Auto-scroll note strip
  useEffect(function(){if(sR.current&&selIdx===null)sR.current.scrollLeft=sR.current.scrollWidth;},[items]);
  // Scroll to selected note
  useEffect(function(){if(sR.current&&selIdx!==null){var el=sR.current.querySelector("[data-nidx='"+selIdx+"']");if(el)el.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});}},[selIdx]);
  // Auto-scroll piano to current octave
  useEffect(function(){if(pianoRef.current){var el=pianoRef.current.querySelector("[data-oct='"+effOct+"']");if(el){var container=pianoRef.current;container.scrollTo({left:el.offsetLeft-container.clientWidth/2+el.clientWidth/2,behavior:"smooth"});}}},[effOct]);
  // Initial piano scroll (no animation) — also re-trigger when becoming visible
  useEffect(function(){requestAnimationFrame(function(){if(pianoRef.current){var el=pianoRef.current.querySelector("[data-oct='4']");if(el){var container=pianoRef.current;container.scrollLeft=el.offsetLeft-container.clientWidth/2+el.clientWidth/2;}}});},[visible]);

  const[tsN,tsD]=timeSig.split("/").map(Number);const bE=tsN*(8/tsD);const beatE=8/tsD;
  var tE=0;for(var ii=0;ii<items.length;ii++){var it=items[ii];if(it.type==="note"||it.type==="rest")tE+=DURS[it.dur].eighths*(it.dotted?1.5:1)*(it.tri?2/3:1);}
  tE=Math.round(tE*1200)/1200;// fix float accumulation (1200 = LCM-friendly for 1/2, 1/3, 1/4)
  // Expose bar completeness
  var barRem=tE>0?Math.round((bE-tE%bE)%bE*1200)/1200:0;
  if(barRem>bE-0.01)barRem=0;// nearly full bar → treat as complete
  if(barInfoRef)barInfoRef.current={complete:tE===0||barRem<0.01,remaining:barRem,bE:bE,tE:tE};
  // Min bars: consider both notes AND chord positions
  var maxChordBeat=0;
  var chordKeys=Object.keys(chords);
  for(var ci=0;ci<chordKeys.length;ci++){var cb=Number(chordKeys[ci]);if(cb+1>maxChordBeat)maxChordBeat=cb+1;}
  maxChordBeat=Math.ceil(maxChordBeat/tsN)*tsN;// round up to bar boundary
  const totalBeats=Math.max(tsN,Math.ceil(tE/beatE),maxChordBeat);
  var barsFromNotes=Math.ceil(tE/bE)||0;
  var barsFromChords=Math.ceil(maxChordBeat/tsN)||0;
  var rawBars=Math.max(barsFromNotes,barsFromChords);
  var hasContent=items.length>0||chordKeys.length>0;
  var edMinBars=hasContent?Math.max(1,rawBars):0;
  // Fill bar with rests — returns new ABC for immediate use
  if(fillBarRef)fillBarRef.current=function(){
    if(barRem<0.01)return null;
    var rem=barRem;var newItems=items.slice();
    var restVals=[{dur:0,e:8},{dur:1,e:4},{dur:2,e:2},{dur:3,e:1},{dur:4,e:0.5}];
    for(var rv=0;rv<restVals.length;rv++){
      while(rem>=restVals[rv].e-0.01){newItems.push({type:"rest",dur:restVals[rv].dur});rem=Math.round((rem-restVals[rv].e)*1200)/1200;}
    }
    mutate(newItems,chords);
    var newTE=0;for(var fi=0;fi<newItems.length;fi++){var ft=newItems[fi];if(ft.type==="note"||ft.type==="rest")newTE+=DURS[ft.dur].eighths*(ft.dotted?1.5:1)*(ft.tri?2/3:1);}
    newTE=Math.round(newTE*1200)/1200;
    var newBarsN=Math.ceil(newTE/bE)||0;
    var newRaw=Math.max(newBarsN,barsFromChords);
    var newMinBars=Math.max(1,newRaw);
    return buildAbc(newItems,keySig,timeSig,tempo,chords,newMinBars,keyQual);
  };
  var currentAbc=useMemo(function(){return buildAbc(items,keySig,timeSig,tempo,chords,edMinBars,keyQual);},[items,keySig,timeSig,tempo,chords,edMinBars,keyQual]);
  useEffect(function(){onAbcChange(currentAbc);},[currentAbc]);

  // Add note (append or edit selected)
  const addNote=function(n,acc,explOct){
    if(selIdx!==null&&selIdx<items.length){
      var ni=items.map(function(x){return Object.assign({},x);});
      var newOct=explOct!==undefined?explOct:(items[selIdx].type==="note"?items[selIdx].oct:cO);
      ni[selIdx]=Object.assign({},ni[selIdx],{type:"note",note:n,acc:acc,oct:newOct});
      sCO(newOct);prevNote(n,newOct,acc,previewOffset||0);mutate(ni);
    }else{
      var oct=explOct!==undefined?explOct:smartOct(n,items);sCO(oct);
      prevNote(n,oct,acc,previewOffset||0);
      var newItems=items.concat([{type:"note",note:n,acc:acc,oct:oct,dur:cD,dotted:dt,tri:tri}]);
      mutate(newItems);
      if(tri){var tc=0;for(var k=newItems.length-1;k>=0&&newItems[k].tri;k--)tc++;if(tc%3===0)sTri(false);}
    }
  };
  const addRest=function(){
    if(selIdx!==null&&selIdx<items.length){
      var ni=items.map(function(x){return Object.assign({},x);});
      ni[selIdx]={type:"rest",dur:ni[selIdx].dur,dotted:ni[selIdx].dotted,tri:ni[selIdx].tri};
      mutate(ni);
    }else{
      var newItems=items.concat([{type:"rest",dur:cD,dotted:dt,tri:tri}]);
      mutate(newItems);
      if(tri){var tc=0;for(var k=newItems.length-1;k>=0&&newItems[k].tri;k--)tc++;if(tc%3===0)sTri(false);}
    }
  };
  const changeDur=function(d){
    sCD(d);
    if(selIdx!==null&&selIdx<items.length){
      var ni=items.map(function(x){return Object.assign({},x);});ni[selIdx]=Object.assign({},ni[selIdx],{dur:d});mutate(ni);
    }
  };
  const toggleDot=function(){
    var nv=!dt;sDt(nv);
    if(selIdx!==null&&selIdx<items.length){
      var ni=items.map(function(x){return Object.assign({},x);});ni[selIdx]=Object.assign({},ni[selIdx],{dotted:nv});mutate(ni);
    }
  };
  const toggleTri=function(){
    var nv=!tri;sTri(nv);
    if(selIdx!==null&&selIdx<items.length){
      var ni=items.map(function(x){return Object.assign({},x);});ni[selIdx]=Object.assign({},ni[selIdx],{tri:nv});mutate(ni);
    }
  };
  const toggleTie=function(){
    if(selIdx!==null&&selIdx<items.length&&items[selIdx].type==="note"){
      var ni=items.map(function(x){return Object.assign({},x);});ni[selIdx]=Object.assign({},ni[selIdx],{tie:!ni[selIdx].tie});mutate(ni);
    }else{
      // No selection: toggle tie on last note
      for(var k=items.length-1;k>=0;k--){
        if(items[k].type==="note"){
          var ni2=items.map(function(x){return Object.assign({},x);});ni2[k]=Object.assign({},ni2[k],{tie:!ni2[k].tie});mutate(ni2);
          break;
        }
      }
    }
  };
  const changeOct=function(delta){
    var nv=Math.max(2,Math.min(7,(selIdx!==null&&items[selIdx]&&items[selIdx].type==="note"?items[selIdx].oct:cO)+delta));sCO(nv);
    if(selIdx!==null&&selIdx<items.length&&items[selIdx].type==="note"){
      var ni=items.map(function(x){return Object.assign({},x);});ni[selIdx]=Object.assign({},ni[selIdx],{oct:nv});
      prevNote(ni[selIdx].note,nv,ni[selIdx].acc,previewOffset||0);mutate(ni);
    }
  };
  const deleteNote=function(){
    if(selIdx!==null&&selIdx<items.length){
      var ni=items.filter(function(_,i){return i!==selIdx;});
      setSelIdx(null);mutate(ni);
    }else if(items.length>0){mutate(items.slice(0,-1));}
  };
  const tapNote=function(idx){
    if(selIdx===idx){setSelIdx(null);return;}
    setSelIdx(idx);
    if(items[idx]){var it2=items[idx];sCD(it2.dur);sDt(!!it2.dotted);sTri(!!it2.tri);
      if(it2.type==="note"){sCO(it2.oct);prevNote(it2.note,it2.oct,it2.acc,previewOffset||0);}}
  };
  if(deselectRef)deselectRef.current=function(){setSelIdx(null);};
  // Map: notation note index → items index (skip rests)
  var noteToItem=[];var itemToNote={};
  for(var mi=0;mi<items.length;mi++){if(items[mi].type==="note"){itemToNote[mi]=noteToItem.length;noteToItem.push(mi);}}
  var noteClickFromNotation=function(notationIdx){if(notationIdx>=0&&notationIdx<noteToItem.length)tapNote(noteToItem[notationIdx]);};
  if(noteClickRef)noteClickRef.current=noteClickFromNotation;
  var selItem=selIdx!==null&&items[selIdx]?items[selIdx]:null;
  var effDur=selItem?selItem.dur:cD;var effDot=selItem?!!selItem.dotted:dt;var effTri=selItem?!!selItem.tri:tri;
  var effOct=selItem&&selItem.type==="note"?selItem.oct:cO;
  var effTie=false;
  if(selItem&&selItem.type==="note")effTie=!!selItem.tie;
  else{for(var ti2=items.length-1;ti2>=0;ti2--){if(items[ti2].type==="note"){effTie=!!items[ti2].tie;break;}}}

  const renderItem=function(item,idx){
    var pB=0;for(var j=0;j<idx;j++){var it3=items[j];if(it3.type==="note"||it3.type==="rest")pB+=DURS[it3.dur].eighths*(it3.dotted?1.5:1)*(it3.tri?2/3:1);}
    var atBar=idx>0&&pB>0&&Math.abs(pB%bE)<0.01;var els=[];var isSel=selIdx===idx;
    if(atBar)els.push(React.createElement("div",{key:idx+"b",style:{width:2,height:44,background:btnBd,borderRadius:1,flexShrink:0,marginRight:2}}));
    var ct,bg=isSel?t.accentBg:chipBg;
    if(item.type==="note"){var aS=item.acc===1?"\u266F":item.acc===-1?"\u266D":"";
      ct=React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:0}},
        React.createElement("span",{style:{fontSize:13,fontWeight:600,fontFamily:"'Instrument Serif',serif",lineHeight:1.1,color:isSel?ac:t.text}},aS+item.note+(item.dotted?".":" ")+(item.tri?"\u00B3":"")),
        React.createElement("span",{style:{fontSize:8,color:isSel?ac:mu,lineHeight:1}},item.oct),
        item.tie&&React.createElement("span",{style:{fontSize:9,color:ac,fontFamily:"'Inter',sans-serif",lineHeight:1,marginTop:-2}},"\u2040"),noteIcon(item.dur,isSel?ac:"#666",16));
      bg=isSel?"rgba(99,102,241,0.15)":"rgba(99,102,241,0.04)";
    }else if(item.type==="rest"){
      ct=React.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center"}},
        React.createElement("span",{style:{fontSize:10,color:isSel?ac:mu}},item.dotted?"rest.":"rest"),noteIcon(item.dur,isSel?ac:mu,14));bg=isSel?t.accentBg:chipBg;}
    els.push(React.createElement("div",{key:idx,"data-nidx":idx,onClick:function(){tapNote(idx);},style:{minWidth:38,height:48,borderRadius:8,background:bg,color:t.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"2px 5px",cursor:"pointer",flexShrink:0,border:isSel?"2px solid "+ac:"1px solid "+btnBd,transition:"all 0.1s"}},ct));return els;};

  // Chord timeline component
  var chordLaneEl=React.createElement(ChordTimeline,{chords:chords,onChordsChange:function(nc){sChords(nc);pushHist(items,nc);},totalBeats:totalBeats,tsN:tsN,th:th,keySig:keySig,forceOpen:highlightChords});

  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
    // 1. Notation preview
    previewEl,
    // 2. Chord hint popup — rendered inline above chord section
    highlightChords&&onChordHintDismiss&&React.createElement("div",{ref:chordHintRef,style:{background:t.card,borderRadius:14,padding:"20px 18px",border:"2px solid "+(isS?t.accent:t.accent),boxShadow:"0 4px 20px "+(isS?"rgba(34,216,158,0.2)":"rgba(99,102,241,0.15)")+", 0 0 16px "+(isS?"rgba(34,216,158,0.1)":"rgba(99,102,241,0.08)"),animation:"fadeIn 0.25s ease"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:10}},
        React.createElement("span",{style:{fontSize:22}},"\uD83C\uDFB5"),
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:14,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"}},"No chords added yet"),
          React.createElement("div",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:2}},"Add them below \u2014 they help with theory analysis"))),
      React.createElement("div",{style:{display:"flex",gap:8,marginTop:4}},
        React.createElement("button",{onClick:onChordHintDismiss,style:{flex:1,padding:"9px",borderRadius:10,border:"none",background:isS?t.playBg:t.accent,color:"#fff",fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Add Chords"),
        React.createElement("button",{onClick:onChordHintSkip,style:{flex:1,padding:"9px",borderRadius:10,border:"1px solid "+t.border,background:"transparent",color:t.muted,fontSize:12,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Skip"))),
    // 3. Chord timeline (with optional glow highlight)
    React.createElement("div",{style:{borderRadius:10,padding:highlightChords?2:0,background:highlightChords?(isS?"rgba(34,216,158,0.12)":"rgba(99,102,241,0.08)"):"transparent",border:highlightChords?("2px solid "+(isS?"rgba(34,216,158,0.5)":"rgba(99,102,241,0.4)")):"2px solid transparent",boxShadow:highlightChords?("0 0 16px "+(isS?"rgba(34,216,158,0.3)":"rgba(99,102,241,0.25)")+", 0 0 32px "+(isS?"rgba(34,216,158,0.15)":"rgba(99,102,241,0.12)")):"none",transition:"all 0.4s ease, box-shadow 0.4s ease",animation:highlightChords?"chordGlow 1.5s ease-in-out infinite":"none"}},chordLaneEl),
    // 3. Minimal player
    playerEl,
    // 4. Empty state hint
    !selItem&&items.length===0&&React.createElement("div",{style:{padding:"8px 12px",background:isS?t.card:t.noteBg,borderRadius:8,border:"1px solid "+btnBd}},
      React.createElement("span",{style:{fontSize:11,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"Tap keys below to add notes\u2026")),
    // 5. Action bar: Undo, Redo, Delete
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4}},
      React.createElement("button",{onClick:undo,disabled:!canUndo,style:{padding:"4px 10px",borderRadius:7,border:"1px solid "+btnBd,background:canUndo?btnBg:btnDis,color:canUndo?t.text:btnDisTx,fontSize:11,cursor:canUndo?"pointer":"default",fontFamily:"monospace"}},"\u21A9 Undo"),
      React.createElement("button",{onClick:redo,disabled:!canRedo,style:{padding:"4px 10px",borderRadius:7,border:"1px solid "+btnBd,background:canRedo?btnBg:btnDis,color:canRedo?t.text:btnDisTx,fontSize:11,cursor:canRedo?"pointer":"default",fontFamily:"monospace"}},"\u21AA Redo"),
      React.createElement("div",{style:{flex:1}}),
      React.createElement("button",{onClick:deleteNote,disabled:items.length===0,style:{padding:"4px 10px",borderRadius:7,border:"1px solid "+(items.length>0?"rgba(229,57,53,0.2)":btnBd),background:items.length>0?"rgba(229,57,53,0.04)":btnDis,color:items.length>0?"#E53935":btnDisTx,fontSize:10,cursor:items.length>0?"pointer":"default",fontFamily:"monospace"}},selIdx!==null?"\uD83D\uDDD1 Delete":"\u21A9 Last"),
      items.length>1&&selIdx===null&&React.createElement("button",{onClick:function(){mutate([],{});setSelIdx(null);},style:{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(229,57,53,0.15)",background:"rgba(229,57,53,0.04)",color:"#E53935",fontSize:10,cursor:"pointer",fontFamily:"monospace"}},"\u2715 All")),
    // 5. Duration picker
    React.createElement("div",{style:{display:"flex",gap:4,alignItems:"center"}},
      DURS.map(function(dd,i){return React.createElement("button",{key:i,onClick:function(){changeDur(i);},style:{padding:"4px 6px",borderRadius:8,border:"1px solid "+(effDur===i?t.accentBorder:btnBd),cursor:"pointer",background:effDur===i?t.accentBg:btnBg,color:effDur===i?ac:mu,display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:36}},noteIcon(i,effDur===i?ac:mu),React.createElement("span",{style:{fontSize:7,letterSpacing:0.5,fontFamily:"monospace"}},dd.name));}),
      React.createElement("div",{style:{width:1,height:28,background:btnBd}}),
      React.createElement("button",{onClick:toggleDot,style:{padding:"4px 10px",borderRadius:8,border:"1px solid "+(effDot?t.accentBorder:btnBd),cursor:"pointer",background:effDot?t.accentBg:btnBg,color:effDot?ac:mu,fontSize:18,fontWeight:700}},"\u00B7"),
      React.createElement("button",{onClick:toggleTri,style:{padding:"4px 8px",borderRadius:8,border:"1px solid "+(effTri?t.accentBorder:btnBd),cursor:"pointer",background:effTri?t.accentBg:btnBg,color:effTri?ac:mu,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}},"3"),
      items.some(function(it){return it.type==="note";})&&React.createElement("button",{onClick:toggleTie,style:{padding:"4px 8px",borderRadius:8,border:"1px solid "+(effTie?t.accentBorder:btnBd),cursor:"pointer",background:effTie?t.accentBg:btnBg,color:effTie?ac:mu,fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:3}},"\u2040","tie")),
    // 7. Rest button
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4}},
      React.createElement("button",{onClick:addRest,style:{padding:"5px 12px",borderRadius:8,border:"1px solid "+btnBd,background:chipBg,color:mu,fontSize:11,cursor:"pointer",fontFamily:"monospace"}},selIdx!==null?"Set Rest":"+ Rest"),
      React.createElement("div",{style:{flex:1}}),
      React.createElement("span",{style:{fontSize:10,color:mu,fontFamily:"'JetBrains Mono',monospace"}},"scroll \u2194 for octaves")),
    // 8. Scrollable multi-octave piano keyboard
    (function(){
      var octLo=2,octHi=7,wkW=46,bkW=30,bkH=68,octW=wkW*7;
      var useFlats=!isSharpKey(keySig);
      var bks=useFlats?
        [{n:"D",a:-1,l:"D\u266D",off:1},{n:"E",a:-1,l:"E\u266D",off:2},{n:"G",a:-1,l:"G\u266D",off:4},{n:"A",a:-1,l:"A\u266D",off:5},{n:"B",a:-1,l:"B\u266D",off:6}]:
        [{n:"C",a:1,l:"C\u266F",off:1},{n:"D",a:1,l:"D\u266F",off:2},{n:"F",a:1,l:"F\u266F",off:4},{n:"G",a:1,l:"G\u266F",off:5},{n:"A",a:1,l:"A\u266F",off:6}];
      var totalW=(octHi-octLo+1)*octW;
      var octaves=[];
      for(var o=octLo;o<=octHi;o++)(function(oct){
        var isCur=oct===effOct;
        // White keys
        var whites=["C","D","E","F","G","A","B"].map(function(n,ki){
          return React.createElement("button",{key:oct+"-"+n,onClick:function(){addNote(n,0,oct);},style:{width:wkW,height:"100%",borderRadius:ki===0?"6px 0 0 6px":ki===6?"0 6px 6px 0":"0",border:"1px solid "+(isCur?"#C5C4BE":"#D5D4CE"),borderRight:ki<6?"none":undefined,cursor:"pointer",background:isCur?"#FFFFF8":"#fff",color:"#1A1A1A",fontSize:14,fontWeight:600,fontFamily:"'Instrument Serif',Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",paddingBottom:6,position:"relative",zIndex:1,flexShrink:0,boxSizing:"border-box"}},
            n==="C"?React.createElement("span",{style:{fontSize:8,color:isCur?ac:mu,fontFamily:"'JetBrains Mono',monospace",marginBottom:2}},oct):null,
            React.createElement("span",null,n));
        });
        // Black keys
        var blackKeys=bks.map(function(k){
          var leftPos=k.off*wkW-bkW/2;
          return React.createElement("button",{key:oct+"-"+k.l,onClick:function(e){e.stopPropagation();addNote(k.n,k.a,oct);},style:{position:"absolute",top:0,left:leftPos,width:bkW,height:bkH,borderRadius:"0 0 5px 5px",border:"1px solid #333",cursor:"pointer",background:"linear-gradient(180deg,#2A2A2A,#111)",color:"#ccc",fontSize:8,fontWeight:600,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:4,zIndex:2,boxShadow:"0 2px 4px rgba(0,0,0,0.3)",boxSizing:"border-box"}},k.l);
        });
        octaves.push(React.createElement("div",{key:oct,"data-oct":oct,style:{position:"relative",display:"flex",height:"100%",flexShrink:0,width:octW,borderRight:oct<octHi?"2px solid "+(isCur?"rgba(99,102,241,0.3)":"#E0DFD8"):"none"}},whites,blackKeys));
      })(o);
      return React.createElement("div",{ref:pianoRef,style:{overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",borderRadius:10,border:"1px solid #D5D4CE",height:112}},
        React.createElement("div",{style:{display:"flex",height:"100%",width:totalW}},octaves));
    })());}

// ============================================================
// SHEET FOCUS — fullscreen notation overlay
// ============================================================
function SheetFocus({abc,onClose,abRange,curNoteRef,curProgressRef,th,playerCtrlRef,theoryMode,theoryAnalysis,soundAbc}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const[playing,setPlaying]=useState(false);
  const[isLandscape,setIsLandscape]=useState(window.innerWidth>window.innerHeight);
  useEffect(()=>{
    document.body.style.overflow="hidden";
    unlockOrientation();
    var onResize=function(){setIsLandscape(window.innerWidth>window.innerHeight);};
    window.addEventListener("resize",onResize);
    return()=>{document.body.style.overflow="";lockPortrait();window.removeEventListener("resize",onResize);};
  },[]);
  // Poll playing state from playerCtrlRef
  useEffect(()=>{if(!playerCtrlRef)return;var iv=setInterval(function(){var p=playerCtrlRef.current&&playerCtrlRef.current.playing;if(p!==playing)setPlaying(!!p);},100);return function(){clearInterval(iv);};},[playing]);
  var onToggle=function(){if(playerCtrlRef&&playerCtrlRef.current&&playerCtrlRef.current.toggle)playerCtrlRef.current.toggle();};
  return React.createElement("div",{"data-sheet-focus":"true",style:{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",maxWidth:"none",zIndex:9999,background:t.card,display:"flex",flexDirection:"column",animation:"sheetUp 0.25s cubic-bezier(0.4,0,0.2,1)"}},
    React.createElement("div",{style:{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:isLandscape?"16px 24px 60px":"52px 16px 72px",paddingTop:isLandscape?"calc(env(safe-area-inset-top, 0px) + 16px)":"calc(env(safe-area-inset-top, 0px) + 52px)",paddingLeft:isLandscape?"calc(env(safe-area-inset-left, 0px) + 24px)":"16px",paddingRight:isLandscape?"calc(env(safe-area-inset-right, 0px) + 24px)":"16px",minHeight:0,display:"flex",alignItems:isLandscape?"center":"stretch"}},
      React.createElement("div",{style:{width:"100%",maxWidth:isLandscape?900:undefined}},
        React.createElement(Notation,{abc,compact:false,focus:true,abRange,curNoteRef,curProgressRef:curProgressRef,th:t,theoryMode:theoryMode,theoryAnalysis:theoryAnalysis,soundAbc:soundAbc}))),
    // Bottom bar with play/stop
    React.createElement("div",{style:{position:"absolute",bottom:0,left:0,right:0,padding:"12px 16px",paddingBottom:"max(12px, env(safe-area-inset-bottom))",background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid "+t.border,display:"flex",alignItems:"center",justifyContent:"center",gap:16}},
      React.createElement("button",{onClick:onToggle,style:{width:48,height:48,borderRadius:24,border:"none",background:playing?(isStudio?"#EF4444":t.muted):(isStudio?t.playBg:t.accent),color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:playing?"none":"0 4px 16px "+t.accentGlow,transition:"all 0.15s"}},playing?"\u25A0":"\u25B6")),
    React.createElement("button",{onClick:onClose,style:{position:"absolute",top:"calc(env(safe-area-inset-top, 0px) + 10px)",right:20,width:40,height:40,borderRadius:12,border:"1px solid "+t.border,background:t.card,color:t.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.15)",zIndex:10}},"\u2715"));}


// ============================================================
// YOUTUBE PLAYER — themed
// ============================================================
function parseYT(u){if(!u)return{videoId:"",startTime:0};let v="",s=0;const m=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);if(m)v=m[1];const t1=u.match(/[?&]t=(\d+)m(\d+)s/);if(t1)s=parseInt(t1[1])*60+parseInt(t1[2]);else{const t2=u.match(/[?&]t=(\d+)/);if(t2)s=parseInt(t2[1]);}const t3=u.match(/[?&]start=(\d+)/);if(t3)s=parseInt(t3[1]);return{videoId:v,startTime:s};}
function fT(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function YTP({videoId,startTime,endTime,isActive,th}){
  var t=th||TH.classic;
  var _on=useState(false); var on=_on[0],sO=_on[1];
  var divRef=useRef(null);
  var playerRef=useRef(null);
  var pollRef=useRef(null);
  var start=startTime||0;
  var end=(endTime&&endTime>start)?endTime:null;

  // Load YT IFrame API once globally
  useEffect(function(){
    if(window.YT&&window.YT.Player)return;
    if(document.querySelector('script[src*="youtube.com/iframe_api"]'))return;
    var tag=document.createElement('script');
    tag.src='https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  },[]);

  // Create player + start loop poll when user presses play
  useEffect(function(){
    if(!on||!videoId||!divRef.current)return;
    var destroyed=false;
    function startPoll(){
      if(!end)return;
      if(pollRef.current)clearInterval(pollRef.current);
      pollRef.current=setInterval(function(){
        try{
          var p=playerRef.current;
          if(!p||!p.getCurrentTime)return;
          var state=p.getPlayerState(); // 1=playing
          if(state!==1)return;
          var cur=p.getCurrentTime();
          if(cur>=end){
            p.seekTo(start,true);
          }
        }catch(e){}
      },200);
    }
    function create(){
      if(destroyed||!divRef.current)return;
      try{
        playerRef.current=new window.YT.Player(divRef.current,{
          videoId:videoId,
          playerVars:{start:start,autoplay:1,rel:0,modestbranding:1},
          events:{
            onReady:function(){startPoll();},
            onStateChange:function(e){
              if(e.data===1)startPoll(); // (re)start poll on play
            }
          }
        });
      }catch(err){}
    }
    if(window.YT&&window.YT.Player){create();}
    else{
      var prev=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=function(){if(prev)prev();create();};
    }
    return function(){
      destroyed=true;
      if(pollRef.current){clearInterval(pollRef.current);pollRef.current=null;}
      try{if(playerRef.current){playerRef.current.destroy();playerRef.current=null;}}catch(e){}
    };
  },[on,videoId,start,end]);

  if(!isActive||!videoId)return null;
  // Note: no &end= param — we handle loop via polling for accuracy
  var embedSrc='https://www.youtube.com/embed/'+videoId+'?start='+start+'&autoplay=1&rel=0&enablejsapi=1';
  return React.createElement('div',{style:{marginTop:12}},
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
      React.createElement('span',{style:{fontSize:10,color:t.subtle,fontFamily:'monospace',letterSpacing:1}},'ORIGINAL'),
      start>0&&React.createElement('span',{style:{fontSize:10,fontFamily:'monospace',color:t.accent,background:t.accentBg,padding:'2px 8px',borderRadius:8}},
        '\u23F1 '+fT(start)+(end?' \u2014 '+fT(end)+' \uD83D\uDD01':''))),
    on
      ?React.createElement('div',{style:{position:'relative',paddingBottom:'56.25%',borderRadius:12,overflow:'hidden',background:'#1A1A1A'}},
          React.createElement('div',{ref:divRef,style:{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}))
      :React.createElement('div',{style:{position:'relative',paddingBottom:'56.25%',borderRadius:12,overflow:'hidden',background:'linear-gradient(135deg,#2a2a3e,#1a1a2e)'}},
          React.createElement('button',{onClick:function(e){e.stopPropagation();sO(true);},style:{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'transparent',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}},
            React.createElement('div',{style:{width:52,height:52,borderRadius:'50%',background:t.accent,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px '+t.accentGlow}},
              React.createElement('div',{style:{width:0,height:0,borderTop:'10px solid transparent',borderBottom:'10px solid transparent',borderLeft:'16px solid #fff',marginLeft:3}})),
            React.createElement('span',{style:{color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'monospace'}},
              start>0?'\u25B6 '+fT(start)+(end?' \u2014 '+fT(end):''):'\u25B6 PLAY'))))
}

// YTPEditor — always-on IFrame player for Editor use, with speed control + loop
function YTPEditor({videoId,startTime,endTime,speed,th,compact}){
  var t=th||TH.studio;
  var divRef=useRef(null);
  var playerRef=useRef(null);
  var pollRef=useRef(null);
  var speedRef=useRef(speed||1);
  var start=startTime||0;
  var end=(endTime&&endTime>start)?endTime:null;

  useEffect(function(){speedRef.current=speed||1;},[speed]);

  useEffect(function(){
    if(window.YT&&window.YT.Player)return;
    if(document.querySelector('script[src*="youtube.com/iframe_api"]'))return;
    var tag=document.createElement('script');
    tag.src='https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  },[]);

  useEffect(function(){
    if(!videoId)return;
    var destroyed=false;
    function startPoll(){
      if(pollRef.current)clearInterval(pollRef.current);
      pollRef.current=setInterval(function(){
        try{
          var p=playerRef.current;
          if(!p||!p.getCurrentTime)return;
          if(p.getPlayerState()!==1)return;
          if(end&&p.getCurrentTime()>=end)p.seekTo(start,true);
        }catch(e){}
      },200);
    }
    function create(){
      if(destroyed||!divRef.current)return;
      try{
        playerRef.current=new window.YT.Player(divRef.current,{
          videoId:videoId,
          playerVars:{start:start,autoplay:0,rel:0,modestbranding:1,controls:1},
          events:{
            onReady:function(e){
              try{e.target.setPlaybackRate(speedRef.current);}catch(ex){}
              startPoll();
            },
            onStateChange:function(e){if(e.data===1)startPoll();}
          }
        });
      }catch(err){}
    }
    if(window.YT&&window.YT.Player){create();}
    else{
      var prev=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=function(){if(prev)prev();if(!destroyed)create();};
    }
    return function(){
      destroyed=true;
      if(pollRef.current){clearInterval(pollRef.current);pollRef.current=null;}
      try{if(playerRef.current){playerRef.current.destroy();playerRef.current=null;}}catch(e){}
    };
  },[videoId,start,end]);

  // Apply speed changes without recreating player
  useEffect(function(){
    try{if(playerRef.current&&playerRef.current.setPlaybackRate)playerRef.current.setPlaybackRate(speed||1);}catch(e){}
  },[speed]);

  if(!videoId)return null;
  var h=compact?'35%':'52%';
  return React.createElement('div',{style:{borderRadius:12,overflow:'hidden',background:'#1A1A1A',position:'relative',paddingBottom:h}},
    React.createElement('div',{ref:divRef,style:{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}));
}

// YTPMini — invisible iframe player with custom app-style play button
// The YT iframe is 1×1px off-screen so audio plays but video is hidden.
// Controls are entirely app-native.
function YTPMini({videoId,startTime,endTime,speed,th}){
  var t=th||TH.studio;
  var _pl=useState(false); var playing=_pl[0],setPlaying=_pl[1];
  var _lo=useState(false); var loaded=_lo[0],setLoaded=_lo[1];
  var divRef=useRef(null);
  var playerRef=useRef(null);
  var pollRef=useRef(null);
  var speedRef=useRef(speed||1);
  var start=startTime||0;
  var end=(endTime&&endTime>start)?endTime:null;

  useEffect(function(){speedRef.current=speed||1;},[speed]);

  // Load YT IFrame API once
  useEffect(function(){
    if(window.YT&&window.YT.Player)return;
    if(document.querySelector('script[src*="youtube.com/iframe_api"]'))return;
    var tag=document.createElement('script');
    tag.src='https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  },[]);

  // Create player immediately (audio-only, invisible)
  useEffect(function(){
    if(!videoId||!divRef.current)return;
    var destroyed=false;
    function startPoll(){
      if(pollRef.current)clearInterval(pollRef.current);
      pollRef.current=setInterval(function(){
        try{
          var p=playerRef.current;
          if(!p||!p.getCurrentTime)return;
          var state=p.getPlayerState();
          setPlaying(state===1);
          if(end&&state===1&&p.getCurrentTime()>=end)p.seekTo(start,true);
        }catch(e){}
      },200);
    }
    function create(){
      if(destroyed||!divRef.current)return;
      try{
        playerRef.current=new window.YT.Player(divRef.current,{
          videoId:videoId,
          playerVars:{start:start,autoplay:0,rel:0,controls:0,disablekb:1,modestbranding:1,mute:0},
          events:{
            onReady:function(e){
              setLoaded(true);
              try{e.target.setPlaybackRate(speedRef.current);}catch(ex){}
              startPoll();
            },
            onStateChange:function(e){
              setPlaying(e.data===1);
              if(e.data===1)startPoll();
            }
          }
        });
      }catch(err){}
    }
    if(window.YT&&window.YT.Player){create();}
    else{
      var prev=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=function(){if(prev)prev();if(!destroyed)create();};
    }
    return function(){
      destroyed=true;
      if(pollRef.current){clearInterval(pollRef.current);pollRef.current=null;}
      try{if(playerRef.current){playerRef.current.destroy();playerRef.current=null;setLoaded(false);setPlaying(false);}}catch(e){}
    };
  },[videoId,start,end]);

  // Apply speed live
  useEffect(function(){
    try{if(playerRef.current&&playerRef.current.setPlaybackRate)playerRef.current.setPlaybackRate(speed||1);}catch(e){}
  },[speed]);

  function toggle(){
    if(!playerRef.current)return;
    try{
      if(playing){playerRef.current.pauseVideo();}
      else{playerRef.current.seekTo(start,true);playerRef.current.playVideo();}
    }catch(e){}
  }

  if(!videoId)return null;
  return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:t===TH.studio?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',border:'1px solid '+t.border}},
    // Invisible 1×1 iframe container — keeps YT player in DOM
    React.createElement('div',{style:{position:'absolute',width:1,height:1,overflow:'hidden',opacity:0,pointerEvents:'none',left:'-9999px'}},
      React.createElement('div',{ref:divRef})),
    // Play / Pause button
    React.createElement('button',{onClick:toggle,disabled:!loaded,style:{
      width:44,height:44,borderRadius:13,flexShrink:0,border:'none',cursor:loaded?'pointer':'default',
      display:'flex',alignItems:'center',justifyContent:'center',
      background:playing?(t===TH.studio?'linear-gradient(135deg,#22D89E,#1AB87A)':t.accent):(loaded?t.playBg:t.filterBg),
      boxShadow:playing?('0 4px 20px '+t.accentGlow):'none',
      transition:'all 0.2s',opacity:loaded?1:0.5}},
      !loaded
        ?React.createElement('div',{style:{width:12,height:12,border:'2px solid '+t.accentBg,borderTopColor:t.accent,borderRadius:'50%',animation:'spin 0.8s linear infinite'}})
        :playing
          ?React.createElement('div',{style:{display:'flex',gap:3}},
              React.createElement('div',{style:{width:3,height:13,background:t===TH.studio?'#08080F':'#fff',borderRadius:1}}),
              React.createElement('div',{style:{width:3,height:13,background:t===TH.studio?'#08080F':'#fff',borderRadius:1}}))
          :React.createElement('div',{style:{width:0,height:0,borderTop:'7px solid transparent',borderBottom:'7px solid transparent',borderLeft:'12px solid #fff',marginLeft:2}})),
    // Label + timestamp
    React.createElement('div',{style:{flex:1,minWidth:0}},
      React.createElement('div',{style:{fontSize:10,fontWeight:600,color:t.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,marginBottom:2}},'REFERENCE'),
      React.createElement('div',{style:{fontSize:11,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},
        fT(start)+(end?' \u2014 '+fT(end)+' \uD83D\uDD01':''))),
    // Speed buttons
    React.createElement('div',{style:{display:'flex',gap:3}},
      [0.5,0.75,1].map(function(s){
        return React.createElement('button',{key:s,onClick:function(){
          speedRef.current=s;
          try{if(playerRef.current&&playerRef.current.setPlaybackRate)playerRef.current.setPlaybackRate(s);}catch(e){}
        },style:{
          padding:'4px 7px',borderRadius:6,fontSize:10,fontWeight:speed===s?700:400,
          fontFamily:"'JetBrains Mono',monospace",cursor:'pointer',
          border:'1.5px solid '+(speed===s?t.accent:t.border),
          background:speed===s?t.accentBg:'transparent',
          color:speed===s?t.accent:t.muted,transition:'all 0.15s'}},s+'x');
      })));
}

// YTCardBtn — invisible iframe player, compact card button
// Renders a single pill button: [▶ ORIG] or [⏸ ORIG]
// The YT iframe sits 1×1px off-screen; audio only, no video visible.
// YTCardBtn — pill button that expands a real visible YT player inline.
// ToS-compliant: player is always visible when active.
// Player is only created when expanded (no hidden iframe).
function YTCardBtn({videoId,startTime,endTime,th}){
  var t=th||TH.studio;
  var _ex=useState(false); var expanded=_ex[0],setExpanded=_ex[1];
  var _pl=useState(false); var playing=_pl[0],setPlaying=_pl[1];
  var _rdy=useState(false); var ready=_rdy[0],setReady=_rdy[1];
  var divRef=useRef(null);
  var playerRef=useRef(null);
  var pollRef=useRef(null);
  var start=startTime||0;
  var end=(endTime&&endTime>start)?endTime:null;

  // Load IFrame API once globally
  useEffect(function(){
    if(window.YT&&window.YT.Player)return;
    if(document.querySelector('script[src*="youtube.com/iframe_api"]'))return;
    var tag=document.createElement('script');
    tag.src='https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  },[]);

  // Create player ONCE on mount (div is always in DOM, just hidden)
  useEffect(function(){
    if(!videoId||!divRef.current)return;
    var destroyed=false;
    function startPoll(){
      if(pollRef.current)clearInterval(pollRef.current);
      pollRef.current=setInterval(function(){
        try{
          var p=playerRef.current;
          if(!p||!p.getPlayerState)return;
          var state=p.getPlayerState();
          setPlaying(state===1);
          if(end&&state===1&&p.getCurrentTime()>=end){p.pauseVideo();setExpanded(false);}
        }catch(e){}
      },200);
    }
    function create(){
      if(destroyed||!divRef.current)return;
      try{
        playerRef.current=new window.YT.Player(divRef.current,{
          videoId:videoId,
          playerVars:{start:start,autoplay:0,rel:0,modestbranding:1,playsinline:1},
          events:{
            onReady:function(){setReady(true);startPoll();},
            onStateChange:function(e){setPlaying(e.data===1);if(e.data===1)startPoll();}
          }
        });
      }catch(err){}
    }
    if(window.YT&&window.YT.Player){create();}
    else{
      var prev=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=function(){if(prev)prev();if(!destroyed)create();};
    }
    return function(){
      destroyed=true;
      if(pollRef.current){clearInterval(pollRef.current);pollRef.current=null;}
      try{if(playerRef.current){playerRef.current.destroy();playerRef.current=null;}}catch(e){}
    };
  },[videoId]);

  // When expanded: seek to start and play. When collapsed: pause.
  useEffect(function(){
    var p=playerRef.current;
    if(!p||!ready)return;
    try{
      if(expanded){p.seekTo(start,true);p.playVideo();}
      else{p.pauseVideo();}
    }catch(e){}
  },[expanded,ready]);

  // Collapse when notation preview starts
  useEffect(function(){
    return previewSubscribe(function(id){
      if(id!==null)setExpanded(false);
    });
  },[]);
  // Collapse when another YTCardBtn opens or navigation happens
  useEffect(function(){
    return ytCardSubscribe(function(){setExpanded(false);});
  },[]);

  if(!videoId)return null;

  function toggleExpand(e){
    e.stopPropagation();
    if(!expanded){previewStop();ytCardCollapseAll();}
    setExpanded(function(v){return !v;});
  }

  return React.createElement('div',{
    onClick:function(e){e.stopPropagation();},
    style:{marginTop:expanded?10:0,transition:'margin 0.2s'}},
    // Player container — always in DOM so YT player persists, hidden when collapsed
    React.createElement('div',{style:{
      borderRadius:10,overflow:'hidden',
      border:expanded?'1px solid rgba(239,68,68,0.3)':'none',
      marginBottom:expanded?8:0,
      position:'relative',
      paddingBottom:expanded?'30%':'0',
      height:expanded?undefined:0,
      transition:'padding-bottom 0.2s, margin-bottom 0.2s'}},
      React.createElement('div',{ref:divRef,style:{position:'absolute',top:0,left:0,width:'100%',height:'100%'}})),
    // Pill button
    React.createElement('button',{
      onClick:toggleExpand,
      title:expanded?'Close original':'Show original recording',
      style:{
        display:'flex',alignItems:'center',gap:4,
        padding:'4px 9px',borderRadius:8,
        border:'1.5px solid '+(expanded||playing?'#EF444480':'rgba(239,68,68,0.25)'),
        background:expanded||playing?'rgba(239,68,68,0.12)':'transparent',
        cursor:'pointer',transition:'all 0.15s',flexShrink:0,
      }},
      expanded
        ?React.createElement('div',{style:{display:'flex',gap:2,flexShrink:0}},
            React.createElement('div',{style:{width:2.5,height:9,background:'#EF4444',borderRadius:1}}),
            React.createElement('div',{style:{width:2.5,height:9,background:'#EF4444',borderRadius:1}}))
        :React.createElement('div',{style:{width:0,height:0,borderTop:'5px solid transparent',borderBottom:'5px solid transparent',borderLeft:'8px solid #EF4444',marginLeft:1,flexShrink:0}}),
      React.createElement('span',{style:{
        fontSize:9,fontWeight:700,letterSpacing:0.5,
        fontFamily:"'JetBrains Mono',monospace",
        color:'#EF4444',whiteSpace:'nowrap',
      }},expanded?'CLOSE':'ORIG')),
    // Watch on YouTube — required by YouTube ToS, only shown when player is open
    expanded&&React.createElement('a',{
      href:'https://www.youtube.com/watch?v='+videoId+(start?'&t='+Math.floor(start):''),
      target:'_blank',
      rel:'noopener noreferrer',
      onClick:function(e){e.stopPropagation();},
      style:{
        display:'flex',alignItems:'center',gap:5,
        marginTop:6,padding:'5px 8px',borderRadius:7,
        background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.07)',
        textDecoration:'none',
        color:'rgba(255,255,255,0.45)',
        fontSize:10,fontFamily:"'Inter',sans-serif",
        transition:'color 0.15s',
        flexShrink:0,
      }},
      // YouTube wordmark SVG (official red logo)
      React.createElement('svg',{width:14,height:10,viewBox:'0 0 90 63',fill:'none'},
        React.createElement('path',{d:'M88.07 9.86A11.3 11.3 0 0 0 80.15 1.9C73.12 0 45 0 45 0S16.88 0 9.85 1.9A11.3 11.3 0 0 0 1.93 9.86C0 16.9 0 31.5 0 31.5s0 14.6 1.93 21.64a11.3 11.3 0 0 0 7.92 7.96C16.88 63 45 63 45 63s28.12 0 35.15-1.9a11.3 11.3 0 0 0 7.92-7.96C90 46.1 90 31.5 90 31.5s0-14.6-1.93-21.64z',fill:'#FF0000'}),
        React.createElement('path',{d:'M36 45L59.4 31.5 36 18v27z',fill:'#ffffff'})),
      React.createElement('span',null,'Watch on YouTube'),
      React.createElement('span',{style:{fontSize:11,opacity:0.6}},'↗')));
}

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
// ── SCALE POPUP COMPONENT ──
function ScalePopup({data,th,isStudio,onClose}){
  var t=th;var notRef=useRef(null);var audioCtxRef=useRef(null);var playingRef=useRef(false);var timerRef=useRef(null);var mountedRef=useRef(true);
  var[playIdx,setPlayIdx]=useState(-1);
  var[tappedIdx,setTappedIdx]=useState(-1);var tapTimerRef=useRef(null);
  var scaleToneSet=useMemo(function(){return new Set(data.intervals);},[data]);
  useEffect(function(){mountedRef.current=true;return function(){mountedRef.current=false;playingRef.current=false;if(timerRef.current)clearTimeout(timerRef.current);if(tapTimerRef.current)clearTimeout(tapTimerRef.current);};},[]);
  var getAudioCtx=function(){if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();return audioCtxRef.current;};
  var playMidi=function(midi,dur){try{var ctx=getAudioCtx();if(ctx.state==="suspended")ctx.resume();var osc=ctx.createOscillator();var gain=ctx.createGain();osc.type="triangle";osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(0.3,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+(dur||0.5));osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+(dur||0.5));}catch(e){}};
  var tapNote=function(ni){
    if(data.midis&&data.midis[ni])playMidi(data.midis[ni],0.5);
    setTappedIdx(ni);if(tapTimerRef.current)clearTimeout(tapTimerRef.current);
    tapTimerRef.current=setTimeout(function(){if(mountedRef.current)setTappedIdx(-1);},600);
  };
  var playScale=function(){if(playingRef.current||!data.midis)return;playingRef.current=true;var midis=data.midis;var i=0;
    var step=function(){if(!mountedRef.current||i>=midis.length){playingRef.current=false;if(mountedRef.current)setPlayIdx(-1);return;}if(mountedRef.current)setPlayIdx(i);playMidi(midis[i],0.4);i++;timerRef.current=setTimeout(step,450);};step();};
  useEffect(function(){
    if(!notRef.current||!data||!data.abc||!window.ABCJS)return;
    try{
      notRef.current.innerHTML="";
      window.ABCJS.renderAbc(notRef.current,data.abc,{paddingtop:4,paddingbottom:2,paddingleft:0,paddingright:0,add_classes:true,responsive:"resize",staffwidth:320,stretchlast:false});
      var svg=notRef.current.querySelector("svg");
      if(svg){
        svg.style.maxWidth="100%";svg.style.overflow="visible";
        var stCol=isStudio?"#F2F2FA":"#1A1A1A";
        svg.querySelectorAll("path").forEach(function(p){p.setAttribute("fill",stCol);p.setAttribute("stroke",stCol);});
        svg.querySelectorAll(".abcjs-staff path").forEach(function(p){p.setAttribute("stroke",t.staffStroke);p.setAttribute("fill","none");p.setAttribute("stroke-width","0.4");});
        svg.querySelectorAll(".abcjs-staff-extra path").forEach(function(p){p.setAttribute("stroke",isStudio?t.staffStroke:t.muted);p.setAttribute("fill",isStudio?t.staffStroke:t.muted);p.setAttribute("stroke-width","0.5");});
        svg.querySelectorAll(".abcjs-bar path").forEach(function(p){p.setAttribute("stroke",t.barStroke);p.setAttribute("stroke-width","0.6");});
        var ct=parseChordName(data.chord);
        var noteEls=svg.querySelectorAll(".abcjs-note");
        noteEls.forEach(function(noteEl,ni){
          var iv=ni<data.intervals.length?data.intervals[ni]:(ni===data.intervals.length?0:-1);
          if(iv<0)return;
          var type=ct?classifyInterval(iv,ct,scaleToneSet):"unknown";
          var col=getTheoryColor(type,isStudio);
          noteEl._scaleCol=col;// store for highlight restore
          noteEl.querySelectorAll("path,circle,ellipse").forEach(function(p){p.setAttribute("fill",col);p.setAttribute("stroke",col);});
          noteEl.style.cursor="pointer";
          noteEl.addEventListener("click",function(e){e.stopPropagation();tapNote(ni);});
        });
      }
    }catch(e){console.warn("ScalePopup render:",e);}
  },[data]);
  // Highlight playing note
  useEffect(function(){
    if(!notRef.current)return;var svg=notRef.current.querySelector("svg");if(!svg)return;
    var noteEls=svg.querySelectorAll(".abcjs-note");
    // Remove old ripple elements
    svg.querySelectorAll(".scale-ripple").forEach(function(el){el.remove();});
    var activeIdx=tappedIdx>=0?tappedIdx:playIdx;
    noteEls.forEach(function(el,i){
      var isActive=i===activeIdx;
      el.style.opacity=activeIdx>=0?(isActive?"1":"0.3"):"1";
      el.style.transition="opacity 0.15s";
      el.style.filter=isActive?"drop-shadow(0 0 8px "+t.accent+"90)":"none";
      // Color: active gets accent, others restore theory color
      var restoreCol=el._scaleCol||t.noteStroke;
      el.querySelectorAll("path,circle,ellipse").forEach(function(p){p.setAttribute("fill",isActive?t.accent:restoreCol);p.setAttribute("stroke",isActive?t.accent:restoreCol);});
      // Add ripple + pulse on tapped note
      if(isActive&&tappedIdx>=0){
        try{
          var bb=el.getBBox();var cx=bb.x+bb.width/2;var cy=bb.y+bb.height/2;var r=Math.max(bb.width,bb.height)*0.7;
          // Expanding ring
          var ring=document.createElementNS("http://www.w3.org/2000/svg","circle");
          ring.setAttribute("class","scale-ripple");
          ring.setAttribute("cx",cx);ring.setAttribute("cy",cy);ring.setAttribute("r",r);
          ring.setAttribute("fill","none");ring.setAttribute("stroke",t.accent);ring.setAttribute("stroke-width","2");
          ring.style.opacity="0.7";
          ring.style.animation="scaleRing 0.5s ease-out forwards";
          svg.appendChild(ring);
          // Left sound wave arc
          var r1=document.createElementNS("http://www.w3.org/2000/svg","path");
          r1.setAttribute("class","scale-ripple");
          var wOff=bb.width/2+6;
          r1.setAttribute("d","M "+(cx-wOff)+" "+(cy-8)+" Q "+(cx-wOff-10)+" "+cy+" "+(cx-wOff)+" "+(cy+8));
          r1.setAttribute("fill","none");r1.setAttribute("stroke",t.accent);r1.setAttribute("stroke-width","2");r1.setAttribute("stroke-linecap","round");
          r1.style.opacity="0.8";r1.style.animation="scaleWave 0.45s ease-out forwards";
          svg.appendChild(r1);
          // Outer left wave
          var r1b=document.createElementNS("http://www.w3.org/2000/svg","path");
          r1b.setAttribute("class","scale-ripple");
          r1b.setAttribute("d","M "+(cx-wOff-5)+" "+(cy-12)+" Q "+(cx-wOff-18)+" "+cy+" "+(cx-wOff-5)+" "+(cy+12));
          r1b.setAttribute("fill","none");r1b.setAttribute("stroke",t.accent);r1b.setAttribute("stroke-width","1.5");r1b.setAttribute("stroke-linecap","round");
          r1b.style.opacity="0.5";r1b.style.animation="scaleWave 0.5s 0.05s ease-out forwards";
          svg.appendChild(r1b);
          // Right sound wave arc
          var r2=document.createElementNS("http://www.w3.org/2000/svg","path");
          r2.setAttribute("class","scale-ripple");
          r2.setAttribute("d","M "+(cx+wOff)+" "+(cy-8)+" Q "+(cx+wOff+10)+" "+cy+" "+(cx+wOff)+" "+(cy+8));
          r2.setAttribute("fill","none");r2.setAttribute("stroke",t.accent);r2.setAttribute("stroke-width","2");r2.setAttribute("stroke-linecap","round");
          r2.style.opacity="0.8";r2.style.animation="scaleWave 0.45s ease-out forwards";
          svg.appendChild(r2);
          // Outer right wave
          var r2b=document.createElementNS("http://www.w3.org/2000/svg","path");
          r2b.setAttribute("class","scale-ripple");
          r2b.setAttribute("d","M "+(cx+wOff+5)+" "+(cy-12)+" Q "+(cx+wOff+18)+" "+cy+" "+(cx+wOff+5)+" "+(cy+12));
          r2b.setAttribute("fill","none");r2b.setAttribute("stroke",t.accent);r2b.setAttribute("stroke-width","1.5");r2b.setAttribute("stroke-linecap","round");
          r2b.style.opacity="0.5";r2b.style.animation="scaleWave 0.5s 0.05s ease-out forwards";
          svg.appendChild(r2b);
        }catch(e){}
      }
    });
  },[playIdx,tappedIdx]);

  var ct=parseChordName(data.chord);
  return React.createElement("div",{onClick:onClose,style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:10000,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
    React.createElement("style",null,"@keyframes scaleRing{0%{opacity:0.6;stroke-width:3}50%{opacity:0.3}100%{opacity:0;stroke-width:0.3}}@keyframes scaleWave{0%{opacity:0;stroke-width:0}15%{opacity:0.9;stroke-width:2.5}100%{opacity:0;stroke-width:0.5}}@keyframes scalePulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}"),
    React.createElement("div",{onClick:function(e){e.stopPropagation();},style:{background:isStudio?t.cardRaised||t.card:t.card,borderRadius:18,padding:"22px 20px 18px",maxWidth:400,width:"100%",border:"1px solid "+(isStudio?t.accent+"25":t.border),boxShadow:isStudio?"0 20px 60px rgba(0,0,0,0.5)":"0 20px 60px rgba(0,0,0,0.15)"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}},
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:18,fontWeight:700,color:t.chordFill,fontFamily:"'JetBrains Mono',monospace"}},data.chord),
          React.createElement("div",{style:{fontSize:13,fontWeight:500,color:t.text,fontFamily:"'Inter',sans-serif",marginTop:2,opacity:0.8}},data.name)),
        React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center"}},
          data.midis&&React.createElement("button",{onClick:function(e){e.stopPropagation();playScale();},style:{width:34,height:34,borderRadius:10,background:t.accent+"15",border:"1.5px solid "+t.accent+"40",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}},
            React.createElement("div",{style:{width:0,height:0,borderTop:"7px solid transparent",borderBottom:"7px solid transparent",borderLeft:"11px solid "+t.accent,marginLeft:2}})),
          React.createElement("button",{onClick:onClose,style:{width:34,height:34,borderRadius:10,border:"1px solid "+t.border,background:t.filterBg||t.card,color:t.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},"\u2715"))),
      React.createElement("div",{ref:notRef,style:{margin:"0 -4px",minHeight:50,overflow:"visible"}}),
      React.createElement("div",{style:{display:"flex",justifyContent:"center",gap:2,marginTop:6}},
        data.notes.concat([data.notes[0]]).map(function(note,ni){
          var iv=ni<data.intervals.length?data.intervals[ni]:0;
          var ivLabel=getIntervalLabel(iv,ct);
          var type=ct?classifyInterval(iv,ct,scaleToneSet):"unknown";
          var col=getTheoryColor(type,isStudio);
          var isRoot=iv===0;
          var isActive=playIdx===ni;
          var isTapped=tappedIdx===ni;
          return React.createElement("div",{key:ni,onClick:function(e){e.stopPropagation();tapNote(ni);},style:{display:"flex",flexDirection:"column",alignItems:"center",flex:1,padding:"4px 0",cursor:"pointer",opacity:(playIdx>=0||tappedIdx>=0)?((isActive||isTapped)?1:0.4):1,transition:"all 0.15s",borderRadius:6,background:(isActive||isTapped)?col+"20":"transparent",boxShadow:isTapped?"0 0 12px "+col+"50":"none",animation:isTapped?"scalePulse 0.3s ease-out":"none"}},
            React.createElement("span",{style:{fontSize:12,fontWeight:isRoot?800:600,color:isRoot?t.chordFill:t.text,fontFamily:"'JetBrains Mono',monospace"}},note),
            React.createElement("span",{style:{fontSize:9,fontWeight:600,color:col,fontFamily:"'JetBrains Mono',monospace"}},ivLabel));}))));
}

// ── TEMPO POPUP ──
function TempoPopup({bpm,onBpmChange,onClose,th,lickTempo,playerCtrlRef,ci,setCi}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var pc=function(){return playerCtrlRef&&playerCtrlRef.current||{};};
  var[tapTimes,setTapTimes]=useState([]);var[tapBpm,setTapBpm]=useState(null);
  var setBpm=function(v){var nv=Math.max(30,Math.min(320,typeof v==="function"?v(bpm):v));onBpmChange(nv);var c=pc();if(c.metroCtrlRef&&c.metroCtrlRef.current&&c.metroCtrlRef.current.setBpmLive)c.metroCtrlRef.current.setBpmLive(nv);};
  var handleTap=function(){var now=Date.now();setTapTimes(function(prev){var up=prev.concat(now).slice(-8);if(up.length>=2){var ivs=[];for(var i=1;i<up.length;i++)ivs.push(up[i]-up[i-1]);var avg=ivs.reduce(function(a,b){return a+b;},0)/ivs.length;var b=Math.round(60000/avg);if(b>=30&&b<=320){setTapBpm(b);setBpm(b);}}return up;});};
  var mc=function(){var c=pc();return c.metroCtrlRef&&c.metroCtrlRef.current||{};};
  var[mSound,setMSound]=useState(function(){var m=mc();return m.getSound?m.getSound():"click";});
  var doSetSound=function(v){setMSound(v);var m=mc();if(m.setSound)m.setSound(v);};
  var[progOn,setProgOn]=useState(function(){var m=mc();var s=m.getProgState?m.getProgState():{};return s.on||false;});
  var[progTarget,setProgTarget]=useState(function(){var m=mc();var s=m.getProgState?m.getProgState():{};return s.target||180;});
  var[progStep,setProgStep]=useState(function(){var m=mc();var s=m.getProgState?m.getProgState():{};return s.inc||5;});
  var[progLoops,setProgLoops]=useState(function(){var m=mc();var s=m.getProgState?m.getProgState():{};return s.bars||1;});
  // Sync changes to MiniMetronome
  var syncProg=function(on,target,inc,bars){
    var m=mc();
    if(m.setProgOn)m.setProgOn(on);
    if(m.setProgTarget)m.setProgTarget(target);
    if(m.setProgInc)m.setProgInc(inc);
    if(m.setProgBars)m.setProgBars(bars);
  };
  var doSetProgOn=function(v){setProgOn(v);syncProg(v,progTarget,progStep,progLoops);
    // Progressive needs loop — auto-enable when turning on
    if(v){var c=pc();if(c.setLooping)c.setLooping(true);}
  };
  var doSetProgTarget=function(v){setProgTarget(v);syncProg(progOn,v,progStep,progLoops);};
  var doSetProgStep=function(v){setProgStep(v);syncProg(progOn,progTarget,v,progLoops);};
  var doSetProgLoops=function(v){setProgLoops(v);syncProg(progOn,progTarget,progStep,v);};
  var chip=function(active,label,fn){return React.createElement("button",{onClick:function(e){e.stopPropagation();fn();},style:{flex:1,padding:"10px 6px",borderRadius:10,background:active?t.accent+"15":(isStudio?"#16162A":t.filterBg),border:"1.5px solid "+(active?t.accent+"40":t.border),color:active?t.accent:t.muted,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}},label);};
  return React.createElement("div",{style:{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}},
    React.createElement("div",{onClick:onClose,style:{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)"}}),
    React.createElement("div",{style:{position:"relative",width:"100%",maxWidth:440,background:t.card,borderRadius:"24px 24px 0 0",padding:"0 20px 32px",maxHeight:"82vh",overflowY:"auto",animation:"popupSlide 0.3s cubic-bezier(0.32,0.72,0,1)"}},
      React.createElement("style",null,"@keyframes popupSlide{from{transform:translateY(100%)}to{transform:translateY(0)}}"),
      React.createElement("div",{style:{display:"flex",justifyContent:"center",padding:"12px 0 6px"}},React.createElement("div",{style:{width:40,height:4,borderRadius:2,background:t.subtle,opacity:0.5}})),
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}},
        React.createElement("span",{style:{fontSize:11,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:2}},"TEMPO & METRONOME"),
        React.createElement("button",{onClick:onClose,style:{width:32,height:32,borderRadius:10,background:isStudio?"#16162A":t.filterBg,border:"1px solid "+t.border,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:t.muted,fontSize:16}},"\u2715")),
      React.createElement("div",{style:{textAlign:"center",marginBottom:24}},
        React.createElement("div",{style:{fontSize:56,fontWeight:800,color:t.text,fontFamily:"'JetBrains Mono',monospace",letterSpacing:-3,lineHeight:1}},bpm),
        React.createElement("div",{style:{fontSize:11,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginTop:4}},"BPM")),
      React.createElement("div",{style:{marginBottom:20,padding:"0 4px"}},
        React.createElement("input",{type:"range",min:30,max:320,value:bpm,onChange:function(e){setBpm(parseInt(e.target.value));},style:{width:"100%",accentColor:t.accent,height:6}}),
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginTop:8}},
          [60,80,100,120,140,160,200].map(function(v){return React.createElement("button",{key:v,onClick:function(){setBpm(v);},style:{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:bpm===v?t.accent:t.subtle,background:bpm===v?t.accentBg:"transparent",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontWeight:bpm===v?700:400}},v);}))),
      React.createElement("div",{style:{display:"flex",gap:8,marginBottom:20}},
        [-5,-1,1,5].map(function(d){return React.createElement("button",{key:d,onClick:function(){setBpm(bpm+d);},style:{flex:1,padding:"12px",borderRadius:12,background:isStudio?"#16162A":t.filterBg,border:"1px solid "+t.border,color:t.text,fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}},(d>0?"+":"")+d);})),
      React.createElement("button",{onClick:handleTap,style:{width:"100%",padding:"16px",borderRadius:14,background:t.accent+"12",border:"2px solid "+t.accent+"40",color:t.accent,fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8}},"TAP TEMPO",tapBpm&&React.createElement("span",{style:{fontSize:11,background:t.accentBg,padding:"2px 8px",borderRadius:6,fontFamily:"'JetBrains Mono',monospace"}},tapBpm)),
      React.createElement("div",{style:{marginBottom:20}},
        React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:1,marginBottom:8}},"CLICK SOUND"),
        React.createElement("div",{style:{display:"flex",gap:6}},
          [{id:"click",label:"Click"},{id:"wood",label:"Wood"},{id:"cowbell",label:"Bell"},{id:"silent",label:"Silent"}].map(function(s){return chip(mSound===s.id,s.label,function(){doSetSound(s.id);});}))),
      // Count-in toggle
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,padding:"12px 14px",background:isStudio?"#16162A":t.filterBg,borderRadius:12,border:"1px solid "+t.border}},
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:1}},"COUNT-IN"),
          React.createElement("div",{style:{fontSize:11,color:t.muted,marginTop:2,fontFamily:"'Inter',sans-serif"}},"Click beats before lick starts")),
        ci!==undefined&&React.createElement("button",{onClick:function(){if(setCi){var c=playerCtrlRef&&playerCtrlRef.current||{};if(c.setCi)c.setCi(!ci);setCi(!ci);}},style:{padding:"6px 14px",borderRadius:8,background:ci?t.accentBg:"transparent",border:"1.5px solid "+(ci?t.accent+"40":t.border),color:ci?t.accent:t.subtle,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}},ci?"ON":"OFF")),
      React.createElement("div",{style:{background:isStudio?"#16162A":t.filterBg,borderRadius:14,padding:16,border:"1px solid "+(progOn?"#3B82F630":t.border)}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:progOn?14:0}},
          React.createElement("div",null,
            React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:1}},"PROGRESSIVE TEMPO"),
            React.createElement("div",{style:{fontSize:11,color:t.muted,marginTop:2,fontFamily:"'Inter',sans-serif"}},"Auto-increase after each loop")),
          React.createElement("button",{onClick:function(){doSetProgOn(!progOn);},style:{padding:"6px 14px",borderRadius:8,background:progOn?"#3B82F618":"transparent",border:"1.5px solid "+(progOn?"#3B82F640":t.border),color:progOn?"#3B82F6":t.subtle,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}},progOn?"ON":"OFF")),
        progOn&&React.createElement("div",{style:{display:"flex",gap:12,flexWrap:"wrap"}},
          React.createElement("div",{style:{flex:1,minWidth:80}},
            React.createElement("div",{style:{fontSize:9,color:"#3B82F6",fontFamily:"'JetBrains Mono',monospace",marginBottom:6}},"TARGET BPM"),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
              React.createElement("button",{onClick:function(){doSetProgTarget(Math.max(bpm+5,progTarget-10));},style:{width:28,height:28,borderRadius:8,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
              React.createElement("span",{style:{fontSize:18,fontWeight:700,color:"#3B82F6",fontFamily:"'JetBrains Mono',monospace",minWidth:40,textAlign:"center"}},progTarget),
              React.createElement("button",{onClick:function(){doSetProgTarget(Math.min(320,progTarget+10));},style:{width:28,height:28,borderRadius:8,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+")),
          React.createElement("div",{style:{minWidth:70}},
            React.createElement("div",{style:{fontSize:9,color:"#3B82F6",fontFamily:"'JetBrains Mono',monospace",marginBottom:6}},"STEP"),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
              [2,5,10].map(function(s){return React.createElement("button",{key:s,onClick:function(){doSetProgStep(s);},style:{padding:"6px 10px",borderRadius:8,background:progStep===s?"#3B82F618":t.card,border:"1.5px solid "+(progStep===s?"#3B82F640":t.border),color:progStep===s?"#3B82F6":t.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}},"+"+s);}))),
          React.createElement("div",{style:{width:"100%",marginTop:4}},
            React.createElement("div",{style:{fontSize:9,color:"#3B82F6",fontFamily:"'JetBrains Mono',monospace",marginBottom:6}},"INCREASE EVERY"),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
              [1,2,4].map(function(n){return React.createElement("button",{key:n,onClick:function(){doSetProgLoops(n);},style:{padding:"6px 12px",borderRadius:8,background:progLoops===n?"#3B82F618":t.card,border:"1.5px solid "+(progLoops===n?"#3B82F640":t.border),color:progLoops===n?"#3B82F6":t.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}},n===1?"1 loop":n+" loops");}))))))));}
// ── DRAWER CONSTANTS ──
// ============================================================
// EDIT PROFILE VIEW — full-screen overlay
// ============================================================
function EditProfileView({authUser,authProfile,onClose,onSave,th}){
  const t=th||TH.studio;const isStudio=t===TH.studio;
  const[displayName,setDisplayName]=useState(authProfile?.display_name||"");
  const[username,setUsername]=useState(authProfile?.username||"");
  const[bio,setBio]=useState(authProfile?.bio||"");
  const[instrument,setInstrument]=useState(authProfile?.instrument||"");
  const[websiteUrl,setWebsiteUrl]=useState(authProfile?.website_url||"");
  const[isPublic,setIsPublic]=useState(authProfile?.is_public!==false);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[errs,setErrs]=useState({});
  const[avatarUrl,setAvatarUrl]=useState(authProfile?.avatar_url||null);
  const[avatarUploading,setAvatarUploading]=useState(false);
  const[avatarErr,setAvatarErr]=useState(null);
  const fileInputRef=useRef(null);

  const handleAvatarClick=function(){fileInputRef.current&&fileInputRef.current.click();};
  const handleAvatarChange=async function(e){
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    if(file.size>3*1024*1024){setAvatarErr("Max. 3 MB");return;}
    if(!file.type.startsWith("image/")){setAvatarErr("Images only");return;}
    setAvatarErr(null);setAvatarUploading(true);
    try{
      const ext=file.name.split(".").pop().toLowerCase()||"jpg";
      const path=authUser.id+"/avatar."+ext;
      // upsert=true replaces existing file
      const{error:upErr}=await supabase.storage.from("avatars").upload(path,file,{upsert:true,contentType:file.type});
      if(upErr)throw upErr;
      const{data:urlData}=supabase.storage.from("avatars").getPublicUrl(path);
      // append cache-buster so the browser shows the new image
      const newUrl=urlData.publicUrl+"?t="+Date.now();
      setAvatarUrl(newUrl);
    }catch(err){
      setAvatarErr("Upload failed — check storage bucket permissions");
    }finally{setAvatarUploading(false);}
    // reset input so the same file can be re-selected if needed
    e.target.value="";
  };

  const inputStyle={width:"100%",background:t.inputBg||t.filterBg,border:"1px solid "+(t.inputBorder||t.border),borderRadius:10,padding:"11px 14px",color:t.text,fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"};
  const fl=(txt,sub)=>React.createElement("div",{style:{marginBottom:6}},
    React.createElement("div",{style:{fontSize:10,fontWeight:600,color:t.muted,fontFamily:"'Inter',sans-serif",letterSpacing:0.5,textTransform:"uppercase"}},txt),
    sub&&React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",marginTop:1}},sub));
  const errMsg=(key)=>errs[key]&&React.createElement("div",{style:{fontSize:11,color:"#FF6666",fontFamily:"'Inter',sans-serif",marginTop:4}},errs[key]);

  const validate=()=>{
    var ev={};
    if(!displayName.trim())ev.displayName="Name cannot be empty";
    if(username.trim()&&!/^[a-z0-9_]{3,15}$/.test(username.trim()))ev.username="Lowercase letters, numbers and _ only · 3–15 characters";
    if(username.trim()&&username.trim().toLowerCase().includes("etudy"))ev.username="This handle is reserved";
    if(bio.length>160)ev.bio="Max. 160 characters";
    if(websiteUrl.trim()&&!/^https?:\/\/.+/.test(websiteUrl.trim()))ev.websiteUrl="URL must start with http:// or https://";
    return ev;
  };

  const handleSave=async()=>{
    var ev=validate();if(Object.keys(ev).length){setErrs(ev);return;}
    setSaving(true);setErrs({});
    try{
      await onSave({display_name:displayName.trim(),username:username.trim()||null,bio:bio.trim(),instrument:instrument||authProfile?.instrument||"",website_url:websiteUrl.trim()||null,is_public:isPublic,avatar_url:avatarUrl||null});
      setSaved(true);
      setTimeout(function(){onClose();},700);
    }catch(err){
      setErrs({general:"Save failed. Please try again."});
      setSaving(false);
    }
  };

  const instC=instrument?(INST_COL[instrument]||t.accent):t.accent;
  const initials=(displayName||authUser?.email||"?").slice(0,2).toUpperCase();

  return React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1200,background:t.bg,display:"flex",flexDirection:"column",animation:"fadeIn 0.18s ease"}},

    // HEADER
    React.createElement("div",{style:{position:"sticky",top:0,zIndex:10,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:"1px solid "+t.border,paddingTop:"calc(env(safe-area-inset-top, 0px) + 12px)"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}},
        React.createElement("button",{onClick:onClose,style:{background:"none",border:"none",cursor:"pointer",color:isStudio?t.accent:t.muted,fontSize:22,padding:"4px 8px 4px 0",display:"flex",alignItems:"center"}},"‹"),
        React.createElement("div",{style:{flex:1,fontSize:16,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"}},"Edit Profile"),
        React.createElement("button",{onClick:handleSave,disabled:saving||saved,style:{padding:"8px 18px",borderRadius:10,border:"none",background:saved?t.accent+"80":t.accent,color:isStudio?"#08080F":"#fff",fontSize:13,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:saving||saved?"default":"pointer",opacity:saving?0.7:1,transition:"all 0.2s"}},saved?"✓ Saved":saving?"Saving…":"Save"))),

    // BODY
    React.createElement("div",{style:{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"20px 16px 120px"}},

        // AVATAR UPLOAD
        React.createElement("div",{style:{display:"flex",justifyContent:"center",marginBottom:28}},
          React.createElement("div",{style:{position:"relative",display:"inline-block"}},
            // Circle
            React.createElement("div",{
              onClick:handleAvatarClick,
              style:{
                width:88,height:88,borderRadius:26,
                background:avatarUrl?"transparent":(isStudio?"linear-gradient(135deg,"+instC+"22,"+instC+"08)":t.accentBg),
                border:"2px solid "+(avatarUploading?t.accent:instC+"50"),
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:isStudio?"0 0 30px "+instC+"20":"none",
                cursor:"pointer",overflow:"hidden",position:"relative",
                transition:"border-color 0.2s"
              }
            },
              avatarUrl&&React.createElement("img",{src:avatarUrl,alt:"avatar",style:{width:"100%",height:"100%",objectFit:"cover"}}),
              !avatarUrl&&React.createElement("span",{style:{fontSize:30,fontWeight:700,color:instC,fontFamily:"'Inter',sans-serif",letterSpacing:-0.5}},initials),
              // Overlay on hover
              React.createElement("div",{style:{
                position:"absolute",inset:0,
                background:"rgba(0,0,0,0.45)",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                opacity:avatarUploading?1:0,transition:"opacity 0.18s",
                borderRadius:24,
                pointerEvents:"none"
              }},
                avatarUploading
                  ?React.createElement("div",{style:{width:20,height:20,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}})
                  :null)),
            // Camera badge
            React.createElement("div",{
              onClick:handleAvatarClick,
              style:{
                position:"absolute",bottom:-4,right:-4,
                width:26,height:26,borderRadius:8,
                background:isStudio?t.accent:"#6366F1",
                border:"2px solid "+t.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",fontSize:12
              }
            },"📷"),
            // Hidden file input
            React.createElement("input",{
              ref:fileInputRef,type:"file",accept:"image/*",
              onChange:handleAvatarChange,
              style:{display:"none"}
            })),
          avatarErr&&React.createElement("div",{style:{
            fontSize:11,color:"#FF6666",fontFamily:"'Inter',sans-serif",
            marginTop:8,textAlign:"center"
          }},avatarErr)),

        // ERROR GENERAL
        errs.general&&React.createElement("div",{style:{background:"#FF444420",border:"1px solid #FF444440",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#FF6666",fontFamily:"'Inter',sans-serif"}},errs.general),

        // DISPLAY NAME
        React.createElement("div",{style:{marginBottom:18}},
          fl("Name","Shown publicly"),
          React.createElement("input",{type:"text",value:displayName,onChange:function(ev){setDisplayName(ev.target.value);},placeholder:"Your name",style:{...inputStyle,borderColor:errs.displayName?"#FF4444":(t.inputBorder||t.border)}}),
          errMsg("displayName")),

        // USERNAME
        React.createElement("div",{style:{marginBottom:18}},
          fl("Username","Your @handle in the feed · lowercase letters, numbers, _"),
          React.createElement("div",{style:{position:"relative"}},
            React.createElement("span",{style:{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:t.subtle,fontSize:14,fontFamily:"'Inter',sans-serif",pointerEvents:"none"}},"@"),
            React.createElement("input",{type:"text",value:username,onChange:function(ev){setUsername(ev.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""));},placeholder:"yourhandle",style:{...inputStyle,paddingLeft:26,borderColor:errs.username?"#FF4444":(t.inputBorder||t.border)}})),
          errMsg("username")),

        // BIO
        React.createElement("div",{style:{marginBottom:18}},
          fl("Bio","Max. 160 characters"),
          React.createElement("textarea",{value:bio,onChange:function(ev){setBio(ev.target.value);},placeholder:"I play tenor sax and love bebop…",rows:3,style:{...inputStyle,resize:"none",lineHeight:1.6,borderColor:errs.bio?"#FF4444":(t.inputBorder||t.border)}}),
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginTop:4}},
            errMsg("bio"),
            React.createElement("div",{style:{fontSize:10,color:bio.length>140?bio.length>160?"#FF6666":"#F59E0B":t.subtle,fontFamily:"'JetBrains Mono',monospace",marginLeft:"auto"}},bio.length+"/160"))),

        // INSTRUMENT
        React.createElement("div",{style:{marginBottom:18}},
          fl("Instrument"),
          React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
            ["Alto Sax","Soprano Sax","Tenor Sax","Baritone Sax","Trumpet","Piano","Guitar","Bass","Trombone","Flute","Clarinet","Vibes","Violin","Vocals"].map(function(name){
              var sel=instrument===name;var ic=INST_COL[name]||t.accent;
              return React.createElement("button",{key:name,onClick:function(){setInstrument(sel?"":name);},style:{padding:"7px 12px",borderRadius:10,border:sel?"1.5px solid "+ic:"1.5px solid "+t.border,background:sel?ic+"18":"transparent",color:sel?ic:t.muted,fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:sel?700:400,cursor:"pointer",transition:"all 0.15s"}},name);}))),

        // WEBSITE
        React.createElement("div",{style:{marginBottom:18}},
          fl("Website / Link","Bandcamp, Instagram, your own site — anything goes"),
          React.createElement("input",{type:"url",value:websiteUrl,onChange:function(ev){setWebsiteUrl(ev.target.value);},placeholder:"https://",style:{...inputStyle,borderColor:errs.websiteUrl?"#FF4444":(t.inputBorder||t.border)}}),
          errMsg("websiteUrl")),

        // PUBLIC TOGGLE
        React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,padding:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}},
          React.createElement("div",null,
            React.createElement("div",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:2}},"Public profile"),
            React.createElement("div",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Other musicians can view your profile")),
          React.createElement("button",{onClick:function(){setIsPublic(!isPublic);},style:{width:44,height:26,borderRadius:13,background:isPublic?t.accent:t.filterBg,border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}},
            React.createElement("div",{style:{position:"absolute",top:3,left:isPublic?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}))),

        // EMAIL (read-only)
        React.createElement("div",{style:{marginBottom:8}},
          fl("Email","Cannot be changed"),
          React.createElement("div",{style:{...inputStyle,color:t.subtle,cursor:"default",userSelect:"none",opacity:0.6}},authUser?.email||"—"))
      ))
  );
}

var DRAWER_PEEK=200,DRAWER_HALF=460,DRAWER_FULL_OFF=80;

// ============================================================
// PUBLIC PROFILE VIEW — full-screen overlay
// ============================================================
function PublicProfileView({username,onClose,onLickSelect,th,likedSet,savedSet,onLike,onSave,userInst}){
  const t=th||TH.studio;const isStudio=t===TH.studio;
  const[profile,setProfile]=useState(null);
  const[licks,setLicks]=useState([]);
  const[loading,setLoading]=useState(true);

  useEffect(function(){
    if(!username)return;
    setLoading(true);
    supabase.from('profiles').select('id, display_name, username, instrument, bio, website_url, streak, avatar_url').or('username.eq.'+username+',display_name.eq.'+username).single().then(function(res){
      if(res.data)setProfile(res.data);
      return fetchPublicLicksByUser(username);
    }).then(function(userLicks){
      setLicks(userLicks||[]);
      setLoading(false);
    }).catch(function(){setLoading(false);});
  },[username]);

  const displayName=profile?.display_name||username;
  const initials=displayName.slice(0,2).toUpperCase();
  const instC=profile&&profile.instrument?(INST_COL[profile.instrument]||t.accent):t.accent;
  const totalLikes=licks.reduce(function(s,l){return s+(l.likes||0);},0);

  return React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1100,background:t.bg,display:"flex",flexDirection:"column",animation:"fadeIn 0.18s ease"}},

    // HEADER
    React.createElement("div",{style:{position:"sticky",top:0,zIndex:10,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:"1px solid "+t.border,paddingTop:"calc(env(safe-area-inset-top, 0px) + 12px)"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"12px 16px 12px",display:"flex",alignItems:"center",gap:10}},
        React.createElement("button",{onClick:onClose,style:{background:"none",border:"none",cursor:"pointer",color:isStudio?t.accent:t.muted,fontSize:22,padding:"4px 8px 4px 0",display:"flex",alignItems:"center"}},"\u2039"),
        React.createElement("div",{style:{flex:1}},
          React.createElement("div",{style:{fontSize:11,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}},"Musician"),
          React.createElement("div",{style:{fontSize:16,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"}},displayName),
          profile?.username&&profile.username!==displayName&&React.createElement("div",{style:{fontSize:10,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600}},"@"+profile.username)))),

    // SCROLLABLE BODY
    React.createElement("div",{style:{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"0 16px 100px"}},

        // PROFILE HERO
        React.createElement("div",{style:{margin:"24px 0 20px",padding:"20px",background:t.card,borderRadius:18,border:"1px solid "+t.border,boxShadow:isStudio?"0 4px 24px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",display:"flex",alignItems:"flex-start",gap:16}},
          // Avatar
          React.createElement("div",{style:{width:64,height:64,borderRadius:20,background:isStudio?"linear-gradient(135deg,"+instC+"22,"+instC+"08)":t.accentBg,border:"2px solid "+instC+"50",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:isStudio?"0 0 24px "+instC+"20":"none",overflow:"hidden"}},
            profile?.avatar_url
              ?React.createElement("img",{src:profile.avatar_url,alt:displayName,style:{width:"100%",height:"100%",objectFit:"cover"}})
              :React.createElement("span",{style:{fontSize:22,fontWeight:700,color:instC,fontFamily:"'Inter',sans-serif",letterSpacing:-0.5}},initials)),
          // Info
          React.createElement("div",{style:{flex:1,minWidth:0}},
            React.createElement("div",{style:{fontSize:18,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:2}},displayName),
            profile?.username&&React.createElement("div",{style:{fontSize:11,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600,marginBottom:6}},"@"+profile.username),
            profile&&profile.instrument&&React.createElement("div",{style:{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,color:instC,background:instC+"15",padding:"3px 10px",borderRadius:8,border:"1px solid "+instC+"25",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}},profile.instrument),
            profile&&profile.bio&&React.createElement("div",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5,marginBottom:profile&&profile.website_url?6:0}},profile.bio),
            profile&&profile.website_url&&React.createElement("a",{href:profile.website_url,target:"_blank",rel:"noopener noreferrer",onClick:function(e){e.stopPropagation();},style:{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:t.accent,fontFamily:"'Inter',sans-serif",textDecoration:"none",fontWeight:500}},"🔗 "+profile.website_url.replace(/^https?:\/\//,"")))),

        // STATS ROW
        React.createElement("div",{style:{display:"flex",gap:8,marginBottom:20}},
          [{label:"Licks",value:licks.length,icon:null},{label:"Likes received",value:totalLikes,icon:null},{label:"Day streak",value:profile?(profile.streak||0):"—",icon:"🔥"}].map(function(s,i){
            return React.createElement("div",{key:i,style:{flex:1,background:t.card,borderRadius:12,padding:"12px 10px",border:"1px solid "+t.border,textAlign:"center",boxShadow:isStudio?"0 2px 10px rgba(0,0,0,0.25)":"0 1px 4px rgba(0,0,0,0.04)"}},
              React.createElement("div",{style:{fontSize:20,fontWeight:700,color:t.text,fontFamily:"'JetBrains Mono',monospace"}},(s.icon?s.icon+" ":"")+s.value),
              React.createElement("div",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:3,letterSpacing:0.3,textTransform:"uppercase"}},s.label));
          })),

        // LICKS SECTION HEADER
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",marginBottom:10}},"Published Licks"),

        // LICK LIST
        loading
          ?React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",color:t.subtle,fontSize:12,fontFamily:"'Inter',sans-serif"}},"Loading\u2026")
          :licks.length===0
            ?React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+t.border,padding:"32px 20px",textAlign:"center"}},
              React.createElement("div",{style:{fontSize:28,marginBottom:8}},"🎷"),
              React.createElement("div",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif"}},"No published licks yet"))
            :React.createElement("div",null,
              licks.map(function(lick){
                var cc=getCatColor(lick.category,t);
                return React.createElement("div",{key:lick.id,onClick:function(){onLickSelect(lick);},style:{background:isStudio?(t.cardRaised||t.card):t.card,borderRadius:14,border:"1px solid "+(isStudio?cc+"20":t.border),padding:"14px 16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:isStudio?"0 2px 12px "+cc+"10":"0 1px 6px rgba(0,0,0,0.04)",transition:"all 0.15s"}},
                  isStudio&&React.createElement("div",{style:{width:4,height:40,borderRadius:2,background:cc,flexShrink:0}}),
                  React.createElement("div",{style:{flex:1,minWidth:0}},
                    React.createElement("div",{style:{fontSize:14,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.title),
                    React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}},
                      React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},lick.artist),
                      React.createElement("span",{style:{fontSize:9,color:cc,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,background:cc+"15",padding:"2px 7px",borderRadius:5}},lick.category),
                      React.createElement("span",{style:{fontSize:9,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},"\u2669="+lick.tempo))),
                  React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,flexShrink:0}},
                    isStudio?IC.flame(14,"#F97316",likedSet&&likedSet.has(lick.id)):React.createElement("span",{style:{fontSize:13,color:t.muted}},"\u2661"),
                    React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}},lick.likes||0)));
              }))
      ))
  );
}

function LickDetail({lick,onBack,th,liked,saved,onLike,onSave,showTips,onTipsDone,onReShowTips,defaultInst,onDeletePrivate,onReport,onUserClick}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const[trInst,setTrInst]=useState(defaultInst||"Concert");const[trMan,setTrMan]=useState(0);
  const[pT,sPT]=useState(lick.tempo);
  const[abOn,setAbOn]=useState(false);const[abA,setAbA]=useState(0);const[abB,setAbB]=useState(1);
  const curNoteRef=useRef(-1);const curProgressRef=useRef(-1);const[focus,setFocus]=useState(false);
  const playerCtrlRef=useRef({toggle:null,playing:false});
  const[trOpen,setTrOpen]=useState(false);const[showTempoPopup,setShowTempoPopup]=useState(false);const[showSoundMenu,setShowSoundMenu]=useState(false);
  const initialLikedRef=useRef(liked);
  const lc=(lick.likes||0)+(liked?1:0)-(initialLikedRef.current?1:0);
  const[burst,sBurst]=useState(null);const burstKeyRef=useRef(0);
  const instOff=INST_TRANS[trInst]||0;
  const notationAbc=transposeAbc(lick.abc,instOff+trMan);
  const soundAbc=trMan?transposeAbc(lick.abc,trMan):lick.abc;
  // ── THEORY MODE ──
  const[theoryMode,setTheoryMode]=useState(false);
  const[scalePopup,setScalePopup]=useState(null);
  const theoryAnalysis=useMemo(function(){
    if(!theoryMode)return null;
    return analyzeTheory(notationAbc);
  },[theoryMode,notationAbc]);
  const transposedKey=((instOff+trMan)!==0)?trKeyName(lick.key.split(" ")[0],instOff+trMan)+(lick.key.includes(" ")?lick.key.substring(lick.key.indexOf(" ")):""): lick.key;
  const keyDisplay=transposedKey;
  const catC=getCatColor(lick.category,t);const instC=getInstColor(lick.instrument,t);

  // ── DRAWER STATE (ref-based for drag correctness) ──
  const[drawerSnap,setDrawerSnap]=useState(0);
  const[drawerH,setDrawerH]=useState(DRAWER_PEEK);
  const[dragging,setDragging]=useState(false);
  const[measuredFullH,setMeasuredFullH]=useState(0);
  const dragRef=useRef({startY:0,startH:0,active:false,moved:false});
  const hRef=useRef(DRAWER_PEEK);
  const snapPtsRef=useRef([DRAWER_PEEK]);
  const maxHRef=useRef(DRAWER_PEEK);
  const drawerContentRef=useRef(null);
  const halfContentRef=useRef(null);
  const fullContentRef=useRef(null);
  useEffect(function(){hRef.current=drawerH;},[drawerH]);
  const winH=typeof window!=="undefined"?window.innerHeight:800;

  // Measure content height ONCE per lick (and when expandable sections change).
  // Use setTimeout so DOM has settled. NOT a ResizeObserver — that would fire on
  // every drag frame (scroll container is flex:1, its rendered height changes).
  var measureContent=function(){
    if(!drawerContentRef.current)return;
    var h=drawerContentRef.current.scrollHeight+48;// +48 for drag handle
    setMeasuredFullH(Math.min(h,winH-60));
  };
  useEffect(function(){var id=setTimeout(measureContent,120);return function(){clearTimeout(id);};},[lick.id]);
  useEffect(function(){var id=setTimeout(measureContent,60);return function(){clearTimeout(id);};},[theoryMode,trOpen]);

  // Build snap points
  var hasHalfContent=!!(lick.description||(lick.tags&&lick.tags.length>0)||lick.youtubeId||lick.spotifyId);
  var estFull=Math.min((hasHalfContent?DRAWER_HALF:DRAWER_PEEK)+220,winH-60);
  var fullMax=measuredFullH>(hasHalfContent?DRAWER_HALF:DRAWER_PEEK)+60?measuredFullH:estFull;
  var snapPts=[DRAWER_PEEK];
  if(hasHalfContent)snapPts.push(DRAWER_HALF);
  if(fullMax>snapPts[snapPts.length-1]+60)snapPts.push(fullMax);
  snapPtsRef.current=snapPts;
  maxHRef.current=snapPts[snapPts.length-1];

  var doSnap=function(h){
    var pts=snapPtsRef.current;
    var closest=0,minD=Infinity;
    pts.forEach(function(sp,i){var d=Math.abs(h-sp);if(d<minD){minD=d;closest=i;}});
    setDrawerH(pts[closest]);setDrawerSnap(closest);
  };
  // Only depend on drawerSnap — NOT on fullMax, to avoid fighting drag
  useEffect(function(){
    var pts=snapPtsRef.current;
    setDrawerH(pts[Math.min(drawerSnap,pts.length-1)]);
  },[drawerSnap]);

  var clampH=function(h){return Math.max(DRAWER_PEEK,Math.min(maxHRef.current,h));};
  var onTouchStart=function(e){dragRef.current={startY:e.touches[0].clientY,startH:hRef.current,active:true,moved:false};setDragging(true);};
  var onTouchMove=function(e){if(!dragRef.current.active)return;var dy=dragRef.current.startY-e.touches[0].clientY;if(Math.abs(dy)>3)dragRef.current.moved=true;setDrawerH(clampH(dragRef.current.startH+dy));};
  var onTouchEnd=function(){if(!dragRef.current.active)return;dragRef.current.active=false;setDragging(false);doSnap(hRef.current);};
  var onMouseDown=function(e){e.preventDefault();dragRef.current={startY:e.clientY,startH:hRef.current,active:true,moved:false};setDragging(true);var mv=function(ev){var dy=dragRef.current.startY-ev.clientY;if(Math.abs(dy)>3)dragRef.current.moved=true;setDrawerH(clampH(dragRef.current.startH+dy));};var up=function(){dragRef.current.active=false;setDragging(false);doSnap(hRef.current);window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);};

  // Opacity derived from actual snap positions — no hardcoded HALF_SHOW/FULL_SHOW constants.
  // halfOpacity: 0 at snap[0], 1 at snap[1] (only if hasHalfContent)
  // fullOpacity: 0 at second-to-last snap, 1 at last snap
  var halfOpacity=0;
  if(hasHalfContent&&snapPts.length>=2){
    var hRange=snapPts[1]-snapPts[0];
    halfOpacity=hRange>0?Math.max(0,Math.min(1,(drawerH-snapPts[0])/hRange)):0;
  }
  var fullOpacity=0;
  if(snapPts.length>=2){
    var fPrev=snapPts[snapPts.length-2];
    var fNext=snapPts[snapPts.length-1];
    var fRange=fNext-fPrev;
    fullOpacity=fRange>0?Math.max(0,Math.min(1,(drawerH-fPrev)/fRange)):0;
  }
  var effectiveSnap=0;
  if(snapPts.length===3){effectiveSnap=drawerH>=(snapPts[1]+snapPts[2])/2?2:drawerH>=(snapPts[0]+snapPts[1])/2?1:0;}
  else if(snapPts.length===2){effectiveSnap=drawerH>=(snapPts[0]+snapPts[1])/2?1:0;}

  // ── PLAYER STATE (from headless Player via onStateChange) ──
  const[ps,setPs]=useState({playing:false,loading:false,looping:false,melody:true,backing:true,sound:"piano",backingStyle:"piano",feel:"straight",ci:true,muteKeys:false,muteBass:false,muteDrums:false});
  // Progress bar ref — bridge to Player's internal prBarRef
  const prBarRef=useRef(null);
  useEffect(function(){
    // Connect our visible progress bar element to Player's animation loop
    var checkInterval=setInterval(function(){
      var c=playerCtrlRef.current;
      if(c&&c.prBarRef&&prBarRef.current){
        c.prBarRef.current=prBarRef.current;
        clearInterval(checkInterval);
      }
    },100);
    return function(){clearInterval(checkInterval);};
  },[]);

  var bb={border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",fontFamily:"'Inter',sans-serif"};
  var pill=function(active,label,fn,opts){var o=opts||{};return React.createElement("button",{onClick:function(e){e.stopPropagation();fn();},style:{...bb,gap:4,padding:"5px 10px",fontSize:10,fontWeight:active?600:500,borderRadius:8,background:active?(o.warmActive?("#F59E0B14"):t.accentBg):"transparent",border:"1.5px solid "+(active?(o.warmActive?"#F59E0B40":t.accentBorder):t.border),color:active?(o.warmActive?"#F59E0B":t.accent):t.subtle,whiteSpace:"nowrap",letterSpacing:0.2}},label);};
  var sBtn=function(a,l,fn){return React.createElement("button",{onClick:function(e){e.stopPropagation();fn();},style:{...bb,gap:4,padding:"5px 10px",fontSize:10,fontWeight:500,borderRadius:7,background:a?t.accentBg:t.filterBg,color:a?t.accent:t.muted}},l);};
  var haptic=function(){try{if(navigator.vibrate)navigator.vibrate(10);}catch(e){}};

  // Helper: call Player ctrl
  var pc=function(){return playerCtrlRef.current||{};};

  return React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,background:t.bg}},

    // ═══════ HEADER (sticky) ═══════
    React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,zIndex:200,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:"1px solid "+t.border}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"12px 16px 12px",paddingTop:"calc(env(safe-area-inset-top, 0px) + 12px)"}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},
          React.createElement("button",{onClick:onBack,style:{background:"none",border:"none",cursor:"pointer",color:isStudio?t.accent:t.muted,fontSize:22,padding:"4px 8px 4px 0",display:"flex",alignItems:"center"}},"\u2039"),
          React.createElement("div",{style:{flex:1,minWidth:0}},
            React.createElement("h1",{style:{fontSize:20,fontWeight:isStudio?700:600,color:t.text,margin:0,fontFamily:t.titleFont,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},lick.title),
            lick.status==="pending"&&React.createElement("span",{style:{fontSize:9,color:"#F59E0B",fontFamily:"'Inter',sans-serif",fontWeight:600,background:"#F59E0B15",padding:"2px 8px",borderRadius:6,border:"1px solid #F59E0B30",marginTop:2,display:"inline-block"}},"\u23F3 Pending review"),
            lick.tune&&React.createElement("p",{style:{fontSize:11,color:t.muted,margin:"3px 0 0",fontFamily:"'Inter',sans-serif",fontWeight:500,display:"flex",alignItems:"center",gap:4}},
              React.createElement("span",{style:{fontSize:9,fontFamily:"'Inter',sans-serif",padding:"1px 7px",borderRadius:5,background:isStudio?t.accent+"12":t.accentBg,color:t.accent,border:"1px solid "+(isStudio?t.accent+"20":t.accentBorder)}},lick.tune))),
          React.createElement("div",{style:{display:"flex",gap:8,flexShrink:0,alignItems:"center"}},
            React.createElement("button",{onClick:function(e){onLike(lick.id);if(!liked&&isStudio){var r=e.target.closest("button").getBoundingClientRect();burstKeyRef.current++;sBurst({x:r.left+r.width/2,y:r.top+r.height/2,k:burstKeyRef.current});var b=e.target.closest("button");b.style.animation="none";void b.offsetHeight;b.style.animation="firePop 0.35s ease";}},style:{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",gap:5,transition:"all 0.15s"}},isStudio?(liked?IC.flame(22,"#F97316",true):IC.flameOff(22)):React.createElement("span",{style:{fontSize:22,color:liked?"#EF4444":t.muted}},liked?"\u2665":"\u2661"),React.createElement("span",{style:{fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:liked?(isStudio?"#F97316":"#EF4444"):t.muted}},lc)),
            React.createElement("button",{onClick:function(e){onSave(lick.id);if(!saved&&isStudio&&e.target.closest("button")){var b=e.target.closest("button");b.style.animation="none";void b.offsetHeight;b.style.animation="firePop 0.35s ease";}},style:{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",transition:"all 0.15s"}},isStudio?IC.target(22,saved?"#22D89E":"#55556A"):React.createElement("span",{style:{fontSize:22,color:saved?"#F59E0B":t.muted}},saved?"\u2605":"\u2606")),
            !showTips&&onReShowTips&&React.createElement("button",{onClick:onReShowTips,style:{width:20,height:20,borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.subtle,fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,marginLeft:2,animation:"helpGlow 0.8s ease"}},"?"))),
        // Chips row under title
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5,marginTop:8,flexWrap:"wrap"}},
          React.createElement("span",{style:{fontSize:9,color:instC,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",background:instC+"12",padding:"3px 8px",borderRadius:6,border:"1px solid "+instC+"20"}},lick.instrument),
          React.createElement("span",{style:{fontSize:9,color:catC,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",background:catC+"12",padding:"3px 8px",borderRadius:6,border:"1px solid "+catC+"20"}},lick.category),
          React.createElement("span",{style:{fontSize:9,color:t.muted,fontWeight:500,fontFamily:"'JetBrains Mono',monospace",background:isStudio?t.bg:t.card,padding:"3px 8px",borderRadius:6,border:"1px solid "+t.border}},keyDisplay),
          React.createElement("span",{style:{fontSize:9,color:t.muted,fontWeight:500,fontFamily:"'JetBrains Mono',monospace",background:isStudio?t.bg:t.card,padding:"3px 8px",borderRadius:6,border:"1px solid "+t.border,display:"flex",alignItems:"center",gap:3}},"\u2669 "+lick.tempo),
          lick.user&&lick.user!=="Anonymous"&&React.createElement("div",{style:{flex:1}}),
          lick.user&&lick.user!=="Anonymous"&&React.createElement("button",{onClick:function(e){e.stopPropagation();if(onUserClick)onUserClick(lick.user);},style:{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center"}},
            React.createElement("span",{style:{fontSize:9,color:isStudio?t.accent+"99":t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600,background:isStudio?t.accent+"10":"transparent",padding:isStudio?"2px 6px":"0",borderRadius:5}},"\u0040"+lick.user))))),

    // ═══════ NOTATION AREA (fills space between header and drawer) ═══════
    React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:drawerH,paddingTop:"calc(env(safe-area-inset-top, 0px) + 88px)",display:"flex",flexDirection:"column",overflow:"hidden",background:isStudio?"#0C0C18":"#F4F3EE"}},
      React.createElement("div",{style:{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column"}},
      React.createElement("div",{style:{maxWidth:520,width:"100%",margin:"auto",padding:"8px 16px 20px",flexShrink:0}},
        // Notation — flat, no card
        React.createElement("div",{style:{position:"relative",padding:"14px 10px 10px",contain:"layout style paint"}},
          React.createElement("div",{onClick:function(){if(!theoryMode)setFocus(true);},style:{cursor:theoryMode?"default":"zoom-in"}},
            React.createElement(Notation,{abc:notationAbc,compact:false,focus:true,abRange:abOn?[abA,abB]:null,curNoteRef:curNoteRef,curProgressRef:curProgressRef,th:t,theoryMode:theoryMode,theoryAnalysis:theoryAnalysis,soundAbc:soundAbc,bassClef:BASS_CLEF_INSTS.has(trInst)})),
          // Theory + Fullscreen buttons
          React.createElement("div",{style:{position:"absolute",top:10,right:12,display:"flex",gap:6,alignItems:"center"}},
            React.createElement("button",{onClick:function(){setTheoryMode(!theoryMode);},style:{height:28,padding:"0 10px",borderRadius:8,background:theoryMode?(isStudio?t.accent+"20":t.accent+"12"):(isStudio?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"),display:"flex",alignItems:"center",gap:5,border:theoryMode?"1.5px solid "+(isStudio?t.accent+"50":t.accent+"40"):"1px solid "+(isStudio?t.border:t.borderSub||t.border),cursor:"pointer",transition:"all 0.2s",boxShadow:theoryMode?"0 0 10px "+(isStudio?t.accent+"20":"rgba(99,102,241,0.1)"):"none"}},
              IC.xray(13,theoryMode?t.accent:(isStudio?t.subtle:t.muted),theoryMode),
              React.createElement("span",{style:{fontSize:9,fontWeight:600,fontFamily:"'Inter',sans-serif",color:theoryMode?t.accent:t.muted,letterSpacing:0.3}},"Theory")),
            !theoryMode&&React.createElement("button",{onClick:function(){setFocus(true);},style:{width:28,height:28,borderRadius:8,background:isStudio?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid "+(isStudio?t.border:t.borderSub||t.border),cursor:"pointer"}},React.createElement("span",{style:{fontSize:12,color:t.muted}},"\u26F6")))),
        // Theory info panel
        theoryMode&&theoryAnalysis&&theoryAnalysis.hasChords&&React.createElement("div",{style:{marginTop:32,padding:"10px 12px",borderRadius:12,background:isStudio?t.card:t.settingsBg,border:"1px solid "+(isStudio?t.accent+"20":t.accentBorder),transition:"all 0.2s"}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginRight:4}},
              [["chord-tone","CT"],["tension","T"],["chromatic","Chr"]].map(function(pair){
                return React.createElement("span",{key:pair[0],style:{display:"flex",alignItems:"center",gap:3,fontSize:9,fontFamily:"'JetBrains Mono',monospace"}},
                  React.createElement("span",{style:{width:7,height:7,borderRadius:"50%",background:getTheoryColor(pair[0],isStudio),display:"inline-block",flexShrink:0,boxShadow:"0 0 4px "+getTheoryColor(pair[0],isStudio)+"40"}}),
                  React.createElement("span",{style:{color:getTheoryColor(pair[0],isStudio),fontWeight:600,opacity:0.85}},pair[1]));})),
            theoryAnalysis.chordScales&&theoryAnalysis.chordScales.some(function(cs){return !!cs.scale;})&&React.createElement("span",{style:{width:1,height:14,background:t.border,flexShrink:0}}),
            theoryAnalysis.chordScales&&theoryAnalysis.chordScales.map(function(cs,idx){
              if(!cs.scale)return null;
              return React.createElement("span",{key:idx,onClick:function(e){e.stopPropagation();var sn=getScaleNotes(cs.chord,cs.scale);if(sn){if(instOff){sn.midis=sn.midis.map(function(m){return m-instOff;});var minM=Math.min.apply(null,sn.midis);if(minM<48){var shift=Math.ceil((48-minM)/12)*12;sn.midis=sn.midis.map(function(m){return m+shift;});}}setScalePopup(sn);}},style:{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,fontSize:10,fontFamily:"'JetBrains Mono',monospace",background:isStudio?t.accent+"10":"rgba(99,102,241,0.06)",border:"1px solid "+(isStudio?t.accent+"18":"rgba(99,102,241,0.1)"),cursor:"pointer",transition:"all 0.15s"}},
                React.createElement("span",{style:{fontWeight:700,color:t.chordFill}},cs.chord),
                React.createElement("span",{style:{fontWeight:500,color:t.text,opacity:0.75,fontFamily:"'Inter',sans-serif",fontSize:10}},cs.scale));}))),
        theoryMode&&(!theoryAnalysis||!theoryAnalysis.hasChords)&&React.createElement("div",{style:{marginTop:8,padding:"10px 14px",borderRadius:10,background:isStudio?"#F59E0B15":"#FEF3C7",border:"1px solid "+(isStudio?"#F59E0B30":"#FDE68A")}},
          React.createElement("span",{style:{fontSize:12,color:isStudio?"#FBBF24":"#92400E",fontFamily:"'Inter',sans-serif"}},"No chord symbols found in this lick. Theory mode needs chord annotations (e.g. \"Dm7\") to analyze intervals.")),
        )),
      // Swipe hint pinned at bottom of notation area (outside scroll, above drawer handle)
      drawerSnap===0&&!theoryMode&&snapPts.length>1&&React.createElement("div",{onClick:function(){setDrawerSnap(1);},style:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px 0 6px",cursor:"pointer",flexShrink:0}},
        React.createElement("span",{style:{fontSize:9,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,opacity:0.5}},"\u25B2 SWIPE UP FOR MORE"))),

    // ═══════ BOTTOM DRAWER ═══════
    React.createElement("div",{style:{position:"fixed",bottom:0,left:0,right:0,height:drawerH,background:isStudio?t.card:t.card,borderRadius:"20px 20px 0 0",boxShadow:"0 -4px 30px rgba(0,0,0,"+(isStudio?"0.5":"0.12")+"), 0 -1px 0 "+t.border,transition:dragging?"none":"height 0.35s cubic-bezier(0.32,0.72,0,1)",zIndex:150,display:"flex",flexDirection:"column",overflow:"hidden"}},
      // Drag handle — grab line + snap stage dots
      React.createElement("div",{onTouchStart:onTouchStart,onTouchMove:onTouchMove,onTouchEnd:onTouchEnd,onMouseDown:onMouseDown,onClick:function(e){if(!dragRef.current.moved&&!dragRef.current.active){var next=(drawerSnap+1)%snapPts.length;setDrawerSnap(next);}},style:{padding:"10px 0 6px",cursor:"grab",display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0,userSelect:"none",touchAction:"none"}},
        React.createElement("div",{style:{width:32,height:3,borderRadius:2,background:t.subtle,opacity:0.4}}),
        snapPts.length>1&&React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center"}},
          snapPts.map(function(sp,i){var active=(dragging?effectiveSnap:drawerSnap)===i;return React.createElement("div",{key:i,style:{width:active?16:6,height:6,borderRadius:3,background:active?t.accent:t.subtle,opacity:active?1:0.3,transition:"all 0.25s cubic-bezier(0.4,0,0.2,1)"}});}))),
      // Drawer scroll content
      React.createElement("div",{ref:drawerContentRef,style:{flex:1,overflowY:drawerH>DRAWER_PEEK+10?"auto":"hidden",overflowX:"hidden",WebkitOverflowScrolling:"touch"}},

        // ────── PEEK: MINIBAR ──────
        React.createElement("div",{style:{padding:"0 16px",flexShrink:0}},
          // Progress bar
          React.createElement("div",{style:{height:3,borderRadius:2,background:t.progressBg||t.border,marginBottom:6,overflow:"hidden",position:"relative"}},
            abOn&&React.createElement("div",{style:{position:"absolute",left:((abA||0)*100)+"%",width:(((abB||1)-(abA||0))*100)+"%",height:"100%",background:t.accentBg}}),
            React.createElement("div",{ref:prBarRef,style:{position:"absolute",left:0,width:"0%",height:"100%",background:t.accent,borderRadius:2,boxShadow:ps.playing?"0 0 8px "+t.accentGlow:"none"}})),
          // Row 1: Play · BPM · spacer · Loop · Melody · Backing
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:4}},
            // Play — 48x48
            React.createElement("button",{onClick:function(e){e.stopPropagation();var c=pc();if(c.toggle)c.toggle();},style:{width:48,height:48,borderRadius:14,flexShrink:0,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:ps.playing?(isStudio?"linear-gradient(135deg,#22D89E,#1AB87A)":t.accent):(ps.loading?t.filterBg:t.playBg),boxShadow:ps.playing?"0 4px 20px "+t.accentGlow:ps.loading?"none":"0 2px 14px "+t.accentGlow,transition:"all 0.2s"}},
              ps.loading?React.createElement("div",{style:{width:14,height:14,border:"2px solid "+t.accentBg,borderTopColor:t.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}):
              ps.playing?React.createElement("div",{style:{display:"flex",gap:3}},React.createElement("div",{style:{width:4,height:16,background:isStudio?"#08080F":"#fff",borderRadius:1}}),React.createElement("div",{style:{width:4,height:16,background:isStudio?"#08080F":"#fff",borderRadius:1}})):
              React.createElement("div",{style:{width:0,height:0,borderTop:"9px solid transparent",borderBottom:"9px solid transparent",borderLeft:"14px solid #fff",marginLeft:3}})),
            // BPM — clearly clickable, opens tempo popup
            React.createElement("button",{onClick:function(e){e.stopPropagation();setShowTempoPopup(true);},style:{width:48,height:48,background:isStudio?"#16162A":t.filterBg,border:"1.5px solid "+(ps.playing?t.accent+"40":t.border),borderRadius:14,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}},
              React.createElement("div",{style:{fontSize:18,fontWeight:800,color:ps.playing?t.accent:t.text,fontFamily:"'JetBrains Mono',monospace",letterSpacing:-1,lineHeight:1}},pT),
              React.createElement("div",{style:{fontSize:6,color:t.accent,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginTop:1}},"BPM")),
            React.createElement("div",{style:{flex:1}}),
            // Settings gear — opens sound/style/feel popup
            React.createElement("button",{onClick:function(e){e.stopPropagation();setShowSoundMenu(!showSoundMenu);},style:{width:34,height:34,borderRadius:10,flexShrink:0,border:"1.5px solid "+(showSoundMenu?t.accent+"40":t.border),background:showSoundMenu?t.accent+"15":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.15s"}},IC.gear?IC.gear(15,showSoundMenu?t.accent:t.subtle):React.createElement("span",{style:{fontSize:14,color:showSoundMenu?t.accent:t.subtle}},"\u2699")),
            // Loop — haptic
            React.createElement("button",{onClick:function(e){e.stopPropagation();haptic();var c=pc();if(c.setLooping)c.setLooping(!ps.looping);},style:{width:34,height:34,borderRadius:10,flexShrink:0,border:"1.5px solid "+(ps.looping?t.accent+"40":t.border),background:ps.looping?t.accent+"15":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.15s"}},IC.loop(15,ps.looping?t.accent:t.subtle)),
            // Melody — haptic
            React.createElement("button",{onClick:function(e){e.stopPropagation();haptic();var c=pc();if(c.setMelody)c.setMelody(!ps.melody);},style:{padding:"8px 14px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",border:"1.5px solid "+(ps.melody?t.accentBorder:t.border),background:ps.melody?t.accentBg:"transparent",color:ps.melody?t.accent:t.subtle}},"Melody"),
            // Backing — haptic
            React.createElement("button",{onClick:function(e){e.stopPropagation();haptic();var c=pc();if(c.setBacking)c.setBacking(!ps.backing);},style:{padding:"8px 14px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",border:"1.5px solid "+(ps.backing?"#F59E0B50":t.border),background:ps.backing?"#F59E0B14":"transparent",color:ps.backing?"#F59E0B":t.subtle}},"Backing")),
          // Transpose — compact collapsible, visible in peek
          React.createElement("div",{style:{marginTop:4,marginBottom:2}},
            React.createElement("button",{onClick:function(e){e.stopPropagation();var opening=!trOpen;setTrOpen(opening);if(opening&&drawerSnap===0){setDrawerH(DRAWER_PEEK+90);hRef.current=DRAWER_PEEK+90;}else if(!opening&&drawerSnap===0){setDrawerH(DRAWER_PEEK);hRef.current=DRAWER_PEEK;}},style:{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"6px 12px",borderRadius:trOpen?"10px 10px 0 0":10,border:"1px solid "+t.border,borderBottom:trOpen?"none":"1px solid "+t.border,background:isStudio?t.cardRaised||t.card:t.card,cursor:"pointer"}},
              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
                React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600}},"TRANSPOSE"),
                (instOff+trMan)!==0&&React.createElement("span",{style:{fontSize:9,color:t.accent,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,background:t.accentBg,padding:"1px 6px",borderRadius:5}},transposedKey)),
              React.createElement("span",{style:{fontSize:9,color:t.subtle,transform:trOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.15s"}},"\u25BC")),
            trOpen&&React.createElement("div",{"data-coach":"transpose",style:{background:isStudio?t.cardRaised||t.card:t.card,borderRadius:"0 0 10px 10px",padding:"8px 12px 10px",border:"1px solid "+t.border,borderTop:"none"}},
              React.createElement(TransposeBar,{trInst:trInst,setTrInst:setTrInst,trMan:trMan,setTrMan:setTrMan,th:t}))),
          // Row 2: A·B loop
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,paddingTop:6,borderTop:"1px solid "+(t.border+"60")}},
            React.createElement("button",{onClick:function(e){e.stopPropagation();haptic();setAbOn(!abOn);if(!abOn){setAbA(0);setAbB(1);}},style:{padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",flexShrink:0,letterSpacing:0.5,lineHeight:"20px",border:"1.5px solid "+(abOn?"#F59E0B50":t.border),background:abOn?"#F59E0B14":"transparent",color:abOn?"#F59E0B":t.subtle}},"A\u2009\u00B7\u2009B"),
            React.createElement("div",{style:{flex:1,opacity:abOn?1:0.3,transition:"opacity 0.2s",pointerEvents:abOn?"auto":"none"}},
              React.createElement(ABRangeBar,{abc:notationAbc,abA:abA,abB:abB,setAbA:setAbA,setAbB:setAbB,onReset:function(){setAbA(0);setAbB(1);},th:t,compact:true})))),

        // ══ HALF: MEDIA + EXTRAS ══
        React.createElement("div",{ref:halfContentRef,style:{padding:"14px 16px 0",opacity:halfOpacity,visibility:halfOpacity>0?"visible":"hidden",transition:dragging?"none":"opacity 0.3s",pointerEvents:halfOpacity>0.3?"auto":"none"}},
          // Description
          lick.description&&React.createElement("p",{style:{fontSize:13,color:t.muted,lineHeight:1.7,margin:"0 0 10px",fontStyle:"italic",fontFamily:t.titleFont}},lick.description),
          // Tags
          lick.tags&&lick.tags.length>0&&React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}},
            lick.tags.map(function(tag,i){var cols=Object.values(CAT_COL);var c=isStudio?cols[i%cols.length]:t.accent;
              return React.createElement("span",{key:i,style:{fontSize:11,color:c,fontFamily:"'JetBrains Mono',monospace",background:isStudio?c+"15":t.accentBg,padding:"5px 12px",borderRadius:10,border:"1px solid "+(isStudio?c+"30":t.accentBorder),display:"flex",alignItems:"center",gap:5}},isStudio&&IC.pip(5,c),tag);})),
          // YouTube
          React.createElement(YTP,{videoId:lick.youtubeId,startTime:lick.youtubeStart,endTime:lick.youtubeEnd,isActive:true,th:t}),
          // Spotify
          React.createElement(SpotifyEmbed,{trackId:lick.spotifyId,th:t})),

        // ══ FULL: THEORY + PRIVATE + REPORT ══
        React.createElement("div",{ref:fullContentRef,style:{padding:"0 16px 32px",opacity:fullOpacity,visibility:fullOpacity>0?"visible":"hidden",transition:dragging?"none":"opacity 0.3s",pointerEvents:fullOpacity>0.3?"auto":"none"}},
          // Theory X-Ray
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:14}},
            React.createElement("div",{style:{height:1,flex:1,background:t.border}}),
            React.createElement("span",{style:{fontSize:9,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}},"THEORY"),
            React.createElement("div",{style:{height:1,flex:1,background:t.border}})),
          React.createElement("div",{style:{marginBottom:14}},
            React.createElement("button",{onClick:function(){setTheoryMode(!theoryMode);},style:{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:12,border:"1.5px solid "+(theoryMode?t.accent:t.border),background:theoryMode?(isStudio?t.accent+"15":t.accent+"08"):t.filterBg,cursor:"pointer",transition:"all 0.2s"}},
              IC.xray(16,theoryMode?t.accent:t.muted,theoryMode),
              React.createElement("span",{style:{fontSize:12,fontWeight:600,color:theoryMode?t.accent:t.muted,fontFamily:"'Inter',sans-serif"}},theoryMode?"Theory ON":"Theory OFF"))),

          // Private lick actions
          lick.private&&React.createElement("div",{style:{marginTop:16,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}},
            onDeletePrivate&&React.createElement("button",{onClick:function(){if(confirm("Delete this lick?"))onDeletePrivate(lick.id);},style:{padding:"12px 20px",borderRadius:12,border:"1.5px solid #EF4444",background:"#EF444410",color:"#EF4444",fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u2715  Delete"),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,padding:"8px 12px",borderRadius:10,background:isStudio?"rgba(34,216,158,0.1)":"#E8F5E9"}},
              React.createElement("span",{style:{fontSize:10,color:isStudio?"#22D89E":"#2E7D32",fontFamily:"'Inter',sans-serif",fontWeight:500}},"Private \u00B7 Offline"))),

          // Report
          !lick.private&&onReport&&React.createElement("div",{style:{marginTop:24,paddingTop:20,borderTop:"1px solid "+t.border,display:"flex",justifyContent:"center"}},
            React.createElement("button",{onClick:function(){if(confirm("Report this lick as spam or inappropriate?")){onReport(lick.id);}},style:{display:"flex",alignItems:"center",gap:8,padding:"14px 32px",borderRadius:14,border:"1.5px solid "+(isStudio?"rgba(239,68,68,0.25)":"rgba(239,68,68,0.2)"),background:isStudio?"rgba(239,68,68,0.06)":"rgba(239,68,68,0.04)",color:isStudio?"#F87171":"#DC2626",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",transition:"all 0.15s",letterSpacing:0.3}},"Report this lick")),

          // (snap dots moved to drag handle)
          ))),

    // ═══════ HEADLESS PLAYER (audio only) ═══════
    React.createElement("div",{style:{position:"absolute",width:0,height:0,overflow:"hidden",pointerEvents:"none"}},
      React.createElement(Player,{abc:soundAbc,tempo:pT,abOn:abOn,abA:abA,abB:abB,setAbOn:setAbOn,setAbA:setAbA,setAbB:setAbB,pT:pT,sPT:sPT,lickTempo:lick.tempo,trInst:null,setTrInst:null,trMan:null,setTrMan:null,onCurNote:function(n){curNoteRef.current=n;},th:t,ctrlRef:playerCtrlRef,initFeel:lick.feel,headless:true,onStateChange:setPs,progressRef:curProgressRef})),

    // ═══════ OVERLAYS ═══════
    focus&&React.createElement(SheetFocus,{abc:notationAbc,onClose:function(){setFocus(false);},abRange:abOn?[abA,abB]:null,curNoteRef:curNoteRef,curProgressRef:curProgressRef,th:t,playerCtrlRef:playerCtrlRef,theoryMode:theoryMode,theoryAnalysis:theoryAnalysis,soundAbc:soundAbc}),
    scalePopup&&React.createElement(ScalePopup,{data:scalePopup,th:t,isStudio:isStudio,onClose:function(){setScalePopup(null);}}),
    burst&&React.createElement(FireBurst,{key:burst.k,originX:burst.x,originY:burst.y,onDone:function(){sBurst(null);}}),
    showTempoPopup&&React.createElement(TempoPopup,{bpm:pT,onBpmChange:sPT,onClose:function(){setShowTempoPopup(false);},th:t,lickTempo:lick.tempo,playerCtrlRef:playerCtrlRef,ci:ps.ci,setCi:function(v){var c=pc();if(c.setCi)c.setCi(v);}}),
    // Sound/Style/Feel settings popup
    showSoundMenu&&React.createElement("div",{style:{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}},
      React.createElement("div",{onClick:function(){setShowSoundMenu(false);},style:{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}}),
      React.createElement("div",{onClick:function(e){e.stopPropagation();},style:{position:"relative",width:"100%",maxWidth:440,background:t.card,borderRadius:"20px 20px 0 0",padding:"0 20px 28px",animation:"popupSlide 0.3s cubic-bezier(0.32,0.72,0,1)"}},
        React.createElement("div",{style:{display:"flex",justifyContent:"center",padding:"12px 0 6px"}},React.createElement("div",{style:{width:40,height:4,borderRadius:2,background:t.subtle,opacity:0.5}})),
        React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}},
          React.createElement("span",{style:{fontSize:11,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:2}},"SOUND SETTINGS"),
          React.createElement("button",{onClick:function(){setShowSoundMenu(false);},style:{width:32,height:32,borderRadius:10,background:isStudio?"#16162A":t.filterBg,border:"1px solid "+t.border,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:t.muted,fontSize:16}},"\u2715")),
        // Melody Sound
        ps.melody&&React.createElement("div",{style:{marginBottom:16}},
          React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:1,marginBottom:8}},"MELODY SOUND"),
          React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
            SOUND_PRESETS.map(function(p){return React.createElement("button",{key:p.id,onClick:function(){haptic();var c=pc();if(c.setSound)c.setSound(p.id);},style:{padding:"10px 14px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",border:"1.5px solid "+(ps.sound===p.id?t.accent+"40":t.border),background:ps.sound===p.id?t.accentBg:"transparent",color:ps.sound===p.id?t.accent:t.muted}},p.label);}))),
        // Backing Style
        ps.backing&&React.createElement("div",{style:{marginBottom:16}},
          React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:1,marginBottom:8}},"BACKING STYLE"),
          React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
            BACKING_STYLES.map(function(s){return React.createElement("button",{key:s.id,onClick:function(){haptic();var c=pc();if(c.setBackingStyle)c.setBackingStyle(s.id);},style:{padding:"10px 14px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",border:"1.5px solid "+(ps.backingStyle===s.id?t.accent+"40":t.border),background:ps.backingStyle===s.id?t.accentBg:"transparent",color:ps.backingStyle===s.id?t.accent:t.muted}},s.label);})),
          ps.backingStyle!=="piano"&&ps.backingStyle!=="rhodes"&&React.createElement("div",{style:{display:"flex",gap:6,marginTop:8}},
            React.createElement("span",{style:{fontSize:9,color:t.subtle,fontFamily:"'Inter',sans-serif",fontWeight:600,alignSelf:"center"}},"Mute:"),
            React.createElement("button",{onClick:function(){haptic();var c=pc();if(c.setMuteKeys)c.setMuteKeys(!ps.muteKeys);},style:{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid "+t.border,background:ps.muteKeys?t.filterBg:t.accentBg,color:ps.muteKeys?t.muted:t.accent,textDecoration:ps.muteKeys?"line-through":"none"}},"Keys"),
            React.createElement("button",{onClick:function(){haptic();var c=pc();if(c.setMuteBass)c.setMuteBass(!ps.muteBass);},style:{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid "+t.border,background:ps.muteBass?t.filterBg:t.accentBg,color:ps.muteBass?t.muted:t.accent,textDecoration:ps.muteBass?"line-through":"none"}},"Bass"),
            (ps.backingStyle==="jazz"||ps.backingStyle==="bossa")&&React.createElement("button",{onClick:function(){haptic();var c=pc();if(c.setMuteDrums)c.setMuteDrums(!ps.muteDrums);},style:{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid "+t.border,background:ps.muteDrums?t.filterBg:t.accentBg,color:ps.muteDrums?t.muted:t.accent,textDecoration:ps.muteDrums?"line-through":"none"}},"Drums"))),
        // Feel
        React.createElement("div",{style:{marginBottom:16}},
          React.createElement("div",{style:{fontSize:9,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,letterSpacing:1,marginBottom:8}},"FEEL"),
          React.createElement("div",{style:{display:"flex",gap:6}},
            ["straight","swing","hard-swing"].map(function(v){return React.createElement("button",{key:v,onClick:function(){haptic();var c=pc();if(c.setFeel)c.setFeel(v);},style:{flex:1,padding:"10px 6px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",border:"1.5px solid "+(ps.feel===v?t.accent+"40":t.border),background:ps.feel===v?t.accentBg:"transparent",color:ps.feel===v?t.accent:t.muted}},v==="straight"?"Straight":v==="swing"?"Swing":"Hard Swing");}))),
      )),
    showTips&&React.createElement(CoachMarks,{tips:DETAIL_TIPS,onDone:onTipsDone,th:t}));}

// ============================================================
// DAILY LICK CARD — compact, themed
// ============================================================
function DailyLickCard({lick,onSelect,th,liked,saved,onLike,onSave,userInst:userInst,onArtistSearch}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const uOff=INST_TRANS[userInst]||0;const cardAbc=uOff?transposeAbc(lick.abc,uOff):lick.abc;
  const keyRoot=uOff?trKeyName(lick.key.split(" ")[0],uOff):lick.key.split(" ")[0];
  const keyQualLabel=lick.key&&lick.key.toLowerCase().includes("minor")?" Minor":" Major";
  const keyLabel=keyRoot+keyQualLabel;
  const prevCurNote=usePreviewCurNote(lick.id);
  const titleParts=lick.title?lick.title.split(" \u2014 "):null;
  const hasArtistInTitle=titleParts&&titleParts.length>1&&lick.artist&&titleParts[0].trim()===lick.artist.trim();
  
  const catC=getCatColor(lick.category,t);const instC=getInstColor(lick.instrument,t);const instBorderC=INST_COL[lick.instrument]||t.accent;
  var cardNBars=getBarInfo(cardAbc).nBars;var isLong=cardNBars>4;
  var _exp=useState(false),expanded=_exp[0],setExpanded=_exp[1];
  var notInnerRef=useRef(null);
  var _notH=useState(500),notFullH=_notH[0],setNotFullH=_notH[1];
  useEffect(function(){var t1=setTimeout(function(){if(notInnerRef.current){var h=notInnerRef.current.offsetHeight;if(h>135)setNotFullH(h+8);}},250);return function(){clearTimeout(t1);};},[cardAbc]);
  return React.createElement("div",{"data-coach":"daily",onClick:()=>onSelect(lick),style:{background:isStudio?(t.cardRaised||t.card):t.card,borderRadius:isStudio?18:14,padding:0,marginBottom:isStudio?16:14,border:"none",borderLeft:isStudio?"none":("3px solid "+instBorderC),cursor:"pointer",boxShadow:isStudio?"0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)":"0 2px 12px rgba(0,0,0,0.06)",transition:"box-shadow 0.2s, transform 0.15s",overflow:"hidden",display:"flex"}},
    isStudio&&React.createElement("div",{style:{width:4,flexShrink:0,background:"linear-gradient(180deg,"+catC+","+instC+")",boxShadow:"2px 0 12px "+catC+"30"}}),
    React.createElement("div",{style:{flex:1,padding:isStudio?18:16}},
      // TOP: badge + date
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:isStudio?12:10}},
        React.createElement("div",{style:{background:isStudio?"linear-gradient(135deg,"+catC+","+instC+")":t.accent,borderRadius:isStudio?10:8,padding:isStudio?"5px 14px":"4px 12px",display:"flex",alignItems:"center",gap:4,boxShadow:isStudio?"0 2px 12px "+catC+"40":"none"}},
          IC.bolt(10,"#fff"),
          React.createElement("span",{style:{fontSize:9,fontWeight:700,color:"#fff",fontFamily:"'Inter',sans-serif",letterSpacing:1}},"DAILY PICK")),
        React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace"}},new Date().toLocaleDateString("en",{month:"short",day:"numeric"}))),
      // TITLE
      React.createElement("h3",{style:{fontSize:isStudio?20:18,fontWeight:700,color:t.text,margin:"0 0 5px",fontFamily:t.titleFont,letterSpacing:isStudio?-0.3:0}},
        hasArtistInTitle?React.createElement(React.Fragment,null,
          React.createElement("span",{onClick:function(e){e.stopPropagation();if(onArtistSearch)onArtistSearch(lick.artist);},style:{cursor:"pointer",borderBottom:"1px solid transparent",transition:"border-color 0.15s"},"onMouseEnter":function(e){e.currentTarget.style.borderBottomColor=isStudio?t.accent+"60":t.accent+"40";},"onMouseLeave":function(e){e.currentTarget.style.borderBottomColor="transparent";}},titleParts[0]),
          React.createElement("span",{style:{color:t.text,fontWeight:400}}," \u2014 "+titleParts.slice(1).join(" \u2014 ")))
        :lick.title),
      // LINE 2: Tune · Instrument
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5,marginBottom:10}},
        lick.tune&&React.createElement("span",{style:{fontSize:10,color:t.text,fontFamily:"'Inter',sans-serif",fontWeight:500,opacity:0.7}},lick.tune),
        lick.tune&&lick.instrument&&React.createElement("span",{style:{fontSize:8,color:t.muted}},"\u00B7"),
        lick.instrument&&React.createElement("span",{style:{fontSize:9,color:instBorderC,fontFamily:"'Inter',sans-serif",fontWeight:500}},lick.instrument)),
      // NOTATION — ≤4 bars: single line. >4 bars: clipped at 1 line with more/less
      React.createElement("div",{style:{marginTop:6,position:"relative",maxHeight:(isLong&&!expanded)?135:notFullH,overflow:"hidden",transition:"max-height 0.4s cubic-bezier(0.4,0,0.2,1)"}},
        React.createElement("div",{ref:notInnerRef,style:{display:"flex",justifyContent:"center"}},
          React.createElement(Notation,{abc:cardAbc,compact:true,th:t,curNoteRef:prevCurNote,bassClef:BASS_CLEF_INSTS.has(userInst)})),
        isLong&&!expanded&&React.createElement("div",{style:{position:"absolute",left:0,right:0,bottom:0,height:48,background:"linear-gradient(to bottom, transparent, "+(isStudio?t.cardRaised||t.card:t.card)+")",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:2}},
          React.createElement("button",{onClick:function(e){e.stopPropagation();setExpanded(true);},style:{background:isStudio?t.card+"E0":t.card+"E0",border:"1px solid "+t.border,borderRadius:12,padding:"2px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,boxShadow:"0 -2px 8px "+(isStudio?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.08)")}},
            React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:500}},"more"),
            React.createElement("span",{style:{fontSize:10,color:t.muted,transform:"rotate(90deg)",display:"inline-block"}},"\u203A")))),
      isLong&&expanded&&React.createElement("div",{style:{display:"flex",justifyContent:"center",marginTop:4}},
        React.createElement("button",{onClick:function(e){e.stopPropagation();setExpanded(false);},style:{background:"transparent",border:"1px solid "+t.border,borderRadius:12,padding:"2px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}},
          React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:500}},"less"),
          React.createElement("span",{style:{fontSize:10,color:t.muted,transform:"rotate(-90deg)",display:"inline-block"}},"\u203A"))),
      // ACTION ROW — Instagram style
      React.createElement("div",{"data-coach":"flame",style:{display:"flex",alignItems:"center",gap:2,marginTop:isStudio?14:10,paddingTop:isStudio?12:8,borderTop:"1px solid "+t.border}},
        React.createElement(PreviewBtn,{lickId:lick.id,abc:lick.abc,tempo:lick.tempo,feel:lick.feel,th:t,size:30}),
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
// ── FlamesPopup — blurred overlay modal showing who liked a lick ──
function FlamesPopup({lickId,lickTitle,likeCount,th,onClose,onUserClick}){
  var t=th||TH.studio;var isStudio=t===TH.studio;
  var _u=useState(null); var users=_u[0],setUsers=_u[1];
  var _e=useState(false); var err=_e[0],setErr=_e[1];

  useEffect(function(){
    if(!lickId)return;
    supabase
      .from('user_licks')
      .select('user_id')
      .eq('lick_id', lickId)
      .eq('type', 'like')
      .limit(50)
      .then(function(res){
        if(res.error){setErr(true);return;}
        var ids=(res.data||[]).map(function(r){return r.user_id;}).filter(Boolean);
        if(ids.length===0){setUsers([]);return;}
        supabase.from('profiles').select('display_name, username, instrument, avatar_url').in('id', ids)
          .then(function(res2){
            if(res2.error){setErr(true);return;}
            setUsers((res2.data||[]).filter(function(p){return p.username||p.display_name;}));
          }).catch(function(){setErr(true);});
      })
      .catch(function(){setErr(true);});
  },[lickId]);

  var count=likeCount||(users?users.length:0);
  return React.createElement(React.Fragment,null,
    React.createElement('div',{
      onClick:onClose,
      style:{
        position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:3000,
        backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)',
        background:isStudio?'rgba(8,8,15,0.72)':'rgba(0,0,0,0.38)',
        animation:'fadeIn 0.18s ease'
      }
    }),
    React.createElement('div',{
      onClick:function(e){e.stopPropagation();},
      style:{
        position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',
        zIndex:3001,
        width:'calc(100% - 48px)',maxWidth:360,
        background:isStudio?(t.cardRaised||t.card):t.card,
        borderRadius:20,
        border:'1px solid '+(isStudio?'rgba(34,216,158,0.18)':t.border),
        boxShadow:isStudio?'0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,216,158,0.08)':'0 8px 40px rgba(0,0,0,0.18)',
        overflow:'hidden',
        animation:'popupIn 0.22s cubic-bezier(0.34,1.56,0.64,1)'
      }
    },
      React.createElement('div',{style:{
        padding:'16px 18px 12px',
        borderBottom:'1px solid '+(isStudio?t.border:t.borderSub||t.border),
        display:'flex',alignItems:'center',justifyContent:'space-between'
      }},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},
          isStudio?IC.flame(16,'#F97316',true):React.createElement('span',{style:{fontSize:16,color:'#EF4444',lineHeight:1}},'❤️'),
          React.createElement('span',{style:{
            fontSize:14,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif"
          }},count+' '+(count===1?(isStudio?'Flame':'Like'):(isStudio?'Flames':'Likes')))),
        React.createElement('button',{
          onClick:onClose,
          style:{background:'none',border:'none',cursor:'pointer',color:t.muted,fontSize:20,lineHeight:1,padding:'2px 4px',borderRadius:6}
        },'\u00D7')),
      lickTitle&&React.createElement('div',{style:{
        padding:'8px 18px',fontSize:10,color:t.muted,
        fontFamily:"'JetBrains Mono',monospace",
        borderBottom:'1px solid '+(isStudio?t.border:t.borderSub||t.border),
        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'
      }},lickTitle),
      React.createElement('div',{style:{maxHeight:280,overflowY:'auto',padding:'8px 0'}},
        users===null&&!err&&React.createElement('div',{style:{padding:'24px',textAlign:'center'}},
          React.createElement('div',{style:{
            width:20,height:20,border:'2px solid '+t.border,borderTopColor:t.accent,
            borderRadius:'50%',animation:'spin 0.7s linear infinite',
            margin:'0 auto'
          }})),
        err&&React.createElement('div',{style:{padding:'24px',textAlign:'center',fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Couldn't load :("),
        users&&users.length===0&&React.createElement('div',{style:{padding:'24px',textAlign:'center'}},
          React.createElement('div',{style:{fontSize:22,marginBottom:8}},isStudio?'🔥':'❤️'),
          React.createElement('div',{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif"}},
            'Be the first to '+(isStudio?'flame':'like')+' this!')),
        users&&users.length>0&&users.map(function(u,i){
          var name=u.display_name||u.username;
          var handle=u.username;
          var instC=isStudio?(INST_COL[u.instrument]||t.accent):t.accent;
          var initials=(name||'?').slice(0,2).toUpperCase();
          return React.createElement('button',{
            key:i,
            onClick:function(){if(handle&&onUserClick){onClose();onUserClick(handle);}},
            style:{
              display:'flex',alignItems:'center',gap:12,
              width:'100%',padding:'10px 18px',
              background:'none',border:'none',cursor:handle?'pointer':'default',
              transition:'background 0.12s',textAlign:'left'
            },
            onMouseEnter:function(e){if(handle)e.currentTarget.style.background=isStudio?'rgba(34,216,158,0.06)':'rgba(0,0,0,0.04)';},
            onMouseLeave:function(e){e.currentTarget.style.background='none';}
          },
            React.createElement('div',{style:{
              width:34,height:34,borderRadius:10,flexShrink:0,
              background:isStudio?'linear-gradient(135deg,'+instC+'22,'+instC+'08)':t.accentBg,
              border:'1.5px solid '+instC+'40',
              display:'flex',alignItems:'center',justifyContent:'center',
              overflow:'hidden'
            }},
              u.avatar_url
                ?React.createElement('img',{src:u.avatar_url,alt:name,style:{width:'100%',height:'100%',objectFit:'cover'}})
                :React.createElement('span',{style:{fontSize:12,fontWeight:700,color:instC,fontFamily:"'Inter',sans-serif"}},initials)),
            React.createElement('div',{style:{flex:1,minWidth:0}},
              React.createElement('div',{style:{
                fontSize:13,fontWeight:600,color:t.text,
                fontFamily:"'Inter',sans-serif",
                whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'
              }},name),
              handle&&React.createElement('div',{style:{
                fontSize:10,color:isStudio?t.accent+'99':t.accent,
                fontFamily:"'Inter',sans-serif",fontWeight:600
              }},'@'+handle)),
            u.instrument&&isStudio&&React.createElement('span',{style:{
              fontSize:8,color:instC,fontFamily:"'JetBrains Mono',monospace",
              background:instC+'15',padding:'2px 7px',borderRadius:5,
              border:'1px solid '+instC+'20',fontWeight:600,flexShrink:0
            }},u.instrument));
        })
      )
    )
  );
}

function LickCard({lick,onSelect,th,liked,saved,onLike,onSave,userInst:userInst,onUserClick,onArtistSearch,animIdx}){
  const t=th||TH.classic;const isStudio=t===TH.studio;
  const uOff=INST_TRANS[userInst]||0;const cardAbc=uOff?transposeAbc(lick.abc,uOff):lick.abc;
  const keyRoot=uOff?trKeyName(lick.key.split(" ")[0],uOff):lick.key.split(" ")[0];
  const keyQualLabel=lick.key&&lick.key.toLowerCase().includes("minor")?" Minor":" Major";
  const keyLabel=keyRoot+keyQualLabel;
  const prevCurNote=usePreviewCurNote(lick.id);
  const[showFlames,setShowFlames]=useState(false);
  const[likeAnim,setLikeAnim]=useState(false);
  const[saveAnim,setSaveAnim]=useState(false);
  const[notationReady,setNotationReady]=useState(false);
  const[inView,setInView]=useState(false);
  const cardRef=useRef(null);
  const catC=getCatColor(lick.category,t);
  const instC=getInstColor(lick.instrument,t);
  const instBorderC=INST_COL[lick.instrument]||t.accent;
  var cardNBars=getBarInfo(cardAbc).nBars;var isLong=cardNBars>4;
  var _exp2=useState(false),expanded=_exp2[0],setExpanded=_exp2[1];
  var notInnerRef2=useRef(null);
  var _notH2=useState(500),notFullH=_notH2[0],setNotFullH=_notH2[1];
  useEffect(function(){var t1=setTimeout(function(){if(notInnerRef2.current){var h=notInnerRef2.current.offsetHeight;if(h>135)setNotFullH(h+8);}},250);return function(){clearTimeout(t1);};},[cardAbc]);
  // Split title: "Artist — Rest" → clickable artist + rest
  const titleParts=lick.title?lick.title.split(" \u2014 "):null;
  const hasArtistInTitle=titleParts&&titleParts.length>1&&lick.artist&&titleParts[0].trim()===lick.artist.trim();
  // IntersectionObserver — fire once when card enters viewport
  useEffect(()=>{
    if(!cardRef.current)return;
    var obs=new IntersectionObserver(function(entries){
      if(entries[0].isIntersecting){setInView(true);obs.disconnect();}
    },{threshold:0.05,rootMargin:"0px 0px -18% 0px"});
    obs.observe(cardRef.current);
    return function(){obs.disconnect();};
  },[]);
  const visible=notationReady&&inView;
  return React.createElement(React.Fragment,null,
    showFlames&&React.createElement(FlamesPopup,{lickId:lick.id,lickTitle:lick.title,likeCount:lick.likes,th:t,onClose:function(e){setShowFlames(false);},onUserClick:onUserClick}),
    React.createElement("div",{ref:cardRef,onClick:()=>onSelect(lick),style:{background:isStudio?(t.cardRaised||t.card):t.card,borderRadius:isStudio?16:14,padding:0,marginBottom:isStudio?12:10,border:"none",borderLeft:"3px solid "+instBorderC,cursor:"pointer",transition:visible?"opacity 0.7s ease-out, transform 0.7s cubic-bezier(0.2,0,0.2,1)":"none",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(22px)",boxShadow:isStudio?"0 2px 16px "+catC+"15, 0 1px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)":"0 1px 6px rgba(0,0,0,0.04)",overflow:"hidden"}},
    React.createElement("div",{style:{padding:isStudio?16:14}},
      // TITLE — artist clickable
      React.createElement("div",{style:{marginBottom:8}},
        React.createElement("h3",{style:{fontSize:isStudio?17:16,fontWeight:isStudio?700:600,color:t.text,margin:"0 0 6px",lineHeight:1.3,fontFamily:t.titleFont,letterSpacing:isStudio?-0.2:0}},
          hasArtistInTitle?React.createElement(React.Fragment,null,
            React.createElement("span",{onClick:function(e){e.stopPropagation();if(onArtistSearch)onArtistSearch(lick.artist);},style:{cursor:"pointer",borderBottom:"1px solid transparent",transition:"border-color 0.15s"},"onMouseEnter":function(e){e.currentTarget.style.borderBottomColor=isStudio?t.accent+"60":t.accent+"40";},"onMouseLeave":function(e){e.currentTarget.style.borderBottomColor="transparent";}},titleParts[0]),
            React.createElement("span",{style:{color:t.text,fontWeight:isStudio?500:400}}," \u2014 "+titleParts.slice(1).join(" \u2014 ")))
          :lick.title),
        // LINE 2: Tune · Instrument · @user
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5}},
          lick.tune&&React.createElement("span",{style:{fontSize:10,color:t.text,fontFamily:"'Inter',sans-serif",fontWeight:500,opacity:0.7}},lick.tune),
          lick.tune&&lick.instrument&&React.createElement("span",{style:{fontSize:8,color:t.muted}},"\u00B7"),
          lick.instrument&&React.createElement("span",{style:{fontSize:9,color:instBorderC,fontFamily:"'Inter',sans-serif",fontWeight:500}},lick.instrument),
          lick.private&&React.createElement("span",{style:{fontSize:8,color:isStudio?"#22D89E":"#2E7D32",fontFamily:"'Inter',sans-serif",fontWeight:600,background:isStudio?"rgba(34,216,158,0.15)":"#E8F5E9",padding:"2px 6px",borderRadius:4,marginLeft:2}},"\uD83D\uDD12 Private"),
          lick.user&&lick.user!=="Anonymous"&&React.createElement("div",{style:{flex:1}}),
          lick.user&&lick.user!=="Anonymous"&&React.createElement("button",{onClick:function(e){e.stopPropagation();if(onUserClick)onUserClick(lick.user);},style:{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center"}},
            React.createElement("span",{style:{fontSize:9,color:isStudio?t.accent+"99":t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600,background:isStudio?t.accent+"10":"transparent",padding:isStudio?"2px 6px":"0",borderRadius:5}},"\u0040"+lick.user)))),
      // NOTATION — ≤4 bars: single line. >4 bars: clipped with more/less
      React.createElement("div",{style:{marginTop:4,position:"relative",maxHeight:(isLong&&!expanded)?135:notFullH,overflow:"hidden",transition:"max-height 0.4s cubic-bezier(0.4,0,0.2,1)"}},
        React.createElement("div",{ref:notInnerRef2,style:{display:"flex",justifyContent:"center"}},
          React.createElement(Notation,{abc:cardAbc,compact:true,th:t,curNoteRef:prevCurNote,onReady:function(){setNotationReady(true);},bassClef:BASS_CLEF_INSTS.has(userInst)})),
        isLong&&!expanded&&React.createElement("div",{style:{position:"absolute",left:0,right:0,bottom:0,height:48,background:"linear-gradient(to bottom, transparent, "+(isStudio?t.cardRaised||t.card:t.card)+")",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:2}},
          React.createElement("button",{onClick:function(e){e.stopPropagation();setExpanded(true);},style:{background:isStudio?t.card+"E0":t.card+"E0",border:"1px solid "+t.border,borderRadius:12,padding:"2px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,boxShadow:"0 -2px 8px "+(isStudio?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.08)")}},
            React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:500}},"more"),
            React.createElement("span",{style:{fontSize:10,color:t.muted,transform:"rotate(90deg)",display:"inline-block"}},"\u203A")))),
      isLong&&expanded&&React.createElement("div",{style:{display:"flex",justifyContent:"center",marginTop:4}},
        React.createElement("button",{onClick:function(e){e.stopPropagation();setExpanded(false);},style:{background:"transparent",border:"1px solid "+t.border,borderRadius:12,padding:"2px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}},
          React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:500}},"less"),
          React.createElement("span",{style:{fontSize:10,color:t.muted,transform:"rotate(-90deg)",display:"inline-block"}},"\u203A"))),
      // ACTION ROW — Instagram style
      React.createElement("div",{style:{marginTop:isStudio?12:8,paddingTop:isStudio?10:6,borderTop:"1px solid "+t.border}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:2}},
          React.createElement(PreviewBtn,{lickId:lick.id,abc:lick.abc,tempo:lick.tempo,feel:lick.feel,th:t,size:26}),
          React.createElement("button",{onClick:e=>{e.stopPropagation();onLike(lick.id);setLikeAnim(true);setTimeout(()=>setLikeAnim(false),300);},style:{background:"none",border:"none",cursor:"pointer",padding:"3px 2px",marginLeft:6,display:"flex",alignItems:"center",gap:3,transition:"all 0.15s",animation:likeAnim?"heartPop 0.3s ease":"none"}},
            isStudio?(liked?IC.flame(18,"#F97316",true):IC.flameOff(18)):React.createElement("span",{style:{fontSize:18,color:liked?"#EF4444":t.muted}},liked?"\u2665":"\u2661")),
          React.createElement("button",{onClick:e=>{e.stopPropagation();onSave(lick.id);setSaveAnim(true);setTimeout(()=>setSaveAnim(false),300);},style:{background:"none",border:"none",cursor:"pointer",padding:"3px 2px",display:"flex",alignItems:"center",marginLeft:4,transition:"all 0.15s",animation:saveAnim?"heartPop 0.3s ease":"none"}},
            isStudio?IC.target(18,saved?"#22D89E":"#55556A"):React.createElement("span",{style:{fontSize:18,color:saved?"#F59E0B":t.muted}},saved?"\u2605":"\u2606")),
          React.createElement("div",{style:{flex:1}}),
          lick.youtubeId&&React.createElement(YTCardBtn,{videoId:lick.youtubeId,startTime:lick.youtubeStart,endTime:lick.youtubeEnd,th:t}),
          // flames pill — visually tappable, hints at likes overview
          React.createElement("button",{onClick:e=>{e.stopPropagation();setShowFlames(true);},style:{
            display:"flex",alignItems:"center",gap:4,
            padding:"4px 9px",borderRadius:8,
            border:"1px solid "+(liked?(isStudio?"rgba(249,115,22,0.3)":"rgba(239,68,68,0.3)"):(isStudio?"rgba(85,85,106,0.25)":t.border)),
            background:liked?(isStudio?"rgba(249,115,22,0.08)":"rgba(239,68,68,0.06)"):"transparent",
            cursor:"pointer",transition:"all 0.15s",marginLeft:lick.youtubeId?6:0,flexShrink:0}},
            isStudio?IC.flame(11,liked?"#F97316":t.muted,liked):React.createElement("span",{style:{fontSize:11,color:liked?(isStudio?"#F97316":"#EF4444"):t.muted}},liked?"\u2665":"\u2661"),
            React.createElement("span",{style:{fontSize:10,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:liked?(isStudio?"#F97316":"#EF4444"):t.muted}},lick.likes)),
          // divider + detail arrow clearly separated
          React.createElement("div",{style:{width:1,height:20,background:t.border,margin:"0 8px",flexShrink:0}}),
          isStudio?React.createElement("div",{style:{cursor:"pointer"}},IC.arrowR(14,t.subtle)):React.createElement("span",{style:{fontSize:15,color:t.subtle,cursor:"pointer"}},"\u203A"))))));}


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
          React.createElement("div",{style:{fontSize:12,color:t.muted,fontFamily:"'JetBrains Mono',monospace",marginBottom:2,display:"flex",alignItems:"center",gap:5}},lick.artist,
            lick.tune&&React.createElement("span",{style:{fontSize:9,fontFamily:"'Inter',sans-serif",padding:"1px 7px",borderRadius:5,background:isStudio?t.accent+"12":t.accentBg,color:t.accent,border:"1px solid "+(isStudio?t.accent+"20":t.accentBorder)}},lick.tune))),

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
              React.createElement(Notation,{abc:earAbc,compact:false,curNoteRef:curNoteRef,th:t,bassClef:BASS_CLEF_INSTS.has(userInst)}))),
          // Mystery overlay when not revealed
          !isRevealed&&React.createElement("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:isStudio?"rgba(12,12,24,0.5)":"rgba(255,255,255,0.3)",borderRadius:14,backdropFilter:"blur(2px)",WebkitBackdropFilter:"blur(2px)"}},
            IC.tabEar(28,t.accent,false),
            React.createElement("span",{style:{fontSize:12,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"Listen first, then reveal"))),

        // PLAYER — with tempo slider
        React.createElement(Player,{abc:lick.abc,tempo:pT||lick.tempo,pT:pT||lick.tempo,sPT:sPT,lickTempo:lick.tempo,onCurNote:function(n){curNoteRef.current=n;},th:t,initFeel:lick.feel}),

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
  const subdivision=1;
  const swing=0;
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
    if(snd==="silent")return;// silent mode — no clicks
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
  const SOUNDS=[{v:"click",l:"Click"},{v:"wood",l:"Wood"},{v:"cowbell",l:"Bell"}];

  // Trainer computed values
  var trTotalSteps=trIncrement>0?Math.ceil((trEndBpm-trStartBpm)/trIncrement):1;
  var trCurrentStep=trIncrement>0?Math.floor((trCurrentBpm-trStartBpm)/trIncrement):0;
  var trProgress=trTotalSteps>0?trCurrentStep/trTotalSteps:0;

  return React.createElement("div",{style:{padding:"24px 0",maxWidth:400,margin:"0 auto"}},
    // Mode toggle
    React.createElement("div",{style:{display:"flex",gap:4,marginBottom:24,background:t.filterBg,borderRadius:10,padding:3}},
      [["metronome","Metronome"],["trainer","Tempo Trainer"]].map(function(m){
        return React.createElement("button",{key:m[0],onClick:function(){if(!playing){setMode(m[0]);}},style:{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:mode===m[0]?(t.activeTabBg||t.card):"transparent",color:mode===m[0]?t.text:t.subtle,fontSize:12,fontWeight:mode===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:playing?"default":"pointer",boxShadow:mode===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s",opacity:playing&&mode!==m[0]?0.4:1}},m[1]);
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
        return React.createElement("button",{key:i,onClick:function(){cycleBeat(i);},style:{width:32,height:32,minWidth:32,minHeight:32,flexShrink:0,borderRadius:"50%",background:bg,border:bdr,transform:"scale("+scale+")",transition:"transform 0.06s ease, background 0.06s ease, box-shadow 0.06s ease",boxShadow:shadow,cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}},
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
      React.createElement("button",{onClick:startStop,style:{flex:1,padding:"16px",borderRadius:14,border:"none",background:playing?(isStudio?"#EF4444":"#EF4444"):t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:playing?"0 4px 20px rgba(239,68,68,0.4)":"0 4px 20px "+t.accentGlow,transition:"all 0.15s",letterSpacing:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:6}},playing?IC.stopInline(14,"#fff"):IC.playInline(14,"#fff"),playing?"Stop":mode==="trainer"?"Start Training":"Start"),
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

      // Sound
      React.createElement("div",null,
        React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:8}},"SOUND"),
        React.createElement("div",{style:{display:"flex",gap:4}},
          SOUNDS.map(function(s){return React.createElement("button",{key:s.v,onClick:function(){setSound(s.v);},style:{flex:1,padding:"6px",borderRadius:6,border:"1px solid "+(sound===s.v?t.accent:t.border),background:sound===s.v?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:sound===s.v?t.accent:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:sound===s.v?600:400,cursor:"pointer"}},s.l);})))));}


// ============================================================
// MINI METRONOME — compact inline metronome for Player Practice mode
// Same Web Audio scheduler as full Metronome, compact UI
// ============================================================
function MiniMetronome({th,initBpm,syncPlaying,ctrlRef,onBpmChange,lickTempo,onSetLoop,lickTimeSig,headless,expandOpen,onExpandToggle,ciProp,setCiProp,editorMode}){
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
  var subdivision=1;
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
  useEffect(function(){beatRef.current=currentBeat;},[currentBeat]);
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
    if(snd==="silent")return;// silent mode — no metronome clicks
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
    if(ctrlRef){ctrlRef.current={start:doStart,stop:doStop,getBpm:function(){return bpmRef.current;},setBpmLive:function(v){bpmRef.current=v;setBpm(v);if(onBpmChange)onBpmChange(v);},
      tapTempo:tapTempo,changeBpm:changeBpm,
      getCurrentBeat:function(){return{beat:beatRef.current,states:beatStatesRef.current,timeSig:timeSigRef.current,playing:playingRef.current,muted:mutedRef.current};},
      cycleBeat:cycleBeat,setMuted:function(v){setMuted(v);mutedRef.current=v;},getMuted:function(){return mutedRef.current;},
      getBeatStates:function(){return beatStatesRef.current;},getTimeSig:function(){return timeSigRef.current;},
      getSound:function(){return soundRef.current;},setSound:function(v){setSound(v);soundRef.current=v;},
      getProgState:function(){return{on:progOnRef.current,target:progTargetRef.current,inc:progIncRef.current,bars:progBarsRef.current,curBpm:progCurBpmRef.current,done:progDoneRef.current};},
      setProgOn:function(v){setProgOn(v);progOnRef.current=v;},
      setProgTarget:function(v){setProgTarget(v);progTargetRef.current=v;},
      setProgInc:function(v){setProgInc(v);progIncRef.current=v;},
      setProgBars:function(v){setProgBars(v);progBarsRef.current=v;},
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
  var SOUNDS=[{v:"click",l:"Click"},{v:"wood",l:"Wood"},{v:"cowbell",l:"Bell"}];
  var chip=function(active,label,onClick){return React.createElement("button",{onClick:function(e){e.stopPropagation();onClick();},style:{padding:"3px 8px",borderRadius:6,border:"1px solid "+(active?t.accent:t.border),background:active?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:active?t.accent:t.muted,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:active?700:400,cursor:"pointer"}},label);};

  var isSynced=!!ctrlRef;

  // HEADLESS MODE: mute+dots always visible; sound/progressive/count-in only when expandOpen
  if(headless)return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:0}},
    // Main metronome bar
    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:t.settingsBg||t.filterBg,borderRadius:expandOpen?"10px 10px 0 0":10,border:"1px solid "+t.border,borderBottom:expandOpen?"1px dashed "+t.border:"1px solid "+t.border}},
      // Left: Mute + beat dots
      React.createElement("button",{onClick:function(e){e.stopPropagation();setMuted(!muted);},style:{width:28,height:28,borderRadius:7,border:muted?"1.5px dashed "+t.border:"1.5px solid "+t.accent,background:muted?t.filterBg:(isStudio?t.accent+"20":t.accent+"12"),color:muted?t.muted:t.accent,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}},muted?"\u2715":"\u266A"),
      beatStates.map(function(bs,i){
        var active=playing&&currentBeat===i;var isAcc=bs===1;var isMut=bs===2;
        var bg=isMut?(isStudio?"rgba(255,255,255,0.05)":"#F3F3F3"):active?(isAcc?t.accent:"#F59E0B"):isAcc?(isStudio?t.accent+"40":t.accent+"25"):(isStudio?t.border+"60":t.border);
        return React.createElement("button",{key:i,onClick:function(e){e.stopPropagation();cycleBeat(i);},style:{width:22,height:22,minWidth:22,minHeight:22,flexShrink:0,borderRadius:"50%",background:bg,border:isAcc?"2px solid "+t.accent:isMut?"2px dashed "+t.border:"2px solid "+(isStudio?t.border:t.borderSub||t.border),transform:active?"scale(1.2)":"scale(1)",transition:"all 0.06s",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active&&!isMut?"0 0 8px "+(isAcc?t.accentGlow:"rgba(245,158,11,0.4)"):"none"}},
          isMut&&React.createElement("span",{style:{fontSize:8,color:t.subtle,fontWeight:700}},"\u00D7"),
          isAcc&&!active&&React.createElement("span",{style:{fontSize:6,color:t.accent,fontWeight:700}},"\u25B2"));
      }),
      // Divider
      React.createElement("div",{style:{width:1,height:22,background:t.border,flexShrink:0,marginLeft:"auto"}}),
      // Right: BPM (tappable) + ± + TAP
      React.createElement("button",{onClick:function(e){e.stopPropagation();tapTempo();},style:{background:"transparent",border:"none",padding:0,cursor:"pointer",flexShrink:0}},
        React.createElement("span",{style:{fontSize:20,fontWeight:700,color:playing&&!muted?t.accent:t.text,fontFamily:"'JetBrains Mono',monospace",letterSpacing:-0.5}},bpm)),
      React.createElement("div",{style:{display:"flex",gap:2,flexShrink:0}},
        React.createElement("button",{onClick:function(e){e.stopPropagation();changeBpm(function(b){return b-5;});},style:{width:26,height:26,borderRadius:6,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u2212"),
        React.createElement("button",{onClick:function(e){e.stopPropagation();changeBpm(function(b){return b+5;});},style:{width:26,height:26,borderRadius:6,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"+")),
      !editorMode&&React.createElement("button",{onClick:function(e){e.stopPropagation();tapTempo();},style:{padding:"4px 10px",borderRadius:7,border:"1.5px solid "+t.border,background:t.card,color:t.text,fontSize:10,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",flexShrink:0}},"TAP"),
      lickTempo&&bpm!==lickTempo&&React.createElement("button",{onClick:function(e){e.stopPropagation();changeBpm(lickTempo);},style:{padding:"2px 6px",borderRadius:5,border:"none",background:"none",color:t.subtle,fontSize:9,cursor:"pointer",flexShrink:0}},"\u21A9"+lickTempo),
      // Expand chevron
      onExpandToggle&&React.createElement("button",{onClick:function(e){e.stopPropagation();onExpandToggle();},style:{width:28,height:28,borderRadius:7,background:expandOpen?t.accentBg:t.filterBg,border:"1px solid "+(expandOpen?t.accent:t.border),color:expandOpen?t.accent:t.muted,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:"auto",transition:"all 0.15s"}},expandOpen?"\u25B2":"\u25BC")),
    // Expand panel
    expandOpen&&React.createElement("div",{style:{padding:"8px 10px",background:t.settingsBg||t.filterBg,borderRadius:"0 0 10px 10px",border:"1px solid "+t.border,borderTop:"none",display:"flex",flexDirection:"column",gap:6}},
      // Count-in + Click sound
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}},
        React.createElement("button",{onClick:function(e){e.stopPropagation();},style:{padding:"3px 8px",borderRadius:6,border:"1px solid "+(isSynced?"transparent":t.border),background:"transparent",color:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:500,cursor:"default"}},"Click:"),
        SOUNDS.map(function(s){return React.createElement("button",{key:s.v,onClick:function(e){e.stopPropagation();setSound(s.v);},style:{padding:"3px 8px",borderRadius:6,border:"1px solid "+(sound===s.v?t.accent:t.border),background:sound===s.v?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:sound===s.v?t.accent:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:sound===s.v?600:400,cursor:"pointer"}},s.l);})),
      // Progressive trainer
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}},
        chip(progOn,"Progressive",function(){var nv=!progOn;setProgOn(nv);if(nv&&isSynced&&onSetLoop)onSetLoop(true);}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"\u2192"),
        progOn&&React.createElement("input",{type:"number",value:progTarget,onClick:function(e){e.stopPropagation();},onChange:function(e){e.stopPropagation();setProgTarget(parseInt(e.target.value)||180);},style:{width:40,padding:"3px 4px",borderRadius:5,border:"1px solid "+t.border,background:t.filterBg,color:t.accent,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center",fontWeight:600}}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"+"),
        progOn&&React.createElement("input",{type:"number",value:progInc,onClick:function(e){e.stopPropagation();},onChange:function(e){e.stopPropagation();setProgInc(parseInt(e.target.value)||5);},style:{width:28,padding:"3px 4px",borderRadius:5,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},"/"),
        progOn&&React.createElement("input",{type:"number",value:progBars,onClick:function(e){e.stopPropagation();},onChange:function(e){e.stopPropagation();setProgBars(Math.max(1,parseInt(e.target.value)||1));},style:{width:24,padding:"3px 4px",borderRadius:5,border:"1px solid "+t.border,background:t.filterBg,color:t.text,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}),
        progOn&&React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},isSynced?"loops":"bars")),
      progOn&&playing&&React.createElement("div",{style:{fontSize:10,color:progDone?"#22D89E":t.accent,fontFamily:"'Inter',sans-serif",fontWeight:500}},
        progDone?"\u2713 Target reached! "+progTarget+" BPM":(isSynced?"Loop ":"Bar ")+(progBarInStep+1)+"/"+progBars+" \u00B7 "+progCurBpm+" BPM"),
      setCiProp&&React.createElement("button",{onClick:function(e){e.stopPropagation();setCiProp(!ciProp);},style:{padding:"4px 10px",borderRadius:6,border:"1px solid "+(ciProp?t.accent:t.border),background:ciProp?(isStudio?t.accent+"20":t.accent+"10"):t.filterBg,color:ciProp?t.accent:t.muted,fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:500,cursor:"pointer"}},"Count-in "+(ciProp?"\u2713":"\u2717"))));

  // Full-mode (non-headless) rendering below
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
        return React.createElement("button",{key:i,onClick:function(e){e.stopPropagation();cycleBeat(i);},style:{width:22,height:22,minWidth:22,minHeight:22,flexShrink:0,borderRadius:"50%",background:bg,border:isAcc?"2px solid "+t.accent:isMut?"2px dashed "+t.border:"2px solid "+(isStudio?t.border:t.borderSub||t.border),transform:active?"scale(1.2)":"scale(1)",transition:"all 0.06s",boxShadow:active&&!isMut?"0 0 10px "+(isAcc?t.accentGlow:"rgba(245,158,11,0.4)"):"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}},
          isMut&&React.createElement("span",{style:{fontSize:8,color:t.subtle,fontWeight:700}},"\u00D7"),
          isAcc&&!active&&React.createElement("span",{style:{fontSize:6,color:t.accent,fontWeight:700}},"\u25B2"));
      }),
      React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",marginLeft:4}},timeSig[0]+"/"+timeSig[1])),

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
          React.createElement("button",{onClick:function(){playPreview(pattern,true);},style:{padding:"12px 16px",borderRadius:14,border:"2px solid "+t.border,background:t.card,color:t.text,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},IC.playInline(14,t.text)),
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
      React.createElement("button",{onClick:generateReady,style:{width:"100%",padding:"16px",borderRadius:14,border:"none",background:t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 20px "+t.accentGlow,letterSpacing:0.5}},IC.playInline(14,"#fff"),"Generate Rhythm"));
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
        React.createElement("button",{onClick:function(){if(!isListening)startGame(false);},style:{width:"100%",padding:"16px",borderRadius:14,border:"none",background:isListening?t.subtle:t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",boxShadow:isListening?"none":"0 4px 20px "+t.accentGlow,letterSpacing:0.5,opacity:isListening?0.5:1}},IC.playInline(14,"#fff"),"Tap Solo"),
        // Secondary row
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{onClick:function(){if(!isListening)playPreview(pattern);},style:{flex:1,padding:"12px",borderRadius:10,border:"1px solid "+(isListening?t.accent:t.border),background:isListening?(isStudio?t.accent+"15":t.accent+"08"):t.filterBg,color:isListening?t.accent:t.text,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",opacity:isListening?0.7:1}},isListening?"...":"Listen"),
          React.createElement("button",{onClick:function(){if(!isListening)startGame(true);},style:{flex:1,padding:"12px",borderRadius:10,border:"1px solid "+(isListening?t.subtle:t.accent+"40"),background:isListening?t.filterBg:(isStudio?t.accent+"08":t.accent+"06"),color:isListening?t.subtle:t.accent,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:isListening?"default":"pointer",opacity:isListening?0.5:1}},IC.playInline(12,isListening?t.subtle:t.accent),"Guide")),
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
        React.createElement("button",{onClick:startPlay,style:{flex:1,padding:"16px",borderRadius:14,border:"none",background:t.accent,color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 4px 20px "+t.accentGlow,letterSpacing:0.5}},IC.playInline(14,"#fff"),"Start")));
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
    (phase==="playing"||isDemo)&&React.createElement("button",{onClick:stopPlay,style:{width:"100%",marginTop:10,padding:"10px",borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.muted,fontSize:11,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},IC.stopInline(11,t.muted),isDemo?"Stop Demo":"Stop"));
}


// ============================================================
// SCALES & CHORDS TRAINER
// ============================================================
var SCALE_CATS=[
  {id:"modes",label:"Modes",scales:["Ionian","Dorian","Phrygian","Lydian","Mixolydian","Aeolian","Locrian"]},
  {id:"mel",label:"Melodic",scales:["Melodic Minor","Lydian Dominant","Altered","Super Locrian"]},
  {id:"harm",label:"Harmonic",scales:["Harmonic Minor","Mixolydian b9 b13"]},
  {id:"pent",label:"Pentatonic",scales:["Major Pentatonic","Minor Pentatonic","Blues"]},
  {id:"sym",label:"Symmetric",scales:["Whole Tone","HW Diminished","WH Diminished"]},
  {id:"bop",label:"Bebop",scales:["Bebop Dominant","Bebop Major"]},
];
var SCALE_ROOTS=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
var SCALE_ROOT_ROW1=["C","Db","D","Eb","E","F"];
var SCALE_ROOT_ROW2=["F#","G","Ab","A","Bb","B"];

// Comfortable low MIDI note per instrument (WRITTEN pitch) for scale display
// Comfortable starting MIDI for one-octave scale display (written pitch)
var INST_LOW_MIDI={"Concert":60,"Alto Sax":58,"Soprano Sax":58,"Tenor Sax":58,"Baritone Sax":58,"Bb Trumpet":58,"Trumpet":58,"Clarinet":52,"Trombone":48,"Piano":60,"Guitar":52,"Bass":36,"Flute":60,"Vibes":53,"Violin":55,"Vocals":60};
// Actual instrument full range (written pitch) for full-range view
var INST_RANGE_LOW={"Concert":48,"Alto Sax":58,"Soprano Sax":58,"Tenor Sax":58,"Baritone Sax":58,"Bb Trumpet":54,"Trumpet":54,"Clarinet":52,"Trombone":40,"Piano":36,"Guitar":40,"Bass":28,"Flute":60,"Vibes":53,"Violin":55,"Vocals":48};
var INST_RANGE_HIGH={"Concert":96,"Alto Sax":90,"Soprano Sax":90,"Tenor Sax":90,"Baritone Sax":90,"Bb Trumpet":84,"Trumpet":84,"Clarinet":94,"Trombone":70,"Piano":96,"Guitar":88,"Bass":55,"Flute":96,"Vibes":89,"Violin":100,"Vocals":79};

function buildScaleAbc(rootName,scaleDef,baseMidi,useBassClef){
  if(!scaleDef)return null;
  var LETTERS=["C","D","E","F","G","A","B"];
  var LET_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  // Parse root
  var rootLetter=rootName[0];
  var rootAcc=0;
  if(rootName.includes("b"))rootAcc=-1;if(rootName.includes("#"))rootAcc=1;
  var rootPc=((LET_PC[rootLetter]+rootAcc)%12+12)%12;
  var rootLetIdx=LETTERS.indexOf(rootLetter);

  // For 7-note scales: assign sequential letters from root
  // For other sizes: pick best letter per note
  var noteCount=scaleDef.notes.length;
  var is7=noteCount===7;
  var spellings=[];// {letter, acc, pc}

  for(var ni=0;ni<noteCount;ni++){
    var interval=scaleDef.notes[ni];
    var pc=(rootPc+interval)%12;

    if(is7){
      // 7-note: degree ni gets letter (rootLetIdx + ni) % 7
      var li=(rootLetIdx+ni)%7;
      var letter=LETTERS[li];
      var natPc=LET_PC[letter];
      var acc=((pc-natPc)%12+12)%12;
      if(acc>6)acc=acc-12;// prefer flats: +11 → -1
      spellings.push({letter:letter,acc:acc,pc:pc});
    }else{
      // Non-7-note: find closest letter name
      // Try natural, then sharp, then flat
      var bestLetter=null,bestAcc=0,bestDist=99;
      for(var li2=0;li2<7;li2++){
        var let2=LETTERS[li2];
        var nat=LET_PC[let2];
        var a=((pc-nat)%12+12)%12;
        if(a>6)a=a-12;
        if(Math.abs(a)<=1&&Math.abs(a)<bestDist){
          bestDist=Math.abs(a);bestLetter=let2;bestAcc=a;
        }
      }
      if(!bestLetter){bestLetter="C";bestAcc=0;}// fallback
      // Avoid duplicate letters: check if previous note uses same letter
      if(spellings.length>0&&spellings[spellings.length-1].letter===bestLetter){
        // Try next letter up with flat
        var altLi=(LETTERS.indexOf(bestLetter)+1)%7;
        var altLetter=LETTERS[altLi];
        var altNat=LET_PC[altLetter];
        var altAcc=((pc-altNat)%12+12)%12;
        if(altAcc>6)altAcc=altAcc-12;
        if(Math.abs(altAcc)<=1){bestLetter=altLetter;bestAcc=altAcc;}
      }
      spellings.push({letter:bestLetter,acc:bestAcc,pc:pc});
    }
  }
  // Add octave root
  spellings.push({letter:rootLetter,acc:rootAcc,pc:rootPc});

  // Find starting octave
  var base=baseMidi||60;
  var rootMidi=rootPc+Math.floor(base/12)*12;
  if(rootMidi<base)rootMidi+=12;
  if(rootMidi>84)rootMidi-=12;

  // Build ABC and MIDI — track accidentals per letter to handle ABC bar rules
  var abcNotes=[];var midis=[];
  var usedAcc={};// letter → last accidental used
  for(var si=0;si<=noteCount;si++){
    var sp=spellings[si];
    var interval2=si<noteCount?scaleDef.notes[si]:12;
    var midi=rootMidi+interval2;midis.push(midi);
    var oct=Math.floor((midi-LET_PC[sp.letter]-sp.acc)/12)-1;
    // Determine if we need explicit accidental
    var needsAcc=false;var abcAcc="";
    if(sp.acc!==0){
      // Always mark sharps/flats
      abcAcc=sp.acc>1?"^^":sp.acc===1?"^":sp.acc===-1?"_":"__";
      needsAcc=true;
    }else if(usedAcc[sp.letter]!==undefined&&usedAcc[sp.letter]!==0){
      // Same letter was previously altered, need explicit natural
      abcAcc="=";needsAcc=true;
    }
    usedAcc[sp.letter]=sp.acc;
    var abcN="";
    if(oct>=5){abcN=(needsAcc?abcAcc:"")+sp.letter.toLowerCase();for(var oi=6;oi<=oct;oi++)abcN+="'";}
    else{abcN=(needsAcc?abcAcc:"")+sp.letter.toUpperCase();for(var oi2=3;oi2>=oct;oi2--)abcN+=",";}
    abcNotes.push(abcN);
  }
  var clefStr=useBassClef?" clef=bass":"";
  var nNotes=abcNotes.length;
  var abcHeader="X:1\n%%stretchlast true\n%%notespacingfactor 1.8\nM:"+nNotes+"/1\nL:1\nK:C"+clefStr+"\n";
  return{abc:abcHeader+abcNotes.join(" ")+" |",midis:midis,intervals:scaleDef.notes.concat([0])};
}

// Build scale across full instrument range (multi-octave)
function buildFullRangeScaleAbc(rootName,scaleDef,lowMidi,highMidi,useBassClef){
  if(!scaleDef)return null;
  var LETTERS=["C","D","E","F","G","A","B"];
  var LET_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  var rootLetter=rootName[0];
  var rootAcc=0;
  if(rootName.includes("b"))rootAcc=-1;if(rootName.includes("#"))rootAcc=1;
  var rootPc=((LET_PC[rootLetter]+rootAcc)%12+12)%12;
  var rootLetIdx=LETTERS.indexOf(rootLetter);
  var is7=scaleDef.notes.length===7;

  // Build spelling map
  var spellMap={};
  for(var ni=0;ni<scaleDef.notes.length;ni++){
    var pc=(rootPc+scaleDef.notes[ni])%12;
    if(is7){
      var li=(rootLetIdx+ni)%7;var letter=LETTERS[li];
      var acc=((pc-LET_PC[letter])%12+12)%12;if(acc>6)acc=acc-12;
      spellMap[scaleDef.notes[ni]%12]=spellMap[scaleDef.notes[ni]%12]||{letter:letter,acc:acc};
    }else{
      var bestL=null,bestA=0,bestD=99;
      for(var li2=0;li2<7;li2++){var l2=LETTERS[li2];var n2=LET_PC[l2];var a2=((pc-n2)%12+12)%12;if(a2>6)a2=a2-12;if(Math.abs(a2)<=1&&Math.abs(a2)<bestD){bestD=Math.abs(a2);bestL=l2;bestA=a2;}}
      spellMap[scaleDef.notes[ni]%12]=spellMap[scaleDef.notes[ni]%12]||{letter:bestL||"C",acc:bestA};
    }
  }
  spellMap[0]=spellMap[0]||{letter:rootLetter,acc:rootAcc};

  function midiToAbc(m,usedAcc){
    var iv=((m-rootPc)%12+12)%12;
    var sp=spellMap[iv];if(!sp)return null;
    var oct=Math.floor((m-LET_PC[sp.letter]-sp.acc)/12)-1;
    var needsAcc=false;var abcAcc="";
    if(sp.acc!==0){abcAcc=sp.acc>1?"^^":sp.acc===1?"^":sp.acc===-1?"_":"__";needsAcc=true;}
    else if(usedAcc[sp.letter]!==undefined&&usedAcc[sp.letter]!==0){abcAcc="=";needsAcc=true;}
    usedAcc[sp.letter]=sp.acc;
    var abcN="";
    if(oct>=5){abcN=(needsAcc?abcAcc:"")+sp.letter.toLowerCase();for(var oi=6;oi<=oct;oi++)abcN+="'";}
    else{abcN=(needsAcc?abcAcc:"")+sp.letter.toUpperCase();for(var oi2=3;oi2>=oct;oi2--)abcN+=",";}
    return abcN;
  }

  // 1. Collect ALL scale tones in range (ascending, low to high)
  var lowestOct=Math.floor(lowMidi/12)*12;
  var allAsc=[];
  for(var oct2=lowestOct;oct2<=highMidi;oct2+=12){
    for(var si=0;si<scaleDef.notes.length;si++){
      var m=oct2+rootPc+scaleDef.notes[si];
      if(m<lowMidi||m>highMidi)continue;
      allAsc.push(m);
    }
  }
  // Dedupe and sort
  allAsc=Array.from(new Set(allAsc)).sort(function(a,b){return a-b;});
  if(allAsc.length<3)return null;

  // 2. Find starting note: lowest root in range
  var startIdx=0;
  for(var i=0;i<allAsc.length;i++){
    var iv2=((allAsc[i]-rootPc)%12+12)%12;
    if(iv2===0){startIdx=i;break;}
  }

  // 3. Build path: start → top, top → bottom (no repeat), bottom → start (no repeat)
  var path=[];
  // Ascending from start to top
  for(var i2=startIdx;i2<allAsc.length;i2++)path.push(allAsc[i2]);
  // Descending from top-1 to bottom
  for(var i3=allAsc.length-2;i3>=0;i3--)path.push(allAsc[i3]);
  // Ascending from bottom+1 back to start
  for(var i4=1;i4<=startIdx;i4++)path.push(allAsc[i4]);

  // 4. Generate ABC: 4/4, 8th notes, beamed in 4s, bar lines every 8 notes
  var usedAcc2={};var noteStrs=[];var nc=0;
  for(var i5=0;i5<path.length;i5++){
    var abcN=midiToAbc(path[i5],usedAcc2);
    if(!abcN)continue;
    noteStrs.push(abcN);nc++;
    if(nc%8===0&&i5<path.length-1){noteStrs.push("|");usedAcc2={};}
  }
  // Join: no space within 4-note beam groups, space between groups, space around barlines
  var abcBody="";var beamCount=0;
  for(var j=0;j<noteStrs.length;j++){
    if(noteStrs[j]==="|"){abcBody+=" | ";beamCount=0;continue;}
    if(beamCount>0&&beamCount%4===0)abcBody+=" ";
    abcBody+=noteStrs[j];
    beamCount++;
  }

  var clefStr=useBassClef?" clef=bass":"";
  var abc="X:1\nM:4/4\nL:1/8\nK:C"+clefStr+"\n"+abcBody+" |";
  return{abc:abc,midis:path,intervals:path.map(function(m){return((m-rootPc)%12+12)%12;})};
}

// Fullscreen scale range viewer
function FullRangeScaleView({rootName,scaleDef,scaleName,lowMidi,highMidi,useBassClef,instOff,th,onClose}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var notRef=useRef(null);var audioCtxRef=useRef(null);var playingRef=useRef(false);var timerRef=useRef(null);var mountedRef=useRef(true);
  var _playIdx=useState(-1),playIdx=_playIdx[0],setPlayIdx=_playIdx[1];
  useEffect(function(){mountedRef.current=true;return function(){mountedRef.current=false;playingRef.current=false;if(timerRef.current)clearTimeout(timerRef.current);};},[]);
  var data=useMemo(function(){return buildFullRangeScaleAbc(rootName,scaleDef,lowMidi,highMidi,useBassClef);},[rootName,scaleDef,lowMidi,highMidi,useBassClef]);

  var getAudioCtx=function(){if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();return audioCtxRef.current;};
  var playMidi=function(midi,dur){try{var ctx=getAudioCtx();if(ctx.state==="suspended")ctx.resume();var osc=ctx.createOscillator();var gain=ctx.createGain();osc.type="triangle";osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(0.25,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+(dur||0.4));osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+(dur||0.4));}catch(e){}};
  var playAll=function(){if(playingRef.current||!data||!data.midis)return;playingRef.current=true;var midis=data.midis.map(function(m){return m-instOff;});var i=0;
    var step=function(){if(!mountedRef.current||i>=midis.length){playingRef.current=false;if(mountedRef.current)setPlayIdx(-1);return;}if(mountedRef.current)setPlayIdx(i);playMidi(midis[i],0.18);i++;timerRef.current=setTimeout(step,200);};step();};

  // Render notation
  useEffect(function(){
    if(!notRef.current||!data||!data.abc||!window.ABCJS)return;
    try{
      notRef.current.innerHTML="";
      window.ABCJS.renderAbc(notRef.current,data.abc,{paddingtop:6,paddingbottom:6,paddingleft:0,paddingright:0,add_classes:true,responsive:"resize",staffwidth:500,wrap:{minSpacing:1.0,maxSpacing:1.8,preferredMeasuresPerLine:2}});
      var svg=notRef.current.querySelector("svg");
      if(svg){
        svg.style.maxWidth="100%";svg.style.overflow="visible";
        var stCol=isStudio?"#F2F2FA":"#1A1A1A";
        svg.querySelectorAll("path").forEach(function(p){p.setAttribute("fill",stCol);p.setAttribute("stroke",stCol);});
        svg.querySelectorAll(".abcjs-staff path").forEach(function(p){p.setAttribute("stroke",t.staffStroke);p.setAttribute("fill","none");p.setAttribute("stroke-width","0.4");});
        svg.querySelectorAll(".abcjs-staff-extra path").forEach(function(p){p.setAttribute("stroke",isStudio?t.staffStroke:t.muted);p.setAttribute("fill",isStudio?t.staffStroke:t.muted);p.setAttribute("stroke-width","0.5");});
        svg.querySelectorAll(".abcjs-bar path").forEach(function(p){p.setAttribute("stroke",t.barStroke);p.setAttribute("stroke-width","0.6");});
        svg.querySelectorAll("text.abcjs-chord,text.abcjs-title,.abcjs-meta-top").forEach(function(el){el.style.display="none";});
        svg.querySelectorAll(".abcjs-time-signature path").forEach(function(p){p.setAttribute("fill",stCol);});
        var noteEls=svg.querySelectorAll(".abcjs-note");
        noteEls.forEach(function(noteEl,ni){
          noteEl.style.cursor="pointer";
          noteEl.addEventListener("click",function(e){e.stopPropagation();if(data.midis[ni])playMidi(data.midis[ni]-instOff,0.5);});
        });
      }
    }catch(e){}
  },[data]);

  // Highlight
  useEffect(function(){
    if(!notRef.current)return;var svg=notRef.current.querySelector("svg");if(!svg)return;
    var noteEls=svg.querySelectorAll(".abcjs-note");
    var stCol=isStudio?"#F2F2FA":"#1A1A1A";
    noteEls.forEach(function(el,i){
      var isActive=i===playIdx;
      el.style.opacity=playIdx>=0?(isActive?"1":"0.3"):"1";
      el.style.transition="opacity 0.1s";
      el.style.filter=isActive?"drop-shadow(0 0 6px "+t.accent+"90)":"none";
      el.querySelectorAll("path,circle,ellipse").forEach(function(p){p.setAttribute("fill",isActive?t.accent:stCol);p.setAttribute("stroke",isActive?t.accent:stCol);});
    });
  },[playIdx]);

  return React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:2000,background:t.bg,display:"flex",flexDirection:"column"}},
    // Header
    React.createElement("div",{style:{padding:"10px 16px",paddingTop:"calc(env(safe-area-inset-top, 0px) + 10px)",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+t.border,flexShrink:0}},
      React.createElement("div",null,
        React.createElement("div",{style:{fontSize:16,fontWeight:700,color:t.text,fontFamily:t.titleFont}},rootName+" "+scaleName),
        React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace"}},data?data.midis.length+" notes · ↑↓":"...")),
      React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},
        React.createElement("button",{onClick:playAll,style:{width:36,height:36,borderRadius:10,background:isStudio?t.playBg:t.accent,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 10px "+t.accentGlow}},
          React.createElement("div",{style:{width:0,height:0,borderTop:"7px solid transparent",borderBottom:"7px solid transparent",borderLeft:"12px solid #fff",marginLeft:2}})),
        React.createElement("button",{onClick:onClose,style:{width:30,height:30,borderRadius:8,background:t.filterBg,border:"1px solid "+t.border,color:t.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u00D7"))),
    // Scrollable notation
    React.createElement("div",{style:{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:16}},
      React.createElement("div",{ref:notRef,style:{background:t.noteBg,borderRadius:12,padding:"12px 16px",border:"1px solid "+(isStudio?t.staffStroke+"30":t.borderSub||t.border)}})));
}

function ScaleChordTrainer({th,userInst}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var transKey=instToTransKey(userInst);
  var instOff=INST_TRANS[transKey]||0;
  var isBassClef=BASS_CLEF_INSTS.has(userInst);
  var instLowMidi=INST_LOW_MIDI[userInst]||INST_LOW_MIDI[transKey]||48;
  var instRangeLow=INST_RANGE_LOW[userInst]||INST_RANGE_LOW[transKey]||48;
  var instRangeHigh=INST_RANGE_HIGH[userInst]||INST_RANGE_HIGH[transKey]||84;
  var _sub=useState("scales"),sub=_sub[0],setSub=_sub[1];
  var _root=useState("C"),root=_root[0],setRoot=_root[1];
  var _cat=useState("modes"),cat=_cat[0],setCat=_cat[1];
  var _scale=useState("Ionian"),scaleName=_scale[0],setScaleName=_scale[1];
  var _octOff=useState(0),octOff=_octOff[0],setOctOff=_octOff[1];
  var _fullRange=useState(false),showFullRange=_fullRange[0],setShowFullRange=_fullRange[1];
  var notRef=useRef(null);var wrapRef=useRef(null);var audioCtxRef=useRef(null);var playingRef=useRef(false);var timerRef=useRef(null);var mountedRef=useRef(true);
  var _playIdx=useState(-1),playIdx=_playIdx[0],setPlayIdx=_playIdx[1];
  var _tapped=useState(-1),tappedIdx=_tapped[0],setTappedIdx=_tapped[1];var tapTimerRef=useRef(null);

  useEffect(function(){mountedRef.current=true;return function(){mountedRef.current=false;playingRef.current=false;if(timerRef.current)clearTimeout(timerRef.current);};},[]);

  useEffect(function(){
    for(var i=0;i<SCALE_CATS.length;i++){if(SCALE_CATS[i].id===cat){setScaleName(SCALE_CATS[i].scales[0]);break;}}
  },[cat]);

  useEffect(function(){setOctOff(0);},[userInst]);

  // Find scale def
  var scaleDef=null;
  for(var si=0;si<SCALE_DEFS.length;si++){if(SCALE_DEFS[si].name===scaleName){scaleDef=SCALE_DEFS[si];break;}}

  // Root = written key (what the player reads). Notation shows this directly.
  // Playback transposes to concert pitch by subtracting instOff from MIDI.
  var baseMidi=instLowMidi+octOff*12;
  var scaleData=useMemo(function(){return buildScaleAbc(root,scaleDef,baseMidi,isBassClef);},[root,scaleDef,baseMidi,isBassClef]);

  // Interval labels
  var ivLabels=["R","b2","2","b3","3","4","b5","5","b5+","6","b7","7","R"];

  // Audio
  var getAudioCtx=function(){if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();return audioCtxRef.current;};
  var playMidi=function(midi,dur){try{var ctx=getAudioCtx();if(ctx.state==="suspended")ctx.resume();var osc=ctx.createOscillator();var gain=ctx.createGain();osc.type="triangle";osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(0.25,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+(dur||0.5));osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+(dur||0.5));}catch(e){}};
  var tapNote=function(ni){
    if(scaleData&&scaleData.midis&&scaleData.midis[ni]){var m=scaleData.midis[ni]-instOff;playMidi(m,0.5);}
    setTappedIdx(ni);if(tapTimerRef.current)clearTimeout(tapTimerRef.current);
    tapTimerRef.current=setTimeout(function(){if(mountedRef.current)setTappedIdx(-1);},600);
  };
  var playScale=function(){if(playingRef.current||!scaleData||!scaleData.midis)return;playingRef.current=true;var midis=scaleData.midis.map(function(m){return m-instOff;});var i=0;
    var step=function(){if(!mountedRef.current||i>=midis.length){playingRef.current=false;if(mountedRef.current)setPlayIdx(-1);return;}if(mountedRef.current)setPlayIdx(i);playMidi(midis[i],0.35);i++;timerRef.current=setTimeout(step,400);};step();};

  // Render notation
  var _notePos=useState(null),notePositions=_notePos[0],setNotePositions=_notePos[1];
  useEffect(function(){
    if(!notRef.current||!scaleData||!scaleData.abc||!window.ABCJS)return;
    try{
      notRef.current.innerHTML="";
      window.ABCJS.renderAbc(notRef.current,scaleData.abc,{paddingtop:4,paddingbottom:2,paddingleft:0,paddingright:0,add_classes:true,responsive:"resize",staffwidth:340,stretchlast:true});
      var svg=notRef.current.querySelector("svg");
      if(svg){
        svg.style.maxWidth="100%";svg.style.overflow="visible";
        var stCol=isStudio?"#F2F2FA":"#1A1A1A";
        svg.querySelectorAll("path").forEach(function(p){p.setAttribute("fill",stCol);p.setAttribute("stroke",stCol);});
        svg.querySelectorAll(".abcjs-staff path").forEach(function(p){p.setAttribute("stroke",t.staffStroke);p.setAttribute("fill","none");p.setAttribute("stroke-width","0.4");});
        svg.querySelectorAll(".abcjs-staff-extra path").forEach(function(p){p.setAttribute("stroke",isStudio?t.staffStroke:t.muted);p.setAttribute("fill",isStudio?t.staffStroke:t.muted);p.setAttribute("stroke-width","0.5");});
        svg.querySelectorAll(".abcjs-bar path").forEach(function(p){p.style.display="none";});
        svg.querySelectorAll("text.abcjs-chord,text.abcjs-title,.abcjs-meta-top,.abcjs-time-signature").forEach(function(el){el.style.display="none";});
        var noteEls=svg.querySelectorAll(".abcjs-note");
        // Capture note center-x positions as percentages of wrapper width
        var wrapEl=wrapRef.current||notRef.current.parentElement;
        var wrapRect=wrapEl.getBoundingClientRect();
        var positions=[];
        noteEls.forEach(function(noteEl,ni){
          noteEl.style.cursor="pointer";
          noteEl.addEventListener("click",function(e){e.stopPropagation();tapNote(ni);});
          // Find notehead (ellipse) to center on it, not on note+accidental
          var head=noteEl.querySelector("ellipse")||noteEl.querySelector("circle");
          var r=head?head.getBoundingClientRect():noteEl.getBoundingClientRect();
          var cx=r.left+r.width/2-wrapRect.left;
          positions.push(cx/wrapRect.width*100);
        });
        setNotePositions(positions);
      }
    }catch(e){console.warn("ScaleChordTrainer render:",e);}
  },[scaleData]);

  // Highlight playing/tapped note
  useEffect(function(){
    if(!notRef.current)return;var svg=notRef.current.querySelector("svg");if(!svg)return;
    var noteEls=svg.querySelectorAll(".abcjs-note");
    var activeIdx=tappedIdx>=0?tappedIdx:playIdx;
    var stCol=isStudio?"#F2F2FA":"#1A1A1A";
    noteEls.forEach(function(el,i){
      var isActive=i===activeIdx;
      el.style.opacity=activeIdx>=0?(isActive?"1":"0.35"):"1";
      el.style.transition="opacity 0.15s";
      el.style.filter=isActive?"drop-shadow(0 0 8px "+t.accent+"90)":"none";
      el.querySelectorAll("path,circle,ellipse").forEach(function(p){p.setAttribute("fill",isActive?t.accent:stCol);p.setAttribute("stroke",isActive?t.accent:stCol);});
    });
  },[playIdx,tappedIdx]);

  // Active cat scales
  var activeCatObj=null;
  for(var ci=0;ci<SCALE_CATS.length;ci++){if(SCALE_CATS[ci].id===cat){activeCatObj=SCALE_CATS[ci];break;}}

  return React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
    // Sub-tabs: Scales | Chords
    React.createElement("div",{style:{display:"flex",gap:3,background:t.filterBg,borderRadius:8,padding:2}},
      [["scales","Scales"],["chords","Chords"]].map(function(m){
        var active=sub===m[0];
        return React.createElement("button",{key:m[0],onClick:function(){setSub(m[0]);},style:{flex:1,padding:"6px 10px",borderRadius:6,border:"none",background:active?(t.activeTabBg||t.card):"transparent",color:active?t.text:t.subtle,fontSize:11,fontWeight:active?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:active?"0 1px 3px rgba(0,0,0,0.06)":"none",transition:"all 0.15s"}},m[1]);})),

    sub==="scales"&&React.createElement("div",{style:{background:t.card,borderRadius:14,padding:16,border:"1px solid "+t.border}},
      // Root selector
      React.createElement("div",{style:{marginBottom:12}},
        React.createElement("div",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:6}},"ROOT"),
        React.createElement("div",{style:{display:"flex",gap:3,marginBottom:3}},
          SCALE_ROOT_ROW1.map(function(k){
            var active=root===k;
            return React.createElement("button",{key:k,onClick:function(){setRoot(k);},style:{flex:1,padding:"7px 2px",borderRadius:7,border:active?"1.5px solid "+t.accent:"1px solid "+t.border,
              fontSize:12,fontFamily:"'JetBrains Mono',monospace",fontWeight:active?700:500,
              background:active?t.accent+"18":(isStudio?"#ffffff06":"#F5F4F0"),
              color:active?t.accent:(isStudio?"#ccc":"#444"),cursor:"pointer",transition:"all 0.1s"}},k);})),
        React.createElement("div",{style:{display:"flex",gap:3}},
          SCALE_ROOT_ROW2.map(function(k){
            var active=root===k;
            return React.createElement("button",{key:k,onClick:function(){setRoot(k);},style:{flex:1,padding:"7px 2px",borderRadius:7,border:active?"1.5px solid "+t.accent:"1px solid "+t.border,
              fontSize:12,fontFamily:"'JetBrains Mono',monospace",fontWeight:active?700:500,
              background:active?t.accent+"18":(isStudio?"#ffffff06":"#F5F4F0"),
              color:active?t.accent:(isStudio?"#ccc":"#444"),cursor:"pointer",transition:"all 0.1s"}},k);}))),

      // Scale category tabs
      React.createElement("div",{style:{marginBottom:10}},
        React.createElement("div",{style:{fontSize:9,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:6}},"SCALE TYPE"),
        React.createElement("div",{style:{display:"flex",gap:3,overflowX:"auto",scrollbarWidth:"none",marginBottom:8}},
          SCALE_CATS.map(function(c){
            var active=cat===c.id;
            return React.createElement("button",{key:c.id,onClick:function(){setCat(c.id);},style:{padding:"5px 10px",borderRadius:7,border:active?"1.5px solid "+t.accent:"1px solid "+t.border,
              fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:active?700:500,whiteSpace:"nowrap",
              background:active?t.accent+"18":(isStudio?"#ffffff06":"#F5F4F0"),
              color:active?t.accent:(isStudio?"#ccc":"#666"),cursor:"pointer",flexShrink:0,transition:"all 0.1s"}},c.label);})),
        // Scale buttons within category
        activeCatObj&&React.createElement("div",{style:{display:"flex",gap:3,flexWrap:"wrap"}},
          activeCatObj.scales.map(function(sn){
            var active=scaleName===sn;
            return React.createElement("button",{key:sn,onClick:function(){setScaleName(sn);},style:{padding:"6px 12px",borderRadius:8,border:"none",
              fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:active?700:400,
              background:active?(isStudio?t.accent+"25":t.accent+"12"):(isStudio?"#ffffff08":t.filterBg),
              color:active?t.accent:t.text,cursor:"pointer",transition:"all 0.15s"}},sn);}))),

      // Title + Octave controls + Play
      React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,marginTop:4}},
        React.createElement("div",{style:{minWidth:0,flex:1}},
          React.createElement("span",{style:{fontSize:16,fontWeight:700,color:t.text,fontFamily:t.titleFont}},root+" "+scaleName),
          scaleDef&&React.createElement("span",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",marginLeft:8}},scaleDef.notes.length+" notes")),
        // Octave controls + Play
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:4,flexShrink:0}},
          React.createElement("button",{onClick:function(){setOctOff(octOff-1);},disabled:baseMidi-12<24,style:{width:28,height:28,borderRadius:7,border:"1px solid "+t.border,background:t.filterBg,color:baseMidi-12<24?t.subtle:t.text,fontSize:11,cursor:baseMidi-12<24?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",opacity:baseMidi-12<24?0.4:1}},"\u2212"),
          React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace",minWidth:20,textAlign:"center"}},octOff===0?"8va":octOff>0?"+"+octOff:octOff),
          React.createElement("button",{onClick:function(){setOctOff(octOff+1);},disabled:baseMidi+12>84,style:{width:28,height:28,borderRadius:7,border:"1px solid "+t.border,background:t.filterBg,color:baseMidi+12>84?t.subtle:t.text,fontSize:11,cursor:baseMidi+12>84?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",opacity:baseMidi+12>84?0.4:1}},"+"),
          React.createElement("button",{onClick:playScale,style:{width:36,height:36,borderRadius:10,background:isStudio?t.playBg:t.accent,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 12px "+t.accentGlow}},
            React.createElement("div",{style:{width:0,height:0,borderTop:"7px solid transparent",borderBottom:"7px solid transparent",borderLeft:"12px solid #fff",marginLeft:2}})))),

      // Notation (interval labels are injected into SVG)
      React.createElement("div",{ref:wrapRef,style:{position:"relative",marginBottom:8}},
        React.createElement("div",{ref:notRef,style:{background:isStudio?t.noteBg:t.noteBg,borderRadius:10,padding:"8px 12px",border:"1px solid "+(isStudio?t.staffStroke+"30":t.borderSub||t.border),minHeight:60}}),
        // Interval labels — absolutely positioned to match note x-positions
        scaleData&&notePositions&&notePositions.length>0&&React.createElement("div",{style:{position:"relative",height:28,marginTop:4}},
          scaleData.intervals.map(function(iv,idx){
            if(idx>=notePositions.length)return null;
            var label=iv===0?(idx===0?"R":"R"):ivLabels[iv]||iv;
            var isRoot=iv===0;
            var isActive=tappedIdx===idx||playIdx===idx;
            return React.createElement("div",{key:idx,onClick:function(){tapNote(idx);},style:{position:"absolute",left:notePositions[idx]+"%",transform:"translateX(-50%)",cursor:"pointer",padding:"3px 5px",borderRadius:6,background:isActive?t.accent+"15":"transparent",transition:"all 0.15s"}},
              React.createElement("span",{style:{fontSize:11,fontWeight:isRoot?700:500,color:isActive?t.accent:isRoot?t.accent:t.text,fontFamily:"'JetBrains Mono',monospace"}},label));})))
      ,
      // Full Range button
      scaleDef&&React.createElement("button",{onClick:function(){setShowFullRange(true);},style:{width:"100%",padding:"10px",borderRadius:10,border:"1px solid "+(isStudio?t.accent+"30":t.accentBorder),background:isStudio?t.accent+"08":t.accentBg,color:t.accent,fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s"}},
        IC.tabScales(14,t.accent,false),"Full Range")),

    sub==="chords"&&React.createElement("div",{style:{background:t.card,borderRadius:14,padding:24,border:"1px solid "+t.border,textAlign:"center"}},
      IC.tabScales(32,t.subtle,false),
      React.createElement("div",{style:{fontSize:14,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:6,marginTop:10}},"Chord Voicings"),
      React.createElement("div",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif"}},"Inversions, drop voicings & more — coming soon")),

    // Fullscreen range overlay
    showFullRange&&scaleDef&&React.createElement(FullRangeScaleView,{rootName:root,scaleDef:scaleDef,scaleName:scaleName,lowMidi:instRangeLow,highMidi:instRangeHigh,useBassClef:isBassClef,instOff:instOff,th:t,onClose:function(){setShowFullRange(false);}}));}


// ── Custom Select — matches key picker design ──
function CustomSelect({value,options,onChange,th,placeholder}){
  var t=th||TH.classic;var isStudio=t===TH.studio;
  var _o=useState(false),open=_o[0],setOpen=_o[1];
  var ref=useRef(null);
  useEffect(function(){
    if(!open)return;
    function handleClick(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",handleClick);document.addEventListener("touchstart",handleClick);
    return function(){document.removeEventListener("mousedown",handleClick);document.removeEventListener("touchstart",handleClick);};
  },[open]);
  var label=value||placeholder||"Select";
  // Find display label if options are objects
  if(typeof options[0]==="object"){var found=options.find(function(o){return o.value===value;});if(found)label=found.label;}
  var opts=options.map(function(o){return typeof o==="string"?{value:o,label:o}:o;});
  return React.createElement("div",{ref:ref,style:{position:"relative"}},
    React.createElement("button",{onClick:function(){setOpen(!open);},
      style:{width:"100%",background:t.inputBg,border:"1px solid "+(open?t.accent:t.inputBorder),borderRadius:10,padding:"10px 14px",color:t.text,
        fontSize:13,fontFamily:"'Inter',sans-serif",fontWeight:500,cursor:"pointer",textAlign:"left",boxSizing:"border-box",
        outline:"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",transition:"border-color 0.15s"}},label+" \u25BE"),
    open&&React.createElement("div",{style:{position:"absolute",top:"100%",left:0,right:0,marginTop:4,zIndex:100,
      background:t.card,border:"1px solid "+t.border,borderRadius:10,padding:4,
      boxShadow:"0 8px 24px rgba(0,0,0,"+(isStudio?"0.5":"0.12")+")",maxHeight:200,overflowY:"auto"}},
      opts.map(function(o){
        var active=o.value===value;
        return React.createElement("button",{key:o.value,onClick:function(){onChange(o.value);setOpen(false);},
          style:{display:"block",width:"100%",padding:"7px 10px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",
            fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:active?700:500,
            background:active?t.accent+"18":(isStudio?"transparent":"transparent"),
            color:active?t.accent:(isStudio?"#ccc":"#444"),
            transition:"all 0.1s"}},o.label);
      })));}

// ============================================================
// EDITOR — themed
// ============================================================
function Editor({onClose,onSubmit,onSubmitPrivate,th,userInst}){const t=th||TH.classic;const isStudio=t===TH.studio;
  const[artist,sA]=useState("");const[tune,sTune]=useState("");const[inst,sI]=useState("Alto Sax");const[cat,sC]=useState("ii-V-I");const[keySig,sK]=useState("C");const[keyQual,sKQ]=useState("Major");const[timeSig,sTS]=useState("4/4");const[tempo,sTm]=useState("120");const[abc,sAbc]=useState("X:1\nT:My Lick\nM:4/4\nL:1/8\nQ:1/4=120\nK:C\n");const[feel,setFeel]=useState("straight");const[yu,sYu]=useState("");const[tm,sTmn]=useState("");const[ts,sTs]=useState("");const[tmEnd,setTmEnd]=useState("");const[tsEnd,setTsEnd]=useState("");const[sp,sSp]=useState("");const[desc,sD]=useState("");const[tags,sTg]=useState("");
  const edCurNoteRef=useRef(-1);
  const noteClickRef=useRef(null);
  const deselectRef=useRef(null);
  const chordsRef=useRef({});
  const barInfoRef=useRef({complete:true,remaining:0});
  const fillBarRef=useRef(null);
  const[edSelIdx,setEdSelIdx]=useState(null);
  const[showBarFill,setShowBarFill]=useState(null);// null or "publish"|"private"
  const[edStep,setEdStep]=useState(0);// 0=About, 1=Reference, 2=Notes
  const[ytSpeed,setYtSpeed]=useState(1);
  const[showChordHint,setShowChordHint]=useState(false);
  var tapTempoRef=useRef([]);
  var handleTapTempo=function(){
    var now=performance.now();var taps=tapTempoRef.current;
    // Reset if last tap was >2 seconds ago
    if(taps.length>0&&now-taps[taps.length-1]>2000)taps.length=0;
    taps.push(now);
    if(taps.length>=2){
      var intervals=[];for(var i=1;i<taps.length;i++)intervals.push(taps[i]-taps[i-1]);
      // Use last 6 taps max
      if(intervals.length>5)intervals=intervals.slice(-5);
      var avg=intervals.reduce(function(a,b){return a+b;},0)/intervals.length;
      var bpm=Math.round(60000/avg);
      if(bpm>=30&&bpm<=300)sTm(String(bpm));
    }
    // Keep max 8 taps
    if(taps.length>8)taps.splice(0,taps.length-8);
  };
  var edInstOff=INST_TRANS[userInst]||0;
  var concertKeyRoot=edInstOff?trKeyName(abcKeySig(keySig),-edInstOff):abcKeySig(keySig);
  var concertKey=concertKeyRoot+" "+keyQual;
  var concertAbc=edInstOff?transposeAbc(abc,-edInstOff):abc;
  useEffect(function(){try{Tone.start();}catch(e){}preloadPiano();preloadChordPiano();_ensurePreviewSynth();},[]);
  var KEY_ROWS=[
    ["C"],["Db","C#"],["D"],["Eb"],["E"],["F"],
    ["F#","Gb"],["G"],["Ab"],["A"],["Bb"],["B"]
  ];
  const[keyOpen,setKeyOpen]=useState(false);
  const keyBtnRef=useRef(null);
  useEffect(function(){
    if(!keyOpen)return;
    var handler=function(e){if(keyBtnRef.current&&!keyBtnRef.current.contains(e.target))setKeyOpen(false);};
    document.addEventListener("mousedown",handler);document.addEventListener("touchstart",handler);
    return function(){document.removeEventListener("mousedown",handler);document.removeEventListener("touchstart",handler);};
  },[keyOpen]);

  // Custom key picker element
  var keyPickerEl=React.createElement("div",{style:{position:"relative"},ref:keyBtnRef},
    React.createElement("button",{onClick:()=>setKeyOpen(!keyOpen),
      style:{width:"100%",background:t.inputBg,border:"1px solid "+(keyOpen?t.accent:t.inputBorder),borderRadius:10,padding:"10px 14px",color:t.text,
        fontSize:14,fontFamily:"'Inter',sans-serif",fontWeight:500,cursor:"pointer",textAlign:"left",boxSizing:"border-box",
        outline:"none"}},keySig+" "+keyQual+" \u25BE"),
    keyOpen&&React.createElement("div",{style:{position:"absolute",top:"100%",left:0,marginTop:4,zIndex:100,
      background:t.card,border:"1px solid "+t.border,borderRadius:10,padding:6,minWidth:160,
      boxShadow:"0 8px 24px rgba(0,0,0,"+(isStudio?"0.5":"0.12")+")"}},
      // Quality toggle
      React.createElement("div",{style:{display:"flex",gap:3,marginBottom:6}},
        ["Major","Minor"].map(function(q){
          var active=keyQual===q;
          return React.createElement("button",{key:q,onClick:function(){sKQ(q);},
            style:{flex:1,padding:"5px 3px",borderRadius:6,border:active?"1.5px solid "+t.accent:"1px solid "+t.border,
              fontSize:9,fontFamily:"'Inter',sans-serif",fontWeight:active?700:500,letterSpacing:0.3,
              background:active?t.accent+"18":(isStudio?"#ffffff06":"#F5F4F0"),
              color:active?t.accent:(isStudio?"#ccc":"#666"),cursor:"pointer"}},q);
        })),
      // Divider
      React.createElement("div",{style:{height:1,background:t.border,marginBottom:5}}),
      // Root note rows
      KEY_ROWS.map(function(row,ri){
        return React.createElement("div",{key:ri,style:{display:"flex",gap:2,marginBottom:ri<KEY_ROWS.length-1?2:0}},
          row.map(function(k){
            var isSel=keySig===k;
            return React.createElement("button",{key:k,onClick:function(){sK(k);setKeyOpen(false);},
              style:{flex:1,padding:"5px 4px",borderRadius:6,border:"none",cursor:"pointer",
                fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:isSel?700:500,
                background:isSel?t.accent+"18":(isStudio?"#ffffff06":"#F5F4F0"),
                color:isSel?t.accent:(isStudio?"#ccc":"#444"),
                outline:isSel?"1.5px solid "+t.accent+"40":"none",
                transition:"all 0.1s"}},k);
          }));
      })));

  const KEYS=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];const TS=["4/4","3/4","6/8","5/4","7/8"];const yt=parseYT(yu);const tSec=(parseInt(tm)||0)*60+(parseInt(ts)||0);const tESecEnd=(parseInt(tmEnd)||0)*60+(parseInt(tsEnd)||0)||null;
  const lb={fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,display:"block",marginBottom:4};
  const ip={width:"100%",background:t.inputBg,border:"1px solid "+t.inputBorder,borderRadius:10,padding:"10px 14px",color:t.text,fontSize:14,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"};
  const noteCount=useMemo(()=>countAbcNotes(abc),[abc]);
  const artistOk=artist.trim().length>=1;
  const notesOk=noteCount>=4;
  const canPublish=artistOk&&notesOk;
  const[label,setLabel]=useState("");
  // Auto-generate title: "Charlie Parker — ii-V-I" or "Charlie Parker — ii-V-I · bridge turnaround"
  var autoTitle=artist.trim();
  if(cat&&cat!=="All")autoTitle+=(autoTitle?" \u2014 ":"")+cat;
  if(label.trim())autoTitle+=" \u00B7 "+label.trim();

  // Compact select helper removed — now using CustomSelect component

  // Feel buttons inline

  // Submit data builder
  const buildData=()=>({title:autoTitle,artist,tune,label:label.trim(),instrument:inst,category:cat,key:concertKey,tempo:parseInt(tempo),feel,abc:concertAbc,chords:chordsRef.current||{},youtubeId:yt.videoId,youtubeStart:tSec,youtubeEnd:tESecEnd||null,spotifyId:parseSpotify(sp),description:desc,tags:tags.split(",").map(tg2=>tg2.trim()).filter(Boolean)});

  // Check bar completeness before publishing
  var tryPublish=function(mode){
    if(!canPublish)return;
    var bi=barInfoRef.current;
    if(bi&&!bi.complete&&bi.tE>0){setShowBarFill(mode);return;}
    if(mode==="private")onSubmitPrivate(buildData());else onSubmit(buildData());
  };
  var doFillAndPublish=function(){
    var newAbc=fillBarRef.current?fillBarRef.current():null;
    var mode=showBarFill;setShowBarFill(null);
    if(newAbc){
      sAbc(newAbc);// update Editor state for consistency
      var cAbc=edInstOff?transposeAbc(newAbc,-edInstOff):newAbc;
      var d2=buildData();d2.abc=cAbc;
      if(mode==="private")onSubmitPrivate(d2);else onSubmit(d2);
    }
  };

  // Step validation
  var step1Ok=artistOk;
  var step2Ok=notesOk;
  var stepLabels=["About","Reference","Notes"];

  // Mini-summary for completed steps
  var summaryParts=[];
  if(edStep>=1){
    var parts=[];
    if(autoTitle)parts.push(autoTitle);
    parts.push(concertKey);parts.push(timeSig);if(feel!=="straight")parts.push(feel);
    if(tune.trim())parts.push(tune.trim());
    summaryParts.push(parts.join(" \u00B7 "));
  }
  if(edStep>=2&&noteCount>0){
    summaryParts.push(noteCount+" notes"+(Object.keys(chordsRef.current||{}).length>0?" + chords":""));
  }

  return React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,background:t.bg,display:"flex",flexDirection:"column"}},
    // Header with progress
    React.createElement("div",{style:{position:"relative",zIndex:10,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",paddingTop:"calc(env(safe-area-inset-top, 0px) + 10px)",borderBottom:"1px solid "+t.border}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"0 16px"}},
        // Top row: title + close
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}},
          React.createElement("h2",{style:{color:t.text,fontSize:18,margin:0,fontFamily:t.titleFont,fontWeight:isStudio?700:600}},"Share a Lick"),
          React.createElement("button",{onClick:onClose,style:{background:t.filterBg,border:"1px solid "+t.border,color:t.muted,width:30,height:30,borderRadius:8,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"\u00D7")),
        // Progress dots + labels
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:0,marginBottom:summaryParts.length>0?6:10}},
          [0,1,2].map(function(si){
            var done=si<edStep;var active=si===edStep;var canJump=si===0||(si===1&&step1Ok)||(si===2&&step1Ok);
            return React.createElement(React.Fragment,{key:si},
              si>0&&React.createElement("div",{style:{flex:1,height:2,background:done?t.accent+"60":t.border,borderRadius:1,margin:"0 2px",transition:"background 0.3s"}}),
              React.createElement("button",{onClick:function(){if(canJump)setEdStep(si);},style:{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:8,border:"none",background:active?(t.accent+"12"):"transparent",cursor:canJump?"pointer":"default",transition:"all 0.2s"}},
                React.createElement("div",{style:{width:20,height:20,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?10:9,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",transition:"all 0.3s",
                  background:done?(isStudio?t.accent+"20":t.accent+"15"):active?(isStudio?t.accent+"15":t.accent+"08"):t.filterBg,
                  color:done||active?t.accent:t.subtle,
                  border:"1.5px solid "+(done?t.accent+"40":active?t.accent+"30":t.border)}},done?"\u2713":(si+1)),
                React.createElement("span",{style:{fontSize:10,fontWeight:active?600:500,color:active?t.text:done?t.muted:t.subtle,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap"}},stepLabels[si])));
          })),
        // Mini-summary
        summaryParts.length>0&&React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'JetBrains Mono',monospace",padding:"0 0 8px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4}},
          summaryParts.join("  \u00B7  ")))),

    // Scrollable step content
    React.createElement("div",{style:{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",padding:"16px 16px 100px"}},

        // ═══ STEP 0: About ═══
        React.createElement("div",{style:{display:edStep===0?"flex":"none",flexDirection:"column",gap:14}},
          React.createElement("div",{style:{background:t.card,borderRadius:14,padding:"16px",border:"1px solid "+(artistOk?t.accentBorder:t.border),transition:"border-color 0.3s"}},
            React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
              React.createElement("div",null,
                React.createElement("label",{style:lb},"ARTIST *"),
                React.createElement("input",{style:{...ip,fontSize:16,fontWeight:600,padding:"12px 14px"},value:artist,onChange:e=>sA(e.target.value),placeholder:"Charlie Parker"})),
              React.createElement("div",null,
                React.createElement("label",{style:lb},"TUNE"),
                React.createElement("input",{style:ip,value:tune,onChange:e=>sTune(e.target.value),placeholder:"Confirmation, Autumn Leaves, ..."})),
              React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}},
                React.createElement("div",null,React.createElement("label",{style:lb},"KEY"),keyPickerEl),
                React.createElement("div",null,React.createElement("label",{style:lb},"TIME"),React.createElement(CustomSelect,{value:timeSig,options:TS,onChange:sTS,th:t})),
                React.createElement("div",null,React.createElement("label",{style:lb},"BPM"),React.createElement("div",{style:{display:"flex",gap:4}},React.createElement("input",{type:"number",value:tempo,onChange:e=>sTm(e.target.value),style:{...ip,fontFamily:"'JetBrains Mono',monospace",flex:1,minWidth:0}}),React.createElement("button",{onClick:handleTapTempo,style:{padding:"0 10px",borderRadius:10,border:"1px solid "+t.inputBorder,background:t.inputBg,color:t.accent,fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}},"TAP")))),
              React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}},
                React.createElement("div",null,React.createElement("label",{style:lb},"FEEL"),React.createElement(CustomSelect,{value:feel,options:[{value:"straight",label:"Straight"},{value:"swing",label:"Swing"},{value:"hard-swing",label:"Hard Swing"}],onChange:setFeel,th:t})),
                React.createElement("div",null,React.createElement("label",{style:lb},"INSTRUMENT"),React.createElement(CustomSelect,{value:inst,options:INST_LIST.filter(i=>i!=="All"),onChange:sI,th:t})),
                React.createElement("div",null,React.createElement("label",{style:lb},"CATEGORY"),React.createElement(CustomSelect,{value:cat,options:CAT_LIST.filter(c=>c!=="All"),onChange:sC,th:t}))),
              React.createElement("div",null,
                React.createElement("label",{style:lb},"LABEL"),
                React.createElement("input",{style:ip,value:label,onChange:e=>{if(e.target.value.length<=30)setLabel(e.target.value);},placeholder:"optional, e.g. bridge turnaround",maxLength:30})),
              artistOk&&React.createElement("div",{style:{padding:"8px 10px",background:t.filterBg,borderRadius:8}},
                React.createElement("div",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:6}},autoTitle),
                React.createElement("div",{style:{display:"flex",gap:4,flexWrap:"wrap"}},
                  tune.trim()&&React.createElement("span",{style:{fontSize:10,fontFamily:"'Inter',sans-serif",padding:"2px 8px",borderRadius:6,background:t.accentBg,color:t.accent,border:"1px solid "+t.accentBorder}},tune.trim()),
                  React.createElement("span",{style:{fontSize:10,fontFamily:"'JetBrains Mono',monospace",padding:"2px 8px",borderRadius:6,background:isStudio?"#ffffff08":"#F0EFE8",color:t.muted}},concertKey),
                  React.createElement("span",{style:{fontSize:10,fontFamily:"'JetBrains Mono',monospace",padding:"2px 8px",borderRadius:6,background:isStudio?"#ffffff08":"#F0EFE8",color:t.muted}},timeSig),
                  feel!=="straight"&&React.createElement("span",{style:{fontSize:10,fontFamily:"'Inter',sans-serif",padding:"2px 8px",borderRadius:6,background:isStudio?"#ffffff08":"#F0EFE8",color:t.muted}},feel)))))),

        // ═══ STEP 1: Reference ═══
        React.createElement("div",{style:{display:edStep===1?"flex":"none",flexDirection:"column",gap:14}},
          // YouTube section
          React.createElement("div",{style:{background:t.card,borderRadius:14,padding:"16px",border:"1px solid "+t.border}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:12}},
              React.createElement("span",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"YouTube Reference"),
              React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif"}},"optional")),
            React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:10}},
              React.createElement("div",null,
                React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"YOUTUBE URL"),
                React.createElement("input",{style:{...ip,fontSize:13},value:yu,onChange:e=>sYu(e.target.value),placeholder:"https://youtube.com/watch?v=..."}),
                yu&&yt.videoId&&React.createElement("div",{style:{marginTop:4,display:"flex",alignItems:"center",gap:4}},
                  React.createElement("span",{style:{fontSize:9,color:t.accent,fontFamily:"monospace"}},"\u2713 "+yt.videoId)),
                yu&&!yt.videoId&&React.createElement("span",{style:{fontSize:9,color:"#EF4444",fontFamily:"monospace",display:"block",marginTop:4}},"Invalid YouTube URL")),
              yu&&yt.videoId&&React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
                // Timestamps
                React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}},
                  React.createElement("div",null,React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"START MIN"),React.createElement("input",{style:{...ip,fontSize:13},type:"number",min:0,value:tm,onChange:e=>sTmn(e.target.value),placeholder:"0"})),
                  React.createElement("div",null,React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"START SEC"),React.createElement("input",{style:{...ip,fontSize:13},type:"number",min:0,max:59,value:ts,onChange:e=>sTs(e.target.value),placeholder:"0"})),
                  React.createElement("div",null,React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"END MIN"),React.createElement("input",{style:{...ip,fontSize:13},type:"number",min:0,value:tmEnd,onChange:e=>setTmEnd(e.target.value),placeholder:"0"})),
                  React.createElement("div",null,React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"END SEC"),React.createElement("input",{style:{...ip,fontSize:13},type:"number",min:0,max:59,value:tsEnd,onChange:e=>setTsEnd(e.target.value),placeholder:"0"}))),
                tESecEnd&&tESecEnd>tSec&&React.createElement("div",{style:{fontSize:10,color:t.accent,fontFamily:"'JetBrains Mono',monospace",padding:"4px 8px",background:t.accentBg,borderRadius:6}},
                  "Loop: "+fT(tSec)+" \u2014 "+fT(tESecEnd)),
                // Preview player (no speed control here — speed is in Notes step)
                React.createElement(YTPEditor,{videoId:yt.videoId,startTime:tSec,endTime:tESecEnd,speed:1,th:t})
              ))),
          // Spotify
          React.createElement("div",{style:{background:t.card,borderRadius:14,padding:"16px",border:"1px solid "+t.border}},
            React.createElement("label",{style:{...lb,fontSize:9,opacity:0.7}},"SPOTIFY TRACK URL"),
            React.createElement("input",{style:{...ip,fontSize:13},value:sp,onChange:e=>sSp(e.target.value),placeholder:"https://open.spotify.com/track/..."}),
            sp&&parseSpotify(sp)&&React.createElement("span",{style:{fontSize:9,color:"#1DB954",fontFamily:"monospace",display:"block",marginTop:4}},"\u2713 Track found"),
            sp&&!parseSpotify(sp)&&React.createElement("span",{style:{fontSize:9,color:"#EF4444",fontFamily:"monospace",display:"block",marginTop:4}},"Paste a Spotify track URL")),
          // Description + Tags
          React.createElement("div",{style:{background:t.card,borderRadius:14,padding:"16px",border:"1px solid "+t.border}},
            React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
              React.createElement("div",null,
                React.createElement("label",{style:lb},"DESCRIPTION"),
                React.createElement("textarea",{style:{...ip,height:70,resize:"vertical",fontSize:13},value:desc,onChange:e=>sD(e.target.value),placeholder:"What makes this lick special?"})),
              React.createElement("div",null,
                React.createElement("label",{style:lb},"TAGS"),
                React.createElement("input",{style:{...ip,fontSize:13},value:tags,onChange:e=>sTg(e.target.value),placeholder:"bebop, essential, blues"}))))),

        // ═══ STEP 2: Notes ═══
        React.createElement("div",{style:{display:edStep===2?"flex":"none",flexDirection:"column",gap:12}},
          // Compact invisible YT reference player
          yt.videoId&&React.createElement(YTPMini,{videoId:yt.videoId,startTime:tSec,endTime:tESecEnd,speed:ytSpeed,th:t}),
          edInstOff!==0&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:isStudio?"rgba(34,216,158,0.06)":"rgba(99,102,241,0.04)",borderRadius:8,border:"1px solid "+(isStudio?"rgba(34,216,158,0.15)":"rgba(99,102,241,0.1)")}},
            React.createElement("span",{style:{fontSize:10,color:isStudio?"#22D89E":t.accent,fontFamily:"'Inter',sans-serif"}},"Entering for "+userInst+" \u2014 will be saved in concert pitch")),
          React.createElement("div",{style:{borderRadius:12,padding:14,border:"1px solid "+t.border,background:t.card}},
            React.createElement(NoteBuilder,{onAbcChange:sAbc,keySig,keyQual,timeSig,tempo:parseInt(tempo)||120,noteClickRef:noteClickRef,onSelChange:setEdSelIdx,deselectRef:deselectRef,previewOffset:-edInstOff,th:t,chordsRef:chordsRef,barInfoRef:barInfoRef,fillBarRef:fillBarRef,visible:edStep===2,highlightChords:showChordHint,onChordHintDismiss:function(){setShowChordHint(false);},onChordHintSkip:function(){var mode=showChordHint;setShowChordHint(false);tryPublish(mode);},
              previewEl:React.createElement("div",{style:{marginBottom:4}},
                React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}},
                  React.createElement("span",{style:{fontSize:9,color:t.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,fontWeight:600}},"PREVIEW"),
                  noteCount>0&&React.createElement("span",{style:{fontSize:9,color:t.accent,fontFamily:"monospace"}},noteCount+" notes")),
                React.createElement(Notation,{abc,compact:false,th:t,curNoteRef:edCurNoteRef,selNoteIdx:edSelIdx,onNoteClick:function(idx){if(noteClickRef.current)noteClickRef.current(idx);},onDeselect:function(){if(deselectRef.current)deselectRef.current();}})),
              playerEl:React.createElement(Player,{abc:concertAbc,tempo:parseInt(tempo)||120,th:t,initFeel:feel,editorMode:true,onCurNote:function(n){edCurNoteRef.current=n;}})})))
        ),
    // Bottom bar — context-aware
    React.createElement("div",{style:{position:"sticky",bottom:0,background:t.headerBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid "+t.border,padding:"10px 16px",paddingBottom:"max(10px, env(safe-area-inset-bottom))"}},
      React.createElement("div",{style:{maxWidth:520,margin:"0 auto",display:"flex",alignItems:"center",gap:8}},
        // Back button (not on step 0)
        edStep>0&&React.createElement("button",{onClick:function(){setEdStep(edStep-1);},
          style:{padding:"10px 16px",borderRadius:10,border:"1px solid "+t.border,background:t.card,color:t.muted,fontSize:13,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"\u2190 Back"),
        React.createElement("div",{style:{flex:1}}),
        // Step 0: Next (needs artist)
        edStep===0&&React.createElement("button",{onClick:function(){if(step1Ok)setEdStep(1);},
          style:{padding:"10px 24px",borderRadius:10,border:"none",
            background:step1Ok?(isStudio?t.playBg:t.accent):t.border,
            color:step1Ok?"#fff":t.subtle,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",
            cursor:step1Ok?"pointer":"default",
            boxShadow:step1Ok?"0 4px 16px "+t.accentGlow:"none",transition:"all 0.2s"}},
          "Next \u2192"),
        edStep===0&&!step1Ok&&React.createElement("span",{style:{position:"absolute",left:"50%",transform:"translateX(-50%)",bottom:"calc(100% + 6px)",fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",background:t.headerBg,padding:"2px 8px",borderRadius:6}},
          "enter an artist to continue"),
        // Step 1: Next — reference is always optional, no validation
        edStep===1&&React.createElement("button",{onClick:function(){setEdStep(2);},
          style:{padding:"10px 24px",borderRadius:10,border:"none",
            background:isStudio?t.playBg:t.accent,
            color:"#fff",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",
            cursor:"pointer",boxShadow:"0 4px 16px "+t.accentGlow,transition:"all 0.2s"}},
          "Next \u2192"),
        // Step 2: Next (needs 4+ notes) + Publish buttons
        edStep===2&&React.createElement(React.Fragment,null,
          React.createElement("button",{onClick:function(){if(!step2Ok)return;var hasChords=Object.keys(chordsRef.current||{}).length>0;if(!hasChords&&!showChordHint){setShowChordHint("private");return;}setShowChordHint(false);tryPublish("private");},disabled:!canPublish,style:{padding:"10px 18px",background:canPublish?t.card:t.border,color:canPublish?t.text:t.subtle,border:canPublish?"1.5px solid "+t.accent:"none",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:canPublish?"pointer":"default",transition:"all 0.2s"}},"\uD83D\uDD12 Private"),
          React.createElement("button",{onClick:function(){if(!step2Ok)return;var hasChords=Object.keys(chordsRef.current||{}).length>0;if(!hasChords&&!showChordHint){setShowChordHint("publish");return;}setShowChordHint(false);tryPublish("publish");},disabled:!canPublish,style:{padding:"10px 22px",background:canPublish?(isStudio?t.playBg:t.accent):t.border,color:canPublish?"#fff":t.subtle,border:"none",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:canPublish?"pointer":"default",boxShadow:canPublish?"0 4px 16px "+t.accentGlow:"none",transition:"all 0.2s"}},"Publish"),
          edStep===2&&!step2Ok&&!showChordHint&&React.createElement("span",{style:{position:"absolute",left:"50%",transform:"translateX(-50%)",bottom:"calc(100% + 6px)",fontSize:10,color:t.subtle,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",background:t.headerBg,padding:"2px 8px",borderRadius:6}},noteCount>0?"min 4 notes ("+noteCount+" so far)":"add some notes"))),
    // Bar-fill dialog
    showBarFill&&React.createElement("div",{style:{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:1100,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
      React.createElement("div",{onClick:function(e){e.stopPropagation();},style:{background:t.card,borderRadius:16,padding:"24px 20px",maxWidth:340,width:"100%",border:"1px solid "+t.border,boxShadow:"0 12px 40px rgba(0,0,0,"+(isStudio?"0.6":"0.15")+")"}},
        React.createElement("div",{style:{fontSize:15,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:8}},"Incomplete bar"),
        React.createElement("p",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",margin:"0 0 16px",lineHeight:1.5}},
          "The last bar isn\u2019t complete yet. For clean looping, fill the remaining beats with rests?"),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{onClick:doFillAndPublish,
            style:{flex:1,padding:"10px",borderRadius:10,border:"none",background:t.accent,color:isStudio?"#08080F":"#fff",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Fill & Save"),
          React.createElement("button",{onClick:function(){setShowBarFill(null);},
            style:{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.muted,fontSize:13,fontWeight:500,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Back")))))));}



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
      if(r&&r.value){try{
        var p=JSON.parse(r.value);
        if(p.length){
          setPlans(p);
          // Sync nextId to max existing item id to avoid collisions after reload
          var maxId=p.reduce(function(mx,plan){
            return plan.items.reduce(function(m,item){return Math.max(m,item.id||0);},mx);
          },100);
          nextId.current=maxId;
        }
      }catch(e){}}
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

          // EXPANDED EDIT PANEL — animated
          React.createElement("div",{style:{
            maxHeight:expanded?"600px":"0",
            overflow:"hidden",
            transition:"max-height 0.28s cubic-bezier(0.4,0,0.2,1)",
          }},
            React.createElement("div",{style:{padding:"0 14px 14px 46px",display:"flex",flexDirection:"column",gap:10}},
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
                React.createElement("span",{style:{fontSize:16,fontWeight:700,color:tc,fontFamily:"'JetBrains Mono',monospace",minWidth:36}},item.bpm||120))))));
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

  // Semitone index of the lick's original key (0=C … 11=B)
  var lickKeySt=useMemo(function(){
    var root=lick.key.split(" ")[0]; // e.g. "Bb", "F#", "C"
    var ri=1;if(ri<root.length&&(root[ri]==="b"||root[ri]==="#"))ri++;
    var base=N2M[root[0].toUpperCase()]||0;
    if(root.includes("#"))base++;
    if(root.includes("b"))base--;
    return((base%12)+12)%12;
  },[lick.key]);
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
  // Build full 12-key drill sequence — offsets relative to lick's original key
  var drillSeq=useMemo(function(){
    if(intDef.semi===0)return buildKeySeq(0,0);
    var all=[];var used=new Set();
    for(var c=0;c<cyclesNeeded;c++){
      var cycle=buildKeySeq(intDef.semi,c);
      for(var j=0;j<cycle.length;j++){if(!used.has(cycle[j])){used.add(cycle[j]);all.push(cycle[j]);}}
    }
    return all;
  },[intDef.semi,cyclesNeeded]);

  // Learn mode: COF offsets starting at 0 (= original key at top)
  var learnOrder=useMemo(function(){return buildKeySeq(7,0);},[]);
  var lickRootName=lick.key.split(" ")[0];
  // Short quality suffix for circle labels: "Minor"→"m", "Major"→""
  var keySuffix=useMemo(function(){
    var parts=lick.key.split(" ");var qual=(parts[1]||"").toLowerCase();
    if(qual==="minor")return "m";
    return "";
  },[lick.key]);
  var learnLabels=learnOrder.map(function(st){return trKeyName(lickRootName,st+uOff)+keySuffix;});

  // Current key for learn mode
  var learnOffset=learnOrder[activeIdx];
  var learnTotalOff=learnOffset+uOff;
  var learnAbc=transposeAbc(lick.abc,learnTotalOff);
  var learnSoundAbc=transposeAbc(lick.abc,learnOffset);
  var learnKeyName=trKeyName(lick.key.split(" ")[0],learnTotalOff)+keySuffix;
  var slowTempo=Math.max(60,Math.round(lick.tempo*0.65));
  var learnTempo=stage===3?lick.tempo:slowTempo;

  // Current key for drill mode
  var drillOffset=drillSeq[drillKeyIdx]||0;
  var drillTotalOff=drillOffset+uOff;
  var drillAbc=transposeAbc(lick.abc,drillTotalOff);
  var drillSoundAbc=transposeAbc(lick.abc,drillOffset);
  var drillKeyName=trKeyName(lick.key.split(" ")[0],drillTotalOff)+keySuffix;

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
          React.createElement("text",{x:x,y:y+0.5,textAnchor:"middle",dominantBaseline:"central",style:{fontSize:isActive?8:7,fontWeight:isActive?700:500,fill:isActive?"#fff":(ks>=1?"#fff":t.muted),fontFamily:"'Inter',sans-serif",pointerEvents:"none"}},labels?labels[i]:trKeyName(lickRootName,st+uOff)+keySuffix));
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
        return React.createElement("button",{key:m[0],onClick:function(){setMode(m[0]);if(m[0]==="learn")stopDrill();},style:{flex:1,padding:"8px 6px",borderRadius:8,border:"none",background:active?(t.activeTabBg||t.card):"transparent",color:active?t.text:t.subtle,fontSize:11,fontWeight:active?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none"}},m[1]);})),

    // === LEARN MODE ===
    mode==="learn"&&React.createElement("div",null,
      // Circle
      renderCircle(learnOrder,learnLabels,learnOffset,stageColor),
      // Stage selector
      React.createElement("div",{style:{display:"flex",gap:4,marginBottom:12,background:t.filterBg,borderRadius:10,padding:3}},
        [{s:1,l:"Sheet"},{s:2,l:"Memory"},{s:3,l:"Tempo"}].map(function(st){
          var active=stage===st.s;
          return React.createElement("button",{key:st.s,onClick:function(){setStage(st.s);setHidden(st.s>=2);},style:{flex:1,padding:"8px 6px",borderRadius:8,border:"none",background:active?(t.activeTabBg||t.card):"transparent",color:active?t.text:t.subtle,fontSize:10,fontWeight:active?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none"}},st.l);})),

      // Notation + Player
      React.createElement("div",{style:{background:t.card,borderRadius:14,padding:14,border:"1px solid "+(isStudio?t.staffStroke+"30":t.border),marginBottom:10}},
        hidden?React.createElement("div",{style:{padding:"20px 16px",textAlign:"center"}},
          IC.tabEar(28,t.muted,false),
          React.createElement("p",{style:{fontSize:13,color:t.muted,fontFamily:"'Inter',sans-serif",margin:"10px 0 0"}},"Play from memory in "+learnKeyName),
          React.createElement("button",{onClick:function(){setHidden(false);},style:{marginTop:10,padding:"5px 14px",borderRadius:8,border:"1px solid "+t.border,background:t.filterBg,color:t.subtle,fontSize:10,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Peek")):
        React.createElement(Notation,{abc:learnAbc,compact:false,th:t,curNoteRef:curNoteRef,bassClef:BASS_CLEF_INSTS.has(userInst)}),
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
              React.createElement("span",{style:{fontSize:10,fontWeight:600,color:t.muted,fontFamily:"'JetBrains Mono',monospace",padding:"2px 6px",borderRadius:5,background:isStudio?t.card+"60":t.card,border:"1px solid "+t.border}},trKeyName(lickRootName,st+uOff)+keySuffix));
          })),

        // Start button
        React.createElement("button",{onClick:startDrill,style:{width:"100%",padding:"16px",borderRadius:14,border:"none",background:"linear-gradient(135deg, "+drillColor+", "+(isStudio?"#A855F7":"#DB2777")+")",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"0 6px 24px "+drillColor+"50",transition:"transform 0.15s",letterSpacing:0.3}},
          IC.playInline(14,"#fff"),"Start Drill")),

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
              React.createElement("span",{style:{fontSize:cur?11:7,fontWeight:cur?800:done?600:500,color:cur||done?"#fff":t.muted,fontFamily:"'JetBrains Mono',monospace"}},trKeyName(lickRootName,st+uOff)+keySuffix));
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
          React.createElement(Notation,{key:"drill-n-"+drillOffset,abc:drillAbc,compact:true,th:t,curNoteRef:curNoteRef,bassClef:BASS_CLEF_INSTS.has(userInst)})),

        // Player with controls visible (hideControls shows settings, no play button)
        React.createElement(Player,{key:"drill-active",abc:drillSoundAbc,tempo:lick.tempo,abOn:false,abA:0,abB:1,setAbOn:null,setAbA:null,setAbB:null,pT:lick.tempo,sPT:null,lickTempo:lick.tempo,trInst:null,setTrInst:null,trMan:null,setTrMan:null,onCurNote:function(n){curNoteRef.current=n;},th:t,forceLoop:true,autoPlay:true,onLoopComplete:onDrillLoop,hideControls:true}),

        // Stop button
        React.createElement("button",{onClick:stopDrill,style:{width:"100%",padding:"13px",borderRadius:12,border:"none",background:isStudio?t.card:t.filterBg,color:drillColor,fontSize:13,fontWeight:700,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:"inset 0 0 0 1.5px "+drillColor,marginTop:8}},
          IC.stopInline(12,drillColor),"Stop"))))
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
  var[trInst,setTrInst]=useState(function(){return instToTransKey(userInst)||"Concert";});
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
          React.createElement(Notation,{abc:notationAbc,compact:false,th:t,curNoteRef:curNoteRef,bassClef:BASS_CLEF_INSTS.has(trInst)}),
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
          React.createElement("button",{onClick:skipNext,style:{width:30,height:30,borderRadius:8,border:"1px solid "+t.border,background:t.card,color:t.text,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},IC.playInline(10,t.text))),
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
      width:36,height:36,borderRadius:18,cursor:"pointer",padding:0,
      background:activeCount>0&&!open?t.accentBg:"transparent",
      border:activeCount>0&&!open?"1px solid "+t.accentBorder:"1px solid "+t.border,
      transition:"all 0.15s",position:"relative"}},
      React.createElement("span",{style:{fontSize:26,color:activeCount>0||open?t.accent:t.subtle}},open?"\u2715":"\u2315"),
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
// ============================================================
// ONBOARDING — 3 screens after first login
// ============================================================
const ONBOARD_INSTRUMENTS = ["Alto Sax","Soprano Sax","Tenor Sax","Baritone Sax","Trumpet","Piano","Guitar","Bass","Trombone","Flute","Clarinet","Vibes","Violin","Vocals","Drums","Other"];
const ONBOARD_LEVELS = [
  {id:"beginner",label:"Beginner",sub:"Less than 2 years"},
  {id:"intermediate",label:"Intermediate",sub:"2\u20135 years"},
  {id:"advanced",label:"Advanced",sub:"5\u201310 years"},
  {id:"pro",label:"Pro",sub:"10+ years"}
];

function Onboarding({onComplete, th}) {
  var t = th || TH.studio;
  var isStudio = t === TH.studio;
  var _step = useState(0);
  var step = _step[0], setStep = _step[1];
  var _name = useState("");
  var name = _name[0], setName = _name[1];
  var _handle = useState("");
  var handle = _handle[0], setHandle = _handle[1];
  var _inst = useState(null);
  var inst = _inst[0], setInst = _inst[1];
  var _level = useState(null);
  var level = _level[0], setLevel = _level[1];
  var _saving = useState(false);
  var saving = _saving[0], setSaving = _saving[1];
  var _handleErr = useState("");
  var handleErr = _handleErr[0], setHandleErr = _handleErr[1];

  var handleOk = /^[a-z0-9_]{3,15}$/.test(handle.trim()) && !handle.trim().includes("etudy");
  var canNext = step === 0 ? (name.trim().length > 0 && handleOk) : step === 1 ? inst !== null : level !== null;

  var handleNext = function() {
    if (step === 0) {
      if (!handleOk) { setHandleErr(handle.trim().includes("etudy") ? "This handle is reserved" : "3–15 characters · lowercase letters, numbers, _"); return; }
      setHandleErr(""); setStep(1); return;
    }
    if (step < 2) { setStep(step + 1); return; }
    setSaving(true);
    onComplete({ display_name: name.trim(), username: handle.trim().toLowerCase(), instrument: inst, level: level });
  };

  var handleBack = function() {
    if (step > 0) setStep(step - 1);
  };

  var dots = React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 } },
    [0,1,2].map(function(i) {
      return React.createElement("div", { key: i, style: {
        width: i === step ? 20 : 6, height: 6, borderRadius: 3,
        background: i === step ? t.accent : (i < step ? t.accent + "60" : t.border),
        transition: "all 0.2s"
      }});
    }));

  return React.createElement("div", {
    style: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 3100,
      background: t.bg, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20
    }
  },
    React.createElement("div", {
      style: { width: "100%", maxWidth: 400 }
    },
      // Header
      React.createElement("div", { style: { textAlign: "center", marginBottom: 8 } },
        React.createElement("div", {
          style: {
            width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px",
            background: t.accentBg, border: "1px solid " + t.accentBorder,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
          }
        }, "\u266B"),
        React.createElement("div", {
          style: { fontSize: 14, color: t.muted, fontFamily: "'Inter',sans-serif", marginBottom: 4 }
        }, "Welcome to \u00C9tudy")),

      // Dots
      dots,

      // ─── Screen 0: Name + Handle ───
      step === 0 && React.createElement("div", null,
        React.createElement("div", {
          style: { fontSize: 20, fontWeight: 700, color: t.text, fontFamily: "'Inter',sans-serif", textAlign: "center", marginBottom: 6 }
        }, "Create your profile"),
        React.createElement("div", {
          style: { fontSize: 13, color: t.muted, fontFamily: "'Inter',sans-serif", textAlign: "center", marginBottom: 24 }
        }, "How other musicians will see you"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: t.muted, fontFamily: "'Inter',sans-serif", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" } }, "Full Name"),
            React.createElement("input", {
              type: "text", placeholder: "Your name", value: name, autoFocus: true,
              onChange: function(e) { setName(e.target.value); },
              style: {
                width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15,
                border: "2px solid " + (name ? t.accent : t.border), background: t.inputBg || t.filterBg,
                color: t.text, fontFamily: "'Inter',sans-serif", outline: "none",
                boxSizing: "border-box", transition: "border-color 0.15s"
              }
            })),
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: t.muted, fontFamily: "'Inter',sans-serif", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" } }, "@Handle"),
            React.createElement("div", { style: { position: "relative" } },
              React.createElement("span", { style: { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: t.subtle, fontSize: 15, pointerEvents: "none" } }, "@"),
              React.createElement("input", {
                type: "text", placeholder: "yourhandle", value: handle,
                onChange: function(e) { setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()); setHandleErr(""); },
                onKeyDown: function(e) { if (e.key === "Enter" && canNext) handleNext(); },
                style: {
                  width: "100%", paddingLeft: 28, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                  borderRadius: 12, fontSize: 15,
                  border: "2px solid " + (handleErr ? "#EF4444" : handle && handleOk ? t.accent : t.border),
                  background: t.inputBg || t.filterBg,
                  color: t.text, fontFamily: "'Inter',sans-serif", outline: "none",
                  boxSizing: "border-box", transition: "border-color 0.15s"
                }
              })),
            handleErr && React.createElement("div", { style: { fontSize: 11, color: "#EF4444", fontFamily: "'Inter',sans-serif", marginTop: 4 } }, handleErr),
            !handleErr && React.createElement("div", { style: { fontSize: 10, color: t.subtle, fontFamily: "'Inter',sans-serif", marginTop: 4 } }, "3–15 characters · lowercase letters, numbers, _"))
        )),

      // ─── Screen 1: Instrument ───
      step === 1 && React.createElement("div", null,
        React.createElement("div", {
          style: { fontSize: 20, fontWeight: 700, color: t.text, fontFamily: "'Inter',sans-serif", textAlign: "center", marginBottom: 6 }
        }, "What do you play?"),
        React.createElement("div", {
          style: { fontSize: 13, color: t.muted, fontFamily: "'Inter',sans-serif", textAlign: "center", marginBottom: 24 }
        }, "We\u2019ll auto-transpose notation for you"),
        React.createElement("div", {
          style: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }
        },
          ONBOARD_INSTRUMENTS.map(function(name) {
            var sel = inst === name;
            var ic = INST_COL[name] || t.accent;
            return React.createElement("button", {
              key: name, onClick: function() { setInst(name); },
              style: {
                padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: sel ? 600 : 400,
                fontFamily: "'Inter',sans-serif", cursor: "pointer", transition: "all 0.15s",
                border: sel ? "2px solid " + ic : "1.5px solid " + t.border,
                background: sel ? (isStudio ? ic + "18" : ic + "10") : "transparent",
                color: sel ? t.text : t.muted
              }
            }, name);
          }))),

      // ─── Screen 2: Level ───
      step === 2 && React.createElement("div", null,
        React.createElement("div", {
          style: { fontSize: 20, fontWeight: 700, color: t.text, fontFamily: "'Inter',sans-serif", textAlign: "center", marginBottom: 6 }
        }, "Your experience level?"),
        React.createElement("div", {
          style: { fontSize: 13, color: t.muted, fontFamily: "'Inter',sans-serif", textAlign: "center", marginBottom: 24 }
        }, "Helps us suggest the right licks for you"),
        React.createElement("div", {
          style: { display: "flex", flexDirection: "column", gap: 10 }
        },
          ONBOARD_LEVELS.map(function(lv) {
            var sel = level === lv.id;
            return React.createElement("button", {
              key: lv.id, onClick: function() { setLevel(lv.id); },
              style: {
                padding: "16px 20px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
                border: sel ? "2px solid " + t.accent : "1.5px solid " + t.border,
                background: sel ? (isStudio ? t.accent + "15" : t.accent + "08") : "transparent"
              }
            },
              React.createElement("div", {
                style: { fontSize: 15, fontWeight: 600, color: sel ? t.text : t.muted, fontFamily: "'Inter',sans-serif", marginBottom: 2 }
              }, lv.label),
              React.createElement("div", {
                style: { fontSize: 12, color: t.subtle, fontFamily: "'Inter',sans-serif" }
              }, lv.sub));
          }))),

      // ─── Navigation ───
      React.createElement("div", {
        style: { display: "flex", gap: 10, marginTop: 28 }
      },
        step > 0 && React.createElement("button", {
          onClick: handleBack,
          style: {
            padding: "14px 24px", borderRadius: 14, border: "1px solid " + t.border,
            background: "transparent", color: t.muted, fontSize: 14, fontWeight: 600,
            fontFamily: "'Inter',sans-serif", cursor: "pointer"
          }
        }, "\u2190 Back"),
        React.createElement("button", {
          onClick: handleNext, disabled: !canNext || saving,
          style: {
            flex: 1, padding: "14px", borderRadius: 14, border: "none",
            background: canNext ? t.accent : t.border,
            color: canNext ? (isStudio ? "#08080F" : "#fff") : t.subtle,
            fontSize: 14, fontWeight: 700, fontFamily: "'Inter',sans-serif",
            cursor: canNext ? "pointer" : "default", opacity: saving ? 0.7 : 1,
            transition: "all 0.15s"
          }
        }, saving ? "Saving\u2026" : step === 2 ? "Let\u2019s go \u2192" : "Next \u2192"))
    )
  );
}

// ============================================================
// LOGIN MODAL — OTP Code Flow (PWA-safe, no redirect needed)
// ============================================================
function LoginModal({onClose, onLogin, th}) {
  var t = th || TH.studio;
  var isStudio = t === TH.studio;
  var _s = useState("idle");
  var step = _s[0], setStep = _s[1];
  var _e = useState("");
  var email = _e[0], setEmail = _e[1];
  var _c = useState(["","","","","","","",""]);
  var code = _c[0], setCode = _c[1];
  var _err = useState("");
  var errMsg = _err[0], setErr = _err[1];
  var inputRefs = useRef([]);

  var handleSendCode = function() {
    if (!email || !email.includes("@")) { setErr("Please enter a valid email"); return; }
    setStep("sending"); setErr("");
    signInWithMagicLink(email).then(function() {
      setStep("code");
    }).catch(function(e) {
      setErr(e.message || "Failed to send code");
      setStep("idle");
    });
  };

  var handleCodeChange = function(idx, val) {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    var next = code.slice();
    next[idx] = val;
    setCode(next);
    if (val && idx < 7 && inputRefs.current[idx + 1]) {
      inputRefs.current[idx + 1].focus();
    }
    if (val && idx === 7) {
      var fullCode = next.join("");
      if (fullCode.length === 8) { submitCode(fullCode); }
    }
  };

  var handleCodeKeyDown = function(idx, e) {
    if (e.key === "Backspace" && !code[idx] && idx > 0 && inputRefs.current[idx - 1]) {
      inputRefs.current[idx - 1].focus();
    }
  };

  var handleCodePaste = function(e) {
    var pasted = (e.clipboardData || window.clipboardData).getData("text").trim();
    if (/^\d{8}$/.test(pasted)) {
      e.preventDefault();
      var digits = pasted.split("");
      setCode(digits);
      if (inputRefs.current[7]) inputRefs.current[7].focus();
      submitCode(pasted);
    }
  };

  var submitCode = function(fullCode) {
    setStep("verifying"); setErr("");
    verifyOtp(email, fullCode).then(function(data) {
      setStep("done");
      if (onLogin) onLogin(data.session);
    }).catch(function(e) {
      setErr(e.message || "Invalid code. Please try again.");
      setStep("code");
      setCode(["","","","","","","",""]);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    });
  };

  var handleGoogle = function() {
    signInWithGoogle().catch(function(e) {
      setErr(e.message || "Google sign-in failed");
    });
  };

  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000,
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease"
    }
  },
    React.createElement("div", {
      onClick: function(e) { e.stopPropagation(); },
      style: {
        width: "100%", maxWidth: 400, background: t.card, borderRadius: 20,
        border: "1px solid " + t.border, padding: 32,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 8 } },
        React.createElement("button", {
          onClick: onClose,
          style: { background: "none", border: "none", color: t.muted, fontSize: 20, cursor: "pointer", padding: 4 }
        }, "\u00D7")),
      React.createElement("div", { style: { textAlign: "center", marginBottom: 24 } },
        React.createElement("div", {
          style: {
            width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px",
            background: t.accentBg, border: "1px solid " + t.accentBorder,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
          }
        }, "\u266B"),
        React.createElement("div", {
          style: { fontSize: 22, fontWeight: 700, color: t.text, fontFamily: "'Inter',sans-serif" }
        }, "\u00C9tudy"),
        React.createElement("div", {
          style: { fontSize: 13, color: t.muted, fontFamily: "'Inter',sans-serif", marginTop: 4 }
        }, step === "code" || step === "verifying"
          ? "Enter the 8-digit code from your email"
          : "Sign in to save licks, track progress & more")),
      (step === "idle" || step === "sending") && React.createElement("div", null,
        React.createElement("button", {
          onClick: handleGoogle,
          style: {
            width: "100%", padding: "14px", borderRadius: 12, border: "1px solid " + t.border,
            background: t.filterBg || t.inputBg, color: t.text, fontSize: 14, fontWeight: 600,
            fontFamily: "'Inter',sans-serif", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16
          }
        },
          React.createElement("img", {
            src: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
            alt: "Google", style: { width: 18, height: 18 }
          }),
          "Continue with Google"),
        React.createElement("div", {
          style: { display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }
        },
          React.createElement("div", { style: { flex: 1, height: 1, background: t.border } }),
          React.createElement("span", { style: { fontSize: 11, color: t.subtle, fontFamily: "'Inter',sans-serif" } }, "or"),
          React.createElement("div", { style: { flex: 1, height: 1, background: t.border } })),
        React.createElement("input", {
          type: "email", placeholder: "your@email.com", value: email,
          onChange: function(e) { setEmail(e.target.value); setErr(""); },
          onKeyDown: function(e) { if (e.key === "Enter") handleSendCode(); },
          style: {
            width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 15,
            border: "1px solid " + (errMsg ? "#EF4444" : t.border), background: t.inputBg || t.filterBg,
            color: t.text, fontFamily: "'Inter',sans-serif", outline: "none",
            boxSizing: "border-box", marginBottom: 12
          }
        }),
        React.createElement("button", {
          onClick: handleSendCode, disabled: step === "sending",
          style: {
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: step === "sending" ? t.subtle : t.accent,
            color: isStudio ? "#08080F" : "#fff", fontSize: 14, fontWeight: 700,
            fontFamily: "'Inter',sans-serif", cursor: step === "sending" ? "default" : "pointer",
            opacity: step === "sending" ? 0.7 : 1
          }
        }, step === "sending" ? "Sending code\u2026" : "Send sign-in code")),
      (step === "code" || step === "verifying") && React.createElement("div", null,
        React.createElement("div", {
          style: {
            textAlign: "center", marginBottom: 20, padding: "10px 16px",
            background: t.accentBg, borderRadius: 10, border: "1px solid " + t.accentBorder
          }
        },
          React.createElement("span", {
            style: { fontSize: 12, color: t.accent, fontFamily: "'JetBrains Mono',monospace" }
          }, email)),
        React.createElement("div", {
          style: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }
        },
          [0,1,2,3,4,5,6,7].map(function(i) {
            return React.createElement("input", {
              key: i,
              ref: function(el) { inputRefs.current[i] = el; },
              type: "text", inputMode: "numeric", maxLength: 1,
              value: code[i],
              onChange: function(e) { handleCodeChange(i, e.target.value); },
              onKeyDown: function(e) { handleCodeKeyDown(i, e); },
              onPaste: i === 0 ? handleCodePaste : undefined,
              autoFocus: i === 0,
              disabled: step === "verifying",
              style: {
                width: 38, height: 48, textAlign: "center", fontSize: 20, fontWeight: 700,
                fontFamily: "'JetBrains Mono',monospace", borderRadius: 10,
                border: "2px solid " + (code[i] ? t.accent : t.border),
                background: t.inputBg || t.filterBg, color: t.text, outline: "none",
                transition: "border-color 0.15s"
              }
            });
          })),
        step === "verifying" && React.createElement("div", {
          style: { textAlign: "center", marginBottom: 12 }
        },
          React.createElement("span", {
            style: { fontSize: 13, color: t.accent, fontFamily: "'Inter',sans-serif" }
          }, "Verifying\u2026")),
        step === "code" && React.createElement("div", { style: { textAlign: "center" } },
          React.createElement("button", {
            onClick: function() { setStep("idle"); setCode(["","","","","","","",""]); },
            style: {
              background: "none", border: "none", color: t.muted, fontSize: 12,
              fontFamily: "'Inter',sans-serif", cursor: "pointer", textDecoration: "underline"
            }
          }, "Didn\u2019t get a code? Try again"))),
      errMsg && React.createElement("div", {
        style: {
          marginTop: 12, padding: "10px 14px", borderRadius: 10,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)"
        }
      },
        React.createElement("span", {
          style: { fontSize: 12, color: "#EF4444", fontFamily: "'Inter',sans-serif" }
        }, errMsg)),
      React.createElement("div", {
        style: { textAlign: "center", marginTop: 20 }
      },
        React.createElement("span", {
          style: { fontSize: 10, color: t.subtle, fontFamily: "'Inter',sans-serif", lineHeight: "1.5" }
        }, "By signing in you agree to our Terms of Service"))
    )
  );
}

export default function Etudy(){
  const[theme,setTheme]=useState(null);const[view,sV]=useState("explore");const[selectedLick,setSelected]=useState(null);const[inst,sI]=useState("All");const[cat,sC]=useState("All");const[sq,sQ]=useState("");const[showEd,sSE]=useState(false);const[licks,sL]=useState(SAMPLE_LICKS);
  // Splash screen
  const[splashDone,setSplashDone]=useState(false);
  const[splashFading,setSplashFading]=useState(false);
  // Detail/Editor transition state: null | "entering" | "visible" | "exiting"
  const[detailAnim,setDetailAnim]=useState(null);
  const[editorAnim,setEditorAnim]=useState(null);
  const detailLickRef=useRef(null);
  // PWA Install prompt
  const[installPrompt,setInstallPrompt]=useState(null);
  // ─── AUTH STATE ───
  const[authUser,setAuthUser]=useState(null);
  const[authProfile,setAuthProfile]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[showLogin,setShowLogin]=useState(false);
  const[showOnboarding,setShowOnboarding]=useState(false);
  // Load profile + likes/saves from Supabase
  var loadUserData=function(user){
    setAuthUser(user);
    fetchProfile(user.id).then(function(p){
      setAuthProfile(p);
      if(!p||!p.onboarding_done)setShowOnboarding(true);
    }).catch(function(){setShowOnboarding(true);});
    // Load server-side likes & saves
    fetchUserLicks(user.id).then(function(result){
      if(result.likes.size>0)setLikedSet(result.likes);
      if(result.saves.size>0)setSavedSet(result.saves);
      // Also cache locally for offline
      var g=getStg();if(g){
        g.set("etudy:likedSet",JSON.stringify([...result.likes])).catch(function(){});
        g.set("etudy:savedSet",JSON.stringify([...result.saves])).catch(function(){});
      }
    }).catch(function(){});
  };
  useEffect(()=>{
    getSession().then(function(session){
      if(session&&session.user){ loadUserData(session.user); }
      setAuthLoading(false);
    }).catch(function(){setAuthLoading(false);});
    var sub=onAuthStateChange(function(event,session){
      if(session&&session.user){ loadUserData(session.user); }
      else { setAuthUser(null);setAuthProfile(null); }
    });
    return function(){if(sub&&sub.unsubscribe)sub.unsubscribe();};
  },[]);
  var requireAuth=function(callback){
    if(authUser){callback();return;}
    setShowLogin(true);
  };
  var handleLoginSuccess=function(session){
    if(session&&session.user){ loadUserData(session.user); }
    setShowLogin(false);
  };
  var handleOnboardingComplete=function(data){
    if(!authUser)return;
    updateProfile(authUser.id,{...data, username: data.username||null, onboarding_done:true}).then(function(p){
      setAuthProfile(p);
      setShowOnboarding(false);
      var mapped=instToUserInst(data.instrument);
      setUserInst(mapped);var g=getStg();if(g)g.set("etudy:userInst",mapped).catch(function(){});
    }).catch(function(e){
      console.error("Profile update failed:",e);
      setShowOnboarding(false);
    });
  };
  var handleProfileSave=async function(data){
    if(!authUser)throw new Error("Not logged in");
    var p=await updateProfile(authUser.id,data);
    setAuthProfile(p);
    if(data.instrument){
      var mapped=instToUserInst(data.instrument);
      setUserInst(mapped);var g=getStg();if(g)g.set("etudy:userInst",mapped).catch(function(){});
    }
    fetchLicks().then(function(fresh){if(fresh&&fresh.length>0)sL(fresh);});
  };
  var handleLogout=function(){
    signOut().then(function(){
      setAuthUser(null);setAuthProfile(null);
      // Clear user-specific local data
      setLikedSet(new Set());setSavedSet(new Set());setMyLicks([]);
      setStreakDays(0);setTotalHours(0);setKeyProgress({});
      var g=getStg();if(g){
        g.delete("etudy:likedSet").catch(function(){});
        g.delete("etudy:savedSet").catch(function(){});
        g.delete("etudy:savedLicksData").catch(function(){});
        g.delete("etudy:myLicks").catch(function(){});
        g.delete("etudy:keyProgress").catch(function(){});
        g.delete("practice-log").catch(function(){});
      }
    }).catch(function(){});
  };
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
  const[rhythmSub,setRhythmSub]=useState(null); // null | "metronome" | "reading" | "poly" — accordion
  const[trainSub,setTrainSub]=useState("rhythm"); // rhythm | ear
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
  const[publicProfileUser,setPublicProfileUser]=useState(null);
  const[showEditProfile,setShowEditProfile]=useState(false);
  const openPublicProfile=useCallback(function(username){
    if(!username||username==="Anonymous")return;
    previewStop();
    setPublicProfileUser(username);
    window.scrollTo(0,0);
  },[]);
  const closePublicProfile=useCallback(function(){
    setPublicProfileUser(null);
  },[]);
  const exploreScrollRef=useRef(0);const viewRef=useRef("explore");
  const switchView=useCallback((nv)=>{
    previewStop();
    if(viewRef.current==="explore")exploreScrollRef.current=window.scrollY||0;
    viewRef.current=nv;sV(nv);
    if(nv==="explore")setTimeout(()=>window.scrollTo(0,exploreScrollRef.current),0);
    else window.scrollTo(0,0);
  },[]);
  const openLick=useCallback((lick)=>{
    previewStop();ytCardCollapseAll();
    if(!selectedLick)exploreScrollRef.current=window.scrollY||0;
    detailLickRef.current=lick;
    setSelected(lick);setDetailAnim("entering");
    requestAnimationFrame(()=>requestAnimationFrame(()=>setDetailAnim("visible")));
    window.scrollTo(0,0);
    if(!visitedRef.current.detail){visitedRef.current.detail=true;setDetailShowTips(true);}
  },[selectedLick]);
  const closeLick=useCallback(()=>{
    ytCardCollapseAll();setDetailAnim("exiting");
    setTimeout(()=>{
      setSelected(null);setDetailAnim(null);detailLickRef.current=null;
      if(viewRef.current==="explore")setTimeout(()=>window.scrollTo(0,exploreScrollRef.current),0);
    },280);
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
    fetchLicks().then(data=>{if(data&&data.length>0){sL(data);
      setSelected(prev=>{if(!prev)return null;var fresh=data.find(l=>l.id===prev.id);return fresh||prev;});
    }
    // Dismiss splash after data arrives
    setTimeout(()=>{setSplashFading(true);setTimeout(()=>setSplashDone(true),400);},300);
    });
  },[]);
  // Fallback: dismiss splash after 2s even if fetch fails
  useEffect(()=>{var t=setTimeout(()=>{setSplashFading(true);setTimeout(()=>setSplashDone(true),400);},2000);return ()=>clearTimeout(t);},[]);
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
    if(!authUser){setShowLogin(true);return;}
    const wasLiked=likedSet.has(id);
    const adding=!wasLiked;
    setLikedSet(s=>{const n=new Set(s);if(adding)n.add(id);else n.delete(id);const g=getStg();if(g)g.set("etudy:likedSet",JSON.stringify([...n])).catch(()=>{});return n;});
    const lick=allLicks.find(l=>l.id===id);
    if(lick){const newCount=Math.max(0,(lick.likes||0)+(adding?1:-1));
      sL(prev=>prev.map(l=>l.id===id?{...l,likes:newCount}:l));
      updateLikes(id,newCount);}
    // Sync with Supabase
    if(adding){addUserLick(authUser.id,id,"like");}else{removeUserLick(authUser.id,id,"like");}
  };
  const toggleSave=id=>{
    if(!authUser){setShowLogin(true);return;}
    const lick=allLicks.find(l=>l.id===id);
    const wassSaved=savedSet.has(id);
    const adding=!wassSaved;
    setSavedSet(s=>{const n=new Set(s);if(adding)n.add(id);else n.delete(id);
      const g=getStg();if(g){g.set("etudy:savedSet",JSON.stringify([...n])).catch(()=>{});
        if(lick&&adding){g.get("etudy:savedLicksData").then(r=>{var m={};try{m=r&&r.value?JSON.parse(r.value):{};}catch(e){}m[id]=lick;g.set("etudy:savedLicksData",JSON.stringify(m)).catch(()=>{});}).catch(()=>{});}
        if(!adding){g.get("etudy:savedLicksData").then(r=>{var m={};try{m=r&&r.value?JSON.parse(r.value):{};}catch(e){}delete m[id];g.set("etudy:savedLicksData",JSON.stringify(m)).catch(()=>{});}).catch(()=>{});}
      }return n;});
    // Sync with Supabase
    if(adding){addUserLick(authUser.id,id,"save");}else{removeUserLick(authUser.id,id,"save");}
  };
  useEffect(()=>{preloadPiano();preloadChordPiano();preloadCustomPianoChord();lockPortrait();},[]);
  const dayOfYear=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/86400000);
  const dailyLick=licks.length>0?licks[dayOfYear%licks.length]:null;
  const srcLicks=lickSource==="mine"?licks.filter(function(l){return savedSet.has(l.id);}).concat(myLicks):licks;
  const fl=srcLicks.filter(l=>{if(lickSource==="community"&&dailyLick&&l.id===dailyLick.id)return false;if(inst!=="All"&&l.instrument!==inst)return false;if(cat!=="All"&&l.category!==cat)return false;if(sq){const q=sq.toLowerCase();return l.title.toLowerCase().includes(q)||l.artist.toLowerCase().includes(q)||l.key.toLowerCase().includes(q)||(l.tune||"").toLowerCase().includes(q)||(l.tags||[]).some(tg2=>tg2.includes(q));}return true;});
  const addLick=d=>{
    if(!authUser){setShowLogin(true);return;}
    const realUser=authProfile?.username||authUser?.email?.split("@")[0]||"Anonymous";
    const temp={...d,id:Date.now(),likes:0,user:realUser,userId:authUser.id,tags:d.tags||[]};
    sL([temp,...licks]);sSE(false);openLick(temp);
    insertLick({...d,user:realUser,userId:authUser.id}).then(real=>{
      if(real)sL(prev=>prev.map(l=>l.id===temp.id?real:l));
    });
  };
  const addPrivateLick=d=>{
    const realUser=authProfile?.username||authUser?.email?.split("@")[0]||"Anonymous";
    const n={...d,id:Date.now(),likes:0,user:realUser,tags:d.tags||[],private:true};
    setMyLicks(prev=>{const u=[n,...prev];const g=getStg();if(g)g.set("etudy:myLicks",JSON.stringify(u)).catch(()=>{});return u;});
    sSE(false);setLickSource("mine");openLick(n);};
  const deletePrivateLick=(id)=>{
    setMyLicks(prev=>{const u=prev.filter(l=>l.id!==id);const g=getStg();if(g)g.set("etudy:myLicks",JSON.stringify(u)).catch(()=>{});return u;});
    closeLick();};
  const searchByArtist=function(artistName){sQ(artistName);setLickSource("community");sI("All");sC("All");sV("explore");window.scrollTo(0,0);};
  const handleReport=async(id)=>{
    var result=await reportLick(id);
    if(result!==null){
      if(result>=3){sL(prev=>prev.filter(l=>l.id!==id));closeLick();}
      alert(result>=3?"Lick removed. Thank you for keeping the community clean!":"Thank you for reporting. We'll review this lick.");
    }
  };

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
  const css=["@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap');","*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}","html,body{background:"+t.bg+"}","::-webkit-scrollbar{display:none}","input:focus,textarea:focus,select:focus{border-color:"+t.accentBorder+"!important;outline:none}","select option{background:"+t.card+"}","input[type=range]{-webkit-appearance:none;background:"+t.progressBg+";border-radius:4px;height:3px}","input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:"+t.accent+";cursor:pointer;box-shadow:0 1px 4px "+t.accentGlow+"}","@keyframes spin{to{transform:rotate(360deg)}}","@keyframes fadeIn{from{opacity:0}to{opacity:1}}","@keyframes playPulse{0%,100%{box-shadow:0 4px 18px "+t.accentGlow+"}50%{box-shadow:0 4px 28px "+t.accentGlow+",0 0 40px "+t.accentGlow+"}}","@keyframes firePop{0%{transform:scale(1)}30%{transform:scale(1.4)}60%{transform:scale(0.9)}100%{transform:scale(1)}}","@keyframes flameFlicker{0%,100%{transform:scaleX(1) scaleY(1)}25%{transform:scaleX(0.94) scaleY(1.03)}50%{transform:scaleX(1.03) scaleY(0.97)}75%{transform:scaleX(0.97) scaleY(1.02)}}","@keyframes flameCore{0%,100%{opacity:0.8;transform:scaleY(1)}50%{opacity:0.5;transform:scaleY(0.85)}}","@keyframes loopPulse{0%,100%{opacity:1}50%{opacity:0.6}}","@keyframes coachIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}","@keyframes coachPulse{0%,100%{opacity:0.5}50%{opacity:1}}","@keyframes drillPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.95)}}","@keyframes drillKeyIn{0%{opacity:0;transform:scale(0.5) translateY(10px)}100%{opacity:1;transform:scale(1) translateY(0)}}","@keyframes drillDot{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}","@keyframes helpGlow{0%{box-shadow:0 0 0 0 "+t.accent+"60;transform:scale(1)}40%{box-shadow:0 0 12px 4px "+t.accent+"40;transform:scale(1.2)}70%{box-shadow:0 0 6px 2px "+t.accent+"20;transform:scale(1.05)}100%{box-shadow:0 0 0 0 transparent;transform:scale(1)}}",
"@keyframes popupIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}","@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}","@keyframes pageIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}","@keyframes heartPop{0%{transform:scale(1)}40%{transform:scale(1.35)}70%{transform:scale(0.88)}100%{transform:scale(1)}}","@keyframes chordGlow{0%,100%{box-shadow:0 0 12px rgba(99,102,241,0.2)}50%{box-shadow:0 0 24px rgba(99,102,241,0.4),0 0 48px rgba(99,102,241,0.15)}}","@keyframes sheetUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}","@keyframes detailSlideIn{from{transform:translateY(100%)}to{transform:translateY(0)}}","@keyframes detailSlideOut{from{transform:translateY(0)}to{transform:translateY(100%)}}","@keyframes splashOut{from{opacity:1}to{opacity:0}}","@keyframes tabFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}","[data-sheet-focus]{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;max-width:none!important;z-index:9999!important}"].join("\n");

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
          view!=="explore"&&React.createElement("span",{style:{fontSize:12,color:t.muted,fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5}},view==="train"?"TRAIN":view==="sessions"?"SESSIONS":view==="me"?"ME":""),
          // ? help button — only after tips have been shown once
          (view==="explore"&&feedTipped||view==="train"&&trainSub==="ear"&&earTipped||view==="train"&&trainSub==="rhythm"&&rhythmTipped)&&React.createElement("button",{onClick:function(){
            if(view==="explore")setFeedShowTips(true);
            else if(view==="train"&&trainSub==="ear")setEarShowTips(true);
            else if(view==="train"&&trainSub==="rhythm")setRhythmShowTips(true);
          },style:{width:22,height:22,borderRadius:11,border:"1px solid "+t.border,background:t.filterBg,color:t.subtle,fontSize:11,fontFamily:"'Inter',sans-serif",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all 0.15s",animation:"helpGlow 0.8s ease"}},"?"),
          // Settings gear
          React.createElement("button",{onClick:function(){setShowSettings(true);},style:{width:34,height:34,borderRadius:17,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,opacity:0.7,transition:"opacity 0.15s"}},IC.gear(20,t.muted)))),
      view==="explore"&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,paddingBottom:6}},
        // Source toggle — takes most space
        React.createElement("div",{style:{display:"flex",gap:4,background:t.filterBg,borderRadius:10,padding:3,flex:1}},
          [["community","Community"],["mine","My Licks"+(savedSet.size+myLicks.length?" ("+( savedSet.size+myLicks.length)+")":"")]].map(function(m){
            return React.createElement("button",{key:m[0],onClick:function(){setLickSource(m[0]);},style:{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:lickSource===m[0]?(t.activeTabBg||t.card):"transparent",color:lickSource===m[0]?t.text:t.subtle,fontSize:12,fontWeight:lickSource===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:lickSource===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}},m[1]);
          })),
        // Filter icon — far right
        React.createElement("div",{style:{flexShrink:0}},
          React.createElement(Filters,{instrument:inst,setInstrument:sI,category:cat,setCategory:sC,sq:sq,setSq:sQ,th:t})))),
    // Content
    React.createElement("div",{style:{padding:"12px 16px 24px"}},
      view==="explore"&&React.createElement("div",{style:{animation:"tabFadeIn 0.2s ease"}},
        lickSource==="community"&&!sq&&inst==="All"&&cat==="All"&&dailyLick&&React.createElement(DailyLickCard,{lick:dailyLick,onSelect:openLick,th:t,liked:likedSet.has(dailyLick.id),saved:savedSet.has(dailyLick.id),onLike:toggleLike,onSave:toggleSave,userInst:userInst,onArtistSearch:searchByArtist}),
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
            React.createElement("div",{style:{display:"flex",gap:4,background:t.filterBg,borderRadius:10,padding:3,marginBottom:12}},
              [["saved",(isStudio?"\u2299 ":"\u2605 ")+"Saved ("+savedLicks.length+")"],["private","\uD83D\uDD12 Private ("+privateLicks.length+")"]].map(function(m){
                return React.createElement("button",{key:m[0],onClick:function(){setMyLicksSub(m[0]);},style:{flex:1,padding:"8px 12px",borderRadius:8,border:"none",background:myLicksSub===m[0]?(t.activeTabBg||t.card):"transparent",color:myLicksSub===m[0]?t.text:t.subtle,fontSize:12,fontWeight:myLicksSub===m[0]?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:myLicksSub===m[0]?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}},m[1]);})),
            activeLicks.length>0&&activeLicks.map(function(l,i){return React.createElement(LickCard,{key:l.id,lick:l,onSelect:openLick,th:t,liked:likedSet.has(l.id),saved:savedSet.has(l.id),onLike:toggleLike,onSave:toggleSave,userInst:userInst,onUserClick:openPublicProfile,onArtistSearch:searchByArtist,animIdx:i});}),
            activeLicks.length===0&&React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",background:t.card,borderRadius:14,border:"1px solid "+t.border}},
              React.createElement("div",{style:{fontSize:12,color:t.subtle,fontFamily:"'Inter',sans-serif"}},myLicksSub==="saved"?"No saved licks yet — "+(isStudio?"target \u2299":"star \u2605")+" licks to save them":"No private licks yet — create one with the + button")));
        })(),
        lickSource==="community"&&fl.map((l,i)=>React.createElement(LickCard,{key:l.id,lick:l,onSelect:openLick,th:t,liked:likedSet.has(l.id),saved:savedSet.has(l.id),onLike:toggleLike,onSave:toggleSave,userInst:userInst,onUserClick:openPublicProfile,onArtistSearch:searchByArtist,animIdx:i})),
        fl.length===0&&!(lickSource==="mine"&&!sq&&inst==="All"&&cat==="All")&&React.createElement("div",{style:{textAlign:"center",padding:"60px 20px"}},React.createElement("p",{style:{fontFamily:t.titleFont,fontSize:16,color:t.subtle,fontStyle:theme==="studio"?"normal":"italic"}},"No licks found"))),
      view==="train"&&React.createElement("div",{style:{animation:"tabFadeIn 0.2s ease"}},
        // Train sub-tabs: Ear | Rhythm (later: Scales)
        React.createElement("div",{style:{display:"flex",gap:4,marginBottom:14,background:t.filterBg,borderRadius:10,padding:3}},
          [["rhythm","Rhythm"],["ear","Ear"],["scales","Scales"]].map(function(m){
            var active=trainSub===m[0];
            return React.createElement("button",{key:m[0],onClick:function(){setTrainSub(m[0]);},style:{flex:1,padding:"8px 10px",borderRadius:8,border:"none",background:active?(t.activeTabBg||t.card):"transparent",color:active?t.text:t.subtle,fontSize:11,fontWeight:active?600:400,fontFamily:"'Inter',sans-serif",cursor:"pointer",boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:5}},
              m[0]==="rhythm"?IC.tabRhythm(13,active?t.text:t.subtle,active):m[0]==="ear"?IC.tabEar(13,active?t.text:t.subtle,active):IC.tabScales(13,active?t.text:t.subtle,active),m[1]);
          })),
        // Scales & Chords sub-view
        trainSub==="scales"&&React.createElement(ScaleChordTrainer,{key:userInst,th:t,userInst:userInst}),
        // Ear sub-view
        trainSub==="ear"&&React.createElement(EarTrainer,{licks:allLicks,onLike:toggleLike,onOpen:openLick,likedSet:likedSet,th:t,userInst:userInst}),
        // Rhythm sub-view — accordion cards
        trainSub==="rhythm"&&React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          // ── Metronome card ──
          React.createElement("div",{"data-coach":"rhythm-metro",style:{background:t.card,borderRadius:14,border:"1px solid "+(rhythmSub==="metronome"?t.accent+"30":t.border),overflow:"hidden",transition:"border-color 0.2s"}},
            React.createElement("button",{onClick:function(){setRhythmSub(rhythmSub==="metronome"?null:"metronome");},style:{width:"100%",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}},
              React.createElement("div",{style:{width:32,height:32,borderRadius:8,background:isStudio?"#3B82F615":"#3B82F608",display:"flex",alignItems:"center",justifyContent:"center"}},
                IC.iconMetronome(16,isStudio?"#3B82F6":"#2563EB")),
              React.createElement("div",{style:{flex:1,textAlign:"left"}},
                React.createElement("div",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"Metronome"),
                React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:1}},"Tap tempo, time signatures, subdivisions")),
              React.createElement("span",{style:{fontSize:14,color:t.muted,transform:rhythmSub==="metronome"?"rotate(90deg)":"none",transition:"transform 0.2s"}},"\u203A")),
            rhythmSub==="metronome"&&React.createElement("div",{style:{padding:"0 16px 16px"}},
              React.createElement(Metronome,{th:t}))),
          // ── Polyrhythm card ──
          React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+(rhythmSub==="poly"?t.accent+"30":t.border),overflow:"hidden",transition:"border-color 0.2s"}},
            React.createElement("button",{onClick:function(){setRhythmSub(rhythmSub==="poly"?null:"poly");},style:{width:"100%",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}},
              React.createElement("div",{style:{width:32,height:32,borderRadius:8,background:isStudio?"#A78BFA15":"#A78BFA08",display:"flex",alignItems:"center",justifyContent:"center"}},
                React.createElement("span",{style:{fontSize:16,color:isStudio?"#A78BFA":"#8B5CF6",lineHeight:1}},"\u25CE")),
              React.createElement("div",{style:{flex:1,textAlign:"left"}},
                React.createElement("div",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"Polyrhythm"),
                React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:1}},"Cross-rhythm patterns with circular visualization")),
              React.createElement("span",{style:{fontSize:14,color:t.muted,transform:rhythmSub==="poly"?"rotate(90deg)":"none",transition:"transform 0.2s"}},"\u203A")),
            rhythmSub==="poly"&&React.createElement("div",{style:{padding:"0 16px 16px"}},
              React.createElement(PolyrhythmTrainer,{th:t,sharedInput:"tap",sharedMicSilent:true}))),
          // ── Rhythm Reading card ──
          React.createElement("div",{style:{background:t.card,borderRadius:14,border:"1px solid "+(rhythmSub==="reading"?t.accent+"30":t.border),overflow:"hidden",transition:"border-color 0.2s"}},
            React.createElement("button",{onClick:function(){setRhythmSub(rhythmSub==="reading"?null:"reading");},style:{width:"100%",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}},
              React.createElement("div",{style:{width:32,height:32,borderRadius:8,background:isStudio?"#F59E0B15":"#F59E0B08",display:"flex",alignItems:"center",justifyContent:"center"}},
                IC.tabRhythm(16,isStudio?"#F59E0B":"#D97706",false)),
              React.createElement("div",{style:{flex:1,textAlign:"left"}},
                React.createElement("div",{style:{fontSize:13,fontWeight:600,color:t.text,fontFamily:"'Inter',sans-serif"}},"Rhythm Reading"),
                React.createElement("div",{style:{fontSize:10,color:t.muted,fontFamily:"'Inter',sans-serif",marginTop:1}},"Sight-read and clap rhythmic patterns")),
              React.createElement("span",{style:{fontSize:14,color:t.muted,transform:rhythmSub==="reading"?"rotate(90deg)":"none",transition:"transform 0.2s"}},"\u203A")),
            rhythmSub==="reading"&&React.createElement("div",{style:{padding:"0 16px 16px"}},
              React.createElement(RhythmGame,{th:t,sharedInput:"tap",sharedMicSilent:true}))))),

      // ─── SESSIONS TAB ───
      view==="sessions"&&React.createElement("div",{style:{padding:"8px 0",animation:"tabFadeIn 0.2s ease"}},
        React.createElement(PracticePlan,{th:t,licks:allLicks,savedSet:savedSet,historyKey:historyRefresh,onStartSession:function(plan){try{Tone.start();}catch(e){}setRunningPlan(plan);}}),
        React.createElement(PracticeHistory,{th:t,historyKey:historyRefresh})),

      // ─── ME TAB ───
      view==="me"&&React.createElement("div",{style:{padding:"8px 0",animation:"tabFadeIn 0.2s ease"}},

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

        // Auth info + Logout
        React.createElement("div",{style:{marginTop:16,paddingTop:16,borderTop:"1px solid "+t.border}},
          authUser
            ?React.createElement("div",null,
              // Profile card
              React.createElement("div",{style:{background:t.card,borderRadius:16,border:"1px solid "+t.border,padding:"16px",marginBottom:12,display:"flex",alignItems:"center",gap:14}},
                // Avatar
                React.createElement("div",{style:{width:52,height:52,borderRadius:16,background:isStudio?"linear-gradient(135deg,"+(authProfile?.instrument?INST_COL[authProfile.instrument]||t.accent:t.accent)+"22,"+(authProfile?.instrument?INST_COL[authProfile.instrument]||t.accent:t.accent)+"08)":t.accentBg,border:"2px solid "+(authProfile?.instrument?INST_COL[authProfile.instrument]||t.accent:t.accent)+"40",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}},
                  authProfile?.avatar_url
                    ?React.createElement("img",{src:authProfile.avatar_url,style:{width:"100%",height:"100%",objectFit:"cover"}})
                    :React.createElement("span",{style:{fontSize:18,fontWeight:700,color:authProfile?.instrument?INST_COL[authProfile.instrument]||t.accent:t.accent,fontFamily:"'Inter',sans-serif"}},(authProfile?.display_name||authUser.email||"?").slice(0,2).toUpperCase())),
                // Info
                React.createElement("div",{style:{flex:1,minWidth:0}},
                  React.createElement("div",{style:{fontSize:14,fontWeight:700,color:t.text,fontFamily:"'Inter',sans-serif",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},authProfile?.display_name||authUser.email),
                  authProfile?.username&&React.createElement("div",{style:{fontSize:11,color:t.accent,fontFamily:"'Inter',sans-serif",fontWeight:600,marginBottom:1}},"@"+authProfile.username),
                  React.createElement("div",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},authUser.email)),
                // Edit button
                React.createElement("button",{onClick:function(){setShowEditProfile(true);},style:{padding:"7px 14px",borderRadius:10,border:"1px solid "+t.border,background:t.filterBg,color:t.muted,fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}},"Edit")),
                            React.createElement("button",{onClick:handleLogout,style:{width:"100%",padding:"10px",borderRadius:10,border:"1px solid "+t.border,background:"transparent",color:t.muted,fontSize:12,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Sign out"))
            :React.createElement("button",{onClick:function(){setShowLogin(true);},style:{width:"100%",padding:"12px 24px",borderRadius:12,border:"none",background:t.accent,color:isStudio?"#08080F":"#fff",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:"pointer"}},"Sign in"),
          React.createElement("div",{style:{marginTop:16,textAlign:"center"}},
            React.createElement("span",{style:{fontSize:10,color:t.subtle,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}},"\u00C9tudy \u00B7 Beta")))),

    // BOTTOM TAB BAR
    React.createElement("div",{style:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,zIndex:100,background:t.tabBarBg||t.headerBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:"1px solid "+(isStudio?t.borderSub||t.border:t.border),display:"flex",padding:"6px 16px",paddingBottom:"calc(8px + env(safe-area-inset-bottom, 0px))"}},
      [["explore","tabLicks","Licks"],["train","tabTrain","Train"],["sessions","tabSessions","Sessions"],["me","tabMe","Me"]].map(function(tab){
        var active=view===tab[0];var iconC=active?t.accent:t.subtle;
        return React.createElement("button",{key:tab[0],onClick:function(){switchView(tab[0]);},style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"8px 0",transition:"all 0.15s"}},
          IC[tab[1]](24,iconC,active),
          React.createElement("span",{style:{fontSize:10,fontFamily:"'Inter',sans-serif",fontWeight:active?600:400,color:active?t.accent:t.subtle,letterSpacing:0.3}},tab[2]));})),
    // FAB — only on explore
    view==="explore"&&React.createElement("button",{"data-coach":"fab",onClick:()=>sSE(true),style:{position:"fixed",bottom:"calc(84px + env(safe-area-inset-bottom, 0px))",right:24,width:isStudio?56:52,height:isStudio?56:52,borderRadius:isStudio?18:16,background:t.playBg||t.accent,border:"none",cursor:"pointer",zIndex:500,boxShadow:isStudio?"0 6px 28px "+t.accentGlow+", 0 2px 8px rgba(0,0,0,0.3)":"0 4px 20px "+t.accentGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontWeight:300}},"+"),
    // Overlays
    feedShowTips&&view==="explore"&&!selectedLick&&!showEd&&React.createElement(CoachMarks,{tips:FEED_TIPS,onDone:markFeedTipped,th:t}),
    earShowTips&&view==="train"&&trainSub==="ear"&&!selectedLick&&React.createElement(CoachMarks,{tips:EAR_TIPS,onDone:markEarTipped,th:t}),
    rhythmShowTips&&view==="train"&&trainSub==="rhythm"&&React.createElement(CoachMarks,{tips:RHYTHM_TIPS,onDone:markRhythmTipped,th:t}),
    selectedLick&&React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,animation:detailAnim==="exiting"?"detailSlideOut 0.28s ease-in forwards":"detailSlideIn 0.3s cubic-bezier(0.32,0.72,0,1) forwards"}},
      React.createElement(LickDetail,{key:selectedLick.id,lick:selectedLick,onBack:closeLick,th:t,liked:likedSet.has(selectedLick.id),saved:savedSet.has(selectedLick.id),onLike:toggleLike,onSave:toggleSave,showTips:detailShowTips,onTipsDone:markDetailTipped,onReShowTips:detailTipped?function(){setDetailShowTips(true);}:null,defaultInst:userInst,onDeletePrivate:deletePrivateLick,onReport:handleReport,onUserClick:openPublicProfile})),
    publicProfileUser&&React.createElement(PublicProfileView,{key:publicProfileUser,username:publicProfileUser,onClose:closePublicProfile,onLickSelect:function(lick){closePublicProfile();openLick(lick);},th:t,likedSet:likedSet,savedSet:savedSet,onLike:toggleLike,onSave:toggleSave,userInst:userInst}),
    showEditProfile&&authUser&&React.createElement(EditProfileView,{authUser:authUser,authProfile:authProfile,onClose:function(){setShowEditProfile(false);},onSave:handleProfileSave,th:t}),
    showEd&&React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1000,animation:"detailSlideIn 0.3s cubic-bezier(0.32,0.72,0,1) forwards"}},
      React.createElement(Editor,{onClose:()=>sSE(false),onSubmit:addLick,onSubmitPrivate:addPrivateLick,th:t,userInst:userInst})),
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
            ["Concert","Alto Sax","Soprano Sax","Tenor Sax","Baritone Sax","Bb Trumpet","Clarinet","Trombone","Flute","Piano","Guitar","Bass","Vibes","Violin","Vocals"].map(function(name){
              var mappedName=instToUserInst(name);
              var isActive=userInst===mappedName;
              return React.createElement("button",{key:name,onClick:function(){changeUserInst(mappedName);},style:{padding:"8px 14px",borderRadius:10,border:isActive?"1.5px solid "+t.accent:"1.5px solid "+t.border,background:isActive?(isStudio?t.accent+"15":t.accent+"08"):"transparent",color:isActive?t.text:t.muted,fontSize:12,fontFamily:"'Inter',sans-serif",fontWeight:isActive?600:400,cursor:"pointer",transition:"all 0.15s"}},name);})),
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
    ),
    showLogin&&React.createElement(LoginModal,{th:t,onClose:function(){setShowLogin(false);},onLogin:handleLoginSuccess}),
    showOnboarding&&authUser&&React.createElement(Onboarding,{th:t,onComplete:handleOnboardingComplete}),
    // Splash screen
    !splashDone&&React.createElement("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,background:isStudio?"#08080F":"#EEEDE6",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:splashFading?0:1,transition:"opacity 0.4s ease",pointerEvents:splashFading?"none":"auto"}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,animation:"fadeIn 0.5s ease"}},
        React.createElement("span",{style:{fontSize:28,opacity:0.6}},"\u266A"),
        React.createElement("span",{style:{fontSize:32,fontFamily:isStudio?"'Inter',sans-serif":"'Instrument Serif',Georgia,serif",color:isStudio?"#F2F2FA":"#1A1A1A",fontWeight:isStudio?700:400,letterSpacing:0.5}},"\u00C9tudy")),
      React.createElement("div",{style:{marginTop:16,width:40,height:2,borderRadius:1,background:isStudio?"#22D89E":"#6366F1",animation:"playPulse 1.2s ease infinite",opacity:0.6}}))
  );}
