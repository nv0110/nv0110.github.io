import{j as e}from"./vendor-ui-aK89YfOw.js";import{r as x}from"./vendor-router-Cg8TMqY4.js";import{exportUserData as k,importUserData as j}from"./utilityService-zcx2R1Ct.js";import"./vendor-react-eWEExxYH.js";import"./vendor-supabase-B7S7y5aO.js";import"./index-C2b1ui_T.js";function $({userCode:i}){const[p,a]=x.useState(null),[d,n]=x.useState(!1),[o,u]=x.useState(null),g=async()=>{if(!i){alert("You need to be logged in to export data");return}n(!0),u(null);try{const c=await k(i);if(c.success){const s=c.data;u({characterCount:s.characterCount,weeksOfData:s.stats.totalWeeksOfData,pitchedItems:s.stats.totalPitchedItems,weekRange:s.stats.weekRange});const r=JSON.stringify(s,null,2),m=new Blob([r],{type:"application/json"}),t=document.createElement("a");t.href=URL.createObjectURL(m),t.download=`maplestory-complete-backup-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(t),t.click(),document.body.removeChild(t),a({type:"success",message:`Complete backup exported successfully! Includes ${s.characterCount} characters, ${s.stats.totalWeeksOfData} weeks of data, and ${s.stats.totalPitchedItems} pitched items.`})}else a({type:"error",message:"Failed to export data"})}catch(c){console.error("Error exporting data:",c),a({type:"error",message:`Error: ${c.message||"Unknown error"}`})}finally{n(!1)}},b=async c=>{if(!i){alert("You need to be logged in to import data");return}const s=c.target.files[0];if(s){n(!0),u(null);try{const r=new FileReader;r.onload=async m=>{try{const t=JSON.parse(m.target.result),l=t.stats||{},f=`This backup contains:
• ${t.characterCount||0} characters
• ${l.totalWeeksOfData||0} weeks of boss data
• ${l.totalPitchedItems||0} pitched items
• Data version: ${t.dataVersion||"unknown"}
${l.weekRange?`
• Week range: ${l.weekRange.earliest} to ${l.weekRange.latest}`:""}

⚠️ IMPORTANT: This will completely replace ALL your current data!
Weekly boss clears will be reset (as intended).

Continue with import?`;if(window.confirm(f)){const h=await j(i,t);h.success?a({type:"success",message:`${h.message} Please refresh the page to see all changes.`}):a({type:"error",message:`Import failed: ${h.error}`})}}catch(t){console.error("Error processing import file:",t),a({type:"error",message:`Invalid backup file: ${t.message}`})}finally{n(!1)}},r.onerror=()=>{a({type:"error",message:"Error reading file"}),n(!1)},r.readAsText(s)}catch(r){console.error("Error with file import:",r),a({type:"error",message:`Error: ${r.message||"Unknown error"}`}),n(!1)}}};return e.jsxs("div",{className:"data-backup-container",children:[e.jsx("h3",{children:"Complete Data Backup & Restore"}),e.jsx("p",{children:"Create a complete backup of ALL your data for full account restoration. Includes character configurations, boss data history, and pitched items."}),e.jsxs("div",{className:"backup-actions",children:[i?e.jsxs("div",{className:"modal-section",children:[e.jsx("h3",{className:"modal-section-title",children:"📤 Export Data"}),e.jsxs("p",{className:"modal-section-description",children:["Create a complete backup of your boss configurations, character setups, and pitched item history.",e.jsx("br",{}),e.jsx("strong",{children:"✨ Universal Restore:"})," Your backup can be imported to any account (same account or transfer to new account)."]}),e.jsx("button",{onClick:g,disabled:d,className:"modal-btn",children:d?"Creating Backup...":"Download Backup"})]}):e.jsxs("div",{className:"modal-section",children:[e.jsx("h3",{className:"modal-section-title",children:"📤 Export Data"}),e.jsx("p",{className:"modal-section-description",children:"You need to be logged in to export data."}),e.jsx("button",{onClick:()=>alert("You need to be logged in to export data"),disabled:!0,className:"modal-btn",children:"Export Data"})]}),e.jsxs("div",{className:"modal-section",children:[e.jsx("h3",{className:"modal-section-title",children:"📥 Import Data"}),e.jsxs("p",{className:"modal-section-description",children:["Restore data from a backup file. This will:",e.jsx("br",{}),"• Replace all current boss configurations and character setups",e.jsx("br",{}),"• Restore all pitched item history",e.jsx("br",{}),"• Clear all weekly boss completion checkmarks (as intended)",e.jsx("br",{}),e.jsx("strong",{children:"💡 Works with any account:"})," You can restore backups from other accounts or transfer data between accounts."]}),e.jsx("button",{onClick:b,disabled:d,className:"modal-btn",children:d?"Restoring...":"Choose Backup File"})]})]}),o&&e.jsxs("div",{className:"export-stats",children:[e.jsx("h4",{children:"Last Export Summary:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:o.characterCount})," characters"]}),e.jsxs("li",{children:[e.jsx("strong",{children:o.weeksOfData})," weeks of boss data"]}),e.jsxs("li",{children:[e.jsx("strong",{children:o.pitchedItems})," pitched items"]}),o.weekRange&&e.jsxs("li",{children:["Data from ",e.jsx("strong",{children:o.weekRange.earliest})," to ",e.jsx("strong",{children:o.weekRange.latest})]})]})]}),p&&e.jsx("div",{className:`status-message ${p.type}`,children:p.message}),e.jsxs("div",{className:"backup-tips",children:[e.jsx("h4",{children:"Complete Backup Features:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Full Restoration:"})," Includes ALL data needed to restore your account"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Character Configurations:"})," All boss selections and party sizes"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Historical Data:"})," All weeks of boss tracking data"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Pitched Items:"})," Complete pitched item history"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Clean Import:"})," Weekly boss clears are automatically reset (as intended)"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Safe Storage:"})," Store backup files in multiple safe locations"]})]}),e.jsx("h4",{children:"Import Notes:"}),e.jsxs("ul",{children:[e.jsx("li",{children:"⚠️ Importing will completely replace ALL your current data"}),e.jsx("li",{children:"✅ Weekly boss clears are cleared during import (this is correct behavior)"}),e.jsx("li",{children:"📱 Create regular backups if you add important data"}),e.jsx("li",{children:"🔄 Refresh the page after importing to see all changes"})]})]}),e.jsx("style",{jsx:!0,children:`
        .data-backup-container {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          max-width: 700px;
        }
        
        .backup-actions {
          display: flex;
          gap: 15px;
          margin: 20px 0;
        }
        
        .backup-button, .import-button {
          padding: 12px 18px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-block;
          font-weight: 500;
          font-size: 14px;
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
        
        .export-stats {
          background-color: #e8f4f8;
          border: 1px solid #b8dce8;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .export-stats h4 {
          margin: 0 0 10px 0;
          color: #2c5aa0;
        }
        
        .export-stats ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .status-message {
          padding: 12px;
          border-radius: 6px;
          margin: 15px 0;
          white-space: pre-line;
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
          margin-top: 25px;
          font-size: 0.9em;
        }
        
        .backup-tips h4 {
          margin: 15px 0 8px 0;
          color: #333;
        }
        
        .backup-tips ul {
          padding-left: 20px;
          margin-bottom: 15px;
        }
        
        .backup-tips li {
          margin-bottom: 4px;
        }
      `})]})}export{$ as default};
