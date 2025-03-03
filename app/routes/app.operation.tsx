import type { Collection, Product as PrismaProduct } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import {
  Badge,
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
import { SearchIcon, XIcon } from "@shopify/polaris-icons";
import { deleteCollection, upsertCollection } from "app/services";
import { authenticate } from "app/shopify.server";
import type { Product } from "app/types";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const collectionId = new URL(request.url).searchParams.get("collection_id");
  console.log(request.url, collectionId);
  const adminStoreProductsResponse = await admin.graphql(`
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
  const storeProducts = await adminStoreProductsResponse.json();
  const collections = await prisma.collection.findMany({
    include: {
      products: true,
    },
  });
  const editableCollection = collections.find(
    (c) => c.id === Number(collectionId),
  );
  console.log("#########", editableCollection);
  return json({
    products: storeProducts.data.products.nodes,
    collections,
    editableCollection,
  });
}

export default function CreateCollection() {
  const navigate = useNavigate();
  const { products, collections, editableCollection } =
    useLoaderData<typeof loader>();
  const alreadyGroupedProducts = collections.map(
    (c: Collection & { products: PrismaProduct[] }) => c.products,
  );
  const flattenedAlreadyGroupedProductIds = alreadyGroupedProducts
    .flat()
    .map((p) => p.id);
  const [formData, setFormData] = useState<{
    name: string;
    priority: string;
    productIds: string[];
  }>({
    name: editableCollection ? editableCollection.name : "",
    priority: editableCollection ? editableCollection.priority : "high",
    productIds: editableCollection
      ? editableCollection.products.map((p) => p.id)
      : [],
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(
    editableCollection ? editableCollection.products.map((p) => p.id) : [],
  );
  const [hasMounted, setHasMounted] = useState(false);

  const handleSubmit = async () => {
    const payload = {
      id: editableCollection?.id,
      name: formData.name,
      priority: formData.priority,
      products: products
        .filter((p: Product) => formData.productIds.includes(p.id))
        .map((p: Product) => ({ id: p.id, title: p.title })),
    };
    const result = await upsertCollection(!!editableCollection, payload);
    if (result.success) {
      navigate("/app");
    }
    shopify.toast.show(result.message);
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <>
      <Page
        narrowWidth
        title={
          editableCollection ? editableCollection.name : "Create Collection"
        }
        backAction={{ url: "/app" }}
      >
        <Box>
          <BlockStack gap={"400"}>
            <Card>
              <BlockStack gap="300">
                <TextField
                  type="text"
                  label="Name"
                  placeholder="collection name"
                  autoComplete="on"
                  value={formData.name}
                  onChange={(value) => {
                    setFormData({ ...formData, name: value });
                  }}
                />
                <Select
                  label="Priority"
                  options={[
                    { label: "High", value: "high" },
                    { label: "Medium", value: "medium" },
                    { label: "Low", value: "low" },
                  ]}
                  value={formData.priority}
                  onChange={(value) => {
                    setFormData({ ...formData, priority: value });
                  }}
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
                        formData.productIds.includes(product.id),
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
                                onClick={() => {
                                  setSelectedIds((prev) =>
                                    prev.filter((id) => id !== product.id),
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    productIds: prev.productIds.filter(
                                      (id) => id !== product.id,
                                    ),
                                  }));
                                }}
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
        </Box>
        <PageActions
          primaryAction={{ content: "Save", onAction: handleSubmit }}
          secondaryActions={[
            editableCollection
              ? {
                  content: "Delete",
                  destructive: true,
                  onAction: async () => {
                    const result = await deleteCollection(
                      editableCollection.id,
                    );
                    if (result.success) navigate("/app");
                    shopify.toast.show(result.message);
                  },
                }
              : {
                  content: "Cancel",
                  onAction: () => navigate("/app"),
                },
          ]}
        />
      </Page>
      <Modal id="products-modal">
        {products.map((product: Product) => {
          const isAlreadyAddedToAnotherCollection =
            flattenedAlreadyGroupedProductIds.includes(product.id);
          const assignedCollection = collections.find((c) =>
            c.products.map((p) => p.id).includes(product.id),
          );
          return (
            <Box key={product.id} paddingBlock={"200"} paddingInline={"400"}>
              <InlineStack align="space-between">
                <InlineStack gap="200">
                  <Checkbox
                    label={""}
                    checked={selectedIds.includes(product.id)}
                    disabled={
                      isAlreadyAddedToAnotherCollection &&
                      assignedCollection?.id !== editableCollection?.id
                    }
                    onChange={() => {
                      shopify.toast.show(selectedIds.length.toString());
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
                {isAlreadyAddedToAnotherCollection ? (
                  <BlockStack align="center">
                    {<Badge tone="success">{assignedCollection?.name}</Badge>}
                  </BlockStack>
                ) : null}
              </InlineStack>
            </Box>
          );
        })}
        <TitleBar title="Add products">
          <button
            variant="primary"
            onClick={() => {
              setFormData({ ...formData, productIds: selectedIds });
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
