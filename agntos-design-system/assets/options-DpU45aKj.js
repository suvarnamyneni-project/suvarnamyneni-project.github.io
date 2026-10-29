function g(e,l,f){var n;if(!e.length)return 0;let t=l;for(let r=0;r<e.length;r+=1)if(t=(t+f+e.length)%e.length,!((n=e[t])!=null&&n.disabled))return t;return l}export{g as n};
