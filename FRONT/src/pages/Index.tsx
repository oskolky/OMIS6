import { useState, useEffect } from "react";
import { FileText, Database, Link2, MessageSquare } from "lucide-react";
import Header from "@/components/layout/Header";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentList from "@/components/documents/DocumentList";
import StatsCard from "@/components/stats/StatsCard";
import { useToast } from "@/hooks/use-toast";

import {
  uploadDocument,
  fetchDocuments,
  deleteDocument,
  reprocessDocument,
  fetchStats,
} from "@/api/client";

const Index = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    documents: 0,
    entities: 0,
    relations: 0,
    sentences: 0,
  });

  const { toast } = useToast();

  // Load all data at start
  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  async function loadDocuments() {
    const docs = await fetchDocuments();
    setDocuments(docs);
  }

  async function loadStats() {
    const s = await fetchStats();
    setStats(s);
  }

  async function handleUpload(file: File) {
    await uploadDocument(file);
    toast({ title: "Документ загружен", description: `${file.name}` });

    await loadDocuments();
    await loadStats();
  }

  async function handleDelete(id: number) {
    await deleteDocument(id);
    toast({ title: "Удалено", description: `Документ #${id} удалён` });

    await loadDocuments();
    await loadStats();
  }

  async function handleReprocess(id: number) {
    await reprocessDocument(id);
    toast({ title: "Переобработка", description: `Документ #${id}` });

    // статус скоро обновится после обработки
    await loadDocuments();
  }

  function handleView(id: number) {
    toast({ title: "Просмотр", description: `Документ #${id}` });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">

        {/* STATS */}
        <section className="mb-12">
          <h2 className="font-mono text-xs uppercase mb-4 text-muted-foreground">
            Статистика базы знаний
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Документов" value={stats.documents} icon={FileText} />
            <StatsCard title="Сущностей" value={stats.entities} icon={Database} />
            <StatsCard title="Связей" value={stats.relations} icon={Link2} />
            <StatsCard title="Предложений" value={stats.sentences} icon={MessageSquare} />
          </div>
        </section>

        {/* UPLOAD */}
        <section className="mb-12">
          <h2 className="font-mono text-xs uppercase mb-4 text-muted-foreground">
            Загрузка документа
          </h2>
          <DocumentUpload onUpload={handleUpload} />
        </section>

        {/* DOCUMENTS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs uppercase text-muted-foreground">
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
    </div>
  );
};

export default Index;
