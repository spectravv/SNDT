// zoom the editor onto map point (X,Y) at scale K, then the -ui screenshot shows it
window.__focus=(X,Y,K)=>{const v=__t.view,r=document.getElementById('map').getBoundingClientRect();v.k=K;v.x=r.width/2-X*K;v.y=r.height/2-Y*K;__t.render();return [r.left,r.top,r.width,r.height]};
