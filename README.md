# w-ipproxy
A crawler for proxies.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-ipproxy.svg?style=flat)](https://npmjs.org/package/w-ipproxy) 
[![license](https://img.shields.io/npm/l/w-ipproxy.svg?style=flat)](https://npmjs.org/package/w-ipproxy) 
[![npm download](https://img.shields.io/npm/dt/w-ipproxy.svg)](https://npmjs.org/package/w-ipproxy) 
[![npm download](https://img.shields.io/npm/dm/w-ipproxy.svg)](https://npmjs.org/package/w-ipproxy)
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-ipproxy.svg)](https://www.jsdelivr.com/package/npm/w-ipproxy)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-ipproxy/WIpProxy.html).

## Installation
### Using npm(ES6 module):
```alias
npm i w-ipproxy
```

#### Example for basic:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-ipproxy/blob/master/g-get.mjs)]
```alias
import _ from 'lodash-es'
import wip from './src/WIpProxy.mjs'

let wo = wip({
    // tar: `https://www.google.com`,
})
wo.on('getRawProxies', (prxsRaw) => {
    console.log(`已抓取公開代理共 ${_.size(prxsRaw)} 個...`)
})
wo.on('add', (p, proxies) => {
    // console.log('新加入代理', { host: p.host, port: p.port }, _.map(proxies, 'proxy'))
})
wo.on('delete', (p, proxies) => {
    // console.log('刪除代理', { host: p.host, port: p.port }, _.map(proxies, 'proxy'))
})
wo.on('change', (proxies) => {
    // console.log(`有效代理`, _.map(proxies, 'proxy'))
    console.log(`已檢測有效代理共 ${_.size(proxies)} 個...`)
})
```

#### Example for server:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-ipproxy/blob/master/g-srv.mjs)]
```alias
import _ from 'lodash-es'
import wip from './src/WIpProxy.mjs'

let wo = wip({
    // tar: `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`,
    withServer: true,
    serverPort: 9000,
    serverCorsOrigins: ['*'],
})
wo.on('getRawProxies', (prxsRaw) => {
    console.log(`已抓取公開代理共 ${_.size(prxsRaw)} 個...`)
})
wo.on('add', (p, proxies) => {
    // console.log('新加入代理', { host: p.host, port: p.port }, _.map(proxies, 'proxy'))
})
wo.on('delete', (p, proxies) => {
    // console.log('刪除代理', { host: p.host, port: p.port }, _.map(proxies, 'proxy'))
})
wo.on('change', (proxies) => {
    // console.log(`有效代理`, _.map(proxies, 'proxy'))
    console.log(`已檢測有效代理共 ${_.size(proxies)} 個...`)
})
//browser view: http://localhost:9000/getProxies
```

