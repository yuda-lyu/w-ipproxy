import wip from './src/WIpProxy.mjs'


let wo = wip({
    // tar: `https://www.google.com`,
})
let ps = await wo.getProxiesOnce()
console.log('ps', ps)


//node g-getOnce.mjs
