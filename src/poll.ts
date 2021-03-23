import Codeship from './Codeship'
import {wait} from './wait'

export interface Options {
  client: Codeship
  log: (message: string) => void

  timeoutSeconds: number
  intervalSeconds: number
  sha: string
}

export const poll = async (options: Options): Promise<string> => {
  const {log, client, timeoutSeconds, intervalSeconds, sha} = options

  let now = new Date().getTime()
  const deadline = now + timeoutSeconds * 1000

  const accessToken = await client.getAccessToken()

  log(`Authenticating on CodeShip's API...`)

  while (now <= deadline) {
    log(`Retrieving check runs on CodeShip's API...`)

    const result = await client.getCodeShipBuilds(accessToken)

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const buildsForCommit = result.builds.filter((build: any) =>
      build.commit_sha.startsWith(sha)
    )

    log(`Retrieved ${buildsForCommit.length} check runs for commit ${sha}`)

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
