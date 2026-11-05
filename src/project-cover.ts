import type {ProjectDefinition} from './projects';

/** One printed layout for every cassette; Blender supplies only the hero plate. */
export const PROJECT_COVER={width:1600,height:910,hero:{x:64,y:128,width:1472,height:510},dividerY:674} as const;
// The two existing plates have very different empty margins. These source-only
// crops keep their subjects comparable until the standard Blender plates arrive.
// New cover paths use the full image; the card layout remains identical.
const legacyFocus:Record<string,{x:number;y:number;width:number;height:number}>={
  '/cases/erste001/assets/opt/assets/mouse/hero-1-1440.avif':{x:460,y:140,width:590,height:415},
  '/assets/render/002-cover.avif':{x:300,y:300,width:930,height:640},
};
export function containHero(width:number,height:number) {
  const box=PROJECT_COVER.hero;
  const scale=Math.min(box.width/Math.max(1,width),box.height/Math.max(1,height));
  const w=width*scale,h=height*scale;
  return {x:box.x+(box.width-w)/2,y:box.y+(box.height-h)/2,width:w,height:h};
}
export function drawProjectCover(c:CanvasRenderingContext2D,project:ProjectDefinition,image?:CanvasImageSource,collection='DESIGN COLLECTION') {
  c.fillStyle='#e8e4da';c.fillRect(0,0,PROJECT_COVER.width,PROJECT_COVER.height);
  c.strokeStyle='#8f9485';c.lineWidth=1.5;c.strokeRect(24,24,1552,862);
  const line=(x:number,y:number,x2:number,y2:number)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();};
  c.fillStyle='#5f6759';c.font='19px MiSans,Arial';
  c.fillText(`COLLECTION / ${collection}`,64,72);
  c.textAlign='right';c.fillText(`PROJECT ARCHIVE / ${project.number}`,1536,72);c.textAlign='left';
  line(64,98,1536,98);
  if(image){
    const source=image as HTMLImageElement|HTMLCanvasElement;
    const width=('naturalWidth' in source?source.naturalWidth:source.width)||1;
    const height=('naturalHeight' in source?source.naturalHeight:source.height)||1;
    const crop=legacyFocus[project.cover??'']??{x:0,y:0,width,height};
    const fit=containHero(crop.width,crop.height);
    c.save();c.beginPath();c.rect(64,128,1472,510);c.clip();
    c.drawImage(image,crop.x,crop.y,crop.width,crop.height,fit.x,fit.y,fit.width,fit.height);c.restore();
  }
  c.strokeStyle='#868e7d';
  for(const [x,y,dx,dy] of [[64,128,1,1],[1536,128,-1,1],[64,638,1,-1],[1536,638,-1,-1]]){
    line(x,y,x+dx*24,y);line(x,y,x,y+dy*24);
  }
  c.fillStyle='#6c7465';c.font='17px Consolas,monospace';
  c.fillText(`FIG.${project.number} / HERO VIEW`,64,662);
  c.textAlign='right';c.fillText('FORM / STRUCTURE / PROTOTYPE',1536,662);c.textAlign='left';
  c.strokeStyle='#6d7663';line(64,674,1536,674);
  c.fillStyle='#1e261c';c.font='bold 104px MiSans,Arial';c.fillText(project.title,60,788,1230);
  c.fillStyle='#606b56';c.font='22px MiSans,Arial';c.fillText(project.subtitle??'INDEPENDENT PRODUCT DESIGN',66,838,1120);
  c.textAlign='right';c.font='18px MiSans,Arial';c.fillText(project.status??'DESIGN ARCHIVE',1536,838,380);c.textAlign='left';
  c.fillStyle='#7b856f';c.fillRect(1518,736,18,18);
}
