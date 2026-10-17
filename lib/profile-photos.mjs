import {jpegDimensions,TRANSFER_LIMIT,imageError} from './chat-images.mjs';
export async function savePhoto(db,me,body,now){
 if(body.mode!==undefined){if(!['avatar','photo'].includes(body.mode)||body.data!==undefined)throw imageError('Choose your avatar or uploaded picture.');
  const row=await db.prepare('UPDATE dashboard_profile_photos SET enabled=? WHERE user_id=? RETURNING version').bind(body.mode==='photo'?1:0,me.id).first();
  if(body.mode==='photo'&&!row)throw imageError('Upload a picture first.');return {photo_version:body.mode==='photo'?row.version:null};
 }
 if(body.data===null){await db.prepare('DELETE FROM dashboard_profile_photos WHERE user_id=?').bind(me.id).run();return {photo_version:null};}
 if(typeof body.data!=='string'||body.data.length>87384||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.data))throw imageError('Choose a profile picture up to 64 KB.');
 const bytes=Uint8Array.from(atob(body.data),c=>c.charCodeAt(0));if(bytes.length>65536)throw imageError('Choose a profile picture up to 64 KB.',413);
 const {width,height}=jpegDimensions(bytes);if(width>256||height>256)throw imageError('Profile pictures must be at most 256 pixels wide and tall.');
 const rate=await db.prepare(`INSERT INTO social_rate_limits(user_id,scope,window_start,count) VALUES(?,'profile-photo',?,1) ON CONFLICT(user_id,scope) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+1 ELSE 1 END,window_start=excluded.window_start RETURNING count`).bind(me.id,Math.floor(now/86400000)).first();
 if(rate.count>5)throw imageError('You can change your profile picture 5 times per day.',429);
 const version=crypto.randomUUID();
 try{await db.prepare('INSERT INTO dashboard_profile_photos(user_id,data,bytes,version) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,bytes=excluded.bytes,version=excluded.version,enabled=1').bind(me.id,body.data,bytes.length,version).run();}
 catch(e){if(String(e.message).includes('PROFILE_PHOTO_LIMIT'))throw imageError('Profile pictures have reached their storage allowance. Please try again later.',429);throw e;}
 return {photo_version:version};
}
export async function readPhoto(db,profile,version,now,own=false){
 if(profile.locked)throw imageError('This profile is private.',403);
 const row=await db.prepare('SELECT data,bytes,version,enabled FROM dashboard_profile_photos WHERE user_id=?').bind(profile.user_id).first();
 if(!row||!row.enabled&&!own||version&&version!==row.version)throw imageError('Profile picture unavailable.',404);
 const month=new Date(now).toISOString().slice(0,7);
 const budget=await db.prepare('INSERT INTO wibs_image_transfer(month,bytes) VALUES(?,?) ON CONFLICT(month) DO UPDATE SET bytes=bytes+excluded.bytes WHERE bytes+excluded.bytes<=? RETURNING bytes').bind(month,row.bytes,TRANSFER_LIMIT).first();
 if(!budget)throw imageError('Image viewing has reached its monthly allowance.',429);
 return new Response(Uint8Array.from(atob(row.data),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',Vary:'Authorization'}});
}
