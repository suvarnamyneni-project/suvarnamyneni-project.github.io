import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{S as t}from"./Badge-u3Rjh3b-.js";function n({task:r,onOpen:a}){return e.jsxs("button",{type:"button",className:"agnt-taskrow",onClick:()=>a==null?void 0:a(r),children:[e.jsxs("span",{children:[e.jsx("h3",{children:r.title}),e.jsx("p",{children:r.file})]}),e.jsxs("span",{children:[e.jsx(t,{status:r.status}),e.jsx("p",{style:{marginTop:4},children:r.sla})]}),e.jsxs("span",{style:{textAlign:"right"},children:[e.jsx("strong",{style:{fontSize:13},children:r.actor}),e.jsxs("p",{children:[r.actorRole," acts"]})]})]})}n.__docgenInfo={description:"",methods:[],displayName:"TaskListRow",props:{task:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  id: string;
  title: string;
  file: string;
  address: string;
  status: StatusName;
  sla: string;
  actor: string;
  actorRole: string;
  ageDays: number;
  urgency: number;
  group: string;
  unit: "Ontario" | "Alberta";
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"file",value:{name:"string",required:!0}},{key:"address",value:{name:"string",required:!0}},{key:"status",value:{name:"union",raw:"keyof typeof statuses",elements:[{name:"literal",value:"Overdue"},{name:"literal",value:"Waiting"},{name:"literal",value:"Ready"},{name:"literal",value:'"Resubmitted · 2nd review"'},{name:"literal",value:'"SLA Breached"'},{name:"literal",value:"Approved"},{name:"literal",value:"Rejected"}],required:!0}},{key:"sla",value:{name:"string",required:!0}},{key:"actor",value:{name:"string",required:!0}},{key:"actorRole",value:{name:"string",required:!0}},{key:"ageDays",value:{name:"number",required:!0}},{key:"urgency",value:{name:"number",required:!0}},{key:"group",value:{name:"string",required:!0}},{key:"unit",value:{name:"union",raw:'"Ontario" | "Alberta"',elements:[{name:"literal",value:'"Ontario"'},{name:"literal",value:'"Alberta"'}],required:!0}}]}},description:""},onOpen:{required:!1,tsType:{name:"signature",type:"function",raw:"(task: TaskRecord) => void",signature:{arguments:[{type:{name:"signature",type:"object",raw:`{
  id: string;
  title: string;
  file: string;
  address: string;
  status: StatusName;
  sla: string;
  actor: string;
  actorRole: string;
  ageDays: number;
  urgency: number;
  group: string;
  unit: "Ontario" | "Alberta";
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"file",value:{name:"string",required:!0}},{key:"address",value:{name:"string",required:!0}},{key:"status",value:{name:"union",raw:"keyof typeof statuses",elements:[{name:"literal",value:"Overdue"},{name:"literal",value:"Waiting"},{name:"literal",value:"Ready"},{name:"literal",value:'"Resubmitted · 2nd review"'},{name:"literal",value:'"SLA Breached"'},{name:"literal",value:"Approved"},{name:"literal",value:"Rejected"}],required:!0}},{key:"sla",value:{name:"string",required:!0}},{key:"actor",value:{name:"string",required:!0}},{key:"actorRole",value:{name:"string",required:!0}},{key:"ageDays",value:{name:"number",required:!0}},{key:"urgency",value:{name:"number",required:!0}},{key:"group",value:{name:"string",required:!0}},{key:"unit",value:{name:"union",raw:'"Ontario" | "Alberta"',elements:[{name:"literal",value:'"Ontario"'},{name:"literal",value:'"Alberta"'}],required:!0}}]}},name:"task"}],return:{name:"void"}}},description:""}}};export{n as T};
