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
} from "../api/client";

const Index = () => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    documents: 0,
    entities: 0,
    relations: 0,
    sentences: 0,
  });

  const { toast } = useToast();

  // -------- Загрузить статистику -------- //
  async function loadStats() {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      console.error("Ошибка загрузки статистики", e);
    }
  }

  // -------- Загрузить список документов -------- //
  async function loadDocuments() {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error("Ошибка загрузки документов", e);
    }
  }

  useEffect(() => {
    loadStats();
    loadDocuments();
  }, []);

  // -------- Загрузка файла -------- //
  async function handleUpload(file: File) {
    await uploadDocument(file);
    toast({
      title: "Документ загружен",
      description: `${file.name} отправлен в систему`,
    });

    await loadDocuments();
    await loadStats();
  }

  // -------- Удаление документа -------- //
  async function handleDelete(id: number) {
    await deleteDocument(id);
    toast({
      title: "Документ удалён",
      description: `Документ #${id} удалён`,
    });

    await loadDocuments();
    await loadStats();
  }

  // -------- Переобработка -------- //
  async function handleReprocess(id: number) {
    await reprocessDocument(id);
    toast({
      title: "Переобработка",
      description: `Документ #${id} отправлен на повторную обработку`,
    });

    await loadDocuments();
  }

  // -------- Просмотр -------- //
  function handleView(id: number) {
    toast({
      title: "Открытие документа",
      description: `Документ #${id}`,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">

        {/* -------- Статистика -------- */}
        <section className="mb-12">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Статистика базы знаний
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Документов" value={stats.documents} icon={FileText} />
            <StatsCard title="Сущностей" value={stats.entities} icon={Database} />
            <StatsCard title="Связей" value={stats.relations} icon={Link2} />
            <StatsCard title="Предложений" value={stats.sentences} icon={MessageSquare} />
          </div>
        </section>

        {/* -------- Загрузка документа -------- */}
        <section className="mb-12">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Загрузка документа
          </h2>

          <DocumentUpload onUpload={handleUpload} />
        </section>

        {/* -------- Список документов -------- */}
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
            onDelete={handleDelete}
            onReprocess={handleReprocess}
            onView={handleView}
          />
        </section>

      </main>

      {/* -------- Footer -------- */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              Knowledge Extraction API v1.1.0
            </p>
            <p className="font-mono text-xs text-muted-foreground">ЛР-5 совместимо</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
