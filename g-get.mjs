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


//node --experimental-modules g-get.mjs
