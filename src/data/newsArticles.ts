import communityImage from "@/assets/community/community_2.webp";
import peterInterviewImage from "@/assets/team/peter-selfie.webp";
import communityProfileImage from "@/assets/community/community_5.webp";
import communityLocationImage from "@/assets/community/community-location.webp";
import natureLandscapeImage from "@/assets/nature/land_10.webp";
import wellProjectImage from "@/assets/project/well.webp";
import busProjectImage from "@/assets/project/bus.webp";
import gruendungsversammlungImage from "@/assets/team/Gründungsversammlung.webp";
import headerConstructionImage from "@/assets/project/community_house/header_construction.webp";
import teamImage from "@/assets/team/team_2.webp";
import constructionItemImage from "@/assets/project/community_house/construction_item.webp";
import landBaseImage from "@/assets/project/header_land.webp";
import landImage1 from "@/assets/project/well.jpg";
import constructionHouseImage from "@/assets/project/goat_farm.webp";
import constructionHouse2Image from "@/assets/project/community_house/construction_house_2.webp";
import houseImage from "@/assets/project/community_house/house.webp";
import house2Image from "@/assets/project/community_house/house_2.webp";
import landWithPeopleImage from "@/assets/project/community_house/land_w_ppl.webp";
// Soak pit update images (WebP format)
import soakPitImage2 from "@/assets/project/2512_soak_pit_update/2.webp";
import soakPitImage3 from "@/assets/project/2512_soak_pit_update/3.webp";
import soakPitImage4 from "@/assets/project/2512_soak_pit_update/4.webp";
import soakPitImage5 from "@/assets/project/2512_soak_pit_update/5.webp";
import soakPitImage9 from "@/assets/project/2512_soak_pit_update/9.webp";
import soakPitImage10 from "@/assets/project/2512_soak_pit_update/10.webp";
import soakPitImage11 from "@/assets/project/2512_soak_pit_update/11.webp";
import soakPitImage12 from "@/assets/project/2512_soak_pit_update/12.webp";
import soakPitImage13 from "@/assets/project/2512_soak_pit_update/13.webp";
import soakPitImage15 from "@/assets/project/2512_soak_pit_update/15.webp";
import soakPitImage16 from "@/assets/project/2512_soak_pit_update/16.webp";
// Soak pit update videos (MP4 format)
import soakPitVideo1 from "@/assets/project/2512_soak_pit_update/1.mp4";
import soakPitVideo6 from "@/assets/project/2512_soak_pit_update/6.mp4";
import soakPitVideo7 from "@/assets/project/2512_soak_pit_update/7.mp4";
import soakPitVideo12 from "@/assets/project/2512_soak_pit_update/12.mp4";
// Christmas meal images
import christmasImage1 from "@/assets/project/2512_soak_pit_update/2512_christmas/all-food.jpeg";
import christmasImage2 from "@/assets/project/2512_soak_pit_update/2512_christmas/chicken-2.jpeg";
import christmasImage3 from "@/assets/project/2512_soak_pit_update/2512_christmas/WhatsApp Image 2025-12-24 at 12.39.25.jpeg";
import christmasImage4 from "@/assets/project/2512_soak_pit_update/2512_christmas/WhatsApp Image 2025-12-24 at 12.39.27.jpeg";
import christmasheaderImage from "@/assets/project/2512_soak_pit_update/2512_christmas/WhatsApp Image 2025-12-25 at 18.40.39.jpeg";
import christmasImage6 from "@/assets/project/2512_soak_pit_update/2512_christmas/WhatsApp Image 2025-12-25 at 18.40.40.jpeg";
import christmasImage7 from "@/assets/project/2512_soak_pit_update/2512_christmas/WhatsApp Image 2025-12-25 at 18.40.43.jpeg";

export interface ArticleSubsection {
  title: string;
  paragraphs?: string[];
}

export interface ArticleSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  stats?: ArticleStat[];
  subsections?: ArticleSubsection[];
  photoGallery?: PhotoGallery;
  cta?: {
    text: string;
    url: string;
    buttonLabel?: string;
  };
}

export interface ArticleBody {
  introduction?: string[];
  highlightTitle?: string;
  sections?: ArticleSection[];
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

export interface ArticleStat {
  value: string;
  label: string;
}

export interface ArticleQuote {
  text: string;
  author?: string;
}

export interface MediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
  caption?: string;
}

export interface PhotoGallery {
  media: MediaItem[];
  layout?: "carousel";
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
  photoGallery?: PhotoGallery;
  isPhotoBased?: boolean;
  isLetter?: boolean;
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

/**
 * Checks if an article should be published based on its date.
 * In production, articles with future dates are filtered out.
 * In development/local, all articles are shown.
 */
const shouldPublishArticle = (articleDate: string): boolean => {
  // In production, filter out articles with future dates
  if (import.meta.env.PROD) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const articleDateObj = new Date(articleDate);
    articleDateObj.setHours(0, 0, 0, 0);
    
    // Only show articles that are published today or in the past
    return articleDateObj.getTime() <= today.getTime();
  }
  
  // In development/local, show all articles
  return true;
};

/**
 * Checks if an article is unpublished (has a future date).
 * Only relevant in development/local mode.
 */
export const isUnpublishedArticle = (articleDate: string): boolean => {
  // Only show warning in development
  if (import.meta.env.PROD) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const articleDateObj = new Date(articleDate);
  articleDateObj.setHours(0, 0, 0, 0);
  
  // Article is unpublished if its date is in the future
  return articleDateObj.getTime() > today.getTime();
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

  const article9ConclusionCtaText = sanitizeValue(
    t("news.article9.conclusion_cta"),
    "news.article9.conclusion_cta"
  );
  const article9ConclusionCtaButtonLabel = sanitizeValue(
    t("news.article9.conclusion_cta_button"),
    "news.article9.conclusion_cta_button"
  );

  const article10QuoteText = sanitizeValue(
    t("news.article10.quote.text"),
    "news.article10.quote.text"
  );

  const article10QuoteAuthor = sanitizeValue(
    t("news.article10.quote.author"),
    "news.article10.quote.author"
  );

  const article11Introduction = splitToArray(
    t("news.article11.introduction"),
    "news.article11.introduction"
  );

  const article13Introduction = splitToArray(
    t("news.article13.introduction"),
    "news.article13.introduction"
  );

  const article13Signature = splitToArray(
    t("news.article13.sections.outlook.signature"),
    "news.article13.sections.outlook.signature"
  );

  const articles: NewsArticle[] = [
    {
      id: "13",
      title: t("news.article13.title"),
      excerpt: t("news.article13.excerpt"),
      content: t("news.article13.content"),
      author: t("news.article13.author"),
      date: "2026-01-01",
      category: t("news.categories.organization"),
      image: gruendungsversammlungImage,
      featured: true,
      isLetter: true,
      body: {
        introduction: article13Introduction,
        showQuote: false,
        sections: [
          {
            title: t("news.article13.sections.fundraising.title"),
            paragraphs: splitToArray(
              t("news.article13.sections.fundraising.paragraphs"),
              "news.article13.sections.fundraising.paragraphs"
            ),
          },
          {
            title: t("news.article13.sections.milestones.title"),
            paragraphs: splitToArray(
              t("news.article13.sections.milestones.paragraphs"),
              "news.article13.sections.milestones.paragraphs"
            ),
          },
          {
            title: t("news.article13.sections.projects.title"),
            paragraphs: splitToArray(
              t("news.article13.sections.projects.paragraphs"),
              "news.article13.sections.projects.paragraphs"
            ),
          },
          {
            title: t("news.article13.sections.challenges.title"),
            paragraphs: splitToArray(
              t("news.article13.sections.challenges.paragraphs"),
              "news.article13.sections.challenges.paragraphs"
            ),
          },
          {
            title: t("news.article13.sections.outlook.title"),
            paragraphs: splitToArray(
              t("news.article13.sections.outlook.paragraphs"),
              "news.article13.sections.outlook.paragraphs"
            ),
          },
        ],
        conclusion: article13Signature,
      },
    },
    {
      id: "11",
      title: t("news.article11.title"),
      excerpt: t("news.article11.excerpt"),
      content: t("news.article11.content"),
      author: t("news.article11.author"),
      date: "2025-12-23",
      category: t("news.categories.construction_progress"),
      image: soakPitImage2,
      featured: true,
      isPhotoBased: true,
      photoGallery: {
        layout: "carousel",
        media: [
          {
            type: "image",
            src: soakPitImage3,
            alt: t("news.article11.gallery.image3.alt"),
            caption: t("news.article11.gallery.image3.caption"),
          },
          {
            type: "video",
            src: soakPitVideo1,
            alt: t("news.article11.gallery.video1.alt"),
            caption: t("news.article11.gallery.video1.caption"),
          },
          {
            type: "image",
            src: soakPitImage4,
            alt: t("news.article11.gallery.image4.alt"),
            caption: t("news.article11.gallery.image4.caption"),
          },
          {
            type: "image",
            src: soakPitImage5,
            alt: t("news.article11.gallery.image5.alt"),
            caption: t("news.article11.gallery.image5.caption"),
          },
          {
            type: "video",
            src: soakPitVideo6,
            alt: t("news.article11.gallery.video6.alt"),
            caption: t("news.article11.gallery.video6.caption"),
          },
          {
            type: "video",
            src: soakPitVideo7,
            alt: t("news.article11.gallery.video7.alt"),
            caption: t("news.article11.gallery.video7.caption"),
          },
          {
            type: "image",
            src: soakPitImage9,
            alt: t("news.article11.gallery.image9.alt"),
            caption: t("news.article11.gallery.image9.caption"),
          },
          {
            type: "image",
            src: soakPitImage10,
            alt: t("news.article11.gallery.image10.alt"),
            caption: t("news.article11.gallery.image10.caption"),
          },
          {
            type: "image",
            src: soakPitImage11,
            alt: t("news.article11.gallery.image11.alt"),
            caption: t("news.article11.gallery.image11.caption"),
          },
          {
            type: "image",
            src: soakPitImage12,
            alt: t("news.article11.gallery.image12.alt"),
            caption: t("news.article11.gallery.image12.caption"),
          },
          {
            type: "image",
            src: soakPitImage13,
            alt: t("news.article11.gallery.image13.alt"),
            caption: t("news.article11.gallery.image13.caption"),
          },
          {
            type: "video",
            src: soakPitVideo12,
            alt: t("news.article11.gallery.video12.alt"),
            caption: t("news.article11.gallery.video12.caption"),
          },
          {
            type: "image",
            src: soakPitImage15,
            alt: t("news.article11.gallery.image15.alt"),
            caption: t("news.article11.gallery.image15.caption"),
          },
          {
            type: "image",
            src: soakPitImage16,
            alt: t("news.article11.gallery.image16.alt"),
            caption: t("news.article11.gallery.image16.caption"),
          },
        ],
      },
      body: {
        introduction: article11Introduction,
      },
    },
    {
      id: "12",
      title: t("news.article12.title"),
      excerpt: t("news.article12.excerpt"),
      content: t("news.article12.content"),
      author: t("news.article12.author"),
      date: "2026-01-03",
      category: t("news.categories.organization"),
      image: christmasheaderImage,
      featured: true,
      body: {
        showQuote: false,
        sections: [
          {
            title: t("news.article12.sections.fundraising.title"),
            paragraphs: splitToArray(
              t("news.article12.sections.fundraising.paragraphs"),
              "news.article12.sections.fundraising.paragraphs"
            ),
            stats: splitStats(
              t("news.article12.sections.fundraising.stats"),
              "news.article12.sections.fundraising.stats"
            ),
          },
          {
            title: t("news.article12.sections.septic_tank.title"),
            paragraphs: splitToArray(
              t("news.article12.sections.septic_tank.paragraphs"),
              "news.article12.sections.septic_tank.paragraphs"
            ),
            photoGallery: {
              layout: "carousel",
              media: [
                {
                  type: "image",
                  src: soakPitImage3,
                  alt: t("news.article11.gallery.image3.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage4,
                  alt: t("news.article11.gallery.image4.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage5,
                  alt: t("news.article11.gallery.image5.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage9,
                  alt: t("news.article11.gallery.image9.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage10,
                  alt: t("news.article11.gallery.image10.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage11,
                  alt: t("news.article11.gallery.image11.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage12,
                  alt: t("news.article11.gallery.image12.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage13,
                  alt: t("news.article11.gallery.image13.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage15,
                  alt: t("news.article11.gallery.image15.alt"),
                },
                {
                  type: "image",
                  src: soakPitImage16,
                  alt: t("news.article11.gallery.image16.alt"),
                },
              ],
            },
          },
          {
            title: t("news.article12.sections.christmas.title"),
            paragraphs: splitToArray(
              t("news.article12.sections.christmas.paragraphs"),
              "news.article12.sections.christmas.paragraphs"
            ),
            photoGallery: {
              layout: "carousel",
              media: [
                {
                  type: "image",
                  src: christmasImage1,
                  alt: t("news.article12.sections.christmas.gallery.image1.alt"),
                },
                {
                  type: "image",
                  src: christmasImage2,
                  alt: t("news.article12.sections.christmas.gallery.image2.alt"),
                },
                {
                  type: "image",
                  src: christmasImage3,
                  alt: t("news.article12.sections.christmas.gallery.image3.alt"),
                },
                {
                  type: "image",
                  src: christmasImage4,
                  alt: t("news.article12.sections.christmas.gallery.image4.alt"),
                },
                {
                  type: "image",
                  src: christmasImage6,
                  alt: t("news.article12.sections.christmas.gallery.image6.alt"),
                },
                {
                  type: "image",
                  src: christmasImage7,
                  alt: t("news.article12.sections.christmas.gallery.image7.alt"),
                },
              ],
            },
          },
          {
            title: t("news.article12.sections.outlook.title"),
            paragraphs: splitToArray(
              t("news.article12.sections.outlook.paragraphs"),
              "news.article12.sections.outlook.paragraphs"
            ),
            cta: {
              text: t("news.article12.sections.outlook.cta.text"),
              url: "/projects",
              buttonLabel: t("news.article12.sections.outlook.cta.button"),
            },
          },
        ],
      },
    },
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
      id: "10",
      title: t("news.article10.title"),
      excerpt: t("news.article10.excerpt"),
      content: t("news.article10.content"),
      author: t("news.article10.author"),
      date: "2025-12-18",
      category: t("news.categories.project_update"),
      image: wellProjectImage,
      featured: true,
      body: {
        introduction: splitToArray(
          t("news.article10.introduction"),
          "news.article10.introduction"
        ),
        highlightTitle: sanitizeValue(
          t("news.article10.highlight_title"),
          "news.article10.highlight_title"
        ),
        sections: [
          {
            title: t("news.article10.sections.planning.title"),
            paragraphs: splitToArray(
              t("news.article10.sections.planning.paragraphs"),
              "news.article10.sections.planning.paragraphs"
            ),
          },
          {
            title: t("news.article10.sections.technical.title"),
            paragraphs: splitToArray(
              t("news.article10.sections.technical.paragraphs"),
              "news.article10.sections.technical.paragraphs"
            ),
          },
        ],
        quote: article10QuoteText
          ? {
              text: article10QuoteText,
              author: article10QuoteAuthor || undefined,
            }
          : undefined,
      },
    },
    {
      id: "9",
      title: t("news.article9.title"),
      excerpt: t("news.article9.excerpt"),
      content: t("news.article9.content"),
      author: t("news.article9.author"),
      date: "2025-12-09",
      category: t("news.categories.project_update"),
      image: house2Image,
      additionalImages: [constructionHouseImage, landWithPeopleImage, constructionHouse2Image,constructionItemImage],
      featured: true,
      body: {
        highlightTitle: sanitizeValue(
          t("news.article9.highlight_title"),
          "news.article9.highlight_title"
        ),
        sections: [
          {
            title: t("news.article9.sections.what_is.title"),
            paragraphs: splitToArray(
              t("news.article9.sections.what_is.paragraphs"),
              "news.article9.sections.what_is.paragraphs"
            ),
          },
          {
            title: t("news.article9.sections.roles.title"),
            subsections: [
              {
                title: t("news.article9.sections.roles.subsection1.title"),
                paragraphs: splitToArray(
                  t("news.article9.sections.roles.subsection1.paragraphs"),
                  "news.article9.sections.roles.subsection1.paragraphs"
                ),
              },
              {
                title: t("news.article9.sections.roles.subsection2.title"),
                paragraphs: splitToArray(
                  t("news.article9.sections.roles.subsection2.paragraphs"),
                  "news.article9.sections.roles.subsection2.paragraphs"
                ),
              },
              {
                title: t("news.article9.sections.roles.subsection3.title"),
                paragraphs: splitToArray(
                  t("news.article9.sections.roles.subsection3.paragraphs"),
                  "news.article9.sections.roles.subsection3.paragraphs"
                ),
              },
            ],
          },
          {
            title: t("news.article9.sections.next_months.title"),
            paragraphs: splitToArray(
              t("news.article9.sections.next_months.paragraphs"),
              "news.article9.sections.next_months.paragraphs"
            ),
          },
          {
            title: t("news.article9.sections.bricks.title"),
            paragraphs: splitToArray(
              t("news.article9.sections.bricks.paragraphs"),
              "news.article9.sections.bricks.paragraphs"
            ),
          },
        ],
        conclusionCTA: article9ConclusionCtaText
          ? {
              text: article9ConclusionCtaText,
              url: "/projects?section=community-house",
              buttonLabel: article9ConclusionCtaButtonLabel || undefined,
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

  // Filter articles based on publication date (only in production)
  const filteredArticles = articles.filter(article => shouldPublishArticle(article.date));

  return filteredArticles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

