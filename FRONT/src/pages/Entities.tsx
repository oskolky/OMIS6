import Header from "@/components/layout/Header";
import EntityBadge from "@/components/entities/EntityBadge";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const mockEntities = [
  { id: 1, text: "Иванов А.П.", type: "person" as const, documentId: 1, frequency: 12 },
  { id: 2, text: "ООО «Техносервис»", type: "organization" as const, documentId: 1, frequency: 8 },
  { id: 3, text: "Москва", type: "location" as const, documentId: 1, frequency: 5 },
  { id: 4, text: "12.12.2024", type: "date" as const, documentId: 1, frequency: 3 },
  { id: 5, text: "Петров С.В.", type: "person" as const, documentId: 2, frequency: 7 },
  { id: 6, text: "АО «Промторг»", type: "organization" as const, documentId: 2, frequency: 4 },
  { id: 7, text: "Санкт-Петербург", type: "location" as const, documentId: 2, frequency: 6 },
  { id: 8, text: "Контракт №2847", type: "other" as const, documentId: 2, frequency: 2 },
];

const Entities = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Search & Filter */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск сущностей..."
                className="pl-10 font-mono"
              />
            </div>
            <Button variant="outline" className="font-mono">
              <Filter className="w-4 h-4 mr-2" />
              Фильтр
            </Button>
          </div>
        </section>

        {/* Entity Types Legend */}
        <section className="mb-8">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Типы сущностей
          </h2>
          <div className="flex flex-wrap gap-3">
            <EntityBadge type="person">Персона</EntityBadge>
            <EntityBadge type="organization">Организация</EntityBadge>
            <EntityBadge type="location">Локация</EntityBadge>
            <EntityBadge type="date">Дата</EntityBadge>
            <EntityBadge type="other">Другое</EntityBadge>
          </div>
        </section>

        {/* Entities Table */}
        <section>
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Извлечённые сущности
          </h2>

          <div className="border border-border">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Сущность</div>
              <div className="col-span-3">Тип</div>
              <div className="col-span-2">Документ</div>
              <div className="col-span-2 text-right">Частота</div>
            </div>

            {mockEntities.map((entity) => (
              <div
                key={entity.id}
                className="grid grid-cols-12 gap-4 p-4 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
              >
                <div className="col-span-1 font-mono text-sm text-muted-foreground">
                  {entity.id}
                </div>
                <div className="col-span-4 font-mono text-sm font-medium">
                  {entity.text}
                </div>
                <div className="col-span-3">
                  <EntityBadge type={entity.type}>
                    {entity.type === "person" && "Персона"}
                    {entity.type === "organization" && "Организация"}
                    {entity.type === "location" && "Локация"}
                    {entity.type === "date" && "Дата"}
                    {entity.type === "other" && "Другое"}
                  </EntityBadge>
                </div>
                <div className="col-span-2 font-mono text-sm text-muted-foreground">
                  doc_{entity.documentId}
                </div>
                <div className="col-span-2 text-right font-mono text-sm">
                  {entity.frequency}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Entities;
