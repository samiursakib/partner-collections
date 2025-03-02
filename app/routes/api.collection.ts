import { type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  switch (request.method) {
    case "POST":
      try {
        const body = await request.json();
        console.log(body);
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
        const result = await prisma.collection.create(payload);
        console.log("##############", result);
        return new Response(
          JSON.stringify({ success: true, message: "Collection created" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (err) {
        console.log(err);
        return new Response(
          JSON.stringify({
            success: false,
            message: (err as Error).message,
          }),
        );
      }
    case "DELETE":
      return new Response("OK", { status: 200 });
    default:
      return new Response("Method not allowed", { status: 405 });
  }
}
