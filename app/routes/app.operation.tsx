import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  EmptyState,
  Icon,
  InlineStack,
  LegacyCard,
  Page,
  PageActions,
  Select,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { useState } from "react";
import { SearchIcon, XIcon } from "@shopify/polaris-icons";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import type { Product } from "app/types";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "app/shopify.server";

export default function CreateCollection() {
  const navigate = useNavigate();
  const { products } = useLoaderData<typeof loader>();

  const [formData, setFormData] = useState<{
    name: string;
    priority: string;
    productIds: string[];
  }>({
    name: "",
    priority: "",
    productIds: [],
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  return (
    <>
      <Page narrowWidth title="Create Collection" backAction={{ url: "/app" }}>
        <Form method="post">
          <BlockStack gap={"400"}>
            <Card>
              <BlockStack gap="300">
                <TextField
                  type="text"
                  name="name"
                  label="Name"
                  placeholder="collection name"
                  autoComplete="on"
                  value={formData.name}
                  onChange={(value) =>
                    setFormData({ ...formData, name: value })
                  }
                />
                <Select
                  name="priority"
                  label="Priority"
                  options={[
                    { label: "High", value: "high" },
                    { label: "Medium", value: "medium" },
                    { label: "Low", value: "low" },
                  ]}
                  value={formData.priority}
                  onChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                />
              </BlockStack>
            </Card>
            <Card>
              <Box minHeight="200">
                <BlockStack>
                  <TextField
                    size="slim"
                    type="text"
                    label="Products"
                    autoComplete="off"
                    placeholder="Search products"
                    prefix={<Icon source={SearchIcon} />}
                    connectedRight={
                      <Button
                        onClick={() => shopify.modal.show("products-modal")}
                      >
                        Browse
                      </Button>
                    }
                    onFocus={() => shopify.modal.show("products-modal")}
                  />
                </BlockStack>
              </Box>
              <Box paddingBlockStart={"400"}>
                {!products.length ? (
                  <LegacyCard sectioned>
                    <EmptyState
                      heading="No products selected yet"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>Search some products to add to your collection.</p>
                    </EmptyState>
                  </LegacyCard>
                ) : (
                  <BlockStack gap="200">
                    {products
                      .filter((product: Product) =>
                        confirmedIds.includes(product.id),
                      )
                      .map((product: Product, index: number) => (
                        <>
                          <Divider />
                          <InlineStack
                            key={product.id}
                            gap="200"
                            align="space-between"
                          >
                            <InlineStack>
                              <BlockStack align="center">
                                <Box width="20px">{index + 1}</Box>
                              </BlockStack>
                              <Thumbnail
                                size="small"
                                source={
                                  product.media.nodes[0]?.preview.image.url
                                }
                                alt={
                                  product.media.nodes[0]?.preview.image.altText
                                }
                              />
                              <BlockStack align="center">
                                <Box paddingInlineStart={"200"}>
                                  <Text variant="bodyMd" as="h3">
                                    {product.title}
                                  </Text>
                                </Box>
                              </BlockStack>
                            </InlineStack>
                            <BlockStack align="center">
                              <Button
                                variant="plain"
                                icon={XIcon}
                                onClick={() =>
                                  setSelectedIds((prev) =>
                                    prev.filter((id) => id !== product.id),
                                  )
                                }
                              />
                            </BlockStack>
                          </InlineStack>
                        </>
                      ))}
                  </BlockStack>
                )}
              </Box>
            </Card>
          </BlockStack>
        </Form>
        <PageActions
          primaryAction={{ content: "Save", onAction: () => {} }}
          secondaryActions={[
            { content: "Cancel", onAction: () => navigate("/app") },
          ]}
        />
      </Page>
      <Modal id="products-modal">
        {products.map((product: Product) => (
          <Box key={product.id} paddingBlock={"200"} paddingInline={"400"}>
            <InlineStack gap="200">
              <Checkbox
                label={""}
                checked={selectedIds.includes(product.id)}
                onChange={() => {
                  setSelectedIds((prev) =>
                    prev.includes(product.id)
                      ? prev.filter((id) => id !== product.id)
                      : [...prev, product.id],
                  );
                }}
              />
              <Thumbnail
                size="small"
                source={product.media.nodes[0]?.preview.image.url}
                alt={product.media.nodes[0]?.preview.image.altText}
              />
              <BlockStack align="center">
                <Box paddingInlineStart={"200"}>
                  <Text variant="bodyMd" as="h3">
                    {product.title}
                  </Text>
                </Box>
              </BlockStack>
            </InlineStack>
          </Box>
        ))}
        <TitleBar title="Add products">
          <button
            variant="primary"
            disabled={selectedIds.length === 0}
            onClick={() => {
              setConfirmedIds(selectedIds);
              shopify.modal.hide("products-modal");
            }}
          >
            Add
          </button>
          <button onClick={() => shopify.modal.hide("products-modal")}>
            Cancel
          </button>
        </TitleBar>
      </Modal>
    </>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    {
      products(first: 250) {
        nodes {
          id
          title
          description
          vendor
          productType
          media(first: 1) {
            nodes {
              preview {
                image {
                  url
                  altText
                }
              }
            }
          }
          createdAt
          updatedAt
        }
      }
    }
  `);
  const result = await response.json();
  return json({ products: result.data.products.nodes });
}
