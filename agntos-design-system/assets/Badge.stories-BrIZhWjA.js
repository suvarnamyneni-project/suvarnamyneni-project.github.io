import{j as t}from"./jsx-runtime-D_zvdyIk.js";import{S as g,s as x,B as f}from"./Badge-u3Rjh3b-.js";import"./cx-2dOUpm6k.js";const v={title:"Components/Badge",component:g,tags:["autodocs"],args:{status:"Waiting"},parameters:{docs:{description:{component:"Status chips use a soft fill, the darker pair color for the label, and a 6px dot. SLA Breached adds a stronger inset ring. These seven labels are the Deal Desk statuses."}}}},a={},s={render:()=>t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:x.map(e=>t.jsx(g,{status:e},e))})},r={render:()=>t.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:["sage","amber","clay","sky","violet","accent","neutral"].map(e=>t.jsx(f,{tone:e,children:e},e))})};var o,n,p;a.parameters={...a.parameters,docs:{...(o=a.parameters)==null?void 0:o.docs,source:{originalSource:"{}",...(p=(n=a.parameters)==null?void 0:n.docs)==null?void 0:p.source}}};var d,c,i;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  }}>{statusNames.map(status => <StatusChip key={status} status={status} />)}</div>
}`,...(i=(c=s.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var l,m,u;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  }}>{(["sage", "amber", "clay", "sky", "violet", "accent", "neutral"] as const).map(tone => <Badge key={tone} tone={tone}>{tone}</Badge>)}</div>
}`,...(u=(m=r.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};const W=["Waiting","Statuses","Tones"];export{s as Statuses,r as Tones,a as Waiting,W as __namedExportsOrder,v as default};
