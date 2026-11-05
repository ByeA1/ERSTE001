import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { projects } from './projects';
import {drawProjectCover,PROJECT_COVER} from './project-cover';
import {projectCollections} from './project-collections';
import {ProjectCoverMotion} from './project-cover-motion';

/** A real printed display surface mounted inside the existing glass cassette. */
export class ProjectPanel {
  mesh: THREE.Mesh;
  private textures = new Map<string, THREE.CanvasTexture>();
  private revealUniform = { value: 0 };
  private motion = new ProjectCoverMotion();
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
      shader.vertexShader='varying vec2 vProjectUV;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvProjectUV=uv;');
      shader.fragmentShader='uniform float projectReveal; varying vec2 vProjectUV;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float front=projectReveal*1.10;
        float depth=1.0-vProjectUV.y;
        if(projectReveal<0.001 || depth>front) discard;
        float settle=smoothstep(0.0,0.10,front-depth);
        diffuseColor.rgb=mix(vec3(0.918,0.898,0.882),diffuseColor.rgb,settle);`);
    };
    material.customProgramCacheKey=()=> 'project-panel-reveal-v1';
  }
  async load() {
    const images=new Map<string,CanvasImageSource>();
    await Promise.all(projects.map(async project=>{
      if(project.cover){
        const image=new Image();image.src=project.cover;
        try{await image.decode();images.set(project.id,image);}catch{}
      }else if(project.id==='erste002'){
        try{images.set(project.id,await this.renderMouse());}catch{}
      }
    }));
    for(const project of projects){
      const canvas=document.createElement('canvas');canvas.width=PROJECT_COVER.width;canvas.height=PROJECT_COVER.height;
      const c=canvas.getContext('2d')!;
      const collection=projectCollections.find(collection=>collection.projectIds.includes(project.id));
      drawProjectCover(c,project,images.get(project.id),collection?.title);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      this.textures.set(project.id,texture);
    }
  }
  select(id?:string, show=true, animate=true){
    this.motion.select(id,show,animate);
    this.sync();
  }
  private sync(){
    const id=this.motion.activeId;
    this.mesh.visible=Boolean(id)&&this.motion.amount>0;
    const material=this.mesh.material as THREE.MeshBasicMaterial;
    const map=id?this.textures.get(id)??null:material.map;
    if(material.map!==map){material.map=map;material.needsUpdate=true;}
    this.revealUniform.value=this.motion.amount;
  }
  reveal(animate=true){
    this.motion.reveal(animate);
    this.sync();
  }
  update(dt:number){
    if(!this.motion.update(dt))return false;
    this.sync();
    return true;
  }
  get hasCover(){return Boolean(this.motion.activeId);}
  get revealAmount(){return this.motion.amount;}
  get frame(){return this.motion.frame;}
  private async renderMouse():Promise<HTMLCanvasElement>{
    const gltf=await new GLTFLoader().loadAsync('/cases/erste002/assets/models/shell-v6.glb');
    const scene=new THREE.Scene();
    const group=gltf.scene;
    const size=new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
    group.scale.setScalar(3/Math.max(size.x,size.y,size.z));
    group.updateMatrixWorld(true);
    const center=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());group.position.sub(center);
    group.traverse(object=>{if(object instanceof THREE.Mesh)object.material=new THREE.MeshStandardMaterial({color:'#20242a',metalness:.08,roughness:.36});});
    scene.add(group,new THREE.HemisphereLight('#ffffff','#85877a',2));
    const key=new THREE.DirectionalLight('#ffffff',3);key.position.set(-3,5,4);scene.add(key);
    const rim=new THREE.DirectionalLight('#c8d6ed',2);rim.position.set(4,3,-3);scene.add(rim);
    const camera=new THREE.PerspectiveCamera(30,1080/660,.1,100);camera.position.set(4,3.8,5);camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(1080,660);renderer.setClearColor('#e8e4da',0);renderer.render(scene,camera);
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=660;canvas.getContext('2d')!.drawImage(renderer.domElement,0,0);
    group.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(object.material as THREE.Material).dispose();}});renderer.dispose();renderer.forceContextLoss();
    return canvas;
  }
}
