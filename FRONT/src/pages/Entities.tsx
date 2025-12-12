import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import EntityBadge from "@/components/entities/EntityBadge";
import { Input } from "@/components/ui/input";

interface Entity {
  id: number;
  text: string;
  type: "person" | "organization" | "location" | "date" | "other";
  documentId: number;
  sentenceId: number;
}

const EntitiesPage = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  const loadEntities = () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (query.trim()) params.append("q", query.trim());

    fetch(`/entities?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setEntities(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    const delay = setTimeout(loadEntities, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">

        <h1 className="font-mono text-lg font-semibold mb-6">
          Сущности
        </h1>

        {/* Only search */}
        <div className="mb-8">
          <Input
            placeholder="Поиск сущности..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-mono"
          />
        </div>

        {loading && (
          <p className="font-mono text-sm text-muted-foreground">Загрузка...</p>
        )}

        {!loading && entities.length === 0 && (
          <p className="font-mono text-sm text-muted-foreground">
            Ничего не найдено.
          </p>
        )}

        <div className="space-y-4">
          {entities.map((e) => (
            <div
              key={e.id}
              className="border border-border p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <EntityBadge type={e.type}>
                  {e.type}
                </EntityBadge>

                <span className="font-mono text-xs text-muted-foreground">
                  Документ #{e.documentId} • Предложение #{e.sentenceId}
                </span>
              </div>

              <p className="font-mono text-sm">{e.text}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default EntitiesPage;
