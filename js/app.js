/* ==========================================================================
   NEXUS TERMINAL — App shell & page renderers
   ========================================================================== */
const D = NEXUS;
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const app = $('#app');

/* ---------------- persistent state (localStorage, no login) ---------------- */
const Store = {
  get(key, fallback){ try{ const v = localStorage.getItem('nexus:'+key); return v? JSON.parse(v): fallback; }catch(e){ return fallback; } },
  set(key, val){ try{ localStorage.setItem('nexus:'+key, JSON.stringify(val)); }catch(e){} }
};
let watchlist = new Set(Store.get('watchlist', []));
let portfolio = Store.get('portfolio', []); // [{id,name,symbol,amount,buyPrice}]
let alerts = Store.get('alerts', []); // [{id,asset,condition,value,active}]
let settings = Store.get('settings', {theme:'dark', currency:'USD', lang:'id'});

function saveWatchlist(){ Store.set('watchlist',[...watchlist]); }
function toggleWatch(id){ watchlist.has(id)? watchlist.delete(id): watchlist.add(id); saveWatchlist(); toast(watchlist.has(id)?'Ditambahkan ke Watchlist':'Dihapus dari Watchlist'); }

function toast(msg, type=''){
  const t = document.createElement('div');
  t.className = 'toast glass'; t.style.borderColor = type==='err'? 'var(--down)':'var(--border)';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 2400);
}

/* ---------------- formatting helpers ---------------- */
function pctSpan(v, d=2){
  if(v===undefined||v===null||isNaN(v)) return '<span>—</span>';
  const cls = v>0? 'up': v<0? 'down':'';
  const arrow = v>0? '▲': v<0? '▼':'';
  return `<span class="${cls}">${arrow} ${Math.abs(v).toFixed(d)}%</span>`;
}
function money(v){ return '$'+D.fmt(v,{compact:true}); }
function starBtn(id){ return `<button class="star-btn ${watchlist.has(id)?'active':''}" data-star="${id}">★</button>`; }
function ratingBadge(v){
  const cls = v>=70?'low': v>=45?'mid':'high';
  return `<span class="badge ${cls}">${v}</span>`;
}

/* ==========================================================================
   NAVIGATION CONFIG
   ========================================================================== */
const NAV = [
  {group:'Utama', items:[
    ['dashboard','Dashboard','#7c3aed'],
    ['heatmap','Heatmap','#22d3ee'],
    ['trending','Trending','#f59e0b'],
    ['top-gainers','Top Gainers','#1fd88f'],
    ['top-losers','Top Losers','#ff4d6d'],
    ['new-listings','New Listings','#a78bfa'],
  ]},
  {group:'Crypto', items:[
    ['crypto','Crypto','#8b5cf6'],
    ['bitcoin','Bitcoin','#f7931a'],
    ['ethereum','Ethereum','#8c8c8c'],
    ['altcoin','Altcoin','#22d3ee'],
    ['memecoin','Memecoin','#f472b6'],
    ['defi','DeFi','#34d399'],
    ['stablecoin','Stablecoin','#60a5fa'],
    ['nft','NFT','#fb7185'],
    ['dex','DEX','#c084fc'],
    ['cex','CEX','#fbbf24'],
  ]},
  {group:'Pasar Tradisional', items:[
    ['forex','Forex','#38bdf8'],
    ['saham','Saham','#a3e635'],
    ['etf','ETF','#fbbf24'],
    ['obligasi','Obligasi','#f472b6'],
    ['indeks','Indeks Dunia','#818cf8'],
  ]},
  {group:'Komoditas & Makro', items:[
    ['komoditas','Komoditas','#eab308'],
    ['logam-mulia','Logam Mulia','#facc15'],
    ['energi','Energi','#fb923c'],
    ['pertanian','Pertanian','#84cc16'],
    ['pangan','Pangan','#4ade80'],
    ['industri','Industri','#94a3b8'],
    ['ekonomi-dunia','Ekonomi Dunia','#60a5fa'],
  ]},
  {group:'Riset & Alat', items:[
    ['ai-analysis','AI Analysis','#8b5cf6'],
    ['screener','Screener','#22d3ee'],
    ['watchlist','Watchlist','#facc15'],
    ['portfolio','Portfolio (Offline)','#34d399'],
  ]},
  {group:'Kalender & Berita', items:[
    ['economic-calendar','Economic Calendar','#f472b6'],
    ['earnings-calendar','Earnings Calendar','#a3e635'],
    ['ipo-calendar','IPO Calendar','#38bdf8'],
    ['news','News','#f59e0b'],
    ['alert-center','Alert Center','#ff4d6d'],
  ]},
  {group:'Lainnya', items:[
    ['settings','Settings','#94a3b8'],
  ]},
];

function buildSidebar(){
  const nav = $('#navScroll');
  nav.innerHTML = NAV.map(g => `
    <div class="nav-group-label">${g.group}</div>
    ${g.items.map(([key,label,color])=>`
      <a href="#/${key}" class="nav-item" data-route="${key}">
        <span class="nav-ico" style="background:${color}">${label.slice(0,1)}</span>
        <span>${label}</span>
      </a>`).join('')}
  `).join('');
}

/* ==========================================================================
   TICKER BAR (signature element)
   ========================================================================== */
function buildTicker(){
  const items = [
    ['BTC', D.CRYPTO[0].price, D.CRYPTO[0].chg['24h']],
    ['ETH', D.CRYPTO[1].price, D.CRYPTO[1].chg['24h']],
    ['SOL', D.CRYPTO[2].price, D.CRYPTO[2].chg['24h']],
    ['S&P 500', D.INDICES[0].price, D.INDICES[0].chg24h],
    ['NASDAQ', D.INDICES[1].price, D.INDICES[1].chg24h],
    ['EUR/USD', D.FOREX[0].price, D.FOREX[0].chg['24h']],
    ['GOLD', D.COMMODITIES[0].price, D.COMMODITIES[0].chg24h],
    ['WTI OIL', D.COMMODITIES.find(c=>c.name==='Crude Oil WTI').price, D.COMMODITIES.find(c=>c.name==='Crude Oil WTI').chg24h],
    ['IHSG', D.INDICES.find(i=>i.symbol==='JKSE').price, D.INDICES.find(i=>i.symbol==='JKSE').chg24h],
  ];
  const html = items.map(([n,p,c])=>`
    <div class="ticker-item"><span class="name">${n}</span><span class="val">${D.fmt(p,{compact:true})}</span>${pctSpan(c)}</div>
  `).join('');
  $('#tickerTrack').innerHTML = html + html; // duplicate for seamless loop
}

/* ==========================================================================
   GENERIC TABLE RENDERER
   ========================================================================== */
let tableRegistry = {};
let tableCounter = 0;
function tableInnerHtml(data, cols){
  const rowsHtml = data.map(row => `
    <tr data-id="${row.id||''}">
      ${cols.map(c => `<td class="${c.cellClass||''}">${c.render(row)}</td>`).join('')}
    </tr>
  `).join('');
  return `
    <table>
      <thead><tr>${cols.map(c=>`<th data-sort="${c.key||''}">${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rowsHtml || `<tr><td colspan="${cols.length}"><div class="empty">Tidak ada data yang cocok.</div></td></tr>`}</tbody>
    </table>`;
}
function genericTable(data, cols, opts={}){
  const tid = 'tbl'+(tableCounter++);
  tableRegistry[tid] = {data, cols};
  return `<div class="table-wrap glass" data-tid="${tid}">${tableInnerHtml(data, cols)}</div>`;
}

const assetCols = (withExtra=[]) => [
  {label:'', key:'watch', render:r=>starBtn(r.id)},
  {label:'Asset', key:'name', render:r=>`
    <div class="asset-cell">
      <span class="asset-logo">${r.logoLetter}</span>
      <div><div class="asset-name">${r.name}</div><div class="asset-sym">${r.symbol}</div></div>
    </div>`, cellClass:'asset-cell'},
  {label:'Harga', key:'price', render:r=>money(r.price)},
  {label:'1H', key:'chg.1h', render:r=>pctSpan(r.chg['1h'])},
  {label:'24H', key:'chg.24h', render:r=>pctSpan(r.chg['24h'])},
  {label:'7D', key:'chg.7d', render:r=>pctSpan(r.chg['7d'])},
  {label:'Volume', key:'volume', render:r=>money(r.volume)},
  {label:'Market Cap', key:'mcap', render:r=>money(r.mcap)},
  ...withExtra,
];

function sortData(data, key, dir){
  const get = (o,k)=> k.split('.').reduce((a,p)=> a && a[p]!==undefined? a[p]: undefined, o);
  return [...data].sort((a,b)=>{
    const av=get(a,key), bv=get(b,key);
    if(typeof av==='string') return dir*av.localeCompare(bv);
    return dir*((av??-Infinity)-(bv??-Infinity));
  });
}

/* ==========================================================================
   PAGE: DASHBOARD
   ========================================================================== */
function pageDashboard(){
  const totalMcap = D.ALL_ASSETS.reduce((s,a)=>s+a.mcap,0);
  const totalVol = D.ALL_ASSETS.reduce((s,a)=>s+a.volume,0);
  const btcDom = (D.CRYPTO[0].mcap/totalMcap*100).toFixed(1);
  const ethDom = (D.CRYPTO[1].mcap/totalMcap*100).toFixed(1);
  const stableDom = (D.STABLECOIN.reduce((s,a)=>s+a.mcap,0)/totalMcap*100).toFixed(1);
  const fgi = Math.floor(D.rnd(15,85));
  const fgiLabel = fgi>75?'Extreme Greed': fgi>55?'Greed': fgi>45?'Netral': fgi>25?'Fear':'Extreme Fear';

  const stats = [
    ['Total Market Cap', money(totalMcap), D.rnd(-3,4)],
    ['Total Volume 24H', money(totalVol), D.rnd(-8,10)],
    ['BTC Dominance', btcDom+'%', D.rnd(-1,1)],
    ['ETH Dominance', ethDom+'%', D.rnd(-1,1)],
    ['Stablecoin Dominance', stableDom+'%', D.rnd(-0.3,0.3)],
    ['Fear & Greed Index', fgi+' · '+fgiLabel, D.rnd(-4,4)],
    ['Total TVL (DeFi)', money(D.rnd(4e10,9e10)), D.rnd(-2,3)],
    ['Open Interest', money(D.rnd(2e10,5e10)), D.rnd(-5,5)],
    ['Liquidation 24H', money(D.rnd(5e7,4e8)), D.rnd(-20,20)],
    ['Avg Funding Rate', (D.rnd(-0.02,0.03)).toFixed(4)+'%', D.rnd(-1,1)],
  ];

  const trending = D.ALL_ASSETS.slice().sort((a,b)=>b.socialScore-a.socialScore).slice(0,6);
  const heat = D.ALL_ASSETS.slice(0,24);

  return `
    <div class="page">
      <div class="page-head">
        <div><span class="eyebrow">Ringkasan Pasar Global</span><h1 class="page-title">Dashboard</h1><div class="page-sub">Semua kelas aset dalam satu layar — realtime simulasi</div></div>
      </div>
      <div class="grid grid-4" style="margin-bottom:16px">
        ${stats.map(([l,v,d])=>`
          <div class="stat-card glass">
            <div class="lbl">${l}</div>
            <div class="val">${v}</div>
            <div class="delta">${pctSpan(d)}</div>
          </div>`).join('')}
      </div>
      <div class="grid grid-2" style="align-items:start;grid-template-columns:1.4fr .8fr">
        <div class="card glass">
          <div class="card-head"><h3>Mini Heatmap</h3><span class="tag">24H Change</span></div>
          <div class="heatmap">
            ${heat.map(a=>{
              const c=a.chg['24h']; const inten=Math.min(Math.abs(c)/20,1);
              const bg = c>=0? `rgba(31,216,143,${0.18+inten*0.55})`:`rgba(255,77,109,${0.18+inten*0.55})`;
              return `<div class="heat-cell" style="background:${bg}"><span class="sym">${a.symbol}</span><span class="pct">${c>0?'+':''}${c.toFixed(1)}%</span></div>`;
            }).join('')}
          </div>
        </div>
        <div class="card glass">
          <div class="card-head"><h3>Trending Assets</h3><span class="tag">Social Score</span></div>
          ${trending.map(a=>`
            <div style="display:flex;align-items:center;justify-content:between;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-soft)">
              <div class="asset-cell" style="flex:1"><span class="asset-logo">${a.logoLetter}</span><div><div class="asset-name">${a.name}</div><div class="asset-sym">${a.symbol}</div></div></div>
              ${pctSpan(a.chg['24h'])}
            </div>`).join('')}
        </div>
      </div>
      <div class="mock-note">⚠️ Seluruh angka pada dashboard ini adalah <b>data simulasi/contoh</b> untuk keperluan demonstrasi tampilan, bukan data pasar real-time sesungguhnya.</div>
    </div>`;
}

/* ==========================================================================
   PAGE: generic crypto-family listing (crypto, altcoin, memecoin, defi, stablecoin, nft, dex, cex)
   ========================================================================== */
function pageCryptoFamily(key, title, sub, dataset, extraCols=[]){
  return `
    <div class="page">
      <div class="page-head">
        <div><span class="eyebrow">${title}</span><h1 class="page-title">${title}</h1><div class="page-sub">${sub}</div></div>
        <div class="chips-row" style="margin:0"><button class="btn primary" data-export="${key}">Export CSV</button></div>
      </div>
      <div id="tableHolder-${key}">${genericTable(dataset, assetCols(extraCols), {clickable:true})}</div>
      <div class="mock-note">Data harga & metrik on-chain di halaman ini bersifat simulasi.</div>
    </div>`;
}

function pageMemecoin(){
  const extra = [
    {label:'Hype', key:'hype', render:r=>ratingBadge(r.hype)},
    {label:'Rug Risk', key:'rugRisk', render:r=>r.rugRisk},
    {label:'Honeypot', key:'honeypot', render:r=>`<span class="${r.honeypot==='Aman'?'up':'down'}">${r.honeypot}</span>`},
    {label:'Whale', key:'whaleActivity', render:r=>r.whaleActivity},
  ];
  return pageCryptoFamily('memecoin','Memecoin','Hype score, rug risk, honeypot detection & smart money tracking', D.MEMECOIN, extra);
}
function pageAltcoin(){
  const extra=[{label:'AI Rating', key:'aiRating', render:r=>ratingBadge(r.aiRating)},{label:'Sector', key:'sector', render:r=>r.sector}];
  return pageCryptoFamily('altcoin','Altcoin','Seluruh altcoin lengkap dengan analisis AI', D.ALTCOIN, extra);
}

/* single-asset deep dive (Bitcoin / Ethereum) */
function pageAssetDeepDive(asset){
  const candles = genCandles(asset.price, 90);
  return `
    <div class="page">
      <div class="page-head">
        <div><span class="eyebrow">Deep Dive</span><h1 class="page-title">${asset.name} (${asset.symbol})</h1><div class="page-sub">${money(asset.price)} · ${pctSpan(asset.chg['24h'])}</div></div>
        <button class="btn primary" data-star="${asset.id}">${watchlist.has(asset.id)?'★ Di Watchlist':'☆ Tambah Watchlist'}</button>
      </div>
      <div class="grid grid-4" style="margin-bottom:16px">
        <div class="stat-card glass"><div class="lbl">Market Cap</div><div class="val">${money(asset.mcap)}</div></div>
        <div class="stat-card glass"><div class="lbl">Volume 24H</div><div class="val">${money(asset.volume)}</div></div>
        <div class="stat-card glass"><div class="lbl">Circulating Supply</div><div class="val">${D.fmt(asset.circSupply,{compact:true})}</div></div>
        <div class="stat-card glass"><div class="lbl">AI Rating</div><div class="val">${ratingBadge(asset.aiRating)}</div></div>
      </div>
      <div class="card glass chart-card">
        <div class="card-head"><h3>Price Chart</h3>
          <div class="tf-row">
            ${['15m','1H','4H','1D','1W'].map((t,i)=>`<button class="chip ${i===3?'active':''}" data-tf="${t}">${t}</button>`).join('')}
          </div>
        </div>
        <canvas id="dive-chart" height="320"></canvas>
      </div>
      <div class="grid grid-3" style="margin-top:16px">
        <div class="card glass"><div class="card-head"><h3>On-chain</h3></div>
          <div class="page-sub">Holders: ${D.fmt(asset.holders,{compact:true})}<br>Whale Activity: ${asset.whaleActivity}<br>Smart Money: ${asset.smartMoney}<br>Dev Activity: ${asset.devActivity}/100</div></div>
        <div class="card glass"><div class="card-head"><h3>Kontrak</h3></div>
          <div class="page-sub">Chain: ${asset.chain}<br>Exchange: ${asset.exchange}<br>Audit: ${asset.audit}<br><span style="font-family:var(--font-mono);font-size:11px;word-break:break-all">${asset.contract}</span></div></div>
        <div class="card glass"><div class="card-head"><h3>AI Summary</h3></div>
          <div class="page-sub">Trend Strength: ${Math.floor(D.rnd(40,95))}/100<br>Confidence Score: ${asset.aiRating}%<br>Risk Level: ${asset.aiRating>70?'Rendah':asset.aiRating>50?'Sedang':'Tinggi'}</div></div>
      </div>
      <div class="mock-note">Chart & metrik ditampilkan menggunakan data simulasi.</div>
    </div>`;
}

/* ==========================================================================
   CANDLESTICK (lightweight canvas, no external chart lib)
   ========================================================================== */
function genCandles(basePrice, n){
  let price = basePrice*0.9;
  const arr=[];
  for(let i=0;i<n;i++){
    const open=price;
    const vol = basePrice*0.02;
    const close = open + D.rnd(-vol,vol);
    const high = Math.max(open,close)+Math.abs(D.rnd(0,vol*0.6));
    const low = Math.min(open,close)-Math.abs(D.rnd(0,vol*0.6));
    arr.push({open,close,high,low});
    price = close;
  }
  return arr;
}
function drawCandles(canvas, candles){
  if(!canvas) return;
  const dpr = window.devicePixelRatio||1;
  const w = canvas.clientWidth, h = canvas.clientHeight || 320;
  canvas.width = w*dpr; canvas.height = h*dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,w,h);
  const max = Math.max(...candles.map(c=>c.high));
  const min = Math.min(...candles.map(c=>c.low));
  const pad = 10;
  const cw = (w-pad*2)/candles.length;
  const y = v => pad + (1-(v-min)/(max-min))*(h-pad*2);
  // grid
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){ const yy=pad+(h-pad*2)*i/4; ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(w,yy); ctx.stroke(); }
  candles.forEach((c,i)=>{
    const x = pad + i*cw + cw/2;
    const up = c.close>=c.open;
    ctx.strokeStyle = up? '#1fd88f':'#ff4d6d';
    ctx.fillStyle = up? '#1fd88f':'#ff4d6d';
    ctx.beginPath(); ctx.moveTo(x,y(c.high)); ctx.lineTo(x,y(c.low)); ctx.stroke();
    const bodyTop = y(Math.max(c.open,c.close)), bodyBot = y(Math.min(c.open,c.close));
    ctx.fillRect(x-cw*0.32, bodyTop, cw*0.64, Math.max(1.5,bodyBot-bodyTop));
  });
}

/* ==========================================================================
   PAGE: FOREX
   ========================================================================== */
function pageForex(){
  const cols = [
    {label:'', render:r=>starBtn(r.id)},
    {label:'Pair', key:'pair', render:r=>`<div class="asset-name">${r.pair}</div>`},
    {label:'Harga', key:'price', render:r=>r.price.toFixed(4)},
    {label:'24H', key:'chg.24h', render:r=>pctSpan(r.chg['24h'])},
    {label:'Spread', key:'spread', render:r=>r.spread+' pips'},
    {label:'ATR', key:'atr', render:r=>r.atr},
    {label:'RSI', key:'rsi', render:r=>r.rsi},
    {label:'MACD', key:'macd', render:r=>r.macd},
    {label:'EMA', key:'ema', render:r=>r.ema},
    {label:'VWAP', key:'vwap', render:r=>r.vwap},
    {label:'AI Trend', key:'aiTrend', render:r=>r.aiTrend},
  ];
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Pasar Valuta Asing</span><h1 class="page-title">Forex</h1><div class="page-sub">Pasangan mata uang dunia dengan indikator teknikal</div></div></div>
    ${genericTable(D.FOREX, cols)}
    <div class="mock-note">Harga forex & indikator bersifat simulasi.</div>
  </div>`;
}

/* ==========================================================================
   PAGE: SAHAM (stocks)
   ========================================================================== */
function pageSaham(){
  const cols = [
    {label:'', render:r=>starBtn(r.id)},
    {label:'Saham', key:'name', render:r=>`<div class="asset-cell"><span class="asset-logo">${r.symbol.slice(0,2)}</span><div><div class="asset-name">${r.name}</div><div class="asset-sym">${r.symbol} · ${r.exchange}</div></div></div>`, cellClass:'asset-cell'},
    {label:'Harga', key:'price', render:r=>D.fmt(r.price)},
    {label:'24H', key:'chg24h', render:r=>pctSpan(r.chg24h)},
    {label:'Market Cap', key:'mcap', render:r=>money(r.mcap)},
    {label:'P/E', key:'pe', render:r=>r.pe},
    {label:'EPS', key:'eps', render:r=>r.eps},
    {label:'Dividend', key:'dividend', render:r=>r.dividend+'%'},
    {label:'Beta', key:'beta', render:r=>r.beta},
    {label:'AI Rating', key:'aiRating', render:r=>ratingBadge(r.aiRating)},
  ];
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Pasar Saham Global</span><h1 class="page-title">Saham</h1><div class="page-sub">NASDAQ, NYSE, IDX, HKEX, JPX, LSE & bursa lainnya</div></div></div>
    ${genericTable(D.STOCKS, cols)}
    <div class="mock-note">Data saham bersifat simulasi.</div>
  </div>`;
}

/* ==========================================================================
   PAGE: simple numeric list (indices, bonds, etf, commodities family)
   ========================================================================== */
function pageIndeks(){
  const cols=[
    {label:'Indeks', key:'name', render:r=>`<div class="asset-name">${r.name}</div><div class="asset-sym">${r.symbol}</div>`},
    {label:'Nilai', key:'price', render:r=>D.fmt(r.price)},
    {label:'24H', key:'chg24h', render:r=>pctSpan(r.chg24h)},
    {label:'YTD', key:'chgYtd', render:r=>pctSpan(r.chgYtd)},
  ];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Indeks Saham Global</span><h1 class="page-title">Indeks Dunia</h1></div></div>${genericTable(D.INDICES,cols)}<div class="mock-note">Data indeks bersifat simulasi.</div></div>`;
}
function pageCommoditySet(title, sub, dataset){
  const cols=[
    {label:'Komoditas', key:'name', render:r=>`<div class="asset-name">${r.name}</div><div class="asset-sym">${r.unit}</div>`},
    {label:'Harga', key:'price', render:r=>D.fmt(r.price)},
    {label:'24H', key:'chg24h', render:r=>pctSpan(r.chg24h)},
    {label:'7D', key:'chg7d', render:r=>pctSpan(r.chg7d)},
  ];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Komoditas</span><h1 class="page-title">${title}</h1><div class="page-sub">${sub}</div></div></div>${genericTable(dataset,cols)}<div class="mock-note">Harga komoditas bersifat simulasi.</div></div>`;
}
function pageObligasi(){
  const cols=[
    {label:'Obligasi', key:'name', render:r=>`<div class="asset-name">${r.name}</div><div class="asset-sym">${r.symbol}</div>`},
    {label:'Yield', key:'yield', render:r=>r.yield+'%'},
    {label:'Δ', key:'chg', render:r=>pctSpan(r.chg,3)},
  ];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Fixed Income</span><h1 class="page-title">Obligasi</h1></div></div>${genericTable(D.BONDS,cols)}<div class="mock-note">Data yield obligasi bersifat simulasi.</div></div>`;
}
function pageEtf(){
  const cols=[
    {label:'ETF', key:'name', render:r=>`<div class="asset-name">${r.name}</div><div class="asset-sym">${r.symbol}</div>`},
    {label:'Harga', key:'price', render:r=>D.fmt(r.price)},
    {label:'24H', key:'chg24h', render:r=>pctSpan(r.chg24h)},
    {label:'AUM', key:'aum', render:r=>money(r.aum)},
  ];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Exchange Traded Fund</span><h1 class="page-title">ETF</h1></div></div>${genericTable(D.ETF,cols)}<div class="mock-note">Data ETF bersifat simulasi.</div></div>`;
}
function pageEkonomiDunia(){
  const cols=[
    {label:'Negara', key:'country', render:r=>`<div class="asset-name">${r.country}</div><div class="asset-sym">${r.code}</div>`},
    {label:'GDP Growth', key:'gdp', render:r=>pctSpan(r.gdp)},
    {label:'Inflasi', key:'inflation', render:r=>r.inflation+'%'},
    {label:'Suku Bunga', key:'rate', render:r=>r.rate+'%'},
  ];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Makroekonomi Global</span><h1 class="page-title">Ekonomi Dunia</h1></div></div>${genericTable(D.MACRO,cols)}<div class="mock-note">Data makroekonomi bersifat simulasi.</div></div>`;
}

/* ==========================================================================
   PAGE: HEATMAP / TRENDING / GAINERS / LOSERS / NEW LISTINGS
   ========================================================================== */
function pageHeatmap(){
  const data = D.ALL_ASSETS;
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Visualisasi Pasar</span><h1 class="page-title">Heatmap</h1><div class="page-sub">Ukuran & warna sel merepresentasikan market cap & perubahan 24H</div></div></div>
    <div class="heatmap">
      ${data.map(a=>{
        const c=a.chg['24h']; const inten=Math.min(Math.abs(c)/20,1);
        const bg = c>=0? `rgba(31,216,143,${0.16+inten*0.6})`:`rgba(255,77,109,${0.16+inten*0.6})`;
        return `<div class="heat-cell" style="background:${bg}"><span class="sym">${a.symbol}</span><span class="pct">${c>0?'+':''}${c.toFixed(1)}%</span></div>`;
      }).join('')}
    </div>
    <div class="mock-note">Heatmap berdasarkan data simulasi.</div>
  </div>`;
}
function pageSortedList(title, sortKey, dir, sub){
  const data = sortData(D.ALL_ASSETS, sortKey, dir).slice(0,30);
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">${sub}</span><h1 class="page-title">${title}</h1></div></div>${genericTable(data, assetCols())}<div class="mock-note">Peringkat berdasarkan data simulasi.</div></div>`;
}
function pageNewListings(){
  const data = D.ALL_ASSETS.slice().sort(()=>D.rng()-0.5).slice(0,15);
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Baru Terdaftar</span><h1 class="page-title">New Listings</h1></div></div>${genericTable(data, assetCols())}<div class="mock-note">Daftar listing baru bersifat simulasi.</div></div>`;
}

/* ==========================================================================
   PAGE: SCREENER
   ========================================================================== */
let screenerFilters = {minPrice:0,maxPrice:1e12,minMcap:0,exchange:'all',chain:'all',sector:'all'};
function pageScreener(){
  const exchanges = [...new Set(D.ALL_ASSETS.map(a=>a.exchange))];
  const chains = [...new Set(D.ALL_ASSETS.map(a=>a.chain))];
  const sectors = [...new Set(D.ALL_ASSETS.map(a=>a.sector))];
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Filter Aset Kustom</span><h1 class="page-title">Screener</h1><div class="page-sub">Saring aset berdasarkan harga, volume, sektor, chain, dan AI Score</div></div></div>
    <div class="card glass" style="margin-bottom:16px">
      <div class="grid grid-4">
        <div><label class="page-sub">Market Cap Min (USD)</label><input class="input" style="width:100%;margin-top:6px" type="number" id="sf-mcap" placeholder="0"></div>
        <div><label class="page-sub">Exchange</label><select class="input" style="width:100%;margin-top:6px" id="sf-exchange"><option value="all">Semua</option>${exchanges.map(e=>`<option value="${e}">${e}</option>`).join('')}</select></div>
        <div><label class="page-sub">Blockchain</label><select class="input" style="width:100%;margin-top:6px" id="sf-chain"><option value="all">Semua</option>${chains.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
        <div><label class="page-sub">Sector</label><select class="input" style="width:100%;margin-top:6px" id="sf-sector"><option value="all">Semua</option>${sectors.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
      </div>
      <button class="btn primary" id="sf-apply" style="margin-top:14px">Terapkan Filter</button>
    </div>
    <div id="screenerResults">${genericTable(D.ALL_ASSETS.slice(0,25), assetCols([{label:'AI Score',key:'aiRating',render:r=>ratingBadge(r.aiRating)}]))}</div>
  </div>`;
}
function applyScreener(){
  const mcap = Number($('#sf-mcap').value)||0;
  const exch = $('#sf-exchange').value;
  const chain = $('#sf-chain').value;
  const sector = $('#sf-sector').value;
  const res = D.ALL_ASSETS.filter(a =>
    a.mcap>=mcap && (exch==='all'||a.exchange===exch) && (chain==='all'||a.chain===chain) && (sector==='all'||a.sector===sector)
  );
  $('#screenerResults').innerHTML = genericTable(res, assetCols([{label:'AI Score',key:'aiRating',render:r=>ratingBadge(r.aiRating)}]));
  toast(`${res.length} aset ditemukan`);
}

/* ==========================================================================
   PAGE: AI ANALYSIS
   ========================================================================== */
function pageAiAnalysis(){
  const list = D.ALL_ASSETS.slice(0,60);
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Kecerdasan Buatan</span><h1 class="page-title">AI Analysis</h1><div class="page-sub">Pilih aset untuk melihat analisis teknikal & fundamental berbasis AI (simulasi)</div></div></div>
    <div class="card glass" style="margin-bottom:16px">
      <select class="input" id="ai-select" style="width:100%;max-width:340px">
        ${list.map(a=>`<option value="${a.id}">${a.name} (${a.symbol})</option>`).join('')}
      </select>
    </div>
    <div id="aiResult"></div>
  </div>`;
}
function renderAiResult(assetId){
  const a = D.ALL_ASSETS.find(x=>x.id===assetId) || D.ALL_ASSETS[0];
  const conf = a.aiRating;
  const patterns = ['Bullish Flag','Head & Shoulders','Ascending Triangle','Cup & Handle','Falling Wedge','Double Bottom'];
  const wyckoff = ['Accumulation Phase C','Markup','Distribution Phase A','Markdown','Re-accumulation'];
  const ict = ['Order Block terdeteksi di area diskon','Fair Value Gap terbentuk di timeframe 4H','Liquidity sweep di atas high sebelumnya','Break of structure bullish'];
  const circumference = 2*Math.PI*56;
  const offset = circumference*(1-conf/100);
  return `
    <div class="grid grid-3">
      <div class="card glass" style="text-align:center">
        <div class="card-head" style="justify-content:center"><h3>Confidence Score</h3></div>
        <div class="confidence-ring">
          <svg width="130" height="130"><circle cx="65" cy="65" r="56" stroke="var(--bg-elevated-2)" stroke-width="10" fill="none"/>
          <circle cx="65" cy="65" r="56" stroke="url(#g1)" stroke-width="10" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
          <defs><linearGradient id="g1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#2dd6ff"/></linearGradient></defs></svg>
          <div class="center"><div class="num">${conf}%</div><div style="font-size:11px;color:var(--text-dim)">Confidence</div></div>
        </div>
      </div>
      <div class="card glass">
        <div class="card-head"><h3>Technical Signal</h3></div>
        <div class="page-sub">
          Pattern: <b style="color:var(--text-hi)">${pick_(patterns,a)}</b><br>
          Wyckoff Stage: ${pick_(wyckoff,a,1)}<br>
          Elliott Wave: Wave ${Math.floor(a.aiRating/20)+1} of 5<br>
          Trend Strength: ${a.aiRating}/100<br>
          Momentum: ${a.chg['24h']>0?'Positif':'Negatif'}<br>
          Volatility Prediction: ${a.aiRating%2===0?'Sedang':'Tinggi'}
        </div>
      </div>
      <div class="card glass">
        <div class="card-head"><h3>ICT Concepts</h3></div>
        <div class="page-sub">${ict[a.aiRating%ict.length]}</div>
        <div class="card-head" style="margin-top:12px"><h3>Trade Plan (Simulasi)</h3></div>
        <div class="page-sub">
          Entry: ${money(a.price*0.98)}<br>
          Take Profit: ${money(a.price*1.12)}<br>
          Stop Loss: ${money(a.price*0.92)}<br>
          Risk Level: <span class="${a.aiRating>65?'up':a.aiRating>45?'':'down'}">${a.aiRating>65?'Rendah':a.aiRating>45?'Sedang':'Tinggi'}</span>
        </div>
      </div>
    </div>
    <div class="mock-note">⚠️ Ini BUKAN saran finansial. Seluruh analisis AI adalah simulasi untuk tujuan demonstrasi produk.</div>
  `;
}
function pick_(arr,a,shift=0){ return arr[(a.aiRating+shift)%arr.length]; }

/* ==========================================================================
   PAGE: WATCHLIST / PORTFOLIO / ALERTS
   ========================================================================== */
function pageWatchlist(){
  const data = D.ALL_ASSETS.filter(a=>watchlist.has(a.id));
  if(!data.length){
    return `<div class="page"><div class="page-head"><div><span class="eyebrow">Tersimpan Lokal</span><h1 class="page-title">Watchlist</h1></div></div>
    <div class="empty glass"><div>⭐</div>Belum ada aset di watchlist. Klik ikon ★ pada tabel aset manapun untuk menambahkannya.</div></div>`;
  }
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Tersimpan Lokal (Local Storage)</span><h1 class="page-title">Watchlist</h1></div></div>${genericTable(data, assetCols())}</div>`;
}
function pagePortfolio(){
  const rows = portfolio.map((p,i)=>{
    const a = D.ALL_ASSETS.find(x=>x.id===p.id);
    const cur = a? a.price : p.buyPrice;
    const pnl = (cur-p.buyPrice)*p.amount;
    const pnlPct = ((cur-p.buyPrice)/p.buyPrice*100);
    return {...p, holdingId:p.holdingId||('legacy'+i), cur, pnl, pnlPct, name:a?a.name:p.name, symbol:a?a.symbol:p.symbol};
  });
  const totalVal = rows.reduce((s,r)=>s+r.cur*r.amount,0);
  const totalPnl = rows.reduce((s,r)=>s+r.pnl,0);
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Virtual Offline · Local Storage</span><h1 class="page-title">Portfolio</h1><div class="page-sub">Simulasi kepemilikan aset, tidak terhubung ke exchange manapun</div></div></div>
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="stat-card glass"><div class="lbl">Total Nilai</div><div class="val">${money(totalVal)}</div></div>
      <div class="stat-card glass"><div class="lbl">Total P/L</div><div class="val">${pctSpan(totalPnl?totalPnl/Math.max(totalVal-totalPnl,1)*100:0)}</div></div>
      <div class="stat-card glass"><div class="lbl">Jumlah Holding</div><div class="val">${rows.length}</div></div>
    </div>
    <div class="card glass" style="margin-bottom:16px">
      <div class="card-head"><h3>Tambah Holding</h3></div>
      <div class="grid grid-4">
        <select class="input" id="pf-asset">${D.ALL_ASSETS.slice(0,40).map(a=>`<option value="${a.id}">${a.name} (${a.symbol})</option>`).join('')}</select>
        <input class="input" id="pf-amount" type="number" placeholder="Jumlah" step="any">
        <input class="input" id="pf-price" type="number" placeholder="Harga Beli (USD)" step="any">
        <button class="btn primary" id="pf-add">Tambah</button>
      </div>
    </div>
    ${rows.length ? genericTable(rows, [
      {label:'Asset', render:r=>`<div class="asset-name">${r.name}</div><div class="asset-sym">${r.symbol}</div>`},
      {label:'Jumlah', render:r=>r.amount},
      {label:'Harga Beli', render:r=>money(r.buyPrice)},
      {label:'Harga Sekarang', render:r=>money(r.cur)},
      {label:'P/L', render:r=>pctSpan(r.pnlPct)},
      {label:'Nilai', render:r=>money(r.cur*r.amount)},
      {label:'', render:r=>`<button class="btn" data-pf-remove="${r.holdingId}">Hapus</button>`},
    ]) : `<div class="empty glass">Belum ada holding. Tambahkan di atas untuk mulai simulasi portfolio.</div>`}
  </div>`;
}
function pageAlertCenter(){
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Notifikasi Kustom</span><h1 class="page-title">Alert Center</h1></div></div>
    <div class="card glass" style="margin-bottom:16px">
      <div class="card-head"><h3>Buat Alert Baru</h3></div>
      <div class="grid grid-4">
        <select class="input" id="al-asset">${D.ALL_ASSETS.slice(0,40).map(a=>`<option value="${a.id}">${a.name} (${a.symbol})</option>`).join('')}</select>
        <select class="input" id="al-cond"><option value="above">Harga di atas</option><option value="below">Harga di bawah</option></select>
        <input class="input" id="al-value" type="number" placeholder="Nilai target (USD)">
        <button class="btn primary" id="al-add">Buat Alert</button>
      </div>
    </div>
    ${alerts.length? genericTable(alerts.map(al=>{
        const a = D.ALL_ASSETS.find(x=>x.id===al.asset);
        return {...al, name:a?a.name:'—', symbol:a?a.symbol:''};
      }), [
        {label:'Asset', render:r=>`${r.name} (${r.symbol})`},
        {label:'Kondisi', render:r=>r.condition==='above'?'Di atas':'Di bawah'},
        {label:'Target', render:r=>money(r.value)},
        {label:'', render:r=>`<button class="btn" data-al-remove="${r.id}">Hapus</button>`},
      ]) : `<div class="empty glass">Belum ada alert aktif.</div>`}
  </div>`;
}

/* ==========================================================================
   PAGE: CALENDARS
   ========================================================================== */
function pageEconomicCalendar(){
  const cols=[
    {label:'Tanggal', render:r=>r.date},{label:'Negara', render:r=>r.country},{label:'Event', render:r=>r.event},
    {label:'Dampak', render:r=>`<span class="badge ${r.impact==='Tinggi'?'high':r.impact==='Sedang'?'mid':'low'}">${r.impact}</span>`},
    {label:'Forecast', render:r=>r.forecast+'%'},{label:'Previous', render:r=>r.previous+'%'},
  ];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Jadwal Rilis Data</span><h1 class="page-title">Economic Calendar</h1></div></div>${genericTable(D.ECON_CAL,cols)}</div>`;
}
function pageEarningsCalendar(){
  const cols=[{label:'Tanggal',render:r=>r.date},{label:'Perusahaan',render:r=>`${r.name} (${r.symbol})`},{label:'EPS Estimasi',render:r=>r.epsEst},{label:'EPS Sebelumnya',render:r=>r.epsPrev}];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Jadwal Laporan Keuangan</span><h1 class="page-title">Earnings Calendar</h1></div></div>${genericTable(D.EARNINGS_CAL,cols)}</div>`;
}
function pageIpoCalendar(){
  const cols=[{label:'Tanggal',render:r=>r.date},{label:'Perusahaan',render:r=>`${r.name} (${r.symbol})`},{label:'Estimasi Harga',render:r=>'$'+r.price}];
  return `<div class="page"><div class="page-head"><div><span class="eyebrow">Penawaran Umum Perdana</span><h1 class="page-title">IPO Calendar</h1></div></div>${genericTable(D.IPO_CAL,cols)}</div>`;
}

/* ==========================================================================
   PAGE: NEWS
   ========================================================================== */
let newsFilter = 'all';
function pageNews(){
  const cats = ['all',...new Set(D.NEWS.map(n=>n.category))];
  const list = D.NEWS.filter(n=> newsFilter==='all'||n.category===newsFilter);
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Berita Pasar Realtime</span><h1 class="page-title">News</h1></div></div>
    <div class="chips-row">${cats.map(c=>`<button class="chip ${c===newsFilter?'active':''}" data-newscat="${c}">${c==='all'?'Semua':c}</button>`).join('')}</div>
    <div class="grid grid-3">
      ${list.map(n=>`<div class="news-card glass"><span class="news-cat">${n.category}</span><div class="news-title">${n.title}</div><div class="news-meta">${n.source} · ${n.time} menit lalu</div></div>`).join('')}
    </div>
  </div>`;
}

/* ==========================================================================
   PAGE: SETTINGS
   ========================================================================== */
function pageSettings(){
  return `<div class="page">
    <div class="page-head"><div><span class="eyebrow">Preferensi Aplikasi</span><h1 class="page-title">Settings</h1></div></div>
    <div class="card glass" style="max-width:480px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-soft)">
        <div><div style="font-weight:600">Dark Mode</div><div class="page-sub">Tema gelap premium (default)</div></div>
        <div class="switch on" id="theme-toggle"><div class="knob"></div></div>
      </div>
      <div style="padding:12px 0;border-bottom:1px solid var(--border-soft)">
        <div style="font-weight:600;margin-bottom:8px">Mata Uang Tampilan</div>
        <select class="input" id="set-currency" style="width:100%">
          <option value="USD" ${settings.currency==='USD'?'selected':''}>USD ($)</option>
          <option value="IDR" ${settings.currency==='IDR'?'selected':''}>IDR (Rp)</option>
          <option value="EUR" ${settings.currency==='EUR'?'selected':''}>EUR (€)</option>
        </select>
      </div>
      <div style="padding:12px 0;border-bottom:1px solid var(--border-soft)">
        <div style="font-weight:600;margin-bottom:8px">Bahasa</div>
        <select class="input" id="set-lang" style="width:100%">
          <option value="id" selected>Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </div>
      <div style="padding:12px 0">
        <button class="btn" id="reset-data" style="border-color:var(--down);color:var(--down)">Reset Semua Data Lokal</button>
      </div>
    </div>
  </div>`;
}

/* ==========================================================================
   ROUTER
   ========================================================================== */
const ROUTES = {
  'dashboard': pageDashboard,
  'crypto': ()=>pageCryptoFamily('crypto','Crypto','Seluruh cryptocurrency dengan data lengkap', D.CRYPTO, [{label:'AI Rating',key:'aiRating',render:r=>ratingBadge(r.aiRating)}]),
  'bitcoin': ()=>pageAssetDeepDive(D.CRYPTO.find(a=>a.symbol==='BTC')),
  'ethereum': ()=>pageAssetDeepDive(D.CRYPTO.find(a=>a.symbol==='ETH')),
  'altcoin': pageAltcoin,
  'memecoin': pageMemecoin,
  'defi': ()=>pageCryptoFamily('defi','DeFi','Protokol keuangan terdesentralisasi', D.DEFI),
  'stablecoin': ()=>pageCryptoFamily('stablecoin','Stablecoin','Aset kripto berpatokan nilai stabil', D.STABLECOIN),
  'nft': ()=>pageCryptoFamily('nft','NFT','Koleksi non-fungible token teratas', D.NFT),
  'dex': ()=>pageCryptoFamily('dex','DEX','Exchange terdesentralisasi', D.DEX),
  'cex': ()=>pageCryptoFamily('cex','CEX','Token exchange tersentralisasi', D.CEX),
  'forex': pageForex,
  'saham': pageSaham,
  'etf': pageEtf,
  'obligasi': pageObligasi,
  'indeks': pageIndeks,
  'komoditas': ()=>pageCommoditySet('Komoditas','Logam, energi & bahan baku global', D.COMMODITIES),
  'logam-mulia': ()=>pageCommoditySet('Logam Mulia','Emas, Perak, Platinum & Palladium', D.COMMODITIES.filter(c=>['Gold','Silver','Platinum','Palladium'].includes(c.name))),
  'energi': ()=>pageCommoditySet('Energi','Minyak, gas & sumber energi global', D.COMMODITIES.filter(c=>['Natural Gas','Crude Oil WTI','Brent Oil'].includes(c.name))),
  'pertanian': ()=>pageCommoditySet('Pertanian','Komoditas hasil pertanian global', D.PERTANIAN),
  'pangan': ()=>pageCommoditySet('Pangan','Harga pangan pokok', D.PANGAN),
  'industri': ()=>pageCommoditySet('Industri','Indeks & harga sektor industri', D.INDUSTRI),
  'ekonomi-dunia': pageEkonomiDunia,
  'heatmap': pageHeatmap,
  'trending': ()=>pageSortedList('Trending','socialScore',-1,'Berdasarkan Social Score'),
  'top-gainers': ()=>pageSortedList('Top Gainers','chg.24h',-1,'Kenaikan Tertinggi 24H'),
  'top-losers': ()=>pageSortedList('Top Losers','chg.24h',1,'Penurunan Terbesar 24H'),
  'new-listings': pageNewListings,
  'ai-analysis': pageAiAnalysis,
  'screener': pageScreener,
  'watchlist': pageWatchlist,
  'portfolio': pagePortfolio,
  'economic-calendar': pageEconomicCalendar,
  'earnings-calendar': pageEarningsCalendar,
  'ipo-calendar': pageIpoCalendar,
  'news': pageNews,
  'alert-center': pageAlertCenter,
  'settings': pageSettings,
};

function render(route){
  const fn = ROUTES[route] || pageDashboard;
  app.innerHTML = fn();
  $$('.nav-item').forEach(el=> el.classList.toggle('active', el.dataset.route===route));
  // post-render hooks
  if(route==='bitcoin'||route==='ethereum'){
    const sym = route==='bitcoin'?'BTC':'ETH';
    const asset = D.CRYPTO.find(a=>a.symbol===sym);
    requestAnimationFrame(()=> drawCandles($('#dive-chart'), genCandles(asset.price,90)));
  }
  if(route==='ai-analysis'){
    $('#aiResult').innerHTML = renderAiResult($('#ai-select').value);
  }
  document.getElementById('mainScroll')?.scrollTo(0,0);
  window.scrollTo(0,0);
  // close mobile sidebar after nav
  if(window.innerWidth<=900) closeSidebar();
}

/* ==========================================================================
   EVENT DELEGATION
   ========================================================================== */
document.addEventListener('click', (e)=>{
  const starEl = e.target.closest('[data-star]');
  if(starEl){ toggleWatch(starEl.dataset.star); render(location.hash.slice(2)||'dashboard'); return; }

  const th = e.target.closest('th[data-sort]');
  if(th && th.dataset.sort){
    const wrap = th.closest('.table-wrap');
    const tid = wrap.dataset.tid;
    const reg = tableRegistry[tid];
    if(!reg) return;
    const key = th.dataset.sort;
    const dir = wrap.dataset.dir==='1'? -1: 1;
    wrap.dataset.dir = String(dir);
    const sorted = sortData(reg.data, key, dir);
    reg.data = sorted;
    wrap.innerHTML = tableInnerHtml(sorted, reg.cols);
    return;
  }

  if(e.target.id==='sf-apply') { applyScreener(); return; }
  if(e.target.id==='reset-data'){
    if(confirm('Hapus semua watchlist, portfolio, alert, dan preferensi tersimpan di perangkat ini?')){
      localStorage.clear(); watchlist=new Set(); portfolio=[]; alerts=[]; settings={theme:'dark',currency:'USD',lang:'id'};
      toast('Semua data lokal telah direset'); render('settings');
    }
    return;
  }
  if(e.target.id==='pf-add'){
    const id = $('#pf-asset').value, amount=Number($('#pf-amount').value), price=Number($('#pf-price').value);
    if(!amount||!price){ toast('Isi jumlah & harga beli','err'); return; }
    const a = D.ALL_ASSETS.find(x=>x.id===id);
    portfolio.push({holdingId:'h'+Date.now()+Math.floor(Math.random()*1000), id, name:a.name, symbol:a.symbol, amount, buyPrice:price});
    Store.set('portfolio',portfolio); toast('Holding ditambahkan'); render('portfolio');
    return;
  }
  const pfRemove = e.target.closest('[data-pf-remove]');
  if(pfRemove){ portfolio = portfolio.filter(p=> p.holdingId!==pfRemove.dataset.pfRemove); Store.set('portfolio',portfolio); toast('Holding dihapus'); render('portfolio'); return; }

  if(e.target.id==='al-add'){
    const asset=$('#al-asset').value, condition=$('#al-cond').value, value=Number($('#al-value').value);
    if(!value){ toast('Isi nilai target','err'); return; }
    alerts.push({id:'al'+Date.now(), asset, condition, value});
    Store.set('alerts',alerts); toast('Alert dibuat'); render('alert-center');
    return;
  }
  const alRemove = e.target.closest('[data-al-remove]');
  if(alRemove){ alerts = alerts.filter(a=>a.id!==alRemove.dataset.alRemove); Store.set('alerts',alerts); render('alert-center'); return; }

  const newsCat = e.target.closest('[data-newscat]');
  if(newsCat){ newsFilter = newsCat.dataset.newscat; render('news'); return; }

  if(e.target.id==='theme-toggle'){ e.target.classList.toggle('on'); toast('Preferensi tema disimpan (dark mode tetap direkomendasikan)'); return; }

  const tf = e.target.closest('[data-tf]');
  if(tf){ $$('.tf-row .chip').forEach(c=>c.classList.remove('active')); tf.classList.add('active'); return; }

  if(e.target.closest('#hamburger')){ toggleSidebar(); return; }
  if(e.target.closest('#overlay')){ closeSidebar(); return; }

  if(e.target.dataset.export){
    toast('Menyiapkan file CSV untuk diunduh...');
    const key = e.target.dataset.export;
    exportCSV(key);
    return;
  }
});

document.addEventListener('change', (e)=>{
  if(e.target.id==='ai-select'){ $('#aiResult').innerHTML = renderAiResult(e.target.value); }
  if(e.target.id==='set-currency'){ settings.currency=e.target.value; Store.set('settings',settings); toast('Mata uang diperbarui'); }
});

document.addEventListener('input', (e)=>{
  if(e.target.id==='globalSearch'){ doGlobalSearch(e.target.value); }
});

function exportCSV(key){
  const map = {crypto:D.CRYPTO, altcoin:D.ALTCOIN, memecoin:D.MEMECOIN, defi:D.DEFI, stablecoin:D.STABLECOIN, nft:D.NFT, dex:D.DEX, cex:D.CEX};
  const data = map[key]||[];
  if(!data.length) return;
  const headers = ['name','symbol','price','chg24h','volume','mcap'];
  const rows = data.map(a=>[a.name,a.symbol,a.price,a.chg['24h'],a.volume,a.mcap].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href=url; link.download=`nexus-${key}.csv`; link.click();
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   GLOBAL SEARCH
   ========================================================================== */
const SEARCH_INDEX = [
  ...D.ALL_ASSETS.map(a=>({id:a.id, name:a.name, symbol:a.symbol, cat:a.category, route:a.category, logo:a.logoLetter})),
  ...D.STOCKS.map(s=>({id:s.id, name:s.name, symbol:s.symbol, cat:'Saham', route:'saham', logo:s.symbol.slice(0,2)})),
  ...D.FOREX.map(f=>({id:f.id, name:f.pair, symbol:f.pair, cat:'Forex', route:'forex', logo:f.pair.slice(0,2)})),
  ...D.INDICES.map(i=>({id:i.id, name:i.name, symbol:i.symbol, cat:'Indeks', route:'indeks', logo:i.symbol.slice(0,2)})),
  ...D.COMMODITIES.map(c=>({id:c.id, name:c.name, symbol:c.unit, cat:'Komoditas', route:'komoditas', logo:c.name.slice(0,2)})),
];
function doGlobalSearch(q){
  const box = $('#searchResults');
  if(!q){ box.style.display='none'; return; }
  const ql = q.toLowerCase();
  const results = SEARCH_INDEX.filter(a=> a.name.toLowerCase().includes(ql) || a.symbol.toLowerCase().includes(ql)).slice(0,8);
  if(!results.length){ box.innerHTML = `<div class="page-sub" style="padding:12px">Tidak ditemukan.</div>`; box.style.display='block'; return; }
  box.innerHTML = results.map(a=>`
    <div class="search-result-item" data-goto="${a.route}" style="display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;border-bottom:1px solid var(--border-soft)">
      <span class="asset-logo">${a.logo}</span><div><div class="asset-name">${a.name}</div><div class="asset-sym">${a.symbol} · ${a.cat}</div></div>
    </div>`).join('');
  box.style.display='block';
}
document.addEventListener('click',(e)=>{
  const goto = e.target.closest('[data-goto]');
  if(goto){ location.hash = '#/'+goto.dataset.goto; $('#searchResults').style.display='none'; $('#globalSearch').value=''; }
  else if(!e.target.closest('.search-wrap')){ const sr=$('#searchResults'); if(sr) sr.style.display='none'; }
});

/* ==========================================================================
   SIDEBAR TOGGLE / CLOCK / ROUTING BOOTSTRAP
   ========================================================================== */
function toggleSidebar(){ $('#sidebar').classList.toggle('open'); $('#overlay').classList.toggle('show'); }
function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); }

function tickClock(){
  const el = $('#clock'); if(!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) + ' WIB';
}

window.addEventListener('hashchange', ()=> render(location.hash.slice(2)||'dashboard'));
window.addEventListener('resize', ()=>{ const c=$('#dive-chart'); if(c) drawCandles(c, genCandles(D.CRYPTO[0].price,90)); });

function init(){
  buildSidebar();
  buildTicker();
  setInterval(tickClock,1000); tickClock();
  if(!location.hash) location.hash = '#/dashboard';
  render(location.hash.slice(2)||'dashboard');
  // gentle live jitter on ticker to simulate realtime feel
  setInterval(buildTicker, 8000);
}
init();
