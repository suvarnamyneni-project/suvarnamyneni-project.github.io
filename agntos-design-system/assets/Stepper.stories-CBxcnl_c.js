import{j as c}from"./jsx-runtime-D_zvdyIk.js";import{S as o}from"./Stepper-yIRbBbkX.js";import{h as l,w as u}from"./sample-DR75VmRb.js";const S={title:"Components/Stepper",component:o,tags:["autodocs"],parameters:{docs:{description:{component:"Workflow steps and file history share one timeline. Done, current, upcoming, and blocked each have a dot color."}}}},t={render:()=>c.jsx(o,{steps:u})},r={render:()=>c.jsx(o,{label:"History",steps:l.map((e,m)=>({id:e.id,title:e.title,detail:`${e.detail} · ${e.when}`,state:m===0?"current":"done"}))})};var s,a,n;t.parameters={...t.parameters,docs:{...(s=t.parameters)==null?void 0:s.docs,source:{originalSource:`{
  render: () => <Stepper steps={workflowSteps} />
}`,...(n=(a=t.parameters)==null?void 0:a.docs)==null?void 0:n.source}}};var i,p,d;r.parameters={...r.parameters,docs:{...(i=r.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <Stepper label="History" steps={history.map((item, index) => ({
    id: item.id,
    title: item.title,
    detail: \`\${item.detail} · \${item.when}\`,
    state: index === 0 ? "current" : "done"
  }))} />
}`,...(d=(p=r.parameters)==null?void 0:p.docs)==null?void 0:d.source}}};const x=["Workflow","History"];export{r as History,t as Workflow,x as __namedExportsOrder,S as default};
