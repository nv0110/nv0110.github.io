import{j as t}from"./vendor-ui-Dn8u3Dbm.js";import{u as M,r as n}from"./vendor-router-CSXoLnNI.js";import{u as Y}from"./index-ChaJcBVv.js";import"./vendor-react-D5d5vywP.js";import"./vendor-supabase-_v2quReu.js";function O(){const d=M(),{isLoggedIn:w,loginInput:r,setLoginInput:S,isCreating:a,createCooldown:o,showPassword:i,setShowPassword:T,handleCreateAccount:k,handleLogin:j}=Y(),[p,f]=n.useState(!1),[l,x]=n.useState(!1),[m,b]=n.useState(""),[s,c]=n.useState(8),[u,y]=n.useState(!1),g=()=>{x(!1),b(""),c(8),d("/",{replace:!0})};if(n.useEffect(()=>{if(l&&s>0){const e=setTimeout(()=>c(s-1),1e3);return()=>clearTimeout(e)}else l&&s===0&&g()},[l,s]),n.useEffect(()=>{if(u){const e=setTimeout(()=>y(!1),2e3);return()=>clearTimeout(e)}},[u]),w)return d("/",{replace:!0}),null;const C=async()=>{const e=await k();e.success&&(b(e.code),x(!0),c(8))},h=async()=>{(await j()).success&&d("/",{replace:!0})},v=e=>{e.key==="Enter"&&r.trim()&&h()},z=async()=>{try{await navigator.clipboard.writeText(m),y(!0)}catch(e){console.error("Failed to copy to clipboard:",e)}};return t.jsxs("div",{style:{padding:"2rem 0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",width:"100%"},children:[t.jsx("h1",{style:{fontWeight:700,fontSize:"2.2rem",marginBottom:"1.5rem"},children:"Maplestory Boss Crystal Calculator"}),t.jsxs("div",{style:{background:"#2d2540",borderRadius:10,padding:"2rem",boxShadow:"0 2px 8px rgba(40, 20, 60, 0.18)",minWidth:320,display:"flex",flexDirection:"column",gap:16,alignItems:"center"},children:[t.jsx("button",{onClick:C,disabled:a||o>0,style:{background:a||o>0?"#6b46c1":"#a259f7",color:"#fff",border:"none",borderRadius:6,padding:"0.7rem 1.5rem",fontWeight:700,fontSize:"1.1rem",marginBottom:8,opacity:a||o>0?.6:1,cursor:a||o>0?"not-allowed":"pointer",transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",boxShadow:a||o>0?"none":"0 2px 8px rgba(162, 89, 247, 0.3)",transform:"translateY(0)",width:"100%"},onMouseOver:e=>{a||o>0||(e.currentTarget.style.background="#b470ff",e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(162, 89, 247, 0.4)")},onMouseOut:e=>{a||o>0||(e.currentTarget.style.background="#a259f7",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(162, 89, 247, 0.3)")},onMouseDown:e=>{a||o>0||(e.currentTarget.style.transform="translateY(1px)",e.currentTarget.style.boxShadow="0 1px 4px rgba(162, 89, 247, 0.2)")},onMouseUp:e=>{a||o>0||(e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(162, 89, 247, 0.4)")},children:a?"Creating Account...":o>0?`Creating Account (${o})`:"Create Account"}),t.jsxs("div",{style:{width:"100%",textAlign:"center",color:"#b39ddb",fontSize:"1.2rem",fontWeight:700,margin:"16px 0",display:"flex",alignItems:"center",gap:12},children:[t.jsx("span",{style:{flex:1,height:1,background:"#3a335a"}}),t.jsx("span",{style:{fontSize:"1.2em",fontWeight:700},children:"or"}),t.jsx("span",{style:{flex:1,height:1,background:"#3a335a"}})]}),t.jsxs("div",{style:{position:"relative",width:"100%",marginBottom:8},children:[t.jsx("input",{type:i?"text":"password",value:r,onChange:e=>S(e.target.value.toUpperCase()),onKeyDown:v,placeholder:"Enter your code",onFocus:()=>f(!0),onBlur:()=>f(!1),style:{background:"#3a335a",color:"#e6e0ff",border:p?"2px solid #a259f7":"1.5px solid #2d2540",borderRadius:6,padding:"0.5rem 1rem",fontSize:"1.1rem",width:"100%",boxSizing:"border-box",outline:"none",transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",boxShadow:p?"0 0 0 3px rgba(162, 89, 247, 0.1), 0 0 20px rgba(162, 89, 247, 0.1)":"none",paddingRight:"3rem"}}),t.jsx("button",{type:"button",onClick:()=>T(!i),style:{position:"absolute",right:"0.5rem",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#a259f7",cursor:"pointer",padding:"0.25rem",fontSize:"0.9rem",borderRadius:4,transition:"all 0.2s ease"},title:i?"Hide password":"Show password",onMouseOver:e=>{e.currentTarget.style.background="rgba(162, 89, 247, 0.1)",e.currentTarget.style.color="#b470ff"},onMouseOut:e=>{e.currentTarget.style.background="transparent",e.currentTarget.style.color="#a259f7"},children:i?"👁️":"👁️‍🗨️"})]}),t.jsx("button",{onClick:h,disabled:!r.trim(),style:{background:r.trim()?"#805ad5":"#555",color:"#fff",border:"none",borderRadius:6,padding:"0.7rem 1.5rem",fontWeight:700,fontSize:"1.1rem",cursor:r.trim()?"pointer":"not-allowed",opacity:r.trim()?1:.6,transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",boxShadow:r.trim()?"0 2px 8px rgba(128, 90, 213, 0.3)":"none",transform:"translateY(0)",width:"100%"},onMouseOver:e=>{r.trim()&&(e.currentTarget.style.background="#9f7aea",e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(128, 90, 213, 0.4)")},onMouseOut:e=>{r.trim()&&(e.currentTarget.style.background="#805ad5",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(128, 90, 213, 0.3)")},onMouseDown:e=>{r.trim()&&(e.currentTarget.style.transform="translateY(1px)",e.currentTarget.style.boxShadow="0 1px 4px rgba(128, 90, 213, 0.2)")},onMouseUp:e=>{r.trim()&&(e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 4px 16px rgba(128, 90, 213, 0.4)")},children:"Login"}),t.jsx("div",{style:{fontSize:"0.85rem",color:"#888",textAlign:"center",marginTop:16,lineHeight:1.4},children:"Your code acts as both username and password. Keep it safe!"})]}),l&&t.jsx("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(40, 32, 74, 0.95)",zIndex:4e3,display:"flex",alignItems:"center",justifyContent:"center",animation:"modalFadeIn 0.3s ease-out"},onClick:g,children:t.jsxs("div",{style:{background:"#2d2540",borderRadius:16,padding:"3rem 2.5rem",maxWidth:480,color:"#e6e0ff",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",position:"relative",minWidth:400,textAlign:"center",border:"2px solid #a259f7",animation:"modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"},onClick:e=>e.stopPropagation(),children:[t.jsx("div",{style:{width:80,height:80,background:"linear-gradient(135deg, #a259f7, #805ad5)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:"0 4px 20px rgba(162, 89, 247, 0.4)",animation:"checkmarkBounce 0.6s ease-out 0.2s both"},children:t.jsx("svg",{width:"40",height:"40",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:t.jsx("path",{d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",stroke:"#fff",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round"})})}),t.jsx("h2",{style:{color:"#a259f7",fontWeight:700,marginBottom:20,fontSize:"1.8rem"},children:"Account Created!"}),t.jsxs("div",{style:{background:"rgba(162, 89, 247, 0.1)",border:"2px solid rgba(162, 89, 247, 0.3)",borderRadius:12,padding:"20px",marginBottom:28},children:[t.jsxs("p",{style:{marginBottom:16,fontSize:"1.1rem",lineHeight:"1.5",color:"#e6e0ff"},children:[t.jsx("strong",{children:"⚠️ IMPORTANT: Save this code immediately!"}),t.jsx("br",{}),"This is your unique login code. You cannot recover it if lost."]}),t.jsxs("div",{style:{background:"#3a335a",borderRadius:8,padding:"16px",margin:"16px 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"},children:[t.jsx("span",{style:{fontSize:"1.8rem",fontWeight:700,fontFamily:"monospace",color:"#a259f7",letterSpacing:"2px"},children:m}),t.jsx("button",{onClick:z,style:{background:"#805ad5",color:"#fff",border:"none",borderRadius:6,padding:"8px 12px",cursor:"pointer",fontSize:"0.9rem",fontWeight:600,transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",transform:"translateY(0)"},title:"Copy to clipboard",onMouseOver:e=>{e.currentTarget.style.background="#9f7aea",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 2px 8px rgba(128, 90, 213, 0.4)"},onMouseOut:e=>{e.currentTarget.style.background="#805ad5",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="none"},onMouseDown:e=>{e.currentTarget.style.transform="translateY(1px)"},onMouseUp:e=>{e.currentTarget.style.transform="translateY(-1px)"},children:"📋 Copy"})]}),t.jsx("p",{style:{margin:0,fontSize:"0.95rem",color:"#b39ddb"},children:"Write it down, take a screenshot, or save it in a password manager."})]}),t.jsxs("div",{style:{background:"rgba(255, 193, 7, 0.1)",border:"1px solid rgba(255, 193, 7, 0.3)",borderRadius:8,padding:"12px",marginBottom:24,fontSize:"1rem",color:"#ffc107"},children:["Auto-login in ",s," seconds..."]}),t.jsx("button",{onClick:g,style:{background:"linear-gradient(135deg, #a259f7, #805ad5)",color:"#fff",border:"none",borderRadius:12,padding:"0.8rem 2rem",fontWeight:700,fontSize:"1.1rem",cursor:"pointer",boxShadow:"0 4px 16px rgba(162, 89, 247, 0.3)",transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",transform:"translateY(0)"},onMouseOver:e=>{e.currentTarget.style.background="linear-gradient(135deg, #b470ff, #9f7aea)",e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 8px 24px rgba(162, 89, 247, 0.4)"},onMouseOut:e=>{e.currentTarget.style.background="linear-gradient(135deg, #a259f7, #805ad5)",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 4px 16px rgba(162, 89, 247, 0.3)"},onMouseDown:e=>{e.currentTarget.style.transform="translateY(1px)"},onMouseUp:e=>{e.currentTarget.style.transform="translateY(-2px)"},children:"I've Saved My Code - Continue"})]})}),u&&t.jsx("div",{style:{position:"fixed",top:"2rem",right:"2rem",background:"linear-gradient(135deg, #10b981, #059669)",color:"#fff",padding:"12px 20px",borderRadius:8,boxShadow:"0 4px 16px rgba(16, 185, 129, 0.3)",zIndex:5e3,display:"flex",alignItems:"center",gap:"8px",fontSize:"0.95rem",fontWeight:600,animation:"toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"},children:"✅ Copied to clipboard!"}),t.jsx("style",{jsx:!0,children:`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes checkmarkBounce {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.1);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes fadeInShake {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          25% {
            transform: translateX(10px);
          }
          50% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `})]})}export{O as default};
