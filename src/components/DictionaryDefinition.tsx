import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

interface DictionaryDefinitionProps {
  className?: string;
}

const DictionaryDefinition = ({ className }: DictionaryDefinitionProps) => {
  const { t } = useLanguage();

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="bg-muted/50 rounded-lg p-5 md:p-6 border-l-4 border-primary h-full flex flex-col">
        {/* Decorative icon */}
        <div className="flex items-start gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-primary/60 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {/* Word */}
            <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-1">
              {t("dictionary.word")}
            </h3>
            
            {/* Part of Speech */}
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {t("dictionary.partOfSpeech")}
            </span>
          </div>
        </div>
        
        {/* Separator Line */}
        <div className="border-t border-border/50 mb-4" />
        
        {/* Definition */}
        <div className="flex-1 flex flex-col">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed italic pl-8 mb-4">
            {t("dictionary.definition")}
          </p>
          
          {/* Additional context */}
          <div className="mt-auto pt-4 border-t border-border/30">
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed pl-8">
              {t("dictionary.context")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DictionaryDefinition;
