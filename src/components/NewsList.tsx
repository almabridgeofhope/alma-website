import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";
import { NewsArticle } from "@/data/newsArticles";

interface NewsListProps {
  articles: NewsArticle[];
  formatDate: (dateString: string) => string;
  getCategoryColor: (category: string) => string;
  onReadMore: (article: NewsArticle) => void;
  title: string;
  subtitle: string;
  readMoreLabel: string;
}

const NewsList = ({ 
  articles, 
  formatDate, 
  getCategoryColor, 
  onReadMore, 
  title, 
  subtitle,
  readMoreLabel,
}: NewsListProps) => {
  return (
    <section className="pt-8 pb-section bg-muted/30">
      <div className="max-w-content mx-auto px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {subtitle}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <div 
              key={article.id}
              className="overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group animate-fade-in bg-card rounded-lg border cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onReadMore(article)}
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-video">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute top-3 left-3">
                  <Badge className={getCategoryColor(article.category)}>
                    <Tag className="w-3 h-3 mr-1" />
                    {article.category}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <User className="w-3 h-3" />
                  <span>{article.author}</span>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(article.date)}</span>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center text-primary hover:text-primary/80 group">
                  <span className="text-sm font-medium">{readMoreLabel}</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsList;
