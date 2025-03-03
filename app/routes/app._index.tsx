import type { Collection, Product } from "@prisma/client";
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  EmptyState,
  IndexTable,
  LegacyCard,
  Page,
  Text,
} from "@shopify/polaris";

export async function loader({ request }: { request: LoaderFunctionArgs }) {
  const collections = await prisma.collection.findMany({
    include: {
      products: true,
    },
  });
  return json({ collections });
}

export default function Index() {
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const collections: Collection[] = loaderData.collections;
  return (
    <Page>
      <TitleBar title="Remix app template">
        <button variant="primary" onClick={() => navigate("/app/operation")}>
          Create a collection
        </button>
      </TitleBar>
      {!collections.length ? (
        <LegacyCard sectioned>
          <EmptyState
            heading="View your collections here"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Track and manage your collections created so far.</p>
          </EmptyState>
        </LegacyCard>
      ) : (
        <IndexTable
          resourceName={{
            singular: "collection",
            plural: "collections",
          }}
          itemCount={collections.length}
          headings={[
            { title: "Name" },
            { title: "Products count" },
            { title: "Priority" },
          ]}
        >
          {collections.map((c, index) => (
            <IndexTable.Row
              id={c.id.toString()}
              key={c.id}
              position={index}
              onClick={() => navigate(`/app/operation?collection_id=${c.id}`)}
            >
              <IndexTable.Cell>
                <Text variant="bodyMd" as="span">
                  {c.name}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                {(c as Collection & { products: Product[] }).products.length}
              </IndexTable.Cell>
              <IndexTable.Cell>
                {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      )}
    </Page>
  );
}
