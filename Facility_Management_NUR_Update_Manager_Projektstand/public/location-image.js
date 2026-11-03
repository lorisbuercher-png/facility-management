// Branch photos stay in the existing tenant-scoped state; no external image hosts.
window.optimizeLocationImage=async function(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Bitte JPG, PNG oder WebP bis 10 MB auswählen.');
 const image=await createImageBitmap(file);
 try{
  const maxW=1400,maxH=780,ratio=Math.min(1,maxW/image.width,maxH/image.height),width=Math.max(1,Math.round(image.width*ratio)),height=Math.max(1,Math.round(image.height*ratio));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');if(!context)throw new Error('Bildverarbeitung wird vom Browser nicht unterstützt.');
  context.drawImage(image,0,0,width,height);
  let encoded=canvas.toDataURL('image/jpeg',0.77);
  if(encoded.length>700000){const w=Math.round(width*.73),h=Math.round(height*.73);canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(image,0,0,w,h);encoded=canvas.toDataURL('image/jpeg',0.62)}
  if(encoded.length>700000)throw new Error('Das Bild ist zu gross. Bitte ein kleineres Foto wählen.');
  return encoded;
 }finally{image.close?.()}
};
