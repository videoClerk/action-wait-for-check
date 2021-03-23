import * as core from '@actions/core'
import {context} from '@actions/github'
import Codeship from './Codeship'
import {poll} from './poll'

async function run(): Promise<void> {
  try {
    const codeshipAuth = core.getInput('codeshipAuth', {required: true})
    const codeshipOrg = core.getInput('codeshipOrg', {required: true})
    const codeshipProject = core.getInput('codeshipProject', {required: true})

    const result = await poll({
      client: new Codeship(codeshipAuth, codeshipOrg, codeshipProject),
      log: msg => core.info(msg),

      sha: core.getInput('sha') || context.sha,

      timeoutSeconds: parseInt(core.getInput('timeoutSeconds') || '600'),
      intervalSeconds: parseInt(core.getInput('intervalSeconds') || '10')
    })

    core.setOutput('conclusion', result)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
