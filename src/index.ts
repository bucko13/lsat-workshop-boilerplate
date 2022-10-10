import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { protectedRoutes } from './protected'

const app = express()
const port = 3000

// middleware
app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use((req: Request, resp: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.get('/', (req: Request, res: Response) => {
  res.send(
    'Welcome to the entrypoint for the boltwall boilerplate project. Try and access /protected for a route protected by boltwall.',
  )
})

app.use('/protected', protectedRoutes)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
