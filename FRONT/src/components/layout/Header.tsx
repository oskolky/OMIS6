import { FileText, BarChart3, Database, Share2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const Header = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-mono text-sm font-bold">KE</span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-tight hidden sm:block">KNOWLEDGE EXTRACTION</span>
            </a>
            
            <nav className="hidden md:flex items-center gap-1">
              <NavLink 
                to="/" 
                end
                className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeClassName="text-foreground bg-secondary"
              >
                <FileText className="inline-block w-4 h-4 mr-2" />
                Документы
              </NavLink>
              <NavLink 
                to="/entities" 
                className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeClassName="text-foreground bg-secondary"
              >
                <Database className="inline-block w-4 h-4 mr-2" />
                Сущности
              </NavLink>
              <NavLink 
                to="/graph" 
                className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeClassName="text-foreground bg-secondary"
              >
                <Share2 className="inline-block w-4 h-4 mr-2" />
                Граф
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block font-mono text-xs text-muted-foreground">v1.1.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
