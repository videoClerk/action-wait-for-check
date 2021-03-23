import fetch from 'node-fetch'

class Codeship {
  codeshipAuth: string
  codeshipOrg: string
  codeshipProject: string

  constructor(
    codeshipAuth: string,
    codeshipOrg: string,
    codeshipProject: string
  ) {
    this.codeshipAuth = codeshipAuth
    this.codeshipOrg = codeshipOrg
    this.codeshipProject = codeshipProject
  }

  async getAccessToken(): Promise<string> {
    const basicAuth = new Buffer(this.codeshipAuth).toString('base64')
    const res = await fetch('https://api.codeship.com/v2/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`
      }
    })
    const json = await res.json()
    return json.accessToken
  }

  async getCodeShipBuilds(accessToken: string): Promise<any> {
    const res = await fetch(
      `https://api.codeship.com/v2/organizations/${this.codeshipOrg}/projects/${this.codeshipProject}/builds?per_page=100`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    const json = await res.json()
    return json
  }
}

export default Codeship
