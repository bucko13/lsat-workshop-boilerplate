import { boltwall, TIME_CAVEAT_CONFIGS } from 'boltwall'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { Caveat, getCaveatsFromMacaroon, Lsat, Satisfier } from 'lsat-js'

const protectedRoutes = Router({ mergeParams: true })

// conditionally based on environment variable use a time based restriction
// where 1 satoshi gives 1 second of access
if (process.env.ENABLE_TIME_CONFIG) {
  console.log('*** Time-based restrictions have been enabled for this server ***')
  protectedRoutes.use(boltwall({ ...TIME_CAVEAT_CONFIGS, minAmount: 200 }) as RequestHandler)
} else {
  console.log('*** No time based restrictions on this server ***')
  protectedRoutes.use(boltwall() as RequestHandler)
}

const createServiceLevelSatisfier = (level: number): Satisfier => {
  return {
    condition: 'service',
    // make sure caveats are of increasing restrictiveness
    satisfyPrevious: (prev: Caveat, cur: Caveat) => prev.value >= cur.value,
    // you get access as long as you have a caveat that's of greater
    // or equal value to the path you're trying to hit
    satisfyFinal: (caveat: Caveat) => caveat.value <= level,
  }
}

protectedRoutes.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'These are the paths you can try and access with different service levels',
    s1: 'GET /service/1 - service level 1',
    s2: 'GET /service/2 - service level 2',
    s3: 'GET /service/3 - service level 3',
  })
})

// Middleware to make sure that any request to the service level has
// a caveat for services at least.
// Before we can let boltwall validate the service-level caveats on our macaroon
// we want to makes sure no request with with a service caveat can even get this far.
protectedRoutes.use('/service', (req: Request, res: Response, next: NextFunction) => {
  const token = req?.headers?.authorization
  // doing this for typescript
  if (!token) {
    return res.status(401).send("I don't know how you got here but you're not authorized")
  }
  const lsat = Lsat.fromToken(token)
  const caveats = getCaveatsFromMacaroon(lsat.baseMacaroon)

  let hasService = false
  for (const caveat of caveats) {
    if (caveat.condition === 'service') hasService = true
  }

  if (!hasService) return res.status(401).json({ error: { message: 'Unauthorized: LSAT invalid' } })
  console.log('Request made with a service level LSAT')
  next()
})

// we'll add three "service levels" where the caveat satisfiers will check for two things:
// 1. that there is a caveat that gives permission for that service level
// 2. that any additional service caveat is more restrictive than the previous. i.e.
// you can't give yourself more permission if you're given a service level of 1 and give
// yourself access to 2 or 3. You can only delegate lesser permissions
for (const level of [1, 2, 3]) {
  const config = {
    caveatSatisfiers: createServiceLevelSatisfier(level),
  }
  protectedRoutes.get(`/service/${level}`, boltwall(config) as RequestHandler, (req: Request, res: Response) => {
    res.send(`You've made it to service level ${level}!`)
  })
}

export { protectedRoutes }
