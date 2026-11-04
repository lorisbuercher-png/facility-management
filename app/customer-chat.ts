/** Tenant-scoped manager ↔ execution-team communication. Pure functions for tests. */
export type ChatViewer={role:string; companyId?:string|null};
export function canAccessConversation(user:ChatViewer, companyId:string, state:any){
 if(!companyId||typeof companyId!=='string'||companyId.length>100)return false;
 if(!['manager','superadmin'].includes(user.role))return false;
 if(user.role==='manager'&&user.companyId!==companyId)return false;
 return !!state?.companies?.some((c:any)=>c.id===companyId);
}
export function validateChatMessage(input:any,state:any,user:ChatViewer){
 if(!input||typeof input!=='object'||!canAccessConversation(user,input.companyId,state))return 'Keine Berechtigung für diesen Chat.';
 if(typeof input.message!=='string'||input.message.trim().length<1||input.message.length>3000)return 'Nachricht muss zwischen 1 und 3000 Zeichen lang sein.';
 if(input.taskId!=null&&(typeof input.taskId!=='string'||input.taskId.length>100||!state.workspaces?.[input.companyId]?.tasks?.some((t:any)=>t.id===input.taskId)))return 'Verknüpfter Auftrag nicht gefunden.';
 return null;
}
