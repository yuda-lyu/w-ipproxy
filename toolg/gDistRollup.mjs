import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'
import getFiles from 'w-package-tools/src/getFiles.mjs'


let fdSrc = './src'
let fdTar = './dist'


rollupFiles({
    fns: 'WIpProxy.mjs',
    fdSrc,
    fdTar,
    hookNameDist: () => 'w-ipproxy',
    // nameDistType: 'kebabCase', //直接由hookNameDist給予
    globals: {
        '@hapi/hapi': '@hapi/hapi',
        '@hapi/inert': '@hapi/inert',
        'https': 'https',
    },
    external: [
        '@hapi/hapi',
        '@hapi/inert',
        'https',
    ],
})

