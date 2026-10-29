import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{B as r}from"./Badge-u3Rjh3b-.js";import{T as i}from"./triangle-alert-D4_QwUey.js";import{c as l}from"./createLucideIcon--EHRR9k_.js";import{C as o}from"./check-DkJ089qz.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]],d=l("sparkles",u),a={Passed:"sage",Suggestions:"violet","Couldn't review":"neutral"},m={Passed:o,Suggestions:d,"Couldn't review":i};function c({documents:t}){return e.jsx("div",{children:t.map(s=>{const n=m[s.status];return e.jsxs("article",{className:"agnt-docrow",children:[e.jsx("span",{className:`agnt-avatar agnt-avatar-${a[s.status]}`,"aria-hidden":"true",children:e.jsx(n,{size:14})}),e.jsxs("div",{children:[e.jsx("h3",{children:s.name}),e.jsx("p",{children:s.note})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6},children:[e.jsx(r,{tone:a[s.status],children:s.status}),e.jsx("span",{className:"agnt-muted",style:{fontSize:12},children:s.kind})]})]},s.id)})})}c.__docgenInfo={description:"",methods:[],displayName:"AiDocumentReview",props:{documents:{required:!0,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string;
  name: string;
  kind: string;
  status: ReviewStatus;
  note: string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"name",value:{name:"string",required:!0}},{key:"kind",value:{name:"string",required:!0}},{key:"status",value:{name:"union",raw:`"Passed" | "Suggestions" | "Couldn't review"`,elements:[{name:"literal",value:'"Passed"'},{name:"literal",value:'"Suggestions"'},{name:"literal",value:`"Couldn't review"`}],required:!0}},{key:"note",value:{name:"string",required:!0}}]}}],raw:"DocumentReview[]"},description:""}}};export{c as A};
