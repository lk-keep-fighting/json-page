import { LowCodePage } from "./components/renderer";
import { exampleAdminConfig, exampleChartConfig } from "./config/example";

export default function App() {
  return (
    <div className="min-h-screen bg-muted/40 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <LowCodePage config={exampleChartConfig} />
        <LowCodePage config={exampleAdminConfig} />
      </div>
    </div>
  );
}
