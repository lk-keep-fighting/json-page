import { LowCodePage } from "./components/renderer";
import { exampleAdminConfig } from "./config/example";

export default function App() {
  return (
    <div className="min-h-screen bg-muted/40 py-10">
      <LowCodePage config={exampleAdminConfig} />
    </div>
  );
}
