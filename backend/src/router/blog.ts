import { createBlogInput, updateBlogInput } from "@aloku901/blog-common";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { decode, verify } from "hono/jwt";

export const blogRouter =  new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string,
    },
    Variables: {
        userId: string,

     }
}>();

blogRouter.use("/*", async (c, next) => {
    const authheader = c.req.header("authorization") || "";
    try {
        const user = await verify(authheader, c.env.JWT_SECRET);
        if(user) {
            c.set("userId", user.id);
            await next();
        } else {
            c.status(403);
            return c.json({
                message:"You are not logged in"
            })
        }
        next();
    } catch(e) {
        c.status(403);
            return c.json({
                message:"You are not logged in"
            })
    }
})

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const {success} = createBlogInput.safeParse(body);
    if(!success) {
        c.status(411);
        return c.json({
            message: "Inputs not Correct"
        })
    }
    const authorId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())

    const blog = await prisma.blog.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: Number(authorId)
        }
    })
    return c.json({
        id: blog.id
    })
  })
  
  blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const {success} = updateBlogInput.safeParse(body);
    if(!success) {
        c.status(411);
        return c.json({
            message: "Inputs not Correct"
        })
    }
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())

    const blog = await prisma.blog.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content,
        }
    })
    return c.json({
        id: blog.id
    })
  })

  blogRouter.get("/bulk", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blogs = await prisma.blog.findMany();

    return c.json({
        blogs
    })

    })
  
  blogRouter.get('/:id', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
    const body = await c.req.json();

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: body.id
            },
        })
        return c.json({
            blog
        })
    } catch (error) {
        c.status(411);
        return c.json({
            message: "Error while fetching blog"
        });
    }
  }) 

  