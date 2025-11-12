import communityImage from "@/assets/community/community_2.png";
import peterInterviewImage from "@/assets/team/peter-selfie.jpeg";
import communityProfileImage from "@/assets/community/community_5.jpg";
import communityLocationImage from "@/assets/community/community-location.png";
import natureLandscapeImage from "@/assets/nature/land_10.jpg";
import wellProjectImage from "@/assets/project/well.jpg";
import busProjectImage from "@/assets/project/bus.png";

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

  const articles: NewsArticle[] = [
    {
      id: "6",
      title: t("news.article6.title"),
      excerpt: t("news.article6.excerpt"),
      content: t("news.article6.content"),
      author: t("news.article6.author"),
      date: "2025-11-15",
      category: t("news.categories.organization"),
      image: communityImage,
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
              url: "/dev/projects",
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
              url: "/dev/projects",
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

