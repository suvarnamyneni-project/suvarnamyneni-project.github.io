import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{useMDXComponents as a}from"./index-Bp2ZTvF6.js";import{M as r}from"./index-CYJq18A0.js";import"./index-C9y0RuIT.js";import"./_commonjsHelpers-CqkleIqs.js";import"./iframe-3qf4Sp3X.js";import"./index-BpnpJ21E.js";import"./index-Drs0PAhs.js";import"./index-DgH-xKnr.js";import"./index-Bhqu_tAV.js";function t(o){const n={code:"code",h1:"h1",h2:"h2",li:"li",ol:"ol",p:"p",ul:"ul",...a(),...o.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Guidelines/Governance"}),`
`,e.jsx(n.h1,{id:"contribution-and-governance",children:"Contribution and governance"}),`
`,e.jsxs(n.p,{children:["Suvarna Myneni is the design owner for agntOS. Token changes start in ",e.jsx(n.code,{children:"packages/tokens/src/tokens.json"})," and are reviewed against the deployed demo before they merge."]}),`
`,e.jsx(n.h2,{id:"how-a-change-lands",children:"How a change lands"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["Open a changeset (",e.jsx(n.code,{children:"npx changeset"}),") and say whether it is a patch, minor, or major."]}),`
`,e.jsxs(n.li,{children:["If you change a color, a type size, a radius, or a shadow, regenerate with ",e.jsx(n.code,{children:"npm run build -w @agntos/tokens"})," and update the contrast report."]}),`
`,e.jsx(n.li,{children:"Add or update the story, the test, and the usage notes in the same change."}),`
`,e.jsx(n.li,{children:"Do not add a component that the Deal Desk does not have a job for."}),`
`]}),`
`,e.jsx(n.h2,{id:"semver",children:"Semver"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Patch: a bug fix that does not change the public props."}),`
`,e.jsx(n.li,{children:"Minor: a new component, a new optional prop, or a new token."}),`
`,e.jsx(n.li,{children:"Major: a renamed prop, a removed variant, or a token that changes the meaning of an existing status."}),`
`]}),`
`,e.jsx(n.h2,{id:"review",children:"Review"}),`
`,e.jsxs(n.p,{children:["Design review looks at status clarity, contrast notes, and keyboard behavior. Engineering review looks at the tests and the Storybook build. Both are required for ",e.jsx(n.code,{children:"packages/ui"}),"."]}),`
`,e.jsx(n.h2,{id:"what-not-to-do",children:"What not to do"}),`
`,e.jsx(n.p,{children:"Do not copy a real client's file into the sample data. Do not fork a one-off color for a single screen. Do not ship a control whose disabled state has no explanation."})]})}function u(o={}){const{wrapper:n}={...a(),...o.components};return n?e.jsx(n,{...o,children:e.jsx(t,{...o})}):t(o)}export{u as default};
