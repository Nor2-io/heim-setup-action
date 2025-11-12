import * as core from '@actions/core'
import { HeimDist } from './dist.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let version = core.getInput('version', { required: true })

    let heimDist = new HeimDist(version)
    let paths = await heimDist.setupHeim()

    core.setOutput('heimHome', paths.heimHome)
    core.setOutput('bin', paths.heimBin)
    core.setOutput('runtime', paths.heimRuntime)
    core.setOutput('cli', paths.heimCli)
  } catch (err) {
    // Fail the workflow run if an error occurs
    core.setFailed((err as Error).message)
  }
}
