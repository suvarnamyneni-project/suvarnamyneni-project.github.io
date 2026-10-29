import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as t}from"./cx-2dOUpm6k.js";import{c as a}from"./createLucideIcon--EHRR9k_.js";import{T as l}from"./triangle-alert-D4_QwUey.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],d=a("circle-check",o);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],u=a("circle-x",m);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],f=a("info",p),y={info:f,success:d,warning:l,danger:u};function g({tone:n="info",title:r,children:i,banner:c=!1}){const s=y[n];return e.jsxs("div",{className:t("agnt-alert",`agnt-alert-${n}`,c&&"agnt-banner"),role:n==="danger"||n==="warning"?"alert":"status",children:[e.jsx(s,{size:16,style:{marginTop:2,flex:"none"},"aria-hidden":"true"}),e.jsxs("div",{children:[r&&e.jsx("strong",{children:r}),e.jsx("p",{children:i})]})]})}g.__docgenInfo={description:"",methods:[],displayName:"Alert",props:{tone:{required:!1,tsType:{name:"union",raw:'"info" | "success" | "warning" | "danger"',elements:[{name:"literal",value:'"info"'},{name:"literal",value:'"success"'},{name:"literal",value:'"warning"'},{name:"literal",value:'"danger"'}]},description:"",defaultValue:{value:'"info"',computed:!1}},title:{required:!1,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactNode"},description:""},banner:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}}}};export{g as A};
