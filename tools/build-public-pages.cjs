'use strict';
const fs = require('node:fs'), path = require('node:path');
const {origin, description, pages} = require('./public-pages.cjs');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const logo = '/assets/brand/repo-company-mark.png';
const iconLinks = '<link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48 96x96" href="/assets/brand/favicon-v2.ico"><link rel="icon" type="image/png" sizes="96x96" href="/assets/brand/favicon-v2.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/apple-touch-icon-v2.png">';
const organization = {'@type':'Organization','@id':origin+'/#organization',name:'Repo Company',alternateName:'RepoCompany',url:origin+'/',logo:origin+logo};
function metadata({title, description:copy, path:route, image=logo}, production) {
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(copy)}">
${production ? '' : '<meta name="robots" content="noindex,nofollow">'}
<link rel="canonical" href="${origin}${route}">
${iconLinks}<meta name="theme-color" content="#101713">
<meta property="og:type" content="website"><meta property="og:site_name" content="Repo Company">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(copy)}">
<meta property="og:url" content="${origin}${route}"><meta property="og:image" content="${origin}${image}">
<meta property="og:image:alt" content="${esc(title)}"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(copy)}"><meta name="twitter:image" content="${origin}${image}">`;
}
function links() {
  return pages.map(p => `<a href="${p.path}">${esc(p.name)}</a>`).join('');
}
function layout(head, body, schema) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}<link rel="stylesheet" href="/repo-public.css"><script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[organization,...schema]})}</script></head>
<body class="repo-public-page"><header class="public-header"><a class="public-brand" href="/" aria-label="Repo Company home"><img src="${logo}" width="36" height="36" alt=""><span>repo company</span></a><nav aria-label="Main navigation"><a href="/games/">Games</a><a href="/wibs/">Wibs</a><a href="/about/reparty/">Reparty</a><a class="public-sign-in" href="/">Log in</a></nav></header><main id="main">${body}</main><footer class="public-footer"><a href="/">Repo Company</a><nav aria-label="Explore Repo Company">${links()}</nav></footer></body></html>`;
}
function card(p) {
  return `<a class="public-game-card" href="${p.path}"><img src="${p.image}" loading="lazy" width="720" height="405" alt="${esc(p.imageAlt)}"><div><h2>${esc(p.name)}</h2><p>${esc(p.lead)}</p><span>${esc(p.details[0])} <span aria-hidden="true">↗</span></span></div></a>`;
}
module.exports = function buildPublicPages(root, dist, {production}) {
  const writePage = (route, html) => { const file = path.join(dist, route, 'index.html'); fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, html); };
  const home = {title:'Repo Company — Games & Good Company',description,path:'/'};
  const intro = `<section id="repo-public-info" class="repo-public-intro" aria-label="Explore Repo Company"><img class="public-fallback-logo" src="${logo}" width="80" height="80" alt="Repo Company"><nav aria-label="Explore Repo Company">${links()}</nav><noscript><p>Enable JavaScript to log in and open your collection. You can browse the games and Wibs pages above without it.</p></noscript></section>`;
  const index = path.join(dist, 'index.html');
  let html = fs.readFileSync(index,'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/,metadata(home,production))
    .replace(/<!-- PUBLIC_INTRO -->/,intro)
    .replace('</head>',`<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[organization,{'@type':'WebSite','@id':origin+'/#website',name:'Repo Company',alternateName:'RepoCompany',url:origin+'/',description,publisher:{'@id':organization['@id']}}]})}</script></head>`);
  fs.writeFileSync(index, html);
  const games = pages.filter(p=>p.type==='VideoGame');
  const gamesMeta = {title:'Games — Moratales, Morogue & Velmora Manager | Repo Company',description:'Explore the Repo Company collection: Moratales, Morogue and Velmora Manager. Discover each game and open it from your collection.',path:'/games/'};
  writePage('/games/',layout(metadata(gamesMeta,production),`<section class="public-heading"><p class="public-eyebrow">Repo Company</p><h1>Games</h1></section><div class="public-game-grid">${games.map(card).join('')}</div><section class="public-companions"><h2>Wibs and Reparty</h2><p>Catch up in <a href="/wibs/">Wibs</a> and share a playlist in <a href="/about/reparty/">Reparty</a>.</p></section>`,[{'@type':'CollectionPage',name:'Repo Company games',url:origin+'/games/',description:gamesMeta.description,mainEntity:{'@type':'ItemList',itemListElement:games.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:origin+p.path}))}}]));
  for(const p of pages) {
    const visual = p.image ? `<figure class="public-hero-image"><img src="${p.image}" width="1280" height="720" alt="${esc(p.imageAlt)}" fetchpriority="high"></figure>` : `<div class="public-product-mark" aria-hidden="true"><img src="${p.icon}" width="200" height="200" alt=""></div>`;
    const body = `<div class="public-breadcrumb"><a href="${p.type==='VideoGame'?'/games/':'/'}">${p.type==='VideoGame'?'Games':'Repo Company'}</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></div><section class="public-product ${p.image?'':'public-community-product'}"><div class="public-product-copy"><p class="public-eyebrow">${p.details.map(esc).join(' · ')}</p><h1>${esc(p.name)}</h1>${p.lead?`<h2>${esc(p.lead)}</h2>`:''}<p>${esc(p.copy)}</p><a class="public-action" href="${p.action}">${esc(p.actionLabel)} <span aria-hidden="true">↗</span></a>${p.note?`<p class="public-note">${esc(p.note)}</p>`:''}</div>${visual}</section><section class="public-features" aria-label="About ${esc(p.name)}">${p.features.map(([heading,copy])=>`<div><h2>${esc(heading)}</h2><p>${esc(copy)}</p></div>`).join('')}</section>${p.shots?`<section class="public-screenshots" aria-label="${esc(p.name)} screenshots">${p.shots.map(([file,alt])=>`<figure><img src="/assets/discover/${file}" width="800" height="450" loading="lazy" alt="${esc(alt)}"><figcaption>${esc(alt)}</figcaption></figure>`).join('')}</section>`:''}`;
    const entity = {'@type':p.type,name:p.name,url:origin+p.path,description:p.description,image:origin+(p.image||p.icon),publisher:{'@id':organization['@id']},...(p.genre?{genre:p.genre}:{applicationCategory:'SocialNetworkingApplication',operatingSystem:'Web browser, Windows'})};
    writePage(p.path,layout(metadata(p,production),body,[entity,{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Repo Company',item:origin+'/'},{'@type':'ListItem',position:2,name:p.name,item:origin+p.path}]}]));
  }
  const notFound = {title:'Page not found | Repo Company',description:'Return to Repo Company or browse the games collection.',path:'/404'};
  fs.writeFileSync(path.join(dist,'404.html'),layout(metadata(notFound,false),'<section class="public-heading"><p class="public-eyebrow">404</p><h1>Page not found.</h1><p>This page may have moved. Head back to your collection or browse the games.</p><a class="public-action" href="/">Back to Repo Company</a></section>',[]));
  const urls = ['/', '/games/', ...pages.map(p=>p.path)];
  fs.writeFileSync(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(route=>`  <url><loc>${origin}${route}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(dist,'robots.txt'),production?`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
  return [...urls.slice(1).map(route=>route.slice(1)+'index.html'),'404.html'];
};
