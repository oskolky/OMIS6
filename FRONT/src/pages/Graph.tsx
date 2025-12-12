import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import KnowledgeGraph from "@/components/graph/KnowledgeGraph";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: string;
}

interface Link {
  id: string;
  source: string;
  target: string;
  label: string;
}

const Graph = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>("all");

  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  const [format, setFormat] = useState("graphml");

  useEffect(() => {
    fetch("/documents")
      .then((r) => r.json())
      .then((data) => setDocuments(data));
  }, []);

  useEffect(() => {
    if (selectedDocument === "all") return;

    fetch(`/graph/${selectedDocument}`)
      .then((r) => r.json())
      .then((data) => {
        setNodes(data.nodes);
        setLinks(data.links);
      });
  }, [selectedDocument]);

  const exportGraph = () => {
    window.location.href = format === "graphml" ? "/graphml" : "/jsonld";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Controls */}
        <section className="mb-6">
          <div className="flex gap-4">

            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger className="w-48 font-mono text-sm">
                <SelectValue placeholder="Выберите документ" />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={String(doc.id)}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="w-32 font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graphml">GraphML</SelectItem>
                <SelectItem value="jsonld">JSON-LD</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="font-mono" onClick={exportGraph}>
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>

          </div>
        </section>

        {/* Graph */}
        {selectedDocument !== "all" && (
          <KnowledgeGraph
            nodes={nodes}
            links={links}
            width={1200}
            height={700}
          />
        )}
      </main>
    </div>
  );
};

export default Graph;
