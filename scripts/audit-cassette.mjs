import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync } from 'node:zlib';
if(path.resolve('.')!=='D:\\RhineTerminal')throw Error('Run in the sole authorized D:/RhineTerminal checkout');
const require=createRequire(path.resolve('.audit/model-logo/tools/package.json'));
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {draco,meshopt,quantize}=require('@gltf-transform/functions');
const draco3d=require('draco3dgltf');
// Match the target checkout's decoder generation rather than the tool's latest.
const {MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const [encoder,decoder]=await Promise.all([draco3d.createEncoderModule(),draco3d.createDecoderModule()]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':encoder,'draco3d.decoder':decoder,'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const out=path.resolve('.audit/model-logo/models');await fs.mkdir(out,{recursive:true});
const original=await fs.readFile('public/assets/archive-cassette.glb');
const json=JSON.parse(original.toString('utf8',20,20+original.readUInt32LE(12)));
const variants=[
  {id:'original',label:'原版',transform:null},
  {id:'draco-16',label:'Draco P16 N12 UV14',transform:()=>draco({method:'edgebreaker',encodeSpeed:0,decodeSpeed:5,quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14,quantizationVolume:'mesh'})},
  {id:'draco-18',label:'Draco P18 N14 UV16',transform:()=>draco({method:'edgebreaker',encodeSpeed:0,decodeSpeed:5,quantizePosition:18,quantizeNormal:14,quantizeTexcoord:16,quantizationVolume:'mesh'})},
  {id:'meshopt-16',label:'Meshopt P16 N12 UV14',transform:()=>meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14,quantizationVolume:'mesh'})},
  {id:'quantize-16',label:'顶点量化 P16 N12 UV14，无专用解码器',transform:()=>quantize({quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14,quantizationVolume:'mesh'})},
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={sourceCommit:'96fe9b9',sourcePath:'D:/RhineTerminal/public/assets/archive-cassette.glb',sourceSha256:sha(original),
  structure:{bytes:original.length,jsonBytes:original.readUInt32LE(12),meshes:json.meshes.length,materials:json.materials.length,textures:json.textures?.length??0,images:json.images?.length??0,triangles:json.meshes.reduce((n,m)=>n+m.primitives.reduce((n,p)=>n+json.accessors[p.indices].count/3,0),0)},variants:[]};
for(const variant of variants){
  const start=performance.now();
  const doc=await io.readBinary(original);
  if(variant.transform)await doc.transform(variant.transform());
  const bytes=variant.transform?Buffer.from(await io.writeBinary(doc)):original;
  const written=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
  await fs.writeFile(path.join(out,variant.id+'.glb'),bytes);
  const entry={id:variant.id,label:variant.label,bytes:bytes.length,gzipBytes:gzipSync(bytes,{level:9}).length,brotliBytes:brotliCompressSync(bytes).length,sha256:sha(bytes),encodeMs:performance.now()-start,
    meshes:written.meshes.length,materials:written.materials.length,extensions:written.extensionsUsed??[],
    // This is a bandwidth projection based on the supplied workplace observation.
    predictedDownloadSeconds:5.99*(gzipSync(bytes,{level:9}).length/gzipSync(original,{level:9}).length)};
  report.variants.push(entry);console.log(JSON.stringify(entry));
}
await fs.writeFile('.audit/model-logo/model-sizes.json',JSON.stringify(report,null,2));
await fs.writeFile('.audit/model-logo/models/manifest.json',JSON.stringify(report,null,2));
