import { Suspense, useState, useCallback, useEffect } from "react";
import {
  Await,
  useFetcher,
  useRevalidator,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Button,
  Banner,
  SkeletonDisplayText,
  SkeletonBodyText,
  BlockStack,
  InlineStack,
  Box,
  Toast,
} from "@shopify/polaris";

import type { Route } from "./+types/dashboard";
import { getInventory, claimStock } from "~/models/inventory.server";


// LOADER: Streaming data
export async function loader({}: Route.LoaderArgs) {
  const inventoryPromise = getInventory();

  return {
    inventory: inventoryPromise,
  };
}

// ACTION: Handle stock claim mutations
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const itemId = formData.get("itemId") as string;

  try {
    const updatedItem = await claimStock(itemId);
    return { success: true, item: updatedItem };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      itemId,
    };
  }
}

// COMPONENT: Main Dashboard
export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <Page title="Inventory Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Current Stock Levels
              </Text>
              <Suspense fallback={<InventorySkeleton />}>
                <Await resolve={loaderData.inventory} errorElement={<InventoryErrorFallback />}>
                  {(inventory) => <InventoryTable items={inventory} />}
                </Await>
              </Suspense>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// COMPONENT: Loading Skeleton
function InventorySkeleton() {
  return (
    <BlockStack gap="400">
      <SkeletonDisplayText size="small" />
      <SkeletonBodyText lines={4} />
      <SkeletonBodyText lines={4} />
      <SkeletonBodyText lines={4} />
    </BlockStack>
  );
}

// COMPONENT: Inventory Table with Optimistic UI
type Item = { id: string; name: string; stock: number };

function InventoryTable({ items }: { items: Item[] }) {
  return (
    <IndexTable
      resourceName={{ singular: "item", plural: "items" }}
      itemCount={items.length}
      headings={[
        { title: "Name" },
        { title: "Stock", alignment: "end" },
        { title: "Action", alignment: "end" },
      ]}
      selectable={false}
    >
      {items.map((item, index) => (
        <InventoryRow key={item.id} item={item} index={index} />
      ))}
    </IndexTable>
  );
}

// COMPONENT: Individual Row with Optimistic UI
function InventoryRow({ item, index }: { item: Item; index: number }) {
  const fetcher = useFetcher<typeof action>();
  const [active, setActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const toastMarkup = active ? (
    <Toast content={errorMsg} error onDismiss={toggleActive} />
  ) : null;

  let displayStock = item.stock;
  const isPending = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data && !fetcher.data.success) {
      setErrorMsg(fetcher.data.error || "An error occurred");
      setActive(true);
    }
  }, [fetcher.data]);

  if (fetcher.formData) {
    // Optimistically decrement stock before server responds
    displayStock = item.stock - 1;
  } else if (fetcher.data?.success && fetcher.data.item) {
    // Keep updated value while loader revalidates (avoids flash of old content)
    displayStock = fetcher.data.item.stock;
  }

  return (
    <IndexTable.Row id={item.id} position={index}>
      <IndexTable.Cell>
        {toastMarkup}
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {item.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack align="end">
          <Text
            as="span"
            variant="bodyMd"
          >
            {displayStock}
          </Text>
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack align="end">
          <fetcher.Form
            method="post"
            onSubmit={(e) => {
              if (isPending) e.preventDefault();
            }}
          >
            <input type="hidden" name="itemId" value={item.id} />
            <Button
              submit
              size="slim"
              loading={isPending}
              disabled={isPending}
            >
              Claim One
            </Button>
          </fetcher.Form>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}

// COMPONENT: Error Fallback for Await (inside Suspense)
function InventoryErrorFallback() {
  const revalidator = useRevalidator();

  if (revalidator.state === "loading") {
    return <InventorySkeleton />;
  }

  return (
    <Banner
      title="Failed to load inventory"
      tone="critical"
      action={{
        content: "Retry",
        onAction: () => revalidator.revalidate(),
      }}
    >
      <p>The legacy API returned an error. Click retry to try again.</p>
    </Banner>
  );
}

// ERROR BOUNDARY: Route-level error handling
export function ErrorBoundary() {
  const error = useRouteError();
  const revalidator = useRevalidator();

  let errorMessage = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status}: ${error.statusText}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <Page title="Inventory Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Current Stock Levels
              </Text>
              {revalidator.state === "loading" ? (
                <InventorySkeleton />
              ) : (
                <Banner
                  title="Failed to load inventory"
                  tone="critical"
                  action={{
                    content: "Retry",
                    onAction: () => revalidator.revalidate(),
                  }}
                >
                  <p>{errorMessage}</p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
