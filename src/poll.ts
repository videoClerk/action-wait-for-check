import Codeship from './Codeship'
import {wait} from './wait'

export interface Options {
  client: Codeship
  log: (message: string) => void

  timeoutSeconds: number
  intervalSeconds: number
  sha: string
  skipIfNotFound: boolean
}

export const poll = async (options: Options): Promise<string> => {
  const {
    log,
    client,
    timeoutSeconds,
    intervalSeconds,
    sha,
    skipIfNotFound
  } = options

  let now = new Date().getTime()
  const deadline = now + timeoutSeconds * 1000

  const accessToken = await client.getAccessToken()

  log(`Authenticating on CodeShip's API...`)

  while (now <= deadline) {
    log(`Retrieving check runs on CodeShip's API...`)

    const result = await client.getCodeShipBuilds(accessToken)

    if (result.errors) {
      log(result.errors)
      const error = new Error('Failed to get builds')
      throw error
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const buildsForCommit = result.builds.filter((build: any) =>
      build.commit_sha.startsWith(sha)
    )

    log(`Retrieved ${buildsForCommit.length} check runs for commit ${sha}`)
    if (buildsForCommit.length <= 0 && skipIfNotFound) {
      log(`No build for commit, skipping`)
      return 'skipped'
    }

    const completedCheck = buildsForCommit.find(
      (build: any) => build.status !== 'testing'
    )

    if (completedCheck) {
      log(
        `Found a completed check with id ${completedCheck.uuid} and conclusion ${completedCheck.status}`
      )
      return completedCheck.status
    }
    const pendingCheck = buildsForCommit.find(
      (build: any) => build.status === 'testing'
    )
    if (pendingCheck) {
      log(
        `Found a pending check with id ${pendingCheck.uuid} and conclusion ${pendingCheck.status}`
      )
    }

    log(
      `No completed checks with sha ${sha}, waiting for ${intervalSeconds} seconds...`
    )
    await wait(intervalSeconds * 1000)

    now = new Date().getTime()
  }

  log(
    `No completed checks after ${timeoutSeconds} seconds, exiting with conclusion 'timed_out'`
  )
  return 'timed_out'
}
