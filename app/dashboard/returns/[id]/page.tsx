import ReturnEntryClient from "./ReturnEntryClient";

export function generateStaticParams() {
  // Generate static params for sample client IDs
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
  ];
}

export default function ReturnEntryPage({ params }: { params: { id: string } }) {
  return <ReturnEntryClient clientId={params.id} />;
}
