// Build the isolated demo from the same pure rules as the server.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function generatedDemoWorkflow(){const source=fs.readFileSync(path.join(root,'app/workflow.ts'),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;return '// Generated from app/workflow.ts. Run node scripts/demo-workflow.cjs.\n(()=>{const exports={};\n'+js+'\nwindow.FACILITY_DEMO_WORKFLOW=exports.applyWorkflow;})();\n'}
module.exports={generatedDemoWorkflow};
if(require.main===module)fs.writeFileSync(path.join(root,'public/demo-workflow.js'),generatedDemoWorkflow());
