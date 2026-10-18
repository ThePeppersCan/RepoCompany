(() => {
 // The launcher's existing trusted-origin link handler opens this page in the
 // system browser. Only fixed provider destinations are allowed.
 const query=new URLSearchParams(location.search),provider=query.get('provider'),id=query.get('id')||'';
 const patterns={youtube:/^[\w-]{11}$/,suno:/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i,spotify:/^[a-zA-Z0-9]{22}$/};
 const origins={youtube:'https://www.youtube.com/watch?v=',suno:'https://suno.com/song/',spotify:'https://open.spotify.com/track/'};
 if(Object.hasOwn(patterns,provider)&&patterns[provider].test(id))location.replace(origins[provider]+encodeURIComponent(id));
 else document.getElementById('listen-status').textContent='This song link is unavailable.';
})();
