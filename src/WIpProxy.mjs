import axios from 'axios'
import https from 'https'
import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import each from 'lodash-es/each.js'
import map from 'lodash-es/map.js'
import trim from 'lodash-es/trim.js'
import values from 'lodash-es/values.js'
import evem from 'wsemi/src/evem.mjs'
import sep from 'wsemi/src/sep.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import ispint from 'wsemi/src/ispint.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import cint from 'wsemi/src/cint.mjs'
import waitFun from 'wsemi/src/waitFun.mjs'
import provideServer from './provideServer.mjs'


/**
 * 抓取代理伺服器
 *
 * @class
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.src='https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&anonymity=all'] 輸入取得代理伺服器API字串，預設'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&anonymity=all'
 * @param {String} [opt.tar='https://httpbin.org/ip'] 輸入檢測目標網址字串，預設'https://httpbin.org/ip'
 * @param {Integer} [opt.timeGetProxies=30*1000] 輸入輪循抓取代理伺服器時間間隔整數，單位ms，預設30*1000
 * @param {Integer} [opt.timeTestProxies=60*1000] 輸入輪循測試代理伺服器時間間隔整數，單位ms，預設60*1000
 * @param {Boolean} [opt.withServer=false] 輸入是否創建供數據供給伺服器布林值，預設false
 * @param {Integer} [opt.serverPort=8080] 輸入創建伺服器所用port整數，預設8080
 * @param {String} [opt.serverApiName='getProxies'] 輸入供給數據API名稱字串，預設'getProxies'
 * @param {Array} [opt.serverCorsOrigins=['*']] 輸入允許跨域網域陣列，若給予['*']代表允許全部，預設['*']
 * @returns {Object} 回傳事件物件，提供函數getProxies，可監聽事件getRawProxies、add、delete、change
 * @example
 *
 * import _ from 'lodash-es'
 * import wip from './src/WIpProxy.mjs'
 *
 * let wo = wip({
 *     // tar: `https://www.google.com`,
 *     withServer: true,
 *     serverPort: 9000,
 *     serverCorsOrigins: ['*'],
 * })
 * wo.on('getRawProxies', (prxsRaw) => {
 *     console.log(`已抓取公開代理共 ${_.size(prxsRaw)} 個...`)
 * })
 * wo.on('add', (p, proxies) => {
 *     // console.log('新加入代理', { host: p.host, port: p.port }, _.map(proxies, 'proxy'))
 * })
 * wo.on('delete', (p, proxies) => {
 *     // console.log('刪除代理', { host: p.host, port: p.port }, _.map(proxies, 'proxy'))
 * })
 * wo.on('change', (proxies) => {
 *     // console.log(`有效代理`, _.map(proxies, 'proxy'))
 *     console.log(`已檢測有效代理共 ${_.size(proxies)} 個...`)
 * })
 *
 * //browser view: http://localhost:9000/getProxies
 *
 */
function WIpProxy(opt = {}) {

    //src
    let src = get(opt, 'src', '')
    if (!isestr(src)) {
        src = 'https://api.proxyscrape.com/v2/?request=displayproxies' +
        `&protocol=http` +
        // `&protocol=https` +
        `&timeout=5000` +
        // `&country=${join(['tw', 'cn', 'hk', 'jp', 'kr', 'sg', 'my', 'in', 'id', 'th', 'vn'])}` +
        // `&ssl=yes` +
        `&anonymity=all`
    }

    //tar
    let tar = get(opt, 'tar', '')
    if (!isestr(tar)) {
        tar = 'https://httpbin.org/ip' //'https://www.google.com'
    }

    //timeGetProxies
    let timeGetProxies = get(opt, 'timeGetProxies')
    if (!ispint(timeGetProxies)) {
        timeGetProxies = 30 * 1000 //30s
    }
    timeGetProxies = cint(timeGetProxies)

    //timeTestProxies
    let timeTestProxies = get(opt, 'timeTestProxies')
    if (!ispint(timeTestProxies)) {
        timeTestProxies = 60 * 1000 //1min
    }
    timeTestProxies = cint(timeTestProxies)

    //withServer
    let withServer = get(opt, 'withServer')
    if (!isbol(withServer)) {
        withServer = false
    }

    //serverPort
    let serverPort = get(opt, 'serverPort')
    if (!ispint(serverPort)) {
        serverPort = 8080
    }
    serverPort = cint(serverPort)

    //serverApiName
    let serverApiName = get(opt, 'serverApiName')
    if (!isestr(serverApiName)) {
        serverApiName = 'getProxies'
    }

    //serverCorsOrigins
    let serverCorsOrigins = get(opt, 'serverCorsOrigins', [])
    if (!isearr(serverCorsOrigins)) {
        serverCorsOrigins = ['*']
    }

    //prxsRaw, kpPrx
    let prxsRaw = []
    let kpPrx = {}

    async function _getProxiesCore(src) {
        let ps = []

        try {

            //res
            let res = await axios.get(src)

            //c
            let c = res.data
            // console.log('c', c)

            //sep
            let ss = sep(c, '\n')
            // console.log('ss', ss)

            //ps
            ps = map(ss, (v) => {
                let [host, port] = v.split(':')
                port = cint(port)
                return {
                    proxy: v,
                    host,
                    port,
                }
            })
            // console.log('ps', ps)

        }
        catch (err) {
            console.log('_getProxiesCore catch', err.message)
        }
        // console.log('ps', ps)

        return ps
    }

    async function _getProxies() {
        // console.log('call getProxies...')
        prxsRaw = await _getProxiesCore(src)
            .catch(() => {})
        // console.log('call getProxies fin')
        ev.emit('getRawProxies', prxsRaw)
    }

    async function _testProxyCore(host, port, url) {

        //ret
        let ret = (state, msg) => {
            return {
                state,
                msg,
                p: {
                    proxy: `${host}:${port}`,
                    host,
                    port,
                },
            }
        }

        //r
        let r = {}
        try {

            //agent
            let agent = new https.Agent({ rejectUnauthorized: false }) //避免證書錯誤中止

            //get
            let res = await axios.get(url, {
                proxy: {
                    host,
                    port,
                    protocol: 'http',
                },
                httpsAgent: agent,
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
            })

            if (res.status === 200) {
                r = ret('success', res.data)
            }
            else {
                r = ret('error', `status[${res.status}] error`)
            }

        }
        catch (err) {
            r = ret('error', trim(err.message))
            // if (r.msg.indexOf(`ssl3_get_record`) >= 0) {
            //     r.msg = `ssl3_get_record error`
            // }
        }
        // console.log(r)

        return r
    }

    async function _testProxiesCore(prxs) {

        //pms
        let pms = map(prxs, (p) => {
            let pm = _testProxyCore(p.host, p.port, tar)
            return pm
        })

        //rrs, allSettled
        let rrs = await Promise.allSettled(pms)
        // console.log('rrs', rrs)

        //psValid, psInvalid
        let psValid = []
        let psInvalid = []
        each(rrs, (v) => {
            let status = get(v, 'status', '')
            let b1 = status === 'fulfilled'
            let state = get(v, 'value.state', '')
            let b2 = state === 'success'
            let b = b1 && b2
            let p = get(v, 'value.p', null)
            if (b) {
                psValid.push(p)
            }
            else {
                psInvalid.push(p)
            }
        })

        return {
            psValid,
            psInvalid,
        }
    }

    async function _testProxies() {
        // console.log('call testProxies...')
        let r = await _testProxiesCore(prxsRaw)
        each(r.psValid, (p) => {
            kpPrx[p.proxy] = p
            ev.emit('add', p, values(kpPrx))
        })
        each(r.psInvalid, (p) => {
            delete kpPrx[p.proxy]
            ev.emit('delete', p, values(kpPrx))
        })
        ev.emit('change', values(kpPrx))
        // console.log('call testProxies fin')
    }

    async function getProxies() {
        let vs
        await waitFun(() => {
            vs = values(kpPrx)
            return size(vs) > 0
        })
        return vs
    }

    //ev
    let ev = evem()

    //取得代理清單
    if (true) {
        _getProxies()
        setInterval(() => {
            _getProxies()
        }, timeGetProxies)
    }

    //過濾出有效代理清單, 延遲3s觸發, 給時間抓取
    setTimeout(() => {
        _testProxies()
        setInterval(() => {
            _testProxies()
                .catch(() => {})
        }, timeTestProxies)
    }, 3000)

    //withServer
    if (withServer) {
        provideServer(getProxies, {
            port: serverPort,
            apiName: serverApiName,
            corsOrigins: serverCorsOrigins,
        })
    }

    //save
    ev.getProxies = getProxies

    return ev
}


export default WIpProxy
