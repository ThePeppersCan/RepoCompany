(() => {const id=location.hash.slice(1).split('/')[0];location.replace('/#account/achievements'+(['moratales','manager','morogue'].includes(id)?'/'+id:''));})();
