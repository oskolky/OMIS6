import { useState } from "react";
import { FileText, Database, Link2, MessageSquare } from "lucide-react";
import Header from "@/components/layout/Header";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentList from "@/components/documents/DocumentList";
import StatsCard from "@/components/stats/StatsCard";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockDocuments = [
  {
    id: 1,
    name: "Отчёт_Q4_2024.pdf",
    uploadedAt: "2024-12-10 14:32",
    status: "completed" as const,
    entities: 47,
    sentences: 234,
  },
  {
    id: 2,
    name: "Договор_поставки.docx",
    uploadedAt: "2024-12-10 12:15",
    status: "completed" as const,
    entities: 23,
    sentences: 89,
  },
  {
    id: 3,
    name: "scan_document.png",
    uploadedAt: "2024-12-10 10:45",
    status: "processing" as const,
    entities: undefined,
    sentences: undefined,
  },
];

const mockStats = {
  documents: 156,
  entities: 3847,
  relations: 1293,
  sentences: 12456,
};

const Index = () => {
  const [documents, setDocuments] = useState(mockDocuments);
  const { toast } = useToast();

  const handleUpload = (file: File) => {
    const newDoc = {
      id: Date.now(),
      name: file.name,
      uploadedAt: new Date().toLocaleString("ru-RU"),
      status: "processing" as const,
      entities: undefined,
      sentences: undefined,
    };
    setDocuments([newDoc, ...documents]);
  };

  const handleDelete = (id: number) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
    toast({
      title: "Документ удалён",
      description: "Документ успешно удалён из системы",
    });
  };

  const handleReprocess = (id: number) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, status: "processing" as const } : doc
      )
    );
    toast({
      title: "Переобработка запущена",
      description: "Документ отправлен на повторную обработку",
    });
  };

  const handleView = (id: number) => {
    toast({
      title: "Просмотр документа",
      description: `Открытие документа #${id}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Stats Section */}
        <section className="mb-12">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Статистика базы знаний
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Документов"
              value={mockStats.documents}
              icon={FileText}
            />
            <StatsCard
              title="Сущностей"
              value={mockStats.entities}
              icon={Database}
            />
            <StatsCard
              title="Связей"
              value={mockStats.relations}
              icon={Link2}
            />
            <StatsCard
              title="Предложений"
              value={mockStats.sentences}
              icon={MessageSquare}
            />
          </div>
        </section>

        {/* Upload Section */}
        <section className="mb-12">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Загрузка документа
          </h2>
          <DocumentUpload onUpload={handleUpload} />
        </section>

        {/* Documents Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Последние документы
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {documents.length} документов
            </span>
          </div>
          <DocumentList
            documents={documents}
            onView={handleView}
            onDelete={handleDelete}
            onReprocess={handleReprocess}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              Knowledge Extraction System API v1.1.0
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              ЛР-5 совместимо
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
