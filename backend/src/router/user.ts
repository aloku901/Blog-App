import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { jwt, sign, verify } from 'hono/jwt'
import { signupInput, signinInput } from "@aloku901/blog-common";


export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();

userRouter.post('/signup', async (c) => {
    const body = await c.req.json();
    const {success} = signupInput.safeParse(body); 
    if(!success) {
      c.status(411);
      return c.json({
        message: "Input not Correct"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    //zod hashed 
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
        name: body.name,
      }
    })
  
    const token = await sign({id: user.id }, c.env.JWT_SECRET)
  
    return c.json({
      jwt: token
    })
  })
  
   userRouter.post('/signin', async (c) => {
      const body = await c.req.json();
      const {success} = signinInput.safeParse(body); 
      if(!success) {
        c.status(411);
        return c.json({
          message: "Input not Correct"
        })
      }
      const prisma = new PrismaClient({
          datasourceUrl: c.env?.DATABASE_URL	,
      }).$extends(withAccelerate());
  
      const user = await prisma.user.findUnique({
          where: {
              username: body.username,
        password: body.password,
          }
      });
  
      if (!user) { 
          c.status(403);
          return c.json({ error: "user not found" });
      }
  
      const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt });
  })
  