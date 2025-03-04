import type { Collection, Product } from "@prisma/client";
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import {
  Badge,
  EmptyState,
  IndexFilters,
  IndexFiltersMode,
  IndexTable,
  LegacyCard,
  Page,
  Text,
  TextField,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { useCallback, useState } from "react";

export async function loader({ request }: { request: LoaderFunctionArgs }) {
  const collections = await prisma.collection.findMany({
    include: {
      products: true,
    },
  });
  return json(
    { collections },
    {
      headers: {
        "ngrok-skip-browser-warning": "1",
      },
    },
  );
}

export default function Index() {
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const collections: (Collection & { products: Product[] })[] =
    loaderData.collections;

  const [sortSelected, setSortSelected] = useState(["collectionName asc"]);
  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Default);
  const [queryValue, setQueryValue] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState(0);
  const [taggedWith, setTaggedWith] = useState<string | undefined>("");

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState([
    "All",
    "High priority",
    "Medium priority",
    "Low priority",
  ]);

  const duplicateView = async (name: string) => {
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };
  const deleteView = (index: number) => {
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => setSelected(index),
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions:
      index === 0
        ? []
        : [
            {
              type: "rename",
              onAction: () => {},
              onPrimaryAction: async (value: string): Promise<boolean> => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
            {
              type: "duplicate",
              onPrimaryAction: async (value: string): Promise<boolean> => {
                await sleep(1);
                duplicateView(value);
                return true;
              },
            },
            {
              type: "edit",
            },
            {
              type: "delete",
              onPrimaryAction: async () => {
                await sleep(1);
                deleteView(index);
                return true;
              },
            },
          ],
  }));

  const sortOptions: IndexFiltersProps["sortOptions"] = [
    {
      label: "Collection name",
      value: "collectionName asc",
      directionLabel: "A-Z",
    },
    {
      label: "Collection name",
      value: "collectionName desc",
      directionLabel: "Z-A",
    },
    { label: "Priority", value: "priority asc", directionLabel: "A-Z" },
    { label: "Priority", value: "priority desc", directionLabel: "Z-A" },
    {
      label: "Products count",
      value: "productsCount asc",
      directionLabel: "Ascending",
    },
    {
      label: "Products count",
      value: "productsCount desc",
      directionLabel: "Descending",
    },
  ];

  const handleQueryValueChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );

  const onCreateNewView = async (value: string) => {
    await sleep(500);
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  const handleTaggedWithChange = useCallback(
    (value: string) => setTaggedWith(value),
    [],
  );
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(""), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

  const filters = [
    {
      key: "taggedWith",
      label: "Tagged with",
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
  ];

  const handleFiltersClearAll = useCallback(() => {
    handleTaggedWithRemove();
    handleQueryValueRemove();
    setSelected(0);
  }, [handleQueryValueRemove, handleTaggedWithRemove]);

  const filteredAndSortedCollections = collections
    .filter((c) => {
      if (
        queryValue &&
        !c.name.toLowerCase().includes(queryValue.toLowerCase())
      ) {
        return false;
      }
      if (selected !== 0) {
        const selectedPriority = itemStrings[selected]
          .toLowerCase()
          .replace(" priority", "");
        return c.priority.toLowerCase() === selectedPriority;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortSelected[0]) {
        case "collectionName asc":
          return a.name.localeCompare(b.name);
        case "collectionName desc":
          return b.name.localeCompare(a.name);
        case "priority asc":
          return a.priority.localeCompare(b.priority);
        case "priority desc":
          return b.priority.localeCompare(a.priority);
        case "productsCount asc":
          return a.products.length - b.products.length;
        case "productsCount desc":
          return b.products.length - a.products.length;
        default:
          return 0;
      }
    });

  return (
    <Page>
      <TitleBar title="Collections">
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
        <LegacyCard>
          <IndexFilters
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            queryValue={queryValue}
            queryPlaceholder="Searching in all"
            onQueryChange={handleQueryValueChange}
            onQueryClear={() => setQueryValue("")}
            onSort={setSortSelected}
            cancelAction={{
              onAction: () => {},
              disabled: false,
              loading: false,
            }}
            tabs={tabs}
            selected={selected}
            onSelect={setSelected}
            canCreateNewView={false}
            onCreateNewView={onCreateNewView}
            filters={filters}
            onClearAll={handleFiltersClearAll}
            mode={mode}
            setMode={setMode}
          />
          <IndexTable
            resourceName={{
              singular: "collection",
              plural: "collections",
            }}
            itemCount={filteredAndSortedCollections.length}
            headings={[
              { title: "#" },
              { title: "Name" },
              { title: "Products count" },
              { title: "Priority" },
            ]}
            selectable={false}
          >
            {filteredAndSortedCollections.map((c, index) => (
              <IndexTable.Row
                id={c.id.toString()}
                key={c.id}
                position={index}
                onClick={() => navigate(`/app/operation?collection_id=${c.id}`)}
              >
                <IndexTable.Cell>{index + 1}</IndexTable.Cell>
                <IndexTable.Cell>
                  <Text variant="bodyMd" as="span">
                    {c.name}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {(c as Collection & { products: Product[] }).products.length}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge
                    tone={
                      c.priority === "high"
                        ? "critical"
                        : c.priority === "medium"
                          ? "warning"
                          : "attention"
                    }
                  >
                    {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                  </Badge>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </LegacyCard>
      )}
    </Page>
  );
}
