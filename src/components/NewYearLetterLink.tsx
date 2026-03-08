import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";

const NewYearLetterLink = () => {
  const { t } = useLanguage();

  return (
    <Card className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-foreground mb-2">
            {t("news.article12.sections.outlook.newyear_link.title")}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {t("news.article12.sections.outlook.newyear_link.description")}
          </p>
          <Link
            to="/news/2026-01-01"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <span>{t("news.article12.sections.outlook.newyear_link.button")}</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default NewYearLetterLink;

