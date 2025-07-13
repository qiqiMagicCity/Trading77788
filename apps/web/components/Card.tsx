export default function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-card border border-green p-4 text-center shadow-md">
      <h3 className="text-lg mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
