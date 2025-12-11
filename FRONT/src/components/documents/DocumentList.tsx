import { FileText, Trash2, RefreshCw, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: number;
  name: string;
  uploadedAt: string;
  status: "processing" | "completed" | "error";
  entities?: number;
  sentences?: number;
}

interface DocumentListProps {
  documents: Document[];
  onView?: (id: number) => void;
  onDelete?: (id: number) => void;
  onReprocess?: (id: number) => void;
}

const DocumentList = ({ documents, onView, onDelete, onReprocess }: DocumentListProps) => {
  const getStatusStyles = (status: Document["status"]) => {
    switch (status) {
      case "completed":
        return "bg-accent text-accent-foreground";
      case "processing":
        return "bg-warning text-warning-foreground";
      case "error":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: Document["status"]) => {
    switch (status) {
      case "completed":
        return "Готово";
      case "processing":
        return "Обработка";
      case "error":
        return "Ошибка";
      default:
        return status;
    }
  };

  if (documents.length === 0) {
    return (
      <div className="border border-border p-12 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="font-mono text-sm text-muted-foreground">
          Нет загруженных документов
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border">
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <div className="col-span-5">Документ</div>
        <div className="col-span-2">Статус</div>
        <div className="col-span-2 hidden md:block">Сущности</div>
        <div className="col-span-3 text-right">Действия</div>
      </div>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className="grid grid-cols-12 gap-4 p-4 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors group"
        >
          <div className="col-span-5 flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-mono text-sm font-medium truncate">{doc.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{doc.uploadedAt}</p>
            </div>
          </div>

          <div className="col-span-2 flex items-center">
            <span className={`px-2 py-1 font-mono text-xs ${getStatusStyles(doc.status)}`}>
              {getStatusText(doc.status)}
            </span>
          </div>

          <div className="col-span-2 hidden md:flex items-center">
            <span className="font-mono text-sm text-muted-foreground">
              {doc.entities ?? "—"}
            </span>
          </div>

          <div className="col-span-3 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView?.(doc.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReprocess?.(doc.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(doc.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
