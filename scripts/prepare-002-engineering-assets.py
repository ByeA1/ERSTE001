from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib, zipfile

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/cases/erste002'
ARCHIVE=ROOT/'_archive/ERSTE002/ERSTE002_Engineering_Archive'
INDEX=json.loads((ARCHIVE/'photo-index.json').read_text(encoding='utf-8'))
TARGET=OUT/'assets/engineering'
TARGET.mkdir(parents=True,exist_ok=True)
names={4235:'Current shell / exterior',4236:'Current shell / internal ribs and rods',4237:'Three prototypes / oblique comparison',4238:'Three prototypes / side comparison',4240:'Three prototypes / front comparison',4241:'FDM form study / oblique',4242:'FDM form study / side profile',4244:'FDM form study / top profile'}
captions={4235:'Current MJF shell, without button cover or electronics. Openings and outer surface are visible.',4236:'Current MJF shell, underside up. Ribs, mounting posts and spanning rods are visible; PCB and battery are absent.',4237:'Lower left: current, red wheel. Centre: second version, empty wheel slot. Upper right: unsplit FDM form study.',4238:'Foreground: current, red wheel. Middle: second version. Background: unsplit FDM form study.',4240:'Left: FDM form study. Centre: current, red wheel. Right: second version, empty wheel slot.',4241:'Unsplit FDM form study with a continuous surface. Its position before or after the shape revision is unconfirmed.',4242:'FDM form study side profile. No shared scale or camera pose is available for dimensional comparison.',4244:'FDM form study top profile and visible layer texture. The photograph does not establish an internal solid structure.'}
manifest=[]
integrity={}
for p in INDEX['photos']:
    source=ARCHIVE/p['original_path']
    digest=hashlib.sha256(source.read_bytes()).hexdigest()
    assert digest==p['sha256'],source
    integrity[str(source)]=digest
    if not p['selected']: continue
    number=int(p['id'][1:])
    original=ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    variants=[]
    for size in [640,1536]:
        image=original.copy(); image.thumbnail((size,size))
        name=f'{p["id"].lower()}-{size}.webp'
        image.save(TARGET/name,'WEBP',quality=85,method=6)
        variants.append({'file':name,'width':image.width,'height':image.height,'bytes':(TARGET/name).stat().st_size})
    manifest.append({'id':p['id'],'source':p['original_path'],'sha256':digest,'title':[p['title_zh'],names[number]],'caption':[p['caption_zh'],captions[number]],'versions':p['version_ids'],'variants':variants})
cad=[]
provenance=json.loads((ROOT/'_archive/ERSTE002/_derived/previews/preview-provenance.json').read_text(encoding='utf-8'))
for record in json.loads((ROOT/'_archive/ERSTE002/_derived/inventory-latest.json').read_text(encoding='utf-8'))['records']:
    path=Path(record['locator'])
    if not path.is_file():continue
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest==record['sha256'],path
    integrity[str(path)]=digest
    if path.suffix=='.zip':
        with zipfile.ZipFile(path) as package:
            for member in record.get('members',[]):
                if 'sha256' in member:
                    assert hashlib.sha256(package.read(package.infolist()[member['zipIndex']])).hexdigest()==member['sha256']
for package in ['P01','P02','P03','P04']:
    source=ROOT/f'_archive/ERSTE002/_derived/previews/{package}-inside.png'
    image=Image.open(source).convert('RGB');image.thumbnail((1200,900))
    filename=f'{package.lower()}-inside.webp';image.save(TARGET/filename,'WEBP',quality=88,method=6)
    cad.append({'id':package,'file':filename,'source':str(source.relative_to(ROOT)).replace('\\','/'),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'models':[{'id':m['id'],'name':m['originalName'],'locator':m['locator'].replace(str(ROOT)+'\\','').replace('\\','/'),'sha256':m['sha256']} for m in provenance['models'] if m['packageId']==package]})
(OUT/'engineering-assets.json').write_text(json.dumps({'photos':manifest,'cad':cad,'limits':['Version identities are user-confirmed; historical print-round mapping remains unconfirmed.','Static photographs do not prove dynamic failure or a quantified mechanical property.','CAD package labels are provisional, not REV numbers. STL units remain unknown.']},ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'docs/erste002-engineering-evidence/asset-source-hashes.json').write_text(json.dumps(integrity,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'photos':len(manifest),'cad':len(cad),'optimizedBytes':sum(p.stat().st_size for p in TARGET.glob('*')),'originalsVerified':len(integrity)}))
