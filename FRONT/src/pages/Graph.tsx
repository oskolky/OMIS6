import { useState } from "react";
import Header from "@/components/layout/Header";
import KnowledgeGraph from "@/components/graph/KnowledgeGraph";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Maximize2 } from "lucide-react";

// Mock data for demonstration
const mockNodes = [
  { id: "doc1", label: "Отчёт Q4", type: "document" as const },
  { id: "doc2", label: "Договор поставки", type: "document" as const },
  { id: "p1", label: "Иванов А.П.", type: "person" as const },
  { id: "p2", label: "Петров С.В.", type: "person" as const },
  { id: "p3", label: "Сидорова Е.М.", type: "person" as const },
  { id: "org1", label: "ООО Техносервис", type: "organization" as const },
  { id: "org2", label: "АО Промторг", type: "organization" as const },
  { id: "org3", label: "ИП Кузнецов", type: "organization" as const },
  { id: "loc1", label: "Москва", type: "location" as const },
  { id: "loc2", label: "Санкт-Петербург", type: "location" as const },
  { id: "date1", label: "12.12.2024", type: "date" as const },
  { id: "date2", label: "Q4 2024", type: "date" as const },
];

const mockLinks = [
  { id: "l1", source: "doc1", target: "p1", label: "автор" },
  { id: "l2", source: "doc1", target: "org1", label: "упоминает" },
  { id: "l3", source: "doc1", target: "date2", label: "период" },
  { id: "l4", source: "p1", target: "org1", label: "работает в" },
  { id: "l5", source: "org1", target: "loc1", label: "находится" },
  { id: "l6", source: "doc2", target: "p2", label: "подписант" },
  { id: "l7", source: "doc2", target: "org2", label: "контрагент" },
  { id: "l8", source: "doc2", target: "date1", label: "дата" },
  { id: "l9", source: "p2", target: "org2", label: "представляет" },
  { id: "l10", source: "org2", target: "loc2", label: "находится" },
  { id: "l11", source: "org1", target: "org2", label: "партнёр" },
  { id: "l12", source: "p3", target: "org1", label: "работает в" },
  { id: "l13", source: "org3", target: "org1", label: "подрядчик" },
];

const Graph = () => {
  const [selectedDocument, setSelectedDocument] = useState<string>("all");
  const [graphFormat, setGraphFormat] = useState<string>("graphml");

  const handleExport = () => {
    // Mock export functionality
    console.log(`Exporting graph in ${graphFormat} format`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Controls */}
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="font-mono text-lg font-semibold mb-1">Граф знаний</h1>
              <p className="font-mono text-xs text-muted-foreground">
                Интерактивная визуализация связей между сущностями
              </p>
            </div>

            <div className="flex gap-3">
              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger className="w-48 font-mono text-sm">
                  <SelectValue placeholder="Выберите документ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все документы</SelectItem>
                  <SelectItem value="1">Отчёт Q4 2024</SelectItem>
                  <SelectItem value="2">Договор поставки</SelectItem>
                </SelectContent>
              </Select>

              <Select value={graphFormat} onValueChange={setGraphFormat}>
                <SelectTrigger className="w-32 font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="graphml">GraphML</SelectItem>
                  <SelectItem value="jsonld">JSON-LD</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport} className="font-mono text-sm">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
            </div>
          </div>
        </section>

        {/* Graph Visualization */}
        <section className="mb-8">
          <div className="relative">
            <KnowledgeGraph
              nodes={mockNodes}
              links={mockLinks}
              width={typeof window !== "undefined" ? Math.min(window.innerWidth - 80, 1200) : 1200}
              height={600}
            />
          </div>
        </section>

        {/* Graph Stats */}
        <section>
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Статистика графа
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-border p-4">
              <p className="font-mono text-2xl font-bold">{mockNodes.length}</p>
              <p className="font-mono text-xs text-muted-foreground">Узлов</p>
            </div>
            <div className="border border-border p-4">
              <p className="font-mono text-2xl font-bold">{mockLinks.length}</p>
              <p className="font-mono text-xs text-muted-foreground">Связей</p>
            </div>
            <div className="border border-border p-4">
              <p className="font-mono text-2xl font-bold">
                {mockNodes.filter(n => n.type === "person").length}
              </p>
              <p className="font-mono text-xs text-muted-foreground">Персон</p>
            </div>
            <div className="border border-border p-4">
              <p className="font-mono text-2xl font-bold">
                {mockNodes.filter(n => n.type === "organization").length}
              </p>
              <p className="font-mono text-xs text-muted-foreground">Организаций</p>
            </div>
          </div>
        </section>

        {/* Relationship Types */}
        <section className="mt-8">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Типы связей
          </h2>
          <div className="border border-border">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">Связь</div>
              <div className="col-span-3">Источник</div>
              <div className="col-span-3">Цель</div>
              <div className="col-span-2 text-right">Количество</div>
            </div>

            {[
              { label: "работает в", sourceType: "person", targetType: "organization", count: 3 },
              { label: "находится", sourceType: "organization", targetType: "location", count: 2 },
              { label: "упоминает", sourceType: "document", targetType: "organization", count: 4 },
              { label: "партнёр", sourceType: "organization", targetType: "organization", count: 1 },
              { label: "подписант", sourceType: "document", targetType: "person", count: 2 },
            ].map((rel, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 p-4 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
              >
                <div className="col-span-4 font-mono text-sm font-medium">{rel.label}</div>
                <div className="col-span-3 font-mono text-sm text-muted-foreground">{rel.sourceType}</div>
                <div className="col-span-3 font-mono text-sm text-muted-foreground">{rel.targetType}</div>
                <div className="col-span-2 text-right font-mono text-sm">{rel.count}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Graph;
