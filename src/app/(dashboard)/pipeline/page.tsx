import PageHeader from "@/components/PageHeader";
import { getPipelineStatus } from "@/lib/pipeline/data";

export default function PipelinePage() {
  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Deals and revenue from HubSpot."
        status={getPipelineStatus()}
      />
    </div>
  );
}
