import {poll} from '../src/poll'

const client = {
  getAccessToken: jest.fn(),
  getCodeShipBuilds: jest.fn()
}

const run = () =>
  poll({
    client: client as any,
    log: () => {},
    sha: 'abcd',
    timeoutSeconds: 3,
    intervalSeconds: 0.1
  })

test('returns conclusion of completed check', async () => {
  client.getAccessToken.mockResolvedValue('accesstoken')
  client.getCodeShipBuilds.mockResolvedValue({
    builds: [
      ,
      {
        uuid: '5cf7230c-12d3-452a-a844-caa13e902524',
        commit_sha: 'abc4',
        status: 'error'
      },
      {
        uuid: '5cf7230c-12d3-452a-a844-caa13e902526',
        commit_sha: 'abcd',
        status: 'success'
      },
      {
        uuid: '5cf7230c-12d3-452a-a844-caa13e902525',
        commit_sha: 'abc2',
        status: 'error'
      }
    ]
  })

  const result = await run()

  expect(result).toBe('success')
  expect(client.getCodeShipBuilds).toHaveBeenCalledWith('accesstoken')
})

test('polls until check is completed', async () => {
  client.getAccessToken.mockResolvedValue('accesstoken')
  client.getCodeShipBuilds
    .mockResolvedValueOnce({
      builds: [
        {
          uuid: '5cf7230c-12d3-452a-a844-caa13e902526',
          commit_sha: 'abcd',
          status: 'testing'
        }
      ]
    })
    .mockResolvedValueOnce({
      builds: [
        {
          uuid: '5cf7230c-12d3-452a-a844-caa13e902526',
          commit_sha: 'abcd',
          status: 'testing'
        }
      ]
    })
    .mockResolvedValueOnce({
      builds: [
        {
          uuid: '5cf7230c-12d3-452a-a844-caa13e902526',
          commit_sha: 'abcd',
          status: 'error'
        }
      ]
    })

  const result = await run()

  expect(result).toBe('error')
  expect(client.getCodeShipBuilds).toHaveBeenCalledTimes(3)
})

test(`returns 'timed_out' if exceeding deadline`, async () => {
  client.getAccessToken.mockResolvedValue('accesstoken')
  client.getCodeShipBuilds.mockResolvedValue({
    builds: [
      {
        uuid: '5cf7230c-12d3-452a-a844-caa13e902526',
        commit_sha: 'abcd',
        status: 'testing'
      }
    ]
  })

  const result = await run()
  expect(result).toBe('timed_out')
})
