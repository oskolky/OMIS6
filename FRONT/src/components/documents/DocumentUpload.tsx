import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onUpload?: (file: File) => void;
}

const DocumentUpload = ({ onUpload }: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
      toast({
        title: "Документ загружен",
        description: `${selectedFile.name} отправлен на обработку`,
      });
      setSelectedFile(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed transition-colors duration-150
          ${isDragging ? "border-primary bg-secondary" : "border-border hover:border-muted-foreground"}
          ${selectedFile ? "border-accent" : ""}
        `}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.doc,.docx"
        />
        
        <div className="p-8 text-center">
          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <FileText className="w-8 h-8 text-accent" />
              <div className="text-left">
                <p className="font-mono text-sm font-medium">{selectedFile.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  clearFile();
                }}
                className="p-1 hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="font-mono text-sm text-muted-foreground">
                Перетащите файл или нажмите для выбора
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-2">
                PDF, DOC, DOCX
              </p>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 flex justify-end">
          <Button onClick={handleUpload} className="font-mono">
            <Upload className="w-4 h-4 mr-2" />
            Загрузить и обработать
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
