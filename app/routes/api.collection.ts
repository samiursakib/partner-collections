import { type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  switch (request.method) {
    case "POST":
      try {
        const body = await request.json();
        if (!body.name || !body.priority)
          throw new Error("Missing name or priority");
        const payload = {
          data: {
            name: body.name as string,
            priority: body.priority as string,
            products: {
              create: body.products.map((p: { id: string; title: string }) => ({
                id: p.id,
                title: p.title,
              })),
            },
          },
          include: {
            products: true,
          },
        };
        await prisma.collection.create(payload);
        return new Response(
          JSON.stringify({ success: true, message: "Collection created" }),
        );
      } catch (err) {
        console.error(err);
        return new Response(
          JSON.stringify({
            success: false,
            message: (err as Error).message,
          }),
        );
      }
    case "PUT":
      try {
        const body = await request.json();
        if (!body.name || !body.priority)
          throw new Error("Missing name or priority");
        const payload = {
          where: {
            id: body.id,
          },
          data: {
            name: body.name,
            priority: body.priority,
            products: {
              deleteMany: {},
              create: body.products.map((p: { id: string; title: string }) => ({
                id: p.id,
                title: p.title,
              })),
            },
          },
          include: {
            products: true,
          },
        };
        await prisma.collection.update(payload);
        return new Response(
          JSON.stringify({ success: true, message: "Collection updated" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (err) {
        console.error(err);
        return new Response(
          JSON.stringify({ success: false, message: (err as Error).message }),
        );
      }
    case "DELETE":
      const collectionId = new URL(request.url).searchParams.get("id");
      if (!collectionId) {
        throw new Error("Collection not found");
      }
      await prisma.$transaction([
        prisma.product.deleteMany({
          where: {
            collectionId: Number(collectionId),
          },
        }),
        prisma.collection.delete({
          where: {
            id: Number(collectionId),
          },
        }),
      ]);
      return new Response(
        JSON.stringify({ success: true, message: "Collection deleted" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    default:
      return new Response(
        JSON.stringify({ success: false, message: "Method not allowed" }),
        { status: 405 },
      );
  }
}
