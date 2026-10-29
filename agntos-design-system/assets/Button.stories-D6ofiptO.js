import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{b as k,a as j,B as i}from"./Button-Cobx0n-P.js";import{C as B}from"./check-DkJ089qz.js";import"./index-C9y0RuIT.js";import"./_commonjsHelpers-CqkleIqs.js";import"./cx-2dOUpm6k.js";import"./createLucideIcon--EHRR9k_.js";const D={title:"Components/Button",component:i,tags:["autodocs"],args:{children:"Approve file",variant:"primary",size:"md"},argTypes:{variant:{control:"select",options:[...j]},size:{control:"select",options:[...k]}},parameters:{docs:{description:{component:"Seven variants from the live kit: primary (ink), secondary, ghost, soft, danger (clay), sage, and link. Heights are 32, 36, and 44px. The 48px xl size is the sign-in emphasis button. Focus is a 3px ring using `--ring`. Loading sets `aria-busy` and blocks a second submit."}}}},a={},s={render:()=>r.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"},children:j.map(e=>r.jsx(i,{variant:e,children:e},e))})},n={render:()=>r.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"},children:k.map(e=>r.jsx(i,{size:e,iconLeft:r.jsx(B,{size:14}),children:e},e))})},t={args:{loading:!0,children:"Approving"}},o={args:{disabled:!0}};var p,c,d;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:"{}",...(d=(c=a.parameters)==null?void 0:c.docs)==null?void 0:d.source}}};var m,l,u;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center"
  }}>
      {buttonVariants.map(variant => <Button key={variant} variant={variant}>{variant}</Button>)}
    </div>
}`,...(u=(l=s.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var g,x,y;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center"
  }}>
      {buttonSizes.map(size => <Button key={size} size={size} iconLeft={<Check size={14} />}>{size}</Button>)}
    </div>
}`,...(y=(x=n.parameters)==null?void 0:x.docs)==null?void 0:y.source}}};var f,v,h;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    loading: true,
    children: "Approving"
  }
}`,...(h=(v=t.parameters)==null?void 0:v.docs)==null?void 0:h.source}}};var b,z,S;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...(S=(z=o.parameters)==null?void 0:z.docs)==null?void 0:S.source}}};const E=["Primary","Variants","Sizes","Loading","Disabled"];export{o as Disabled,t as Loading,a as Primary,n as Sizes,s as Variants,E as __namedExportsOrder,D as default};
