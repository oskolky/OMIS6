import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import EntityBadge from "@/components/entities/EntityBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [typeFilter, setTypeFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");

  const loadEntities = () => {
    setLoading(true);

    const params = new URLSearchParams();

    if (query.trim()) params.append("q", query.trim());
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (documentFilter !== "all") params.append("document_id", documentFilter);

    fetch(`/entities?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setEntities(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEntities();
  }, [query, typeFilter, documentFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">

        <h1 className="font-mono text-lg font-semibold mb-6">
          Сущности
        </h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">

          <Input
            placeholder="Поиск по тексту..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-mono"
          />

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 font-mono">
              <SelectValue placeholder="Тип сущности" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="person">Персона</SelectItem>
              <SelectItem value="organization">Организация</SelectItem>
              <SelectItem value="location">Локация</SelectItem>
              <SelectItem value="date">Дата</SelectItem>
              <SelectItem value="other">Другое</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="ID документа (или all)"
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value)}
            className="font-mono w-40"
          />

        </div>

        {/* List */}
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
                  Документ #{e.documentId} | Предложение #{e.sentenceId}
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
