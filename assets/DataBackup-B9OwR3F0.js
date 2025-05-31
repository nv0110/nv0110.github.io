import{j as e}from"./vendor-ui-aK89YfOw.js";import{r as d}from"./vendor-router-Cg8TMqY4.js";import{exportUserData as b,importUserData as g}from"./utilityService-OetPi0cW.js";import"./vendor-react-eWEExxYH.js";import"./vendor-supabase-B7S7y5aO.js";import"./index-ChAGxcO2.js";function I({userCode:s}){const[p,r]=d.useState(null),[n,c]=d.useState(!1),u=async()=>{if(!s){alert("You need to be logged in to export data");return}c(!0);try{const t=await b(s);if(t.success){const i=JSON.stringify(t.export,null,2),a=new Blob([i],{type:"application/json"}),o=document.createElement("a");o.href=URL.createObjectURL(a),o.download=`maplestory-data-backup-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),r({type:"success",message:"Data exported successfully!"})}else r({type:"error",message:"Failed to export data"})}catch(t){console.error("Error exporting data:",t),r({type:"error",message:`Error: ${t.message||"Unknown error"}`})}finally{c(!1)}},m=async t=>{if(!s){alert("You need to be logged in to import data");return}const i=t.target.files[0];if(i){c(!0);try{const a=new FileReader;a.onload=async o=>{try{const l=JSON.parse(o.target.result);window.confirm("Importing this data will replace your current data. Continue?")&&((await g(s,l)).success?r({type:"success",message:"Data imported successfully! Refresh the page to see changes."}):r({type:"error",message:"Failed to import data"}))}catch(l){console.error("Error processing import file:",l),r({type:"error",message:`Invalid backup file: ${l.message}`})}finally{c(!1)}},a.onerror=()=>{r({type:"error",message:"Error reading file"}),c(!1)},a.readAsText(i)}catch(a){console.error("Error with file import:",a),r({type:"error",message:`Error: ${a.message||"Unknown error"}`}),c(!1)}}};return e.jsxs("div",{className:"data-backup-container",children:[e.jsx("h3",{children:"Backup & Restore Data"}),e.jsx("p",{children:"Backup your data to protect against database issues or account problems."}),e.jsxs("div",{className:"backup-actions",children:[e.jsx("button",{onClick:u,disabled:n||!s,className:"backup-button",children:n?"Processing...":"Export Data Backup"}),e.jsx("div",{className:"import-container",children:e.jsxs("label",{className:"import-label",children:[e.jsx("input",{type:"file",accept:".json",onChange:m,disabled:n||!s,style:{display:"none"}}),e.jsx("span",{className:"import-button",children:n?"Processing...":"Import Data Backup"})]})})]}),p&&e.jsx("div",{className:`status-message ${p.type}`,children:p.message}),e.jsxs("div",{className:"backup-tips",children:[e.jsx("h4",{children:"Tips:"}),e.jsxs("ul",{children:[e.jsx("li",{children:"Store your backup file in a safe location"}),e.jsx("li",{children:"Create regular backups if you add important data"}),e.jsx("li",{children:"Importing will replace all your current data"})]})]}),e.jsx("style",{jsx:!0,children:`
        .data-backup-container {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          max-width: 600px;
        }
        
        .backup-actions {
          display: flex;
          gap: 15px;
          margin: 20px 0;
        }
        
        .backup-button, .import-button {
          padding: 10px 15px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: inline-block;
          font-weight: 500;
        }
        
        .backup-button:hover, .import-button:hover {
          background-color: #3a7bc8;
        }
        
        .backup-button:disabled, .import-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .import-label {
          cursor: pointer;
        }
        
        .status-message {
          padding: 10px;
          border-radius: 4px;
          margin: 15px 0;
        }
        
        .status-message.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .status-message.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .backup-tips {
          margin-top: 20px;
          font-size: 0.9em;
        }
        
        .backup-tips h4 {
          margin-bottom: 10px;
        }
        
        .backup-tips ul {
          padding-left: 20px;
        }
      `})]})}export{I as default};
