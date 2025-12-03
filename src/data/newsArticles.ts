import communityImage from "@/assets/community/community_2.webp";
import peterInterviewImage from "@/assets/team/peter-selfie.webp";
import communityProfileImage from "@/assets/community/community_5.webp";
import communityLocationImage from "@/assets/community/community-location.webp";
import natureLandscapeImage from "@/assets/nature/land_10.webp";
import wellProjectImage from "@/assets/project/well.webp";
import busProjectImage from "@/assets/project/bus.webp";
import gruendungsversammlungImage from "@/assets/team/Gründungsversammlung.webp";
import headerConstructionImage from "@/assets/project/header_construction.webp";
import landBaseImage from "@/assets/project/header_land.webp";
import landImage1 from "@/assets/project/well.jpg";
import constructionHouseImage from "@/assets/project/goat_farm.webp";

export interface ArticleSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  stats?: ArticleStat[];
}

export interface ArticleBody {
  introduction?: string[];
  highlightTitle?: string;
  sections: ArticleSection[];
  conclusion?: string[];
  conclusionCTA?: {
    text: string;
    url: string;
    buttonLabel?: string;
  };
  quote?: ArticleQuote;
  quote2?: ArticleQuote;
  showQuote?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  featured: boolean;
  additionalImages?: string[];
  body?: ArticleBody;
}

export interface ArticleStat {
  value: string;
  label: string;
}

export interface ArticleQuote {
  text: string;
  author?: string;
}

const sanitizeValue = (value: string, key: string): string => {
  if (!value || value === key) {
    return "";
  }
  return value.trim();
};

const splitToArray = (value: string, key: string): string[] => {
  const sanitized = sanitizeValue(value, key);
  if (!sanitized) {
    return [];
  }
  return sanitized
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
};

const splitStats = (value: string, key: string): ArticleStat[] => {
  const sanitized = sanitizeValue(value, key);
  if (!sanitized) {
    return [];
  }

  return sanitized
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((entry) => {
      const [valuePart, labelPart] = entry.split("::").map((part) => part?.trim() ?? "");
      return {
        value: valuePart || "",
        label: labelPart || "",
      };
    })
    .filter((stat) => stat.value || stat.label);
};

export const getNewsArticles = (t: (key: string) => string): NewsArticle[] => {
  const conclusionCtaText = sanitizeValue(
    t("news.article5.sections.conclusion_cta"),
    "news.article5.sections.conclusion_cta"
  );
  const conclusionCtaButtonLabel = sanitizeValue(
    t("news.article5.sections.conclusion_cta_button"),
    "news.article5.sections.conclusion_cta_button"
  );

  const article6ConclusionCtaText = sanitizeValue(
    t("news.article6.conclusion_cta"),
    "news.article6.conclusion_cta"
  );
  const article6ConclusionCtaButtonLabel = sanitizeValue(
    t("news.article6.conclusion_cta_button"),
    "news.article6.conclusion_cta_button"
  );

  const article6QuoteText = sanitizeValue(
    t("news.article6.quote.text"),
    "news.article6.quote.text"
  );

  const article6QuoteAuthor = sanitizeValue(
    t("news.article6.quote.author"),
    "news.article6.quote.author"
  );

  const article5QuoteText = sanitizeValue(
    t("news.article5.sections.quote.text"),
    "news.article5.sections.quote.text"
  );

  const article5QuoteAuthor = sanitizeValue(
    t("news.article5.sections.quote.author"),
    "news.article5.sections.quote.author"
  );

  const article7ConclusionCtaText = sanitizeValue(
    t("news.article7.conclusion_cta"),
    "news.article7.conclusion_cta"
  );
  const article7ConclusionCtaButtonLabel = sanitizeValue(
    t("news.article7.conclusion_cta_button"),
    "news.article7.conclusion_cta_button"
  );

  const article7QuoteText = sanitizeValue(
    t("news.article7.quote.text"),
    "news.article7.quote.text"
  );

  const article7QuoteAuthor = sanitizeValue(
    t("news.article7.quote.author"),
    "news.article7.quote.author"
  );

  const article8QuoteText = sanitizeValue(
    t("news.article8.quote.text"),
    "news.article8.quote.text"
  );

  const article8QuoteAuthor = sanitizeValue(
    t("news.article8.quote.author"),
    "news.article8.quote.author"
  );

  const article8Quote2Text = sanitizeValue(
    t("news.article8.quote2.text"),
    "news.article8.quote2.text"
  );

  const article8Quote2Author = sanitizeValue(
    t("news.article8.quote2.author"),
    "news.article8.quote2.author"
  );

  const articles: NewsArticle[] = [
    {
      id: "8",
      title: t("news.article8.title"),
      excerpt: t("news.article8.excerpt"),
      content: t("news.article8.content"),
      author: t("news.article8.author"),
      date: "2025-12-03",
      category: t("news.categories.community"),
      image: landBaseImage,
      additionalImages: [landImage1, constructionHouseImage],
      featured: true,
      body: {
        introduction: splitToArray(
          t("news.article8.introduction"),
          "news.article8.introduction"
        ),
        highlightTitle: sanitizeValue(
          t("news.article8.highlight_title"),
          "news.article8.highlight_title"
        ),
        sections: [
          {
            title: t("news.article8.sections.community_house.title"),
            paragraphs: splitToArray(
              t("news.article8.sections.community_house.paragraphs"),
              "news.article8.sections.community_house.paragraphs"
            ),
          },
          {
            title: t("news.article8.sections.farm_project.title"),
            paragraphs: splitToArray(
              t("news.article8.sections.farm_project.paragraphs"),
              "news.article8.sections.farm_project.paragraphs"
            ),
          },
          {
            title: t("news.article8.sections.well_project.title"),
            paragraphs: splitToArray(
              t("news.article8.sections.well_project.paragraphs"),
              "news.article8.sections.well_project.paragraphs"
            ),
          },
        ],
        quote: article8QuoteText
          ? {
              text: article8QuoteText,
              author: article8QuoteAuthor || undefined,
            }
          : undefined,
        quote2: article8Quote2Text
          ? {
              text: article8Quote2Text,
              author: article8Quote2Author || undefined,
            }
          : undefined,
      },
    },
    {
      id: "7",
      title: t("news.article7.title"),
      excerpt: t("news.article7.excerpt"),
      content: t("news.article7.content"),
      author: t("news.article7.author"),
      date: "2025-11-22",
      category: t("news.categories.project_update"),
      image: headerConstructionImage,
      featured: true,
      body: {
        introduction: splitToArray(
          t("news.article7.introduction"),
          "news.article7.introduction"
        ),
        quote: article7QuoteText
        ? {
            text: article7QuoteText,
            author: article7QuoteAuthor || undefined,
          }
        : undefined,
        highlightTitle: sanitizeValue(
          t("news.article7.highlight_title"),
          "news.article7.highlight_title"
        ),
        sections: [],
        conclusion: splitToArray(
          t("news.article7.conclusion"),
          "news.article7.conclusion"
        ),
        conclusionCTA: article7ConclusionCtaText
          ? {
              text: article7ConclusionCtaText,
              url: "/donation",
              buttonLabel: article7ConclusionCtaButtonLabel || undefined,
            }
          : undefined,
      },
    },
    {
      id: "6",
      title: t("news.article6.title"),
      excerpt: t("news.article6.excerpt"),
      content: t("news.article6.content"),
      author: t("news.article6.author"),
      date: "2025-11-15",
      category: t("news.categories.organization"),
      image: gruendungsversammlungImage,
      featured: true,
      body: {
        introduction: splitToArray(
          t("news.article6.introduction"),
          "news.article6.introduction"
        ),
        highlightTitle: sanitizeValue(
          t("news.article6.highlight_title"),
          "news.article6.highlight_title"
        ),
        sections: [
          {
            title: t("news.article6.sections.community_house.title"),
            paragraphs: splitToArray(
              t("news.article6.sections.community_house.paragraphs"),
              "news.article6.sections.community_house.paragraphs"
            ),
          },
          {
            title: t("news.article6.sections.progress.title"),
            paragraphs: splitToArray(
              t("news.article6.sections.progress.paragraphs"),
              "news.article6.sections.progress.paragraphs"
            ),
          },
          {
            title: t("news.article6.sections.goal.title"),
            paragraphs: splitToArray(
              t("news.article6.sections.goal.paragraphs"),
              "news.article6.sections.goal.paragraphs"
            ),
          },
        ],
        conclusion: splitToArray(
          t("news.article6.conclusion"),
          "news.article6.conclusion"
        ),
        conclusionCTA: article6ConclusionCtaText
          ? {
              text: article6ConclusionCtaText,
              url: "/projects?section=community-house",
              buttonLabel: article6ConclusionCtaButtonLabel || undefined,
            }
          : undefined,
        quote: article6QuoteText
          ? {
              text: article6QuoteText,
              author: article6QuoteAuthor || undefined,
            }
          : undefined,
      },
    },
    {
      id: "5",
      title: t("news.article5.title"),
      excerpt: t("news.article5.excerpt"),
      content: t("news.article5.content"),
      author: t("news.article5.author"),
      date: "2025-11-11",
      category: t("news.categories.community"),
      image: peterInterviewImage,
      additionalImages: [busProjectImage, communityImage],
      featured: false,
      body: {
        introduction: splitToArray(
          t("news.article5.introduction"),
          "news.article5.introduction"
        ),
        highlightTitle: sanitizeValue(
          t("news.article5.highlight_title"),
          "news.article5.highlight_title"
        ),
        sections: [
          {
            title: t("news.article5.sections.question1.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question1.paragraphs"),
              "news.article5.sections.question1.paragraphs"
            ),
          },
          {
            title: t("news.article5.sections.question2.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question2.paragraphs"),
              "news.article5.sections.question2.paragraphs"
            ),
          },
          {
            title: t("news.article5.sections.question3.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question3.paragraphs"),
              "news.article5.sections.question3.paragraphs"
            ),
          },
          {
            title: t("news.article5.sections.question4.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question4.paragraphs"),
              "news.article5.sections.question4.paragraphs"
            ),
          },
          {
            title: t("news.article5.sections.question5.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question5.paragraphs"),
              "news.article5.sections.question5.paragraphs"
            ),
          },
          {
            title: t("news.article5.sections.question6.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question6.paragraphs"),
              "news.article5.sections.question6.paragraphs"
            ),
          },
          {
            title: t("news.article5.sections.question7.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question7.paragraphs"),
              "news.article5.sections.question7.paragraphs"
            ),
          },
          {
            title: t("news.article5.sections.question8.title"),
            paragraphs: splitToArray(
              t("news.article5.sections.question8.paragraphs"),
              "news.article5.sections.question8.paragraphs"
            ),
          },
        ],
        conclusion: splitToArray(
          t("news.article5.sections.conclusion"),
          "news.article5.sections.conclusion"
        ),
        conclusionCTA: conclusionCtaText
          ? {
              text: conclusionCtaText,
              url: "/projects",
              buttonLabel: conclusionCtaButtonLabel || undefined,
            }
          : undefined,
        quote: article5QuoteText
          ? {
              text: article5QuoteText,
              author: article5QuoteAuthor || undefined,
            }
          : undefined,
      },
    },
    {
      id: "4",
      title: t("news.article4.title"),
      excerpt: t("news.article4.excerpt"),
      content: t("news.article4.content"),
      author: t("news.article4.author"),
      date: "2025-10-15",
      category: t("news.categories.community"),
      image: communityProfileImage,
      additionalImages: [communityLocationImage, natureLandscapeImage, wellProjectImage],
      featured: true,
      body: {
        introduction: splitToArray(t("news.article4.introduction"), "news.article4.introduction"),
        highlightTitle: sanitizeValue(
          t("news.article4.highlight_title"),
          "news.article4.highlight_title"
        ),
        showQuote: false,
        sections: [
          {
            title: t("news.article4.sections.population.title"),
            paragraphs: splitToArray(
              t("news.article4.sections.population.paragraphs"),
              "news.article4.sections.population.paragraphs"
            ),
            stats: splitStats(
              t("news.article4.sections.population.stats"),
              "news.article4.sections.population.stats"
            ),
          },
          {
            title: t("news.article4.sections.economy.title"),
            paragraphs: splitToArray(
              t("news.article4.sections.economy.paragraphs"),
              "news.article4.sections.economy.paragraphs"
            ),
            bullets: splitToArray(
              t("news.article4.sections.economy.bullets"),
              "news.article4.sections.economy.bullets"
            ),
          },
          {
            title: t("news.article4.sections.education.title"),
            paragraphs: splitToArray(
              t("news.article4.sections.education.paragraphs"),
              "news.article4.sections.education.paragraphs"
            ),
            stats: splitStats(
              t("news.article4.sections.education.stats"),
              "news.article4.sections.education.stats"
            ),
          },
          {
            title: t("news.article4.sections.infrastructure.title"),
            paragraphs: splitToArray(
              t("news.article4.sections.infrastructure.paragraphs"),
              "news.article4.sections.infrastructure.paragraphs"
            ),
            bullets: splitToArray(
              t("news.article4.sections.infrastructure.bullets"),
              "news.article4.sections.infrastructure.bullets"
            ),
          },
          {
            title: t("news.article4.sections.health.title"),
            paragraphs: splitToArray(
              t("news.article4.sections.health.paragraphs"),
              "news.article4.sections.health.paragraphs"
            ),
            bullets: splitToArray(
              t("news.article4.sections.health.bullets"),
              "news.article4.sections.health.bullets"
            ),
          },
        ],
      },
    },
  ];

  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

