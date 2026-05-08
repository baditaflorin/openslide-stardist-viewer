import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { SlideWorkbench } from "./features/slides/SlideWorkbench";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <SlideWorkbench />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
