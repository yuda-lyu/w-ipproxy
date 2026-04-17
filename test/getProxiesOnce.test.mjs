import assert from 'assert'
import axios from 'axios'
import https from 'https'
import wip from '../src/WIpProxy.mjs'


describe('getProxiesOnce', function() {
    this.timeout(180 * 1000) //3min, 因為需要抓清單+檢測+獨立驗證

    let myIp = ''
    let ps = []

    before(async function() {

        //取本機真實公網IP (不走代理), 作為後續洩漏比對基準
        try {
            let r = await axios.get('https://httpbin.org/ip', { timeout: 10000 })
            myIp = r.data?.origin || ''
        }
        catch (err) {
            //網路異常則整組test跳過
            this.skip()
        }
        if (!myIp) {
            this.skip()
        }

        //取代理清單 (預設anonymity=elite + 匿名性檢查)
        let wo = wip({})
        ps = await wo.getProxiesOnce()

    })

    it('should return a non-empty array of proxy objects', function() {
        //若上游proxyscrape當下無代理供應, 放行以免CI誤報 (非本專案bug)
        if (ps.length === 0) {
            this.skip()
        }
        assert.ok(Array.isArray(ps))
        for (let p of ps) {
            assert.strictEqual(typeof p.host, 'string')
            assert.ok(p.host.length > 0)
            assert.strictEqual(typeof p.port, 'number')
            assert.ok(p.port > 0)
            assert.strictEqual(p.proxy, `${p.host}:${p.port}`)
        }
    })

    it('majority of returned proxies should be independently usable against httpbin', async function() {
        if (ps.length === 0) {
            this.skip()
        }

        //獨立再打一次httpbin.org/ip, 不倚賴內建的檢測結果
        let agent = new https.Agent({ rejectUnauthorized: false })
        let sample = ps.slice(0, 30) //取前30個避免長時間阻塞CI
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
                return res.status === 200
                    && typeof res.data === 'object'
                    && res.data !== null
                    && typeof res.data.origin === 'string'
            }
            catch (err) {
                return false
            }
        })
        let rrs = await Promise.all(pms)
        let okCount = rrs.filter((v) => v).length
        let ratio = okCount / rrs.length

        //要求至少50%仍可用, 免疫於個別代理剛好在測試間掛掉的flakiness
        assert.ok(
            ratio >= 0.5,
            `independent reachability ratio too low: ${okCount}/${rrs.length} (${(ratio * 100).toFixed(1)}%)`
        )
    })

})
