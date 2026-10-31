export const MAX_PHOTO=10*1024*1024, MAX_UPLOAD=21*1024*1024;
export function photoType(bytes: Uint8Array) {
 if(bytes.length>=12&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)&&[73,72,68,82].every((v,i)=>bytes[12+i]===v))return 'image/png';
 if(bytes.length>=20&&[82,73,70,70].every((v,i)=>bytes[i]===v)&&[87,69,66,80].every((v,i)=>bytes[i+8]===v))return 'image/webp';
 return null;
}
export async function boundedBody(request: Request, max: number) {
 if(Number(request.headers.get('Content-Length'))>max)throw new Error('Die ausgewählten Dateien sind zusammen zu gross. Maximal 20 MB pro Vorgang.');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error('Die ausgewählten Dateien sind zusammen zu gross. Maximal 20 MB pro Vorgang.')}chunks.push(value)}
 const out=new Uint8Array(size);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length}return out;
}
export async function readWorkflowInput(request: Request) {
 const type=request.headers.get('Content-Type')||'';
 if(type.startsWith('application/json')){const raw=await boundedBody(request,18000);return {input:JSON.parse(new TextDecoder().decode(raw)),files:[] as File[]};}
 if(!type.startsWith('multipart/form-data'))throw new Error('JSON oder ein Fotoformular erforderlich.');
 const body=await boundedBody(request,MAX_UPLOAD);
 const form=await new Response(body,{headers:{'Content-Type':type}}).formData();
 const raw=form.get('payload');if(typeof raw!=='string'||raw.length>18000)throw new Error('Ungültige Auftragsdaten.');
 const files=form.getAll('photos') as File[];if(files.length>5||files.some(f=>typeof f==='string'||!f.size||f.size>MAX_PHOTO))throw new Error('Maximal fünf Fotos, jeweils bis 10 MB, auswählen.');
 if(files.reduce((n,f)=>n+f.size,0)>20*1024*1024)throw new Error('Maximal 20 MB Fotos pro Vorgang.');
 return {input:JSON.parse(raw),files};
}
