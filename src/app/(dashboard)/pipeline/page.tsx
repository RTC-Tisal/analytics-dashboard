import PageHeader from "@/components/PageHeader";
import { pipelineDataSource } from "@/lib/pipeline/data";

export default function PipelinePage() {
  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Deals and revenue from HubSpot."
        dataSource={pipelineDataSource}
      />
    </div>
  );
}
