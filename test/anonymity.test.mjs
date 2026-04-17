import assert from 'assert'
import axios from 'axios'
import https from 'https'
import wip from '../src/WIpProxy.mjs'


describe('anonymity (elite + anonymityCheck)', function() {
    this.timeout(240 * 1000) //4min, 因為getProxiesOnce加上獨立leak驗證本身就耗時

    let myIp = ''
    let ps = []

    before(async function() {

        //取本機真實公網IP
        try {
            let r = await axios.get('https://httpbin.org/ip', { timeout: 10000 })
            myIp = r.data?.origin || ''
        }
        catch (err) {
            this.skip()
        }
        if (!myIp) {
            this.skip()
        }

        //預設設定已是anonymity=elite且啟用anonymityCheck, 走完整過濾路徑
        let wo = wip({})
        ps = await wo.getProxiesOnce()

    })

    it('no returned proxy should leak real IP via httpbin origin', async function() {
        if (ps.length === 0) {
            this.skip()
        }

        let agent = new https.Agent({ rejectUnauthorized: false })
        let sample = ps.slice(0, 30)
        let pms = sample.map(async (p) => {
            try {
                let res = await axios.get('https://httpbin.org/ip', {
                    proxy: { host: p.host, port: p.port, protocol: 'http' },
                    httpsAgent: agent,
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                    },
                    validateStatus: () => true,
                })
                if (res.status !== 200) {
                    return { proxy: p.proxy, ok: true, reason: 'non-200, ignored' }
                }
                let origin = res.data?.origin
                if (typeof origin !== 'string') {
                    return { proxy: p.proxy, ok: true, reason: 'non-json, ignored' }
                }
                //回傳origin含本機真實IP即代表該代理洩漏
                let leaks = origin.indexOf(myIp) >= 0
                return { proxy: p.proxy, ok: !leaks, origin }
            }
            catch (err) {
                //網路錯誤不算洩漏, 直接放行
                return { proxy: p.proxy, ok: true, reason: err.message }
            }
        })
        let rrs = await Promise.all(pms)
        let leaked = rrs.filter((r) => !r.ok)

        assert.strictEqual(
            leaked.length, 0,
            `expected 0 proxies to leak real IP, got ${leaked.length}: ` +
            leaked.slice(0, 5).map((r) => `${r.proxy} (origin=${r.origin})`).join('; ')
        )
    })

    it('no returned proxy should carry X-Forwarded-For / Via when viewed from target', async function() {
        if (ps.length === 0) {
            this.skip()
        }

        let LEAK_IP_HEADERS = [
            'x-forwarded-for', 'x-real-ip', 'x-client-ip', 'client-ip',
            'true-client-ip', 'cf-connecting-ip', 'forwarded',
            'x-originating-ip', 'x-cluster-client-ip',
        ]
        let LEAK_PROXY_HEADERS = [
            'via', 'proxy-connection', 'x-proxy-id',
        ]

        let agent = new https.Agent({ rejectUnauthorized: false })
        let sample = ps.slice(0, 30)
        let pms = sample.map(async (p) => {
            try {
                let res = await axios.get('https://httpbin.org/headers', {
                    proxy: { host: p.host, port: p.port, protocol: 'http' },
                    httpsAgent: agent,
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                    },
                    validateStatus: () => true,
                })
                if (res.status !== 200 || typeof res.data?.headers !== 'object') {
                    return { proxy: p.proxy, ok: true, reason: 'ignored' }
                }
                let hs = {}
                for (let k in res.data.headers) {
                    hs[k.toLowerCase()] = String(res.data.headers[k])
                }
                let bad = []
                for (let k of LEAK_IP_HEADERS) {
                    if (k in hs && hs[k].indexOf(myIp) >= 0) {
                        bad.push(`${k}=${hs[k]}`)
                    }
                }
                for (let k of LEAK_PROXY_HEADERS) {
                    if (k in hs) {
                        bad.push(`${k}=${hs[k]}`)
                    }
                }
                return { proxy: p.proxy, ok: bad.length === 0, bad }
            }
            catch (err) {
                return { proxy: p.proxy, ok: true, reason: err.message }
            }
        })
        let rrs = await Promise.all(pms)
        let leaked = rrs.filter((r) => !r.ok)

        assert.strictEqual(
            leaked.length, 0,
            `expected 0 proxies with leaky headers, got ${leaked.length}: ` +
            leaked.slice(0, 5).map((r) => `${r.proxy} (${r.bad.join(',')})`).join('; ')
        )
    })

})
