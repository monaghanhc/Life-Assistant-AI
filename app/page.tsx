import { LifeAdminShell } from "@/components/life-admin-shell";
import { getInitialProviderStatus } from "@/lib/assist-service";
import { getSeedUserMemory } from "@/lib/user-memory";

export default function Home() {
  const memory = getSeedUserMemory();
  const provider = getInitialProviderStatus();

  return <LifeAdminShell memory={memory} provider={provider} />;
}
