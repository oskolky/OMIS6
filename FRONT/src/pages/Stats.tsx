import Header from "@/components/layout/Header";
import StatsCard from "@/components/stats/StatsCard";
import { FileText, Database, Link2, MessageSquare, TrendingUp, Clock } from "lucide-react";

const mockDetailedStats = {
  overview: {
    totalDocuments: 156,
    totalEntities: 3847,
    totalRelations: 1293,
    totalSentences: 12456,
  },
  processing: {
    completed: 148,
    processing: 5,
    failed: 3,
    averageTime: "2.4s",
  },
  entities: {
    persons: 892,
    organizations: 567,
    locations: 1234,
    dates: 678,
    other: 476,
  },
};

const Stats = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Overview Stats */}
        <section className="mb-12">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Общая статистика
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Документов"
              value={mockDetailedStats.overview.totalDocuments}
              icon={FileText}
            />
            <StatsCard
              title="Сущностей"
              value={mockDetailedStats.overview.totalEntities}
              icon={Database}
            />
            <StatsCard
              title="Связей"
              value={mockDetailedStats.overview.totalRelations}
              icon={Link2}
            />
            <StatsCard
              title="Предложений"
              value={mockDetailedStats.overview.totalSentences}
              icon={MessageSquare}
            />
          </div>
        </section>

        {/* Processing Stats */}
        <section className="mb-12">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Обработка
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Завершено"
              value={mockDetailedStats.processing.completed}
              subtitle={`${((mockDetailedStats.processing.completed / mockDetailedStats.overview.totalDocuments) * 100).toFixed(1)}% от всех`}
              icon={TrendingUp}
            />
            <StatsCard
              title="В обработке"
              value={mockDetailedStats.processing.processing}
              icon={Clock}
            />
            <StatsCard
              title="Ошибки"
              value={mockDetailedStats.processing.failed}
              icon={FileText}
            />
            <StatsCard
              title="Среднее время"
              value={mockDetailedStats.processing.averageTime}
              subtitle="на документ"
              icon={Clock}
            />
          </div>
        </section>

        {/* Entity Distribution */}
        <section className="mb-12">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Распределение сущностей
          </h2>
          <div className="border border-border">
            {Object.entries(mockDetailedStats.entities).map(([type, count]) => {
              const total = Object.values(mockDetailedStats.entities).reduce((a, b) => a + b, 0);
              const percentage = ((count / total) * 100).toFixed(1);
              
              const typeLabels: Record<string, string> = {
                persons: "Персоны",
                organizations: "Организации",
                locations: "Локации",
                dates: "Даты",
                other: "Другое",
              };

              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-4 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-primary" />
                    <span className="font-mono text-sm font-medium">
                      {typeLabels[type] || type}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-48 h-2 bg-secondary hidden md:block">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm text-muted-foreground w-16 text-right">
                      {percentage}%
                    </span>
                    <span className="font-mono text-sm font-medium w-20 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* API Endpoints */}
        <section>
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            API Endpoints
          </h2>
          <div className="border border-border font-mono text-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-2">Метод</div>
              <div className="col-span-6">Endpoint</div>
              <div className="col-span-4">Описание</div>
            </div>
            
            {[
              { method: "POST", endpoint: "/extract", desc: "Загрузить документ" },
              { method: "GET", endpoint: "/documents", desc: "Список документов" },
              { method: "GET", endpoint: "/documents/{id}", desc: "Информация о документе" },
              { method: "DELETE", endpoint: "/documents/{id}", desc: "Удалить документ" },
              { method: "GET", endpoint: "/entities", desc: "Получить сущности" },
              { method: "GET", endpoint: "/relations", desc: "Получить связи" },
              { method: "GET", endpoint: "/graph", desc: "Граф знаний" },
              { method: "GET", endpoint: "/stats", desc: "Статистика" },
            ].map((api, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 p-4 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
              >
                <div className="col-span-2">
                  <span className={`px-2 py-1 text-xs ${api.method === "POST" ? "bg-accent text-accent-foreground" : api.method === "DELETE" ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`}>
                    {api.method}
                  </span>
                </div>
                <div className="col-span-6 text-muted-foreground">{api.endpoint}</div>
                <div className="col-span-4">{api.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Stats;
