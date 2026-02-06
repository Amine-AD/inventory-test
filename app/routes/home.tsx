import { Link } from "react-router";
import { Page, BlockStack, InlineStack, Text } from "@shopify/polaris";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Inventory Test" }];
}

export default function Home() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <BlockStack gap="500" inlineAlign="center">
        <Text as="h1" variant="heading3xl">
          Inventory Test
        </Text>
        <InlineStack gap="500" align="center">
          <Link 
            to="/dashboard" 
            style={{ fontSize: "1.2rem", color: "#005bd3", textDecoration: "underline" }}
          >
            Dashboard
          </Link>
          <Link 
            to="/dashboard-v2" 
            style={{ fontSize: "1.2rem", color: "#005bd3", textDecoration: "underline" }}
          >
            Dashboard V2
          </Link>
        </InlineStack>
      </BlockStack>
    </div>
  );
}
