/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jest/no-conditional-expect */

import { jest } from '@jest/globals'

import * as core from '../__fixtures__/core.js'
import * as tc from '../__fixtures__/tool-cache.js'
import { HTTPError } from '@actions/tool-cache'
// import * as hc from "../__fixtures__/http-client.js";
import * as hc from '@actions/http-client'
// import * as hc from '../__fixtures__/http-client.js';

import osm, { arch, platform } from 'os'
import path from 'path'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/tool-cache', () => tc)
// jest.unstable_mockModule('@actions/http-client', () => hc);

const { run } = await import('../src/main.js')
const { HeimDist } = await import('../src/dist.js')

import dataJson from './data/data.json'
import { HeimPaths, IHeimVersions } from '../src/dist.js'
import { TypedResponse } from '@actions/http-client/lib/interfaces.js'

describe('heim-setup', () => {
  const debugPrints = false

  // node
  // @ts-error @typescript-eslint/no-explicit-any
  let os = {} as any

  let platformSpy: jest.Spied<typeof platform>
  let archSpy: jest.Spied<typeof arch>

  // @actions/core
  let addPathSpy: jest.Spied<typeof core.addPath>
  let exportVariableSpy: jest.Spied<typeof core.exportVariable>
  let getInputSpy: jest.Spied<typeof core.getInput>
  let setOutputSpy: jest.Spied<typeof core.setOutput>
  let infoSpy: jest.Spied<typeof core.info>
  let dbgSpy: jest.Spied<typeof core.debug>

  // @actions/tool-cache
  let findSpy: jest.Spied<typeof tc.find>
  let downloadSpy: jest.Spied<typeof tc.downloadTool>
  let cacheDirSpy: jest.Spied<typeof tc.cacheDir>
  let extractZipSpy: jest.Spied<typeof tc.extractZip>
  let extractTarSpy: jest.Spied<typeof tc.extractTar>

  // @actions/http-client
  let getJsonSpy: jest.Spied<typeof hc.HttpClient.prototype.getJson>

  beforeEach(() => {
    // node
    os = {}
    platformSpy = jest.spyOn(osm, 'platform')
    platformSpy.mockImplementation(() => {
      return os['platform']
    })
    archSpy = jest.spyOn(osm, 'arch')
    archSpy.mockImplementation(() => os['arch'])

    // @actions/core
    addPathSpy = jest.spyOn(core, 'addPath')
    addPathSpy.mockImplementation(() => {})
    exportVariableSpy = jest.spyOn(core, 'exportVariable')
    exportVariableSpy.mockImplementation(() => {})
    infoSpy = jest.spyOn(core, 'info')
    infoSpy.mockImplementation((msg: any) => {
      if (debugPrints) {
        console.log(`Info called with \n"${msg}"`)
      }
    })
    dbgSpy = jest.spyOn(core, 'debug')
    dbgSpy.mockImplementation((msg: any) => {
      if (debugPrints) {
        console.log(`Debug called with \n"${msg}"`)
      }
    })

    // @actions/tool-cache
    findSpy = jest.spyOn(tc, 'find')
    downloadSpy = jest.spyOn(tc, 'downloadTool')
    cacheDirSpy = jest.spyOn(tc, 'cacheDir')
    extractZipSpy = jest.spyOn(tc, 'extractZip')
    extractTarSpy = jest.spyOn(tc, 'extractTar')

    // @actions/http-client
    getJsonSpy = jest.spyOn(hc.HttpClient.prototype, 'getJson')
    getJsonSpy.mockImplementation(async () => {
      const data = <IHeimVersions>dataJson
      return <TypedResponse<IHeimVersions>>{
        statusCode: 200,
        result: data
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  // version: 1.1.1
  // version: v1
  // version: current,
  // version: invalid

  // windows x86_64 win32 x64
  // linux x86_64 linux x64
  // linux aarch64 linux arm64
  // macos aarch64 darwin arm64
  // linux x86_64 openbsd x64
  // linux aarch64 openbsd arm64
  // unsupported arch

  // extractZip
  // extractTar

  describe('main', () => {
    beforeEach(() => {
      getInputSpy = jest.spyOn(core, 'getInput')
      setOutputSpy = jest.spyOn(core, 'setOutput')
    })

    it('Complete version in cache', async () => {
      os.platform = 'linux'
      os.arch = 'x64'
      const version = '1.1.1'

      getInputSpy.mockImplementation(() => version)
      const toolPath = path.normalize(`/cache/heim/${version}/x86_64/`)
      findSpy.mockImplementation(() => toolPath)

      await run()

      expect(setOutputSpy).toHaveBeenNthCalledWith(
        1,
        'heimHome',
        path.normalize(`${toolPath}heim`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        2,
        'bin',
        path.normalize(`${toolPath}heim/bin`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        3,
        'runtime',
        path.normalize(`${toolPath}heim/bin/heim-runtime`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        4,
        'cli',
        path.normalize(`${toolPath}heim/bin/heim`)
      )
    })
    it('Complete version not in cache', async () => {
      os.platform = 'linux'
      os.arch = 'x64'
      const version = '1.1.1'

      getInputSpy.mockImplementation(() => version)
      const cachePath = path.normalize(`/cache/${version}/x86_64/heim/`)
      cacheDirSpy.mockImplementation(async () => cachePath)

      await run()

      const major = version.substring(0, version.indexOf('.'))
      expect(downloadSpy).toHaveBeenCalledWith(
        `https://cloud.heim.dev/heim/release/download?file=heim_${version}_x86_64_linux.tar.gz&major=v${major}`
      )

      expect(setOutputSpy).toHaveBeenNthCalledWith(
        1,
        'heimHome',
        path.normalize(`${cachePath}heim`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        2,
        'bin',
        path.normalize(`${cachePath}heim/bin`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        3,
        'runtime',
        path.normalize(`${cachePath}heim/bin/heim-runtime`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        4,
        'cli',
        path.normalize(`${cachePath}heim/bin/heim`)
      )
    })

    it('Major version in cache', async () => {
      os.platform = 'linux'
      os.arch = 'x64'
      const majorVersion = 'v1'
      const version = '1.1.1'

      getInputSpy.mockImplementation(() => majorVersion)
      const toolPath = path.normalize(`/cache/heim/${version}/x86_64/`)
      findSpy.mockImplementation(() => toolPath)

      await run()

      expect(setOutputSpy).toHaveBeenNthCalledWith(
        1,
        'heimHome',
        path.normalize(`${toolPath}heim`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        2,
        'bin',
        path.normalize(`${toolPath}heim/bin`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        3,
        'runtime',
        path.normalize(`${toolPath}heim/bin/heim-runtime`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        4,
        'cli',
        path.normalize(`${toolPath}heim/bin/heim`)
      )
    })
    it('Major version not in cache', async () => {
      os.platform = 'linux'
      os.arch = 'x64'
      const majorVersion = 'v1'
      const version = '1.1.1'

      getInputSpy.mockImplementation(() => majorVersion)
      const cachePath = path.normalize(`/cache/${version}/x86_64/heim/`)
      cacheDirSpy.mockImplementation(async () => cachePath)

      await run()

      expect(downloadSpy).toHaveBeenCalledWith(
        `https://cloud.heim.dev/heim/release/download?file=heim_${version}_x86_64_linux.tar.gz&major=${majorVersion}`
      )

      expect(setOutputSpy).toHaveBeenNthCalledWith(
        1,
        'heimHome',
        path.normalize(`${cachePath}heim`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        2,
        'bin',
        path.normalize(`${cachePath}heim/bin`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        3,
        'runtime',
        path.normalize(`${cachePath}heim/bin/heim-runtime`)
      )
      expect(setOutputSpy).toHaveBeenNthCalledWith(
        4,
        'cli',
        path.normalize(`${cachePath}heim/bin/heim`)
      )
    })

    it('Invalid version', async () => {
      os.platform = 'linux'
      os.arch = 'x64'
      const version = 'v01'

      getInputSpy.mockImplementation(() => version)
      getJsonSpy.mockImplementation(async () => {
        return <TypedResponse<IHeimVersions>>{
          statusCode: 404,
          result: null
        }
      })
      const setFailedSpy = jest.spyOn(core, 'setFailed')
      setFailedSpy.mockImplementation(() => {})

      await run()

      expect(setFailedSpy).toHaveBeenCalledWith(
        `Unabled to find a version matching ${version}`
      )
    })
  })

  describe('HeimDist', () => {
    it('Unsupported archeitecture', async () => {
      os.platform = 'linux'
      os.arch = 'ppc64'
      const version = '1.1.1'

      const heimDist = new HeimDist(version)
      await expect(heimDist.setupHeim()).rejects.toThrow(
        `Unsupported architecture '${os.arch}'`
      )
    })

    it('Unable to find a version matching', async () => {
      os.platform = 'linux'
      os.arch = 'x64'
      const version = 'v01'

      const heimDist = new HeimDist(version)
      getJsonSpy.mockImplementation(async () => {
        return <TypedResponse<IHeimVersions>>{
          statusCode: 404,
          result: null
        }
      })
      await expect(heimDist.setupHeim()).rejects.toThrow(
        `Unabled to find a version matching ${version}`
      )
    })

    it('Failed to download heim', async () => {
      os.platform = 'linux'
      os.arch = 'x64'
      const version = '1.1.1'

      downloadSpy.mockImplementation(() => {
        throw new HTTPError(404)
      })

      const heimDist = new HeimDist(version)

      await expect(heimDist.setupHeim()).rejects.toThrow(
        `Unexpected HTTP response: 404`
      )
    })

    it.each([
      ['win32', 'x64', '1.1.1', 'x86_64', '1.1.1'],
      ['linux', 'x64', '1.1.1', 'x86_64', '1.1.1'],
      ['openbsd', 'x64', '1.1.1', 'x86_64', '1.1.1'],
      ['openbsd', 'arm64', '1.1.1', 'aarch64', '1.1.1'],
      ['linux', 'arm64', '1.1.1', 'aarch64', '1.1.1'],
      ['darwin', 'arm64', '1.1.1', 'aarch64', '1.1.1'],

      ['win32', 'x64', 'v1', 'x86_64', '1.1.1'],
      ['linux', 'x64', 'v1', 'x86_64', '1.1.1'],
      ['openbsd', 'x64', 'v1', 'x86_64', '1.1.1'],
      ['openbsd', 'arm64', 'v1', 'aarch64', '1.1.1'],
      ['linux', 'arm64', 'v1', 'aarch64', '1.1.1'],
      ['darwin', 'arm64', 'v1', 'aarch64', '1.1.1'],

      ['win32', 'x64', 'current', 'x86_64', '1.1.1'],
      ['linux', 'x64', 'current', 'x86_64', '1.1.1'],
      ['openbsd', 'x64', 'current', 'x86_64', '1.1.1'],
      ['openbsd', 'arm64', 'current', 'aarch64', '1.1.1'],
      ['linux', 'arm64', 'current', 'aarch64', '1.1.1'],
      ['darwin', 'arm64', 'current', 'aarch64', '1.1.1']
    ])(
      `find tool in cache, os: %s, arch: %s, version: %s`,
      async (platform, arch, version, expArch, expVersion) => {
        os.platform = platform
        os.arch = arch
        const toolPath = path.normalize(`/cache/heim/${expVersion}/${expArch}/`)
        findSpy.mockImplementation(() => toolPath)

        const heimDist = new HeimDist(version)
        const heimPaths = await heimDist.setupHeim()

        let ext = ''
        if (platform === 'win32') {
          ext = '.exe'
        }

        expect(heimPaths).toStrictEqual(<HeimPaths>{
          heimHome: path.normalize(`${toolPath}heim`),
          heimBin: path.normalize(`${toolPath}heim/bin`),
          heimRuntime: path.normalize(`${toolPath}heim/bin/heim-runtime${ext}`),
          heimCli: path.normalize(`${toolPath}heim/bin/heim${ext}`)
        })

        if (version !== expVersion) {
          expect(getJsonSpy).toHaveBeenCalledWith(
            `https://cloud.heim.dev/heim/release?version=${version}`
          )
        }

        expect(infoSpy).toHaveBeenNthCalledWith(
          1,
          `Found in cache @ ${toolPath}`
        )
        expect(infoSpy).toHaveBeenNthCalledWith(2, 'Appending to Path')
        expect(addPathSpy).toHaveBeenCalledTimes(1)
        expect(infoSpy).toHaveBeenNthCalledWith(3, 'Adding HEIM_HOME env')
        expect(exportVariableSpy).toHaveBeenCalledTimes(1)
      }
    )

    it.each([
      ['win32', 'x64', '1.1.1', 'windows', 'x86_64', '1.1.1'],
      ['linux', 'x64', '1.1.1', 'linux', 'x86_64', '1.1.1'],
      ['openbsd', 'x64', '1.1.1', 'linux', 'x86_64', '1.1.1'],
      ['openbsd', 'arm64', '1.1.1', 'linux', 'aarch64', '1.1.1'],
      ['linux', 'arm64', '1.1.1', 'linux', 'aarch64', '1.1.1'],
      ['darwin', 'arm64', '1.1.1', 'macos', 'aarch64', '1.1.1'],

      ['win32', 'x64', 'v1', 'windows', 'x86_64', '1.1.1'],
      ['linux', 'x64', 'v1', 'linux', 'x86_64', '1.1.1'],
      ['openbsd', 'x64', 'v1', 'linux', 'x86_64', '1.1.1'],
      ['openbsd', 'arm64', 'v1', 'linux', 'aarch64', '1.1.1'],
      ['linux', 'arm64', 'v1', 'linux', 'aarch64', '1.1.1'],
      ['darwin', 'arm64', 'v1', 'macos', 'aarch64', '1.1.1'],

      ['win32', 'x64', 'current', 'windows', 'x86_64', '1.1.1'],
      ['linux', 'x64', 'current', 'linux', 'x86_64', '1.1.1'],
      ['openbsd', 'x64', 'current', 'linux', 'x86_64', '1.1.1'],
      ['openbsd', 'arm64', 'current', 'linux', 'aarch64', '1.1.1'],
      ['linux', 'arm64', 'current', 'linux', 'aarch64', '1.1.1'],
      ['darwin', 'arm64', 'current', 'macos', 'aarch64', '1.1.1']
    ])(
      'tool not in cache, os: %s, arch: %s, version: %s',
      async (platform, arch, version, expPlat, expArch, expVersion) => {
        os.platform = platform
        os.arch = arch

        const extractPath = '/cache/heim/'
        let downloadExt = 'tar.gz'
        let fileExt = ''
        if (platform === 'win32') {
          extractZipSpy.mockImplementation(async () => extractPath)
          downloadExt = 'zip'
          fileExt = '.exe'
        } else {
          extractTarSpy.mockImplementation(async () => extractPath)
        }
        const cachePath = path.normalize(
          `/cache/${expVersion}/${expArch}/heim/`
        )
        cacheDirSpy.mockImplementation(async () => cachePath)

        const heimDist = new HeimDist(version)
        const heimPaths = await heimDist.setupHeim()

        const major = expVersion.substring(0, expVersion.indexOf('.'))

        if (version !== expVersion) {
          expect(getJsonSpy).toHaveBeenCalledWith(
            `https://cloud.heim.dev/heim/release?version=${version}`
          )
        }

        expect(downloadSpy).toHaveBeenCalledWith(
          `https://cloud.heim.dev/heim/release/download?file=heim_${expVersion}_${expArch}_${expPlat}.${downloadExt}&major=v${major}`
        )
        expect(cacheDirSpy).toHaveBeenCalledWith(
          extractPath,
          'heim',
          expVersion,
          expArch
        )

        expect(heimPaths).toStrictEqual(<HeimPaths>{
          heimHome: path.normalize(`${cachePath}heim`),
          heimBin: path.normalize(`${cachePath}heim/bin`),
          heimRuntime: path.normalize(
            `${cachePath}heim/bin/heim-runtime${fileExt}`
          ),
          heimCli: path.normalize(`${cachePath}heim/bin/heim${fileExt}`)
        })
      }
    )
  })
})
