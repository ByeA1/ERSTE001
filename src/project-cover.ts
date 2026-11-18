import type {ProjectDefinition} from './projects';

/** One printed layout for every cassette; Blender supplies only the hero plate. */
export const PROJECT_COVER={width:1600,height:910,hero:{x:44,y:100,width:1512,height:642},dividerY:758} as const;
export function containHero(width:number,height:number) {
  const box=PROJECT_COVER.hero;
  const scale=Math.min(box.width/Math.max(1,width),box.height/Math.max(1,height));
  const w=width*scale,h=height*scale;
  return {x:box.x+(box.width-w)/2,y:box.y+(box.height-h)/2,width:w,height:h};
}
export function heroSource(width:number,height:number,frame?:ProjectDefinition['coverFrame']) {
  const x=Math.max(0,Math.min(.99,frame?.x??0))*width;
  const y=Math.max(0,Math.min(.99,frame?.y??0))*height;
  return {x,y,width:Math.max(1,Math.min(width-x,(frame?.width??1)*width)),height:Math.max(1,Math.min(height-y,(frame?.height??1)*height))};
}
export function drawProjectCover(c:CanvasRenderingContext2D,project:ProjectDefinition,image?:CanvasImageSource,collection='DESIGN COLLECTION') {
  c.fillStyle='#e8e4da';c.fillRect(0,0,PROJECT_COVER.width,PROJECT_COVER.height);
  c.strokeStyle='#858677';c.lineWidth=1.5;c.strokeRect(24,24,1552,862);
  const line=(x:number,y:number,x2:number,y2:number)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();};
  c.fillStyle='#454b40';c.font='19px MiSans,Arial';
  c.fillText(`COLLECTION / ${collection}`,54,66);
  c.textAlign='right';c.fillText(`PROJECT ARCHIVE / ${project.number}`,1546,66);c.textAlign='left';
  line(54,84,1546,84);
  if(image){
    const source=image as HTMLImageElement|HTMLCanvasElement;
    const width=('naturalWidth' in source?source.naturalWidth:source.width)||1;
    const height=('naturalHeight' in source?source.naturalHeight:source.height)||1;
    const crop=heroSource(width,height,project.coverFrame);
    const fit=containHero(crop.width,crop.height),scale=fit.width/crop.width;
    c.save();c.beginPath();c.rect(44,100,1512,642);c.clip();
    // Scale the entire studio plate around the subject crop: continuous backdrop,
    // complete product silhouette, no stretching or visible crop rectangle.
    c.drawImage(image,fit.x-crop.x*scale,fit.y-crop.y*scale,width*scale,height*scale);c.restore();
  }
  c.strokeStyle='#868e7d';
  for(const [x,y,dx,dy] of [[44,100,1,1],[1556,100,-1,1],[44,742,1,-1],[1556,742,-1,-1]]){
    line(x,y,x+dx*24,y);line(x,y,x,y+dy*24);
  }
  c.strokeStyle='#858677';line(54,PROJECT_COVER.dividerY,1546,PROJECT_COVER.dividerY);
  c.fillStyle='#242a22';c.font='bold 83px MiSans,Arial';c.fillText(project.title,50,839,780);
  c.fillStyle='#505749';c.font='18px Consolas,monospace';c.textAlign='right';
  c.fillText(project.status??'DESIGN ARCHIVE',1546,803,570);
  c.fillText(`FIG.${project.number} / PRODUCT STUDY`,1546,836,570);c.textAlign='left';
  c.font='20px MiSans,Arial';c.fillText(project.subtitle??'INDEPENDENT PRODUCT DESIGN',56,869,1460);
}
