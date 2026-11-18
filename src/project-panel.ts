import * as THREE from 'three';
import { projects } from './projects';
import {drawProjectCover,PROJECT_COVER} from './project-cover';
import {projectCollections} from './project-collections';
import {ProjectCoverMotion} from './project-cover-motion';

/** A real printed display surface mounted inside the existing glass cassette. */
export class ProjectPanel {
  mesh: THREE.Mesh;
  private textures = new Map<string, THREE.CanvasTexture>();
  private revealUniform = { value: 0 };
  private nextMap = { value: null as THREE.Texture | null };
  private blendUniform = { value: 0 };
  private swap?: { from: string; to: string; progress: number; queued?: string };
  private fontSignature = '';
  private renderer?: THREE.WebGLRenderer;
  private motion = new ProjectCoverMotion();
  private pending = new Set<HTMLImageElement>();
  private disposed = false;
  private repaint = new Set<() => void>();
  private refreshFonts = () => {
    // These cards contain Latin glyphs only. Loading another Chinese font
    // shard must not repaint and re-upload both full-resolution cover maps.
    const signature = ['19px MiSans','bold 83px MiSans','20px MiSans'].map(font=>document.fonts.check(font,'ERSTE001 DESIGN ARCHIVE')).join();
    if (signature === this.fontSignature) return;
    this.fontSignature = signature;
    this.repaint.forEach(paint=>paint());
    if (this.renderer) this.warmTextures(this.renderer);
  };
  constructor() {
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.36, 2.48),new THREE.MeshBasicMaterial({transparent:false,toneMapped:false,depthWrite:true}));
    this.mesh.position.set(0,1.55,.171);
    this.mesh.userData.surface='Project_Panel';
    // The physical glass already supplies depth. An override-material pass
    // cannot reproduce this plane's discard and would leave a ghost rectangle.
    this.mesh.userData.excludeFromAO=true;
    this.mesh.visible=false;
    const material=this.mesh.material as THREE.MeshBasicMaterial;
    material.onBeforeCompile=shader=>{
      shader.uniforms.projectReveal=this.revealUniform;
      shader.uniforms.projectNextMap=this.nextMap;
      shader.uniforms.projectBlend=this.blendUniform;
      shader.vertexShader='varying vec2 vProjectUV;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvProjectUV=uv;');
      shader.fragmentShader='uniform float projectReveal; uniform sampler2D projectNextMap; uniform float projectBlend; varying vec2 vProjectUV;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        #ifdef USE_MAP
          // Canvas textures share the renderer's sRGB-to-linear texture decode.
          diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(projectNextMap,vMapUv).rgb,projectBlend);
        #endif`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float front=projectReveal*1.10;
        float depth=1.0-vProjectUV.y;
        if(projectReveal<0.001 || depth>front) discard;
        float settle=smoothstep(0.0,0.10,front-depth);
        diffuseColor.rgb=mix(vec3(0.918,0.898,0.882),diffuseColor.rgb,settle);`);
    };
    material.customProgramCacheKey=()=> 'project-panel-reveal-blend-v2';
  }
  async load() {
    const decoded: Promise<unknown>[] = [];
    document.fonts.addEventListener('loadingdone',this.refreshFonts);
    for(const project of projects){
      const canvas=document.createElement('canvas');canvas.width=PROJECT_COVER.width;canvas.height=PROJECT_COVER.height;
      const c=canvas.getContext('2d')!;
      const collection=projectCollections.find(collection=>collection.projectIds.includes(project.id));
      drawProjectCover(c,project,undefined,collection?.title);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      this.textures.set(project.id,texture);
      let cover:HTMLImageElement|undefined;
      const paint=()=>{
        if(this.disposed)return;
        drawProjectCover(c,project,cover,collection?.title);texture.needsUpdate=true;
      };
      this.repaint.add(paint);
      if(project.cover){
        const image=new Image();image.decoding='async';
        this.pending.add(image);image.src=project.cover;
        decoded.push(image.decode().then(()=>{
          if(this.disposed)return;
          cover=image;paint();
        }).catch(()=>{}).finally(()=>this.pending.delete(image)));
      }
    }
    await Promise.allSettled(decoded);
    this.refreshFonts();
  }
  warmTextures(renderer: THREE.WebGLRenderer) {
    this.renderer=renderer;
    this.textures.forEach(texture=>renderer.initTexture(texture));
  }
  select(id?:string, show=true, animate=true){
    const active=this.motion.activeId;
    if (animate && show && id && active && (this.motion.frame.phase==='open'||this.motion.frame.phase==='opening') && id!==active) {
      if (this.swap) {
        if (id===this.swap.from) {
          // Reverse the current blend without jumping on rapid previous/next.
          const {from,to,progress}=this.swap;
          this.swap={from:to,to:from,progress:1-progress};
          this.motion.replace(id);
        } else this.swap.queued=id;
      } else {
        this.swap={from:active,to:id,progress:0};
        this.motion.replace(id);
      }
    } else {
      // A return midway through a blend must not replace the print abruptly.
      // Continue its blend underneath the original physical closing wipe.
      if (!animate || (id && !show)) this.swap=undefined;
      else if (this.swap) this.swap.queued=undefined;
      this.motion.select(id,show,animate);
    }
    this.sync();
  }
  private sync(){
    const id=this.motion.activeId;
    this.mesh.visible=Boolean(id)&&this.motion.amount>0;
    const material=this.mesh.material as THREE.MeshBasicMaterial;
    const map=this.swap?this.textures.get(this.swap.from)!:id?this.textures.get(id)??null:material.map;
    if(material.map!==map){
      const needsProgram = !material.map !== !map;
      material.map=map;
      if(needsProgram)material.needsUpdate=true;
    }
    this.nextMap.value=this.swap?this.textures.get(this.swap.to)!:map;
    const p=this.swap?.progress??0;
    this.blendUniform.value=p*p*(3-2*p);
    this.revealUniform.value=this.motion.amount;
  }
  reveal(animate=true){
    this.motion.reveal(animate);
    this.sync();
  }
  update(dt:number){
    const changed=this.motion.update(dt);
    if(this.swap){
      this.swap.progress=Math.min(1,this.swap.progress+Math.max(0,dt)/.32);
      if(this.swap.progress===1){
        const queued=this.swap.queued;
        this.swap=undefined;
        if(queued && queued!==this.motion.activeId)this.select(queued,true,true);
      }
    } else if(!changed)return false;
    this.sync();
    return true;
  }
  /** Independent texture for the viewer's WebGL context; same authored card. */
  async createAssemblyPrint(){
    await Promise.allSettled([...this.pending].map(image=>image.decode()));
    if(this.disposed)return;
    const id=this.motion.activeId,source=id?this.textures.get(id):undefined;
    if(!source)return;
    const canvas=document.createElement('canvas');canvas.width=PROJECT_COVER.width;canvas.height=PROJECT_COVER.height;
    canvas.getContext('2d')!.drawImage(source.image,0,0);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    const print=new THREE.Mesh(this.mesh.geometry.clone(),new THREE.MeshBasicMaterial({map,toneMapped:false,side:THREE.DoubleSide}));
    print.position.copy(this.mesh.position);print.userData.surface='Project_Print';
    print.userData.assemblyPart='cover';print.userData.excludeFromAO=true;
    return print;
  }
  get hasCover(){return Boolean(this.motion.activeId);}
  get revealAmount(){return this.motion.amount;}
  get frame(){return {...this.motion.frame,phase:this.swap?'crossfading':this.motion.frame.phase};}
  dispose(){
    this.disposed=true;
    this.renderer=undefined;
    document.fonts.removeEventListener('loadingdone',this.refreshFonts);this.repaint.clear();
    this.pending.forEach(image=>image.removeAttribute('src'));this.pending.clear();
    this.textures.forEach(texture=>texture.dispose());this.textures.clear();
  }
}
