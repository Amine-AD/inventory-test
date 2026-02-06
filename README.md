# Inventory Resilience Dashboard

This project demonstrates a resilient Remix/React Router application that handles slow and unreliable legacy APIs using advanced patterns like Streaming, Optimistic UI, and Error Boundaries.

## Prerequisites

Before running the application, ensuring you have the following installed:

- **Node.js**: The application is built with React Router v7 (Remix) and requires a modern Node.js runtime (LTS recommended).
- **npm**: The Node Package Manager is used for dependency management and scripts.

## How to Run

1.  **Install Dependencies**
    Open your terminal in the project directory and run:

    ```bash
    npm install --legacy-peer-deps
    ```

    > **Note:** We use the `--legacy-peer-deps` flag because Shopify Polaris currently lists React 18 as a peer dependency, but this project uses React 19. This flag allows the installation to proceed despite the version mismatch.

2.  **Start the Development Server**
    Run the following command to start the app in development mode:

    ```bash
    npm run dev
    ```

3.  **Access the App**
    Open your browser and navigate to:
    ```
    http://localhost:5173
    ```
    (Or the URL provided in the terminal output).

## Implementation Details

### Task 1: Streaming & Performance

To eliminate the "white screen" effect caused by the 3-second API delay, I utilized **React Router's native streaming capabilities**. In React Router v7, returning a promise from the `dashboard` loader automatically enables streaming, removing the need for the deprecated `defer` utility.

- **Immediate Render:** The page shell renders immediately (0ms) while the inventory data fetch is kicked off in the background.
- **Suspense & Await:** The inventory list is wrapped in `<Suspense>` with a fallback skeleton component. The `<Await>` component resolves the deferred promise, rendering the table only when data is ready.

### Task 2: Optimistic UI

For the "Claim One" feature, immediate feedback is critical despite the 1-second mutation delay.

- **Strategy:** I used `useFetcher` to track the pending state of the stock claim action.
- **Implementation:** The UI checks `fetcher.formData` to determine if a mutation is in flight. If so, it artificially decrements the stock count _before_ the server responds.
- **Rollback:** If the server returns an error (e.g., "Out of Stock"), the optimistic update is automatically discarded because `fetcher.formData` is cleared, causing the UI to revert to the server's truth.
- **Double-Submit Protection:** The claim button is disabled whenever `fetcher.state` is not "idle", preventing users from queuing up multiple widely-spaced requests during the delay.

### Task 3: Error Boundaries & Retry Logic

Since the backend fails 20% of the time, the application must be resilient.

- **Route-Level Boundary:** I implemented a `ErrorBoundary` export effectively isolating the failure to the route.
- **Partial Failure:** The error boundary ensures that while the main content might fail, the surrounding app shell remains intact.
- **Retry Logic:** The "Retry" button uses `useRevalidator().revalidate()` to re-run the loader without reloading the entire page or losing client-side state. This provides a smoother recovery experience than a full browser refresh.

## Tech Stack

- **Framework:** React Router v7 (Remix)
- **UI Library:** Shopify Polaris
- **Styling:** Tailwind CSS (via Vite)
