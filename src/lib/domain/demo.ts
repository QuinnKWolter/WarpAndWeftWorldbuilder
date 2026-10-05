import { blankProject, base, entitySchema, unitSchema, eventSchema, relationshipSchema, relationshipStateSchema, changeSchema, type Bundle } from './model';

export function demoProject(): Bundle {
  const b = blankProject('The Lantern Archive');
  b.project.description = 'In a city that forgets at dawn, a mapmaker discovers who has been keeping the memories.';
  const entity = (name:string,facet:string,summary:string) => { const e=entitySchema.parse({...base(),name,facets:[facet],summary}); b.entities.push(e); return e; };
  const mara=entity('Mara Venn','character','A mapmaker following the parts of the city that disappear.');
  const elian=entity('Elian Rook','character','The keeper of the archive, with a kindness he cannot afford.');
  const iris=entity('Iris Vale','character','A ferryman who remembers every crossing.');
  const harbour=entity('The Quiet Harbour','location','Lanterns reflected in water that never quite moves.');
  const archive=entity('The Lantern Archive','location','Every lost memory, catalogued beneath a glass roof.');
  const key=entity('The Copper Key','item','Warm to the touch. It opens a door that was never there.');
  const secret=entity('The Dawn Protocol','secret','The city forgets because someone chooses what survives.');
  const council=entity('The Glass Council','faction','The caretakers of an arrangement nobody remembers agreeing to.');
  council.facets.push('political actor');
  const unit=(title:string,time:number|null,synopsis:string,parentId:string|null=null,type='scene',rank=1024) => { const u=unitSchema.parse({...base(),title,storyTime:time,timeLabel:time===null?'':`Day ${time}`,synopsis,parentId,type,rank,status:'draft'}); b.units.push(u); return u; };
  const act1=unit('I · A city of borrowed mornings',null,'Follow the light. Find what is missing.',null,'act');
  const act2=unit('II · What the light keeps',null,'The truth has a cost.',null,'act',2048);
  const arrival=unit('A light across the water',1,'Mara arrives with a map of a street nobody remembers.',act1.id);
  const meeting=unit('The keeper’s invitation',2,'Elian offers a place in the archive, and a reason to stay.',act1.id,'scene',2048);
  const memory=unit('Before the first dawn',0,'A memory of Iris placing the copper key in Elian’s hand.',act1.id,'flashback',3072);
  const discovery=unit('A door without a room',3,'Mara finds the Dawn Protocol behind a blank shelf.',act2.id);
  const betrayal=unit('The things we choose to keep',4,'Elian admits the city’s forgetting is deliberate. Mara takes the key.',act2.id,'scene',2048);
  const ending=unit('Tomorrow, remembered',6,'At the harbour, Mara decides which memories to return.',act2.id,'scene',4096);
  const ghost=unit('Someone must pay the price',5,'Who gives up their memory so the city can keep its own?',act2.id,'placeholder',3072); ghost.unresolved=true;
  const beat=unit('The unopened letter',4,'A letter changes the meaning of Elian’s confession.',betrayal.id,'beat'); beat.setup=true;
  const inbox=unit('A festival of unlit lanterns',null,'An image for later: a thousand lanterns, none lit.'); inbox.unplaced=true;
  const mystery={...base(),name:'The missing mornings',description:'What happens to the city at dawn?',color:'#4f7c6c'};
  const trust={...base(),name:'Mara & Elian',description:'The distance between trust and understanding.',color:'#ad7950'};
  b.threads.push(mystery,trust);
  for (const u of [arrival,meeting,memory,discovery,betrayal,ending]) {
    b.threadMemberships.push({...base(),threadId:mystery.id,objectId:u.id});
    if ([meeting.id,betrayal.id,ending.id].includes(u.id)) b.threadMemberships.push({...base(),threadId:trust.id,objectId:u.id});
  }
  for (const u of [arrival,meeting,discovery,betrayal,ending]) {
    for (const e of [mara, u.id === arrival.id || u.id === ending.id ? iris : elian]) b.memberships.push({...base(),unitId:u.id,entityId:e.id,role:'present'});
    b.memberships.push({...base(),unitId:u.id,entityId:u.id===arrival.id||u.id===ending.id?harbour.id:archive.id,role:'setting'});
  }
  b.memberships.push({...base(),unitId:betrayal.id,entityId:key.id,role:'involved'});
  const event=(title:string,time:number,unitId:string|null) => {const e=eventSchema.parse({...base(),title,storyTime:time,unitId,order:10});b.events.push(e);return e;};
  const e0=event('Iris gives Elian the key',0,memory.id);
  const e1=event('A tentative welcome',1,arrival.id);
  const e2=event('Elian shares the archive',2,meeting.id);
  const e3=event('The protocol is found',3,discovery.id);
  const e4=event('The keeper confesses',4,betrayal.id);
  const e6=event('The city is given a choice',6,ending.id);
  const use=event('Mara opens the sealed gate',1,arrival.id);
  use.requirements=[{subjectId:mara.id,key:'possession',targetId:key.id,value:true}];
  const r=relationshipSchema.parse({...base(),sourceId:mara.id,targetId:elian.id,label:'A fragile alliance',description:'Each knows something the other needs.'});b.relationships.push(r);
  for (const [time,label,e] of [[1,'Strangers',e1],[2,'Friends',e2],[3,'Suspicious',e3],[4,'Betrayed',e4],[6,'Allies',e6]] as const) b.relationshipStates.push(relationshipStateSchema.parse({...base(),relationshipId:r.id,from:time,label,eventId:e.id,unitId:e.unitId}));
  b.relationships.push(relationshipSchema.parse({...base(),sourceId:elian.id,targetId:archive.id,type:'caretaker',label:'Keeps the archive',directed:true}));
  const change=(subjectId:string,property:string,targetId:string|null,value:boolean|string,time:number,eventId:string,unitId:string|null) => b.changes.push(changeSchema.parse({...base(),subjectId,key:property,targetId,value,storyTime:time,eventId,unitId}));
  change(elian.id,'possession',key.id,true,0,e0.id,memory.id);
  change(mara.id,'location',null,harbour.name,1,e1.id,arrival.id);
  change(mara.id,'location',null,archive.name,2,e2.id,meeting.id);
  change(mara.id,'knowledge',secret.id,true,3,e3.id,discovery.id);
  change(elian.id,'possession',key.id,false,4,e4.id,betrayal.id);
  change(mara.id,'possession',key.id,true,4,e4.id,betrayal.id);
  change(mara.id,'location',null,harbour.name,6,e6.id,ending.id);
  b.links.push({...base(),sourceId:discovery.id,targetId:betrayal.id,type:'causes'});
  const prose='The harbour kept its own hours.\n\nMara had learned this on her first morning, when the clock above the ferry office struck thirteen and nobody looked up. Now she stood at the edge of the water with a map that was already wrong.\n\nAcross the channel, a single lantern burned in the archive.\n\nSomebody, she thought, is still awake.';
  b.documents.push({...base(),unitId:arrival.id,text:prose,content:{type:'doc',content:prose.split('\n\n').map((text) => ({type:'paragraph',content:[{type:'text',text}]}))}});
  return b;
}
