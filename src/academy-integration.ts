import axios from 'axios'

async function isDomainApproved(domain: string) {
  if (process.env.NAME === 'staging') {
    if (domain === 'app.staging.chesslang.com') return true
  }

  if (process.env.NAME === 'production') {
    if (domain === 'app.chesslang.com') return true
  }

  try {
    const result1 = await axios.post(
      `http://${process.env.NAME}.interservice.com/internal/academy/api/v1/integration/is-domain-approved`,
      { domain }
    )
    const result2 = await axios.post(
      `http://${process.env.NAME}.interservice.com/internal/academy/api/v1/integration/is-domain-approved`,
      { domain: domain.replace('www', '') }
    )

    if (result1.data.approved || result2.data.approved) {
      return true
    }

    return false
  } catch (err) {
    console.log('--> Domain Approval request error: ', err)
    throw err
  }
}

export async function approveDomains(opts: any, certs: any, cb: any) {
  if (certs) {
    opts.domains = certs.altnames
  } else {
    try {
      if (await isDomainApproved(opts.domain)) {
        opts.domains = [opts.domain]
        opts.email = 'support@shortcastle.com'
        opts.agreeTos = true
        opts.rsaKeySize = 2048
      } else {
        cb(new Error('Invalid domain access'))
        return
      }
    } catch (err) {
      cb(err)
    }
  }

  cb(null, { options: opts, certs })
}
