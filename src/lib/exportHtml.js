export function buildStandaloneHtml({ data, includePhotos }) {
  const cleaned = includePhotos
    ? data
    : {
        ...data,
        items: data.items.map((item) => ({
          ...item,
          photo_refs: item.photo_refs.map((p) => ({ filename: p.filename })),
        })),
      };

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Timeliner Export</title><style>body{font-family:Arial,sans-serif;margin:1rem}.tabs button{margin-right:.5rem}.card{border:1px solid #ddd;padding:.75rem;border-radius:8px;margin:.5rem 0}</style></head><body><h1>Timeliner Export</h1><div class="tabs"><button onclick="setView('vertical')">Vertical</button><button onclick="setView('horizontal')">Horizontal</button><button onclick="setView('grid')">Grid</button></div><div id="app"></div><script id="timeline-data" type="application/json">${JSON.stringify(
    cleaned
  )}</script><script>const data=JSON.parse(document.getElementById('timeline-data').textContent);let view='vertical';function setView(v){view=v;render()}function render(){const root=document.getElementById('app'); if(view==='grid'){root.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.5rem">'+data.items.map(i=>'<div class="card"><h3>'+i.title+'</h3><p>'+i.date.display+'</p><p>'+i.description+'</p></div>').join('')+'</div>';} else if(view==='horizontal'){root.innerHTML='<div>'+data.items.map(i=>'<div class="card"><strong>'+i.date.display+'</strong> — '+i.title+'</div>').join('')+'</div>';} else {root.innerHTML=data.items.map(i=>'<div class="card"><h3>'+i.title+'</h3><p>'+i.date.display+'</p><p>'+i.description+'</p></div>').join('');}}render();</script></body></html>`;
}
