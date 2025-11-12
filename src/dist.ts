import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as hc from '@actions/http-client'
import os from 'os'

import semver from 'semver'

import * as path from 'path'

interface HeimInfo {
  version: semver.SemVer
  resolvedVersion: string
  arch: string
  platform: string
  downloadUrl: string
}

export interface HeimPaths {
  heimHome: string
  heimBin: string
  heimRuntime: string
  heimCli: string
}

export interface IHeimAsset {
  name: string
  download_url: string
}
export interface IHeimVersions {
  name: string
  version: string
  date: string
  assets: IHeimAsset[]
}

export class HeimDist {
  protected httpClient: hc.HttpClient
  protected arch = os.arch()
  protected platform = os.platform()
  protected baseUrl = 'https://cloud.heim.dev/heim'

  constructor(protected version: string) {
    this.httpClient = new hc.HttpClient('setup-heim', [], {
      allowRetries: true,
      maxRetries: 3
    })
  }

  public async setupHeim(): Promise<HeimPaths> {
    const heimInfo = await this.getHeimInfo()

    let toolPath = this.findToolInCache(heimInfo)
    if (toolPath) {
      core.info(`Found in cache @ ${toolPath}`)
    } else {
      toolPath = await this.downloadHeim(heimInfo)
    }

    let ext = ''
    if (heimInfo.platform === 'windows') {
      ext = '.exe'
    }

    const heimHome = path.join(toolPath, 'heim')
    const binPath = path.join(heimHome, 'bin')
    const heimRuntime = path.join(binPath, `heim-runtime${ext}`)
    const heimCli = path.join(binPath, `heim${ext}`)

    core.info('Appending to Path')
    core.addPath(binPath)
    core.info('Adding HEIM_HOME env')
    core.exportVariable('HEIM_HOME', heimHome)

    core.debug(
      `heimHome: ${heimHome}
            bin: ${binPath}
            runtime: ${heimRuntime}
            cli: ${heimCli}`
    )

    return <HeimPaths>{
      heimHome: heimHome,
      heimBin: binPath,
      heimRuntime: heimRuntime,
      heimCli: heimCli
    }
  }

  protected async getHeimInfo(): Promise<HeimInfo> {
    let arch: string

    if (this.arch === 'x64') {
      arch = 'x86_64'
    } else if (this.arch === 'arm64') {
      arch = 'aarch64'
    } else {
      throw new Error(`Unsupported architecture '${this.arch}'`)
    }

    let platform: string
    if (this.platform === 'win32') {
      platform = 'windows'
    } else if (this.platform === 'darwin') {
      platform = 'macos'
    } else if (this.platform === 'linux') {
      platform = 'linux'
    } else {
      core.debug(
        `Platform ${this.platform} does not have an offical build installing linux version`
      )
      platform = 'linux'
    }

    let version: semver.SemVer
    const inputVersion = this.version
    if (
      inputVersion === 'current' ||
      inputVersion === 'latest' ||
      inputVersion.startsWith('v')
    ) {
      const resp = await this.httpClient.getJson<IHeimVersions>(
        `https://cloud.heim.dev/heim/release?version=${inputVersion}`
      )
      if (resp.statusCode === 200 && resp.result != null) {
        version = semver.parse(resp.result.version, false, true)
      } else {
        throw new Error(`Unabled to find a version matching ${inputVersion}`)
      }
    } else {
      version = semver.parse(inputVersion, false, true)
    }

    const filename = `heim_${version.raw}_${arch}_${platform}`
    const file: string =
      platform === 'windows' ? `${filename}.zip` : `${filename}.tar.gz`
    const major = version.major
    const downloadUrl = `${this.baseUrl}/download?file=${file}&major=v${major}`

    return <HeimInfo>{
      version: version,
      resolvedVersion: version.raw,
      arch: arch,
      platform: platform,
      downloadUrl: downloadUrl
    }
  }

  protected findToolInCache(info: HeimInfo) {
    return tc.find('heim', info.resolvedVersion, info.arch)
  }

  protected async extractArchive(
    downloadPath: string,
    info: HeimInfo
  ): Promise<string> {
    core.info('Extracting...')
    let extractPath: string
    if (info.platform === 'windows') {
      extractPath = await tc.extractZip(downloadPath)
    } else {
      extractPath = await tc.extractTar(downloadPath)
    }

    core.info('Adding to the cache...')
    const toolPath = await tc.cacheDir(
      extractPath,
      'heim',
      info.resolvedVersion,
      info.arch
    )

    return toolPath
  }

  protected async downloadHeim(info: HeimInfo): Promise<string> {
    core.info(
      `Heim
            Version: ${info.version}
            Arch: ${info.arch}
            Platform: ${info.platform}`
    )
    core.debug(`DownloadUrl: ${info.downloadUrl}`)

    core.info('Starting download')
    const downloadPath = await tc.downloadTool(info.downloadUrl)

    core.info(`Download path: ${downloadPath}`)

    const toolPath = await this.extractArchive(downloadPath, info)
    core.info('Done')

    return toolPath
  }
}
