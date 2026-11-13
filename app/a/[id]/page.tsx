import { Suspense } from "react";
import PublicActivity from "../../[id]/PublicActivity";

async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicActivity key={id} id={id} />;
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <ActivityPage params={params} />
    </Suspense>
  );
}
