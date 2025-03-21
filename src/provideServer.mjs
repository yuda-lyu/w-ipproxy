import Hapi from '@hapi/hapi'
import get from 'lodash-es/get.js'
import ispint from 'wsemi/src/ispint.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import cint from 'wsemi/src/cint.mjs'


function provideServer(fun, opt = {}) {

    //port
    let port = get(opt, 'port')
    if (!ispint(port)) {
        port = 8080
    }
    port = cint(port)

    //corsOrigins
    let corsOrigins = get(opt, 'corsOrigins', [])
    if (!isearr(corsOrigins)) {
        corsOrigins = ['*']
    }

    //apiName
    let apiName = get(opt, 'apiName')
    if (!isestr(apiName)) {
        apiName = 'getProxies'
    }

    //startServer
    let startServer = async () => {
        let server = Hapi.server({
            // host: 'localhost',
            port,
            routes: {
                cors: {
                    origin: corsOrigins, //Access-Control-Allow-Origin
                    credentials: false, //Access-Control-Allow-Credentials
                },
            },
        })

        //route
        server.route({
            method: 'GET',
            path: `/${apiName}`,
            handler: async () => {
                let proxies = await fun()
                return proxies
            },
        })

        //start
        await server.start()

        console.log(`Server running at: ${server.info.uri}`)
    }

    //startServer
    startServer()

}


export default provideServer
