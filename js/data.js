/* ==========================================================================
   NEXUS TERMINAL — Mock Data Layer
   Semua angka di sini adalah data CONTOH (simulasi), bukan data pasar nyata.
   Dibuat deterministik (seeded) supaya tampilan konsisten setiap kali dibuka,
   dengan sedikit "live jitter" untuk mensimulasikan pergerakan realtime.
   ========================================================================== */

// ---- seeded RNG (mulberry32) ----
function makeRng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h+s.charCodeAt(i); h|=0;} return h; }

const NEXUS = (() => {

const rng = makeRng(20260707);
const rnd = (min,max)=> min + rng()*(max-min);
const pick = (arr)=> arr[Math.floor(rng()*arr.length)];
const round = (n,d=2)=> Number(n.toFixed(d));

function makeAsset(name, symbol, basePrice, opts={}){
  const mcapMult = opts.mcapMult ?? rnd(5e6, 4e11);
  return {
    id: symbol.toLowerCase()+'-'+hashStr(name),
    name, symbol,
    logoLetter: symbol.slice(0,2).toUpperCase(),
    price: basePrice,
    chg: {
      '1m': round(rnd(-1.5,1.5)), '5m': round(rnd(-2.5,2.5)), '15m': round(rnd(-3,3)),
      '1h': round(rnd(-4,4)), '4h': round(rnd(-6,6)),
      '24h': round(rnd(-18,22)), '7d': round(rnd(-30,40)), '30d': round(rnd(-45,80)),
    },
    volume: opts.volume ?? rnd(50_000, 900_000_000),
    liquidity: opts.liquidity ?? rnd(20_000, 60_000_000),
    fdv: opts.fdv ?? basePrice*rnd(1e6,1e10),
    mcap: mcapMult,
    circSupply: opts.circSupply ?? rnd(1e5,1e10),
    maxSupply: opts.maxSupply ?? (rng()>0.3? rnd(1e6,2.1e10): null),
    burn: round(rnd(0,18),1),
    holders: Math.floor(rnd(120,3_400_000)),
    exchange: opts.exchange ?? pick(['Binance','Uniswap V3','Raydium','PancakeSwap','Coinbase','OKX','Jupiter']),
    chain: opts.chain ?? pick(['Ethereum','Solana','BNB Chain','Base','Arbitrum','Polygon','TON']),
    contract: opts.contract ?? ('0x'+Math.abs(hashStr(name+symbol)).toString(16).padEnd(40,'0').slice(0,40)),
    audit: pick(['Passed','Passed','Passed','Unaudited','Flagged']),
    whaleActivity: pick(['Akumulasi Kuat','Akumulasi','Netral','Distribusi','Distribusi Kuat']),
    smartMoney: pick(['Masuk','Netral','Keluar']),
    devActivity: Math.floor(rnd(0,100)),
    socialScore: Math.floor(rnd(0,100)),
    aiRating: Math.floor(rnd(35,97)),
    hype: Math.floor(rnd(0,100)),
    community: Math.floor(rnd(0,100)),
    liquidityScore: Math.floor(rnd(0,100)),
    rugRisk: pick(['Rendah','Rendah','Sedang','Tinggi']),
    honeypot: rng()>0.92 ? 'Terdeteksi' : 'Aman',
    sniper: Math.floor(rnd(0,40)),
    sector: opts.sector ?? pick(['Layer 1','DeFi','Gaming','AI','Meme','Infrastructure','RWA']),
    country: opts.country ?? null,
    category: opts.category,
    watch: false,
  };
}

// ---------------- CRYPTO ----------------
const cryptoNames = [
  ['Bitcoin','BTC',68000],['Ethereum','ETH',3650],['Solana','SOL',168],['BNB','BNB',612],
  ['XRP','XRP',2.31],['Toncoin','TON',6.8],['Cardano','ADA',0.72],['Avalanche','AVAX',38.4],
  ['Chainlink','LINK',17.9],['Polkadot','DOT',7.4],['Tron','TRX',0.135],['Sui','SUI',3.9],
  ['Aptos','APT',9.2],['Near Protocol','NEAR',6.1],['Internet Computer','ICP',11.4],
  ['Cosmos','ATOM',8.7],['Injective','INJ',26.3],['Sei','SEI',0.62],['Celestia','TIA',7.9],
  ['Arbitrum','ARB',1.02],['Optimism','OP',2.44],['Render','RNDR',9.6],['The Graph','GRT',0.28],
  ['Filecoin','FIL',6.3],['Stacks','STX',2.1],
];
const CRYPTO = cryptoNames.map(([n,s,p])=> makeAsset(n,s,p,{category:'crypto', mcapMult: p*rnd(5e7,2e8)}));

const altcoinNames = [
  ['Aave','AAVE',162],['Uniswap','UNI',10.8],['Maker','MKR',2650],['Lido DAO','LDO',1.9],
  ['Fantom','FTM',0.71],['Algorand','ALGO',0.19],['Hedera','HBAR',0.11],['VeChain','VET',0.043],
  ['Kaspa','KAS',0.16],['Mantle','MNT',0.98],['Ondo','ONDO',1.31],['Jupiter','JUP',0.98],
  ['Pyth Network','PYTH',0.42],['Worldcoin','WLD',3.2],['Starknet','STRK',0.61],
];
const ALTCOIN = altcoinNames.map(([n,s,p])=> makeAsset(n,s,p,{category:'altcoin', sector:pick(['DeFi','Layer 2','Oracle','RWA','Infrastructure'])}));

const memeNames = [
  ['Dogecoin','DOGE',0.19],['Shiba Inu','SHIB',0.000024],['Pepe','PEPE',0.0000212],
  ['Bonk','BONK',0.0000341],['dogwifhat','WIF',2.1],['Floki','FLOKI',0.00021],
  ['Book of Meme','BOME',0.011],['Popcat','POPCAT',0.98],['Mog Coin','MOG',0.0000019],
  ['Brett','BRETT',0.089],['Turbo','TURBO',0.0067],['Cat in a Dogs World','MEW',0.0059],
];
const MEMECOIN = memeNames.map(([n,s,p])=> makeAsset(n,s,p,{category:'memecoin', mcapMult:p*rnd(1e9,4e10), sector:'Meme'}));

const defiNames = [
  ['Curve DAO','CRV',0.31],['Compound','COMP',54],['PancakeSwap','CAKE',2.4],
  ['GMX','GMX',31],['dYdX','DYDX',1.6],['Synthetix','SNX',1.9],['Convex Finance','CVX',3.1],
  ['Frax Share','FXS',4.2],['Balancer','BAL',3.6],['Yearn Finance','YFI',6800],
];
const DEFI = defiNames.map(([n,s,p])=> makeAsset(n,s,p,{category:'defi', sector:'DeFi'}));

const stableNames = [
  ['Tether','USDT',1.0002],['USD Coin','USDC',0.9998],['Dai','DAI',1.0001],
  ['First Digital USD','FDUSD',0.9999],['TrueUSD','TUSD',0.997],['PayPal USD','PYUSD',1.0003],
];
const STABLECOIN = stableNames.map(([n,s,p])=> {
  const a = makeAsset(n,s,p,{category:'stablecoin', mcapMult:rnd(1e9,1.1e11)});
  a.chg = {'1m':0,'5m':0.01,'15m':-0.01,'1h':0.02,'4h':-0.02,'24h':round(rnd(-0.1,0.1),3),'7d':round(rnd(-0.2,0.2),3),'30d':round(rnd(-0.3,0.3),3)};
  return a;
});

const nftNames = [
  ['Pudgy Penguins','PUDGY',14.2],['Bored Ape Yacht Club','BAYC',22.1],['DeGods','DEGOD',9.7],
  ['Azuki','AZUKI',5.3],['Milady','MIL',2.8],['CryptoPunks','PUNK',41.6],['Doodles','DOOD',1.9],
];
const NFT = nftNames.map(([n,s,p])=> makeAsset(n,s,p,{category:'nft', sector:'NFT'}));

const dexNames = [
  ['Uniswap','UNI',10.8],['PancakeSwap','CAKE',2.4],['Raydium','RAY',4.1],['Jupiter','JUP',0.98],
  ['Curve','CRV',0.31],['Orca','ORCA',3.7],['SushiSwap','SUSHI',1.1],['Trader Joe','JOE',0.42],
];
const DEX = dexNames.map(([n,s,p])=> makeAsset(n,s,p,{category:'dex', sector:'DEX'}));

const cexNames = [
  ['Binance Coin','BNB',612],['OKB','OKB',48.2],['Crypto.com Coin','CRO',0.11],
  ['KuCoin Token','KCS',9.8],['Gate Token','GT',7.1],['LEO Token','LEO',5.9],
];
const CEX = cexNames.map(([n,s,p])=> makeAsset(n,s,p,{category:'cex', sector:'Exchange'}));

// ---------------- FOREX ----------------
const forexList = [
  ['EUR/USD',1.0842],['GBP/USD',1.2701],['USD/JPY',157.34],['USD/CAD',1.3689],
  ['USD/CHF',0.8912],['AUD/USD',0.6621],['NZD/USD',0.6033],['USD/CNY',7.243],
  ['USD/SGD',1.3467],['USD/IDR',16210],['EUR/GBP',0.8536],['EUR/JPY',170.58],
  ['GBP/JPY',199.86],['USD/INR',83.42],['USD/KRW',1378.5],['USD/MXN',18.24],
  ['USD/ZAR',18.62],['USD/TRY',33.15],['USD/HKD',7.812],['AUD/JPY',104.18],
];
const FOREX = forexList.map(([pair,p])=>({
  id:'fx-'+hashStr(pair), pair, price:p,
  chg:{'24h':round(rnd(-1.4,1.4),2)},
  spread:round(rnd(0.1,2.4),1),
  atr:round(rnd(0.2,1.8),2), rsi:round(rnd(20,80),1), macd:round(rnd(-0.4,0.4),3),
  ema:round(p*rnd(0.995,1.005),4), sma:round(p*rnd(0.994,1.006),4),
  bb:round(p*rnd(0.99,1.01),4), vwap:round(p*rnd(0.996,1.004),4),
  fibo:round(p*rnd(0.97,1.03),4), pivot:round(p*rnd(0.995,1.005),4),
  aiTrend: pick(['Bullish Kuat','Bullish','Netral','Bearish','Bearish Kuat']),
  watch:false,
}));

// ---------------- SAHAM (STOCKS) ----------------
const stockList = [
  ['Apple Inc.','AAPL','NASDAQ',221.4],['Microsoft','MSFT','NASDAQ',452.8],['NVIDIA','NVDA','NASDAQ',138.6],
  ['Amazon','AMZN','NASDAQ',198.3],['Alphabet','GOOGL','NASDAQ',176.2],['Meta Platforms','META','NASDAQ',534.1],
  ['Tesla','TSLA','NASDAQ',241.9],['Berkshire Hathaway','BRK.B','NYSE',452.3],['JPMorgan Chase','JPM','NYSE',214.6],
  ['Visa','V','NYSE',276.4],['Bank Central Asia','BBCA','IDX',10250],['Bank Rakyat Indonesia','BBRI','IDX',4380],
  ['Telkom Indonesia','TLKM','IDX',3120],['Astra International','ASII','IDX',5025],
  ['Tencent Holdings','0700','HKEX',392.4],['Toyota Motor','7203','JPX',2841],
  ['Sony Group','6758','JPX',3102],['HSBC Holdings','HSBA','LSE',712.3],
  ['Samsung Electronics','005930','KOSPI',78900],['Alibaba Group','BABA','NYSE',82.7],
];
const STOCKS = stockList.map(([name,sym,exch,p])=>({
  id:'st-'+hashStr(sym+exch), name, symbol:sym, exchange:exch, price:p,
  chg24h: round(rnd(-5,6),2),
  mcap: p*rnd(2e8,3e10),
  pe: round(rnd(6,55),1), eps: round(p/rnd(8,40),2), dividend: round(rnd(0,4.2),2),
  beta: round(rnd(0.4,2.1),2), volume: Math.floor(rnd(1e5,9e7)),
  float: round(rnd(30,98),1), insider: round(rnd(0,25),1), institutional: round(rnd(10,85),1),
  aiRating: Math.floor(rnd(35,96)),
  watch:false,
}));

// ---------------- INDEKS DUNIA ----------------
const indexList = [
  ['S&P 500','SPX',5567.2],['NASDAQ Composite','IXIC',18342.6],['Dow Jones','DJI',40211.7],
  ['Nikkei 225','N225',39872.4],['DAX','DAX',18654.1],['FTSE 100','FTSE',8203.5],
  ['CAC 40','CAC',7821.9],['Hang Seng','HSI',18342.7],['Kospi','KOSPI',2789.4],
  ['IHSG','JKSE',7412.8],['ASX 200','ASX200',7845.3],['TSX Composite','TSX',22156.9],
];
const INDICES = indexList.map(([name,sym,p])=>({
  id:'idx-'+hashStr(sym), name, symbol:sym, price:p, chg24h: round(rnd(-2.2,2.2),2), chgYtd: round(rnd(-10,28),2),
}));

// ---------------- KOMODITAS ----------------
function commoditySet(list, cat){
  return list.map(([name,unit,p])=>({
    id:cat+'-'+hashStr(name), name, unit, category:cat, price:p,
    chg24h: round(rnd(-3,3.4),2), chg7d: round(rnd(-6,7),2),
  }));
}
const COMMODITIES = commoditySet([
  ['Gold','USD/oz',2412.5],['Silver','USD/oz',30.8],['Copper','USD/lb',4.52],
  ['Platinum','USD/oz',985.2],['Palladium','USD/oz',1021.4],['Nickel','USD/ton',18420],
  ['Aluminium','USD/ton',2510],['Iron Ore','USD/ton',108.3],['Steel','USD/ton',612],
  ['Lithium','USD/ton',13850],['Cobalt','USD/ton',26400],['Uranium','USD/lb',86.4],
  ['Natural Gas','USD/MMBtu',2.68],['Crude Oil WTI','USD/bbl',81.4],['Brent Oil','USD/bbl',84.9],
],'komoditas');

const PERTANIAN = commoditySet([
  ['Corn','USD/bu',4.42],['Rice','USD/cwt',15.8],['Wheat','USD/bu',5.61],['Coffee','USD/lb',2.24],
  ['Cocoa','USD/ton',7842],['Soybean','USD/bu',10.92],['Cotton','USD/lb',0.68],['Palm Oil','MYR/ton',3912],
  ['Rubber','JPY/kg',312],['Tea','USD/kg',2.85],['Sugar','USD/lb',0.187],
],'pertanian');

const PANGAN = commoditySet([
  ['Beras','IDR/kg',15200],['Gula','IDR/kg',17800],['Minyak Goreng','IDR/L',16400],
  ['Daging Sapi','IDR/kg',138000],['Ayam','IDR/kg',37500],['Telur','IDR/kg',29800],
  ['Susu','IDR/L',19500],['Jagung','IDR/kg',6200],['Kentang','IDR/kg',12100],
  ['Cabai','IDR/kg',48500],['Bawang Merah','IDR/kg',36200],['Gandum','IDR/kg',11400],
],'pangan');

const INDUSTRI = commoditySet([
  ['Semiconductor Index','pts',3842],['AI Chip Index','pts',5210],['EV Battery (Lithium-ion)','USD/kWh',115],
  ['Rare Earth Basket','pts',2140],['Solar Panel (poly-Si)','USD/kg',6.2],['Wind Turbine Steel','USD/ton',640],
  ['Textile Cotton Yarn','USD/kg',3.1],['Chemical Basket','pts',1980],['Construction Materials','pts',2210],
  ['Shipping (Baltic Dry)','pts',1842],['Aviation Fuel','USD/gal',2.41],['Automotive Steel','USD/ton',615],
],'industri');

// ---------------- OBLIGASI (BONDS) ----------------
const BONDS = [
  ['US 10Y Treasury','US10Y',4.42],['US 2Y Treasury','US2Y',4.71],['German 10Y Bund','DE10Y',2.51],
  ['Japan 10Y JGB','JP10Y',1.02],['Indonesia 10Y (SUN)','ID10Y',6.88],['UK 10Y Gilt','UK10Y',4.19],
  ['China 10Y Bond','CN10Y',2.28],
].map(([name,sym,yld])=>({id:'bd-'+hashStr(sym),name,symbol:sym,yield:yld,chg:round(rnd(-0.08,0.08),3)}));

// ---------------- ETF ----------------
const ETF = [
  ['SPDR S&P 500 ETF','SPY',556.2],['Invesco QQQ','QQQ',482.7],['iShares Bitcoin Trust','IBIT',38.6],
  ['Vanguard Total Stock','VTI',278.4],['ARK Innovation','ARKK',48.9],['Gold Shares ETF','GLD',224.1],
  ['iShares MSCI Emerging','EEM',43.2],
].map(([name,sym,p])=>({id:'etf-'+hashStr(sym),name,symbol:sym,price:p,chg24h:round(rnd(-2.5,2.5),2),aum:rnd(1e9,6e11)}));

// ---------------- EKONOMI DUNIA (macro) ----------------
const MACRO = [
  ['Amerika Serikat','US',2.8,3.1,5.25],['Uni Eropa','EU',0.9,2.4,3.75],['Tiongkok','CN',5.1,0.3,3.45],
  ['Jepang','JP',0.7,2.2,0.25],['Indonesia','ID',5.2,2.9,6.25],['Inggris','GB',0.6,2.6,5.0],
  ['India','IN',7.6,4.8,6.5],['Brazil','BR',2.3,4.2,10.5],
].map(([country,code,gdp,inflation,rate])=>({id:'mac-'+code,country,code,gdp,inflation,rate}));

// ---------------- NEWS ----------------
const newsCats = ['Crypto','Forex','Saham','AI','Teknologi','Ekonomi','Energi','Industri','Pertanian','Pangan'];
const newsTemplates = [
  n=>`${n} bergerak volatil di tengah sentimen risk-on pelaku pasar global`,
  n=>`Analis proyeksikan ${n} akan uji level resistensi kunci pekan ini`,
  n=>`Volume perdagangan ${n} melonjak seiring masuknya dana institusional`,
  n=>`Regulator tinjau ulang kerangka kebijakan terkait sektor ${n}`,
  n=>`Data terbaru tunjukkan tren jangka menengah ${n} mulai berbalik arah`,
  n=>`Pelaku pasar cermati katalis makro yang berpotensi pengaruhi ${n}`,
];
const NEWS = [];
for(let i=0;i<40;i++){
  const cat = newsCats[i % newsCats.length];
  const tmpl = newsTemplates[Math.floor(rng()*newsTemplates.length)];
  NEWS.push({
    id:'news-'+i, category:cat, title: tmpl(cat),
    source: pick(['Nexus Wire','Market Pulse','Global Desk','Chain Report','Macro Watch']),
    time: Math.floor(rnd(2,720)),
  });
}

// ---------------- CALENDARS ----------------
const ECON_CAL = ['CPI','GDP','PMI','NFP','Interest Rate Decision','FOMC Statement','ECB Rate Decision','BOJ Policy Rate','BI Rate Decision','PPI','Retail Sales']
  .map((ev,i)=>({
    id:'ec-'+i, event:ev, country:pick(['US','EU','ID','JP','GB','CN']),
    date: new Date(Date.now()+ (i-3)*86400000).toISOString().slice(0,10),
    impact: pick(['Tinggi','Sedang','Rendah']),
    forecast: round(rnd(-1,6),1), previous: round(rnd(-1,6),1),
  }));

const EARNINGS_CAL = STOCKS.slice(0,12).map((s,i)=>({
  id:'er-'+i, name:s.name, symbol:s.symbol, date:new Date(Date.now()+(i-2)*86400000).toISOString().slice(0,10),
  epsEst: round(rnd(0.5,6),2), epsPrev: round(rnd(0.4,5.5),2),
}));

const IPO_CAL = [
  ['Nexara Robotics','NXRA', 18.5],['Quantum Grid Energy','QGE',24.0],['Helios Biotech','HLBT',11.2],
  ['Orbital Data Systems','ODS',33.4],['BrightPay Fintech','BPAY',9.8],
].map(([name,sym,price],i)=>({id:'ipo-'+i,name,symbol:sym,price,date:new Date(Date.now()+(i+1)*3*86400000).toISOString().slice(0,10)}));

// ---------------- master list for global search / screener ----------------
const ALL_ASSETS = [
  ...CRYPTO, ...ALTCOIN, ...MEMECOIN, ...DEFI, ...STABLECOIN, ...NFT, ...DEX, ...CEX,
];

return {
  rng, rnd,
  CRYPTO, ALTCOIN, MEMECOIN, DEFI, STABLECOIN, NFT, DEX, CEX,
  FOREX, STOCKS, INDICES, COMMODITIES, PERTANIAN, PANGAN, INDUSTRI, BONDS, ETF, MACRO,
  NEWS, ECON_CAL, EARNINGS_CAL, IPO_CAL, ALL_ASSETS,
  fmt(n, opts={}){
    if(n===null||n===undefined||isNaN(n)) return '—';
    const abs=Math.abs(n);
    if(opts.compact && abs>=1000){
      const u=['','K','M','B','T'];
      let i=0, v=n;
      while(Math.abs(v)>=1000 && i<u.length-1){v/=1000;i++;}
      return v.toFixed(v<10?2:1)+u[i];
    }
    if(abs<0.01 && abs>0) return n.toFixed(8).replace(/0+$/,'').replace(/\.$/,'');
    if(abs<1) return n.toFixed(4);
    if(abs<1000) return n.toFixed(2);
    return n.toLocaleString('en-US',{maximumFractionDigits:2});
  },
  currency(n, cur='USD'){
    const symbols={USD:'$',IDR:'Rp ',EUR:'€'};
    return (symbols[cur]||'')+this.fmt(n,{compact:true});
  }
};
})();
