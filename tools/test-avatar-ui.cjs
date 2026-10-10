const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage(),errors=[],out=path.resolve('QA/dashboard-staging');
 page.on('pageerror',e=>errors.push(e.message));
 const config=JSON.parse(fs.readFileSync('dashboard-config.json','utf8')),catalog=JSON.parse(fs.readFileSync('account-assets/avatar-v2/catalog.json','utf8'));
 const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qaplayer@'+config.authDomain,user_metadata:{username:'QAPlayer'}},token='test-token';
 let writes=0,failSave=false,social={username:'QAPlayer',profile:{display_name:'QAPlayer',repo_score:10,avatar:null},friends:[{username:'fern',display_name:'Fern',status:'accepted',online:1,repo_score:250,avatar:{...catalog.defaults,body:'female',hair:'18',beard:'none',hairColor:'#272336',skinColor:'#b97850',eyes:'06'}}],blocks:[],activity:[]};
 const send=(r,b,status=200)=>r.fulfill({status,contentType:'application/json',body:JSON.stringify(b)});
 await context.route(config.url+'/**',async r=>{const p=new URL(r.request().url()).pathname;
  if(p.endsWith('/auth/v1/token'))return send(r,{access_token:token,token_type:'bearer',expires_in:3600,refresh_token:'test',user});
  if(p.endsWith('/auth/v1/user'))return send(r,user);
  if(p.endsWith('/get_my_character'))return send(r,[{username:'QAPlayer',id:user.id}]);
  if(p.endsWith('/get_my_bank'))return send(r,[{gp:50000,items:{}}]);
  return send(r,[]);
 });
 await context.route('**/api/dashboard/**',async r=>{const p=new URL(r.request().url()).pathname.split('/').pop();if(p==='state')return send(r,social);if(p==='profile')return send(r,{username:'fern',relationship:'accepted',profile:social.friends[0],activity:[],mutual_friends:[]});if(p==='avatar'){writes++;if(failSave)return send(r,{error:'Test save unavailable'},503);social.profile.avatar=r.request().postDataJSON().avatar;return send(r,{ok:true,avatar:social.profile.avatar});}return send(r,{ok:true});});
 await page.goto('http://127.0.0.1:8788/#account/profile');
 await page.getByRole('button',{name:'Sign in →',exact:true}).click();await page.locator('[name=username]').fill('QAPlayer');await page.locator('[name=password]').fill('test-password');await page.locator('#account-login-form [type=submit]').click();
 await page.waitForFunction(()=>repoAccount.state.social&&repoAvatar.catalog&&!document.querySelector('#account-detail').open);
 await page.locator('.profile-edit[data-edit-avatar]').click();
 const ready=()=>page.waitForFunction(()=>{const b=document.querySelector('#avatar-creator .avatar-save');return b&&!b.disabled});
 await ready();
 for(const [key,count] of Object.entries({body:2,eyes:8,nose:8,mouth:8,ears:5,hair:25,beard:7,clothing:5})){await page.locator('[data-avatar-section="'+key+'"]').click();assert.equal(await page.locator('[data-avatar-option]').count(),count);}
 await page.locator('[data-avatar-section=body]').click();await page.locator('[data-avatar-option=female]').click();await ready();
 await page.locator('[data-avatar-section=hair]').click();await page.locator('[data-avatar-option="18"]').click();await ready();
 await page.locator('[data-avatar-section=beard]').click();await page.locator('[data-avatar-option=none]').click();await ready();
 await page.locator('[data-link-hair]').uncheck();await ready();
 await page.locator('.avatar-quick-colors [data-avatar-color=hairColor]').fill('#33253d');await ready();
 await page.locator('.avatar-quick-colors [data-avatar-color=beardColor]').fill('#cc7744');await ready();
 await page.locator('.avatar-quick-colors [data-avatar-color=skinColor]').fill('#b97850');await ready();
 await page.locator('.avatar-quick-colors [data-avatar-color=eyeColor]').fill('#398254');await ready();
 await page.locator('[data-avatar-section=eyes]').click();await page.locator('[data-avatar-option="06"]').click();await ready();
 await page.waitForFunction(()=>[...document.querySelectorAll('#avatar-creator canvas[data-option-id]')].every(c=>c.dataset.thumbnailReady==='true'));
 await page.screenshot({path:path.join(out,'avatar-creator-desktop.png')});
 await page.locator('.avatar-cancel').click();assert.equal(writes,0,'Cancel must not save');
 await page.locator('.profile-edit[data-edit-avatar]').click();await ready();await page.locator('[data-avatar-section=hair]').click();assert.equal(await page.locator('[data-avatar-option="01"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-avatar-option="24"]').click();await ready();await page.locator('[data-avatar-section=body]').click();await page.locator('[data-avatar-option=female]').click();await ready();
 await page.locator('[data-avatar-section=clothing]').click();assert.equal(await page.locator('[data-avatar-option]').count(),5);
 await page.locator('[data-avatar-option=hoodie]').click();await ready();
 await page.locator('[data-avatar-color=clothingColor]').fill('#b27c42');await ready();
 failSave=true;await page.locator('.avatar-save').click();await page.getByText('Test save unavailable',{exact:true}).waitFor();assert(await page.locator('#avatar-creator').isVisible(),'Failed save preserves draft');
 failSave=false;await page.locator('.avatar-save').click();await page.waitForFunction(()=>!document.querySelector('#avatar-creator').open);assert.equal(writes,2);assert.equal(social.profile.avatar.hair,'24');assert.equal(social.profile.avatar.body,'female');
 assert.equal(social.profile.avatar.clothing,'hoodie');assert.equal(social.profile.avatar.clothingColor,'#b27c42');
 await page.waitForFunction(()=>document.querySelector('.profile-avatar canvas')?.dataset.avatarReady==='true');
 await page.reload();await page.waitForFunction(()=>document.querySelector('.profile-avatar canvas')?.dataset.avatarReady==='true');
 assert.equal(await page.locator('.profile-friend canvas').count(),1);
 await page.screenshot({path:path.join(out,'avatar-profile-saved.png')});
 await page.locator('[data-tab=friends][role=tab]').click();await page.waitForFunction(()=>document.querySelector('.hub-avatar canvas')?.dataset.avatarReady==='true');
 await page.locator('.hub-profile-link').first().click();await page.waitForFunction(()=>document.querySelector('.player-profile canvas')?.dataset.avatarReady==='true');assert.equal(await page.locator('#account-detail[open]').count(),0);
 await page.locator('[data-tab=profile][role=tab]').click();await page.locator('.profile-edit[data-edit-avatar]').click();await ready();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-avatar-section=hair]').click();
 assert(await page.evaluate(()=>document.querySelector('#avatar-creator').scrollWidth<=innerWidth+1),'Mobile does not overflow horizontally');
 await page.waitForFunction(()=>[...document.querySelectorAll('#avatar-creator canvas[data-option-id]')].every(c=>c.dataset.thumbnailReady==='true'));
 await page.screenshot({path:path.join(out,'avatar-creator-mobile.png'),fullPage:true});
 await page.locator('.avatar-cancel').click();
 // Render every asset plus colour extremes using the actual creator renderer.
 const result=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=c.height=160;const cat=repoAvatar.catalog,signatures={};let rendered=0;
  for(const [key,parts] of Object.entries(cat.parts)){const values=[];for(const p of parts){await repoAvatar.draw(c,{...cat.defaults,beard:'none',[key]:p.id});values.push(c.toDataURL());rendered++;}signatures[key]=new Set(values).size;}
  for(const skinColor of cat.colors.skin)for(const body of ['male','female']){await repoAvatar.draw(c,{...cat.defaults,body,skinColor,hairColor:'#f0d284',beardColor:'#f0d284',eyeColor:'#55aa44'});rendered++;}
  const clothing={};for(const body of ['male','female']){const values=[];for(const style of cat.clothing){await repoAvatar.draw(c,{body,clothing:style.id,clothingColor:'#853f43'});values.push(c.toDataURL());rendered++;}clothing[body]=new Set(values).size;}
  return{rendered,signatures,clothing};
 });
 for(const [key,parts]of Object.entries(catalog.parts))assert.equal(result.signatures[key],parts.length,key+' choices must render differently');
 for(const body of ['male','female'])assert.equal(result.clothing[body],5,body+' clothing styles must render differently');
 assert.deepEqual(errors,[]);console.log('PASS: option counts, '+result.rendered+' renders, colours, cancel/reset state, failed save, persistence, profile, Friends and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
